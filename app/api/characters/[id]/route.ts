import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getCharacterById, updateCharacter, deleteCharacter } from '@/lib/db/characters'

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  note: z.string().optional(),
  avatar: z.string().optional(),
})

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const data = await getCharacterById(params.id)
    if (!data) return NextResponse.json({ data: null, error: '角色不存在' }, { status: 404 })
    return NextResponse.json({ data, error: null })
  } catch {
    return NextResponse.json({ data: null, error: '获取角色失败' }, { status: 500 })
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json()
    const parsed = updateSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ data: null, error: '参数错误' }, { status: 400 })
    const data = await updateCharacter(params.id, parsed.data)
    return NextResponse.json({ data, error: null })
  } catch {
    return NextResponse.json({ data: null, error: '更新角色失败' }, { status: 500 })
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    await deleteCharacter(params.id)
    return NextResponse.json({ data: null, error: null })
  } catch {
    return NextResponse.json({ data: null, error: '删除角色失败' }, { status: 500 })
  }
}
