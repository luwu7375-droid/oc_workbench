import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getBridgeUserId, verifyBridgeToken } from '@/lib/tavern-bridge'

const candidateSchema = z.object({
  id: z.string(),
  type: z.enum(['event', 'state', 'relation', 'trait']),
  title: z.string().min(1),
  content: z.string().min(1),
  confidence: z.number().min(0).max(1),
  targets: z.array(z.string()),
})

const schema = z.object({
  characterIds: z.array(z.string()).min(1),
  candidates: z.array(candidateSchema).min(1),
})

// ItemType mapping: event/state/relation/trait → snippet (all go in as snippets)
// state_card is reserved for the character's current state summary
const TYPE_TO_ITEM_TYPE = {
  event: 'snippet',
  state: 'state_card',
  relation: 'snippet',
  trait: 'profile',
} as const

export async function POST(req: NextRequest) {
  if (!verifyBridgeToken(req)) {
    return NextResponse.json({ data: null, error: '未授权' }, { status: 401 })
  }
  const userId = getBridgeUserId()

  try {
    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ data: null, error: '请求格式错误' }, { status: 400 })
    }

    const { characterIds, candidates } = parsed.data

    // Verify all characterIds belong to this user
    const ownedCount = await prisma.character.count({
      where: { id: { in: characterIds }, userId },
    })
    if (ownedCount !== characterIds.length) {
      return NextResponse.json({ data: null, error: '角色不存在或无权限' }, { status: 403 })
    }

    let committed = 0
    const committedIds: string[] = []

    for (const candidate of candidates) {
      // Only write to workbench target
      if (!candidate.targets.includes('workbench')) continue

      const itemType = TYPE_TO_ITEM_TYPE[candidate.type]

      const item = await prisma.item.create({
        data: {
          title: candidate.title,
          content: candidate.content,
          itemType,
          characters: {
            create: characterIds.map((characterId) => ({ characterId })),
          },
        },
      })

      committedIds.push(item.id)
      committed++
    }

    return NextResponse.json({
      data: { committed, itemIds: committedIds },
      error: null,
    })
  } catch (error) {
    console.error('[Bridge] commit error:', error)
    return NextResponse.json({ data: null, error: '写回失败' }, { status: 500 })
  }
}
