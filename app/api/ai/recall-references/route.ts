import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const { text, characterIds } = await req.json()

    if (!text?.trim()) {
      return NextResponse.json({ error: '请提供文本内容' }, { status: 400 })
    }

    if (!characterIds || characterIds.length === 0) {
      return NextResponse.json({ error: '请提供角色 ID' }, { status: 400 })
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: '未配置 ANTHROPIC_API_KEY' }, { status: 500 })
    }

    // 查询相关角色的所有 reference 类型 items
    const references = await prisma.item.findMany({
      where: {
        itemType: 'reference',
        characters: {
          some: {
            characterId: { in: characterIds }
          }
        }
      },
      include: {
        characters: {
          include: {
            character: true
          }
        }
      },
      orderBy: { updatedAt: 'desc' }
    })

    if (references.length === 0) {
      return NextResponse.json({
        data: [],
        error: null
      })
    }

    // 构建 references 列表供 AI 分析
    const referencesText = references.map((ref: { title: string | null; content: string }, idx: number) => {
      const title = ref.title || '无标题'
      const content = ref.content.substring(0, 500) // 限制长度避免 token 过多
      return `[${idx}] 标题: ${title}\n内容: ${content}`
    }).join('\n\n')

    // 调用 OpenRouter API
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
            content: `用户正在编辑以下段落：
${text}

以下是数据库中的摘抄参考列表：
${referencesText}

请分析段落内容，从摘抄列表中找出最相关的 3-5 条（如果总数不足 5 条则全部返回）。

返回 JSON 格式：
{
  "indices": [0, 2, 5]
}

indices 是相关摘抄的索引数组，按相关度从高到低排序。如果没有相关的，返回空数组 []。`,
          },
        ],
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('OpenRouter API error:', response.status, errorText)
      return NextResponse.json({
        error: `AI 调用失败 (${response.status})`
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
    const indices = parsed.indices || []

    // 根据索引返回相关的 references
    const results = indices
      .filter((idx: number) => idx >= 0 && idx < references.length)
      .map((idx: number) => {
        const ref = references[idx]
        return {
          id: ref.id,
          title: ref.title || '无标题',
          content: ref.content
        }
      })

    return NextResponse.json({
      data: results,
      error: null
    })
  } catch (error) {
    console.error('Recall references error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '召回失败' },
      { status: 500 }
    )
  }
}
