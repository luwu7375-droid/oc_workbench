import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const searchSchema = z.object({
  query: z.string().min(1, '请输入搜索词'),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { query } = searchSchema.parse(body)

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: '未配置 ANTHROPIC_API_KEY' }, { status: 500 })
    }

    // 调用 OpenRouter API 进行语义理解
    let keywords: string[] = []
    try {
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
              content: `你是一个 OC（原创角色）创作助手。用户正在搜索角色或内容，请理解用户意图并提取相关关键词。

用户输入：${query}

请分析用户可能在寻找什么，返回相关的关键词列表。关键词应包括：
1. 角色名（如果提到）
2. 角色特征（性格、外貌、职业等）
3. 内容主题（剧情、设定、关系等）
4. 同义词和相关词

返回 JSON 格式：
{
  "keywords": ["关键词1", "关键词2", "关键词3"]
}

要求：
- 返回 3-8 个关键词
- 关键词应该是中文
- 包含原词和扩展词
- 只返回 JSON，不要其他文字`,
            },
          ],
        }),
      })

      if (!response.ok) {
        throw new Error(`API 调用失败: ${response.status}`)
      }

      const data = await response.json()
      const content = data.choices?.[0]?.message?.content

      if (content) {
        const jsonMatch = content.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0])
          keywords = parsed.keywords || []
        }
      }
    } catch (error) {
      console.error('AI 调用失败，降级到关键词搜索:', error)
      // 降级：使用原始查询词
      keywords = [query]
    }

    // 如果 AI 没有返回关键词，使用原始查询
    if (keywords.length === 0) {
      keywords = [query]
    }

    // 使用关键词在数据库中搜索
    const characterConditions = keywords.map(kw => ({
      OR: [
        { name: { contains: kw, mode: 'insensitive' as const } },
        { note: { contains: kw, mode: 'insensitive' as const } },
      ],
    }))

    const itemConditions = keywords.map(kw => ({
      OR: [
        { title: { contains: kw, mode: 'insensitive' as const } },
        { content: { contains: kw, mode: 'insensitive' as const } },
      ],
    }))

    const [characters, items] = await Promise.all([
      prisma.character.findMany({
        where: { OR: characterConditions },
        take: 10,
      }),
      prisma.item.findMany({
        where: { OR: itemConditions },
        include: { characters: { include: { character: true } } },
        take: 20,
      }),
    ])

    return NextResponse.json({
      data: { characters, items, keywords },
      error: null,
    })
  } catch (error) {
    console.error('Semantic search error:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { data: null, error: error.issues[0].message },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { data: null, error: error instanceof Error ? error.message : '搜索失败' },
      { status: 500 }
    )
  }
}
