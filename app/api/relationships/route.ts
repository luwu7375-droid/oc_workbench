import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getRelationships, createRelationship } from '@/lib/db/relationships'
import { z } from 'zod'

const CreateSchema = z.object({
  fromId: z.string().cuid(),
  toId: z.string().cuid(),
  label: z.string().min(1).max(50),
  note: z.string().max(500).optional(),
}).refine(data => data.fromId !== data.toId, {
  message: '角色不能与自身建立关系',
  path: ['toId'],
})

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 })

  try {
    const data = await getRelationships(userId)
    return NextResponse.json({ data, error: null })
  } catch {
    return NextResponse.json({ data: null, error: 'Failed to fetch relationships' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const parsed = CreateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ data: null, error: parsed.error.message }, { status: 400 })
    }
    const data = await createRelationship(userId, parsed.data)
    if (!data) return NextResponse.json({ data: null, error: '角色不存在或无权限' }, { status: 403 })
    return NextResponse.json({ data, error: null }, { status: 201 })
  } catch {
    return NextResponse.json({ data: null, error: 'Failed to create relationship' }, { status: 500 })
  }
}
