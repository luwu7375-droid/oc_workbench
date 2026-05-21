import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getBridgeUserId } from '@/lib/tavern-bridge'

const schema = z.object({
  characterIds: z.array(z.string()).min(1),
  messages: z.array(
    z.object({
      role: z.enum(['user', 'assistant', 'system']),
      content: z.string(),
      name: z.string().optional(),
    })
  ).min(1),
})

export async function POST(req: NextRequest) {
  const userId = getBridgeUserId()

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ data: null, error: '未配置 ANTHROPIC_API_KEY' }, { status: 500 })
  }

  try {
    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ data: null, error: '请提供 characterIds 和 messages' }, { status: 400 })
    }

    const { messages } = parsed.data

    const chatText = messages
      .filter((m) => m.role !== 'system')
      .map((m) => `${m.name ?? (m.role === 'user' ? '用户' : '角色')}：${m.content}`)
      .join('\n')

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.ANTHROPIC_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'OC Workbench',
      },
      body: JSON.stringify({
        model: 'deepseek/deepseek-chat-v3-2',
        messages: [
          {
            role: 'user',
            content: `你是一个 OC（原创角色）创作助手。请从以下对话记录中提取值得记录的记忆片段。

要求：
1. 每条记忆应是一个独立的、有意义的事件或状态
2. 类型（type）只能是以下之一：event（事件）、state（状态）、relation（关系）、trait（性格/特征）
3. confidence 为 0-1 的置信度，表示这条记忆的重要程度
4. suggestedTargets 为建议写回的目标，可选值：workbench（Workbench 数据库）、worldbook（世界书）、character_card（角色卡）、prompt（Prompt）
5. 提取 3-8 条，不要过多也不要遗漏重要内容

返回 JSON 格式：
{
  "candidates": [
    {
      "type": "event",
      "title": "简短标题（10字以内）",
      "content": "详细描述（1-3句话）",
      "confidence": 0.85,
      "suggestedTargets": ["workbench", "worldbook"]
    }
  ]
}

对话记录：
${chatText}`,
          },
        ],
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[Bridge] extract AI error:', response.status, errorText)
      return NextResponse.json(
        { data: null, error: `AI 调用失败 (${response.status})` },
        { status: 500 }
      )
    }

    const aiData = await response.json()
    const content = aiData.choices?.[0]?.message?.content

    if (!content) {
      return NextResponse.json({ data: null, error: 'AI 未返回有效数据' }, { status: 500 })
    }

    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return NextResponse.json({ data: null, error: 'AI 返回格式错误' }, { status: 500 })
    }

    const { candidates } = JSON.parse(jsonMatch[0])

    // 补充 targets 字段（初始值等于 suggestedTargets）
    const enriched = (candidates as Array<{
      type: string
      title: string
      content: string
      confidence: number
      suggestedTargets: string[]
    }>).map((c, i) => ({
      id: `extract-${Date.now()}-${i}`,
      ...c,
      targets: [...c.suggestedTargets],
    }))

    return NextResponse.json({ data: { candidates: enriched }, error: null })
  } catch (error) {
    console.error('[Bridge] extract error:', error)
    return NextResponse.json({ data: null, error: '提取失败' }, { status: 500 })
  }
}
