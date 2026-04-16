import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const { characterId } = await req.json()

    if (!characterId) {
      return NextResponse.json({ error: '缺少 characterId' }, { status: 400 })
    }

    // 查询该角色的所有 is_public=true 且 item_type=profile 的内容
    const publicProfiles = await prisma.item.findMany({
      where: {
        itemType: 'profile',
        isPublic: true,
        characters: {
          some: {
            characterId,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    })

    if (publicProfiles.length === 0) {
      return NextResponse.json({ error: '该角色没有公开的资料' }, { status: 400 })
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: '未配置 ANTHROPIC_API_KEY' }, { status: 500 })
    }

    // 合并所有公开资料内容
    const profileContent = publicProfiles
      .map((p) => p.content)
      .join('\n\n')

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
            content: `请根据以下角色资料，生成一段简洁的角色简介。

要求：
1. 字数控制在 100-200 字
2. 突出角色的核心特征、性格、身份
3. 语言简洁流畅，适合作为角色卡片的简介
4. 不要使用"这个角色"��"该角色"等指代词，直接描述
5. 直接输出简介文本，不要添加任何前缀或后缀

角色资料：
${profileContent}`,
          },
        ],
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('OpenRouter API error:', response.status, errorText)
      return NextResponse.json({
        error: `AI 调用失败 (${response.status})`,
      }, { status: 500 })
    }

    const data = await response.json()
    const summary = data.choices?.[0]?.message?.content?.trim()

    if (!summary) {
      return NextResponse.json({ error: 'AI 未返回有效数据' }, { status: 500 })
    }

    return NextResponse.json({
      data: { summary },
      error: null,
    })
  } catch (error) {
    console.error('Generate summary error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '生成简介失败' },
      { status: 500 }
    )
  }
}
