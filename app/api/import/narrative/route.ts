import { NextRequest, NextResponse } from 'next/server'
import { getUserId } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createRelationship } from '@/lib/db/relationships'

export async function POST(req: NextRequest) {
  const userId = getUserId()

  try {
    const { text } = await req.json()

    if (!text?.trim()) {
      return NextResponse.json({ error: '请输入剧情文本' }, { status: 400 })
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: '未配置 ANTHROPIC_API_KEY' }, { status: 500 })
    }

    // 使用 OpenRouter API
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.ANTHROPIC_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:3001',
        'X-Title': 'OC Workbench',
      },
      body: JSON.stringify({
        model: 'deepseek/deepseek-chat-v3-2',
        messages: [
          {
            role: 'user',
            content: `请分析以下剧情文本，提取角色信息、片段和角色关系。

要求：
1. 识别所有出现的角色名字
2. 将剧情拆分成多个片段（每个片段 1-3 段）
3. 标记每个片段涉及的角色
4. 如果能识别出角色的设定信息（性格、外貌等），也提取出来
5. 提取文本中角色之间的明确关系

返回 JSON 格式：
{
  "characters": [
    { "name": "角色名", "profile": "角色设定（如果有）" }
  ],
  "snippets": [
    { "content": "片段内容", "characterNames": ["角色A", "角色B"] }
  ],
  "relationships": [
    { "from": "角色A", "to": "角色B", "label": "师徒" }
  ]
}

关系提取说明：
- from: 关系发起方角色名（必须出现在 characters 列表中）
- to: 关系接收方角色名（必须出现在 characters 列表中）
- label: 关系描述，2-6个汉字，如"师徒"、"情侣"、"宿敌"、"同伴"
- 如无明确关系，返回空数组 []

剧情文本：
${text}`,
          },
        ],
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('OpenRouter API error:', response.status, errorText)
      return NextResponse.json({
        error: `API 调用失败 (${response.status}): ${errorText.substring(0, 200)}`
      }, { status: 500 })
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content

    if (!content) {
      return NextResponse.json({ error: 'AI 未返回有效数据' }, { status: 500 })
    }

    // 解析 AI 返回的 JSON
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return NextResponse.json({ error: 'AI 未返回有效数据' }, { status: 500 })
    }

    const parsed = JSON.parse(jsonMatch[0])
    const { characters, snippets, relationships = [] } = parsed

    // 创建或查找角色（限定当前用户）
    const characterMap = new Map<string, string>() // name -> id

    for (const char of characters) {
      const existing = await prisma.character.findFirst({
        where: { userId, name: { equals: char.name, mode: 'insensitive' } },
      })

      if (existing) {
        characterMap.set(char.name, existing.id)
        if (char.profile && !existing.note) {
          await prisma.character.update({
            where: { id: existing.id },
            data: { note: char.profile },
          })
        }
      } else {
        const created = await prisma.character.create({
          data: {
            userId,
            name: char.name,
            note: char.profile || null,
          },
        })
        characterMap.set(char.name, created.id)
      }
    }

    // 创建片段
    let itemsCreated = 0
    for (const snippet of snippets) {
      const characterIds = snippet.characterNames
        .map((name: string) => characterMap.get(name))
        .filter(Boolean) as string[]

      if (characterIds.length === 0) continue

      await prisma.item.create({
        data: {
          content: snippet.content,
          itemType: 'snippet',
          characters: {
            create: characterIds.map((characterId) => ({ characterId })),
          },
        },
      })
      itemsCreated++
    }

    // 创建关系
    let relationshipsCreated = 0
    for (const rel of relationships) {
      const fromId = characterMap.get(rel.from)
      const toId = characterMap.get(rel.to)
      if (fromId && toId && fromId !== toId) {
        try {
          await createRelationship(userId, { fromId, toId, label: rel.label })
          relationshipsCreated++
        } catch {
          // 忽略重复冲突，幂等操作
        }
      }
    }

    return NextResponse.json({
      data: {
        charactersCreated: characters.length,
        itemsCreated,
        relationshipsCreated,
      },
      error: null,
    })
  } catch (error) {
    console.error('Narrative import error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '导入失败' },
      { status: 500 }
    )
  }
}
