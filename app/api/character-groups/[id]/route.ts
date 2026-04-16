import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getCharacterGroupById, updateCharacterGroup, deleteCharacterGroup } from '@/lib/db/character-groups'

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  characterIds: z.array(z.string()).min(2).optional(),
})

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const data = await getCharacterGroupById(id)
    if (!data) {
      return NextResponse.json({ data: null, error: '角色组不存在' }, { status: 404 })
    }
    return NextResponse.json({ data, error: null })
  } catch {
    return NextResponse.json({ data: null, error: '获取角色组失败' }, { status: 500 })
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()
    const parsed = updateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ data: null, error: '参数错误' }, { status: 400 })
    }
    const data = await updateCharacterGroup(id, parsed.data)
    return NextResponse.json({ data, error: null })
  } catch {
    return NextResponse.json({ data: null, error: '更新角色组失败' }, { status: 500 })
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await deleteCharacterGroup(id)
    return NextResponse.json({ data: { success: true }, error: null })
  } catch {
    return NextResponse.json({ data: null, error: '删除角色组失败' }, { status: 500 })
  }
}
