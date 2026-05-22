import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getBridgeUserId, verifyBridgeToken } from '@/lib/tavern-bridge'

const schema = z.object({
  names: z.array(z.string().min(1)).min(1),
})

export async function POST(req: NextRequest) {
  if (!verifyBridgeToken(req)) {
    return NextResponse.json({ data: null, error: '未授权' }, { status: 401 })
  }
  const userId = getBridgeUserId()

  try {
    const body = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ data: null, error: '请提供角色名列表' }, { status: 400 })
    }

    const { names } = parsed.data
    const result: Record<string, { id: string; name: string; auto_created: boolean }> = {}

    for (const name of names) {
      const existing = await prisma.character.findFirst({
        where: { userId, name: { equals: name, mode: 'insensitive' } },
      })

      if (existing) {
        result[name] = { id: existing.id, name: existing.name, auto_created: false }
      } else {
        const created = await prisma.character.create({
          data: { userId, name },
        })
        result[name] = { id: created.id, name: created.name, auto_created: true }
      }
    }

    return NextResponse.json({ data: result, error: null })
  } catch (error) {
    console.error('[Bridge] resolve error:', error)
    return NextResponse.json({ data: null, error: '角色解析失败' }, { status: 500 })
  }
}
