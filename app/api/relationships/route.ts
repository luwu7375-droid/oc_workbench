import { NextResponse } from 'next/server'
import { getRelationships, createRelationship } from '@/lib/db/relationships'
import { z } from 'zod'

const CreateSchema = z.object({
  fromId: z.string().cuid(),
  toId: z.string().cuid(),
  label: z.string().min(1).max(50),
  note: z.string().max(500).optional(),
})

export async function GET() {
  try {
    const data = await getRelationships()
    return NextResponse.json({ data, error: null })
  } catch {
    return NextResponse.json({ data: null, error: 'Failed to fetch relationships' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const parsed = CreateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ data: null, error: parsed.error.message }, { status: 400 })
    }
    const data = await createRelationship(parsed.data)
    return NextResponse.json({ data, error: null }, { status: 201 })
  } catch {
    return NextResponse.json({ data: null, error: 'Failed to create relationship' }, { status: 500 })
  }
}
