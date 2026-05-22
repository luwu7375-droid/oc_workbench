import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getBridgeUserId, verifyBridgeToken } from '@/lib/tavern-bridge'

export async function GET(req: NextRequest) {
  if (!verifyBridgeToken(req)) {
    return NextResponse.json({ data: null, error: '未授权' }, { status: 401 })
  }
  const userId = getBridgeUserId()
  const { searchParams } = new URL(req.url)
  const characterIds = searchParams.getAll('characterIds')

  if (!characterIds.length) {
    return NextResponse.json({ data: null, error: '请提供 characterIds' }, { status: 400 })
  }

  try {
    const items = await prisma.item.findMany({
      where: {
        itemType: { in: ['state_card', 'snippet'] },
        characters: {
          some: {
            characterId: { in: characterIds },
            character: { userId },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    })

    const stateCards = items
      .filter(i => i.itemType === 'state_card')
      .map(i => ({ title: i.title ?? '', content: i.content }))

    const recentSnippets = items
      .filter(i => i.itemType === 'snippet')
      .slice(0, 10)
      .map(i => ({ title: i.title ?? '', content: i.content }))

    return NextResponse.json({ data: { stateCards, recentSnippets }, error: null })
  } catch (error) {
    console.error('[Bridge] context inject error:', error)
    return NextResponse.json({ data: null, error: '获取上下文失败' }, { status: 500 })
  }
}
