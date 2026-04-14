import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getItemById, updateItem, deleteItem } from '@/lib/db/items'
import { ItemType } from '@prisma/client'

const updateSchema = z.object({
  content: z.string().min(1).optional(),
  title: z.string().optional(),
  itemType: z.nativeEnum(ItemType).optional(),
  pinned: z.boolean().optional(),
  fictionalOrder: z.number().int().optional(),
  fictionalStage: z.string().optional(),
  characterIds: z.array(z.string()).optional(),
})

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const data = await getItemById(id)
    if (!data) return NextResponse.json({ data: null, error: '内容不存在' }, { status: 404 })
    return NextResponse.json({ data, error: null })
  } catch {
    return NextResponse.json({ data: null, error: '获取内容失败' }, { status: 500 })
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const parsed = updateSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ data: null, error: '参数错误' }, { status: 400 })
    const data = await updateItem(id, parsed.data)
    return NextResponse.json({ data, error: null })
  } catch {
    return NextResponse.json({ data: null, error: '更新内容失败' }, { status: 500 })
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await deleteItem(id)
    return NextResponse.json({ data: null, error: null })
  } catch {
    return NextResponse.json({ data: null, error: '删除内容失败' }, { status: 500 })
  }
}
