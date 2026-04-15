import { NextResponse } from 'next/server'
import { updateRelationship, deleteRelationship } from '@/lib/db/relationships'
import { z } from 'zod'

const UpdateSchema = z.object({
  label: z.string().min(1).max(50).optional(),
  note: z.string().max(500).optional(),
})

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const parsed = UpdateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ data: null, error: parsed.error.message }, { status: 400 })
    }
    const data = await updateRelationship(id, parsed.data)
    return NextResponse.json({ data, error: null })
  } catch {
    return NextResponse.json({ data: null, error: 'Failed to update relationship' }, { status: 500 })
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await deleteRelationship(id)
    return NextResponse.json({ data: null, error: null })
  } catch {
    return NextResponse.json({ data: null, error: 'Failed to delete relationship' }, { status: 500 })
  }
}
