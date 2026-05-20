import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { updateRelationship, deleteRelationship } from '@/lib/db/relationships'
import { z } from 'zod'

const UpdateSchema = z.object({
  label: z.string().min(1).max(50).optional(),
  note: z.string().max(500).optional(),
})

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = await params
    const body = await req.json()
    const parsed = UpdateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ data: null, error: parsed.error.message }, { status: 400 })
    }
    const data = await updateRelationship(id, userId, parsed.data)
    if (!data) return NextResponse.json({ data: null, error: '关系不存在' }, { status: 404 })
    return NextResponse.json({ data, error: null })
  } catch {
    return NextResponse.json({ data: null, error: 'Failed to update relationship' }, { status: 500 })
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = await params
    const ok = await deleteRelationship(id, userId)
    if (!ok) return NextResponse.json({ data: null, error: '关系不存在' }, { status: 404 })
    return NextResponse.json({ data: null, error: null })
  } catch {
    return NextResponse.json({ data: null, error: 'Failed to delete relationship' }, { status: 500 })
  }
}
