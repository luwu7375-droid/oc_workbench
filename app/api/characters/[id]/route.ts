import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { z } from 'zod'
import { getCharacterById, updateCharacter, deleteCharacter } from '@/lib/db/characters'

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  note: z.string().optional(),
  avatar: z.string().optional(),
})

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = await params
    const data = await getCharacterById(id, userId)
    if (!data) return NextResponse.json({ data: null, error: '角色不存在' }, { status: 404 })
    return NextResponse.json({ data, error: null })
  } catch {
    return NextResponse.json({ data: null, error: '获取角色失败' }, { status: 500 })
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = await params
    const body = await req.json()
    const parsed = updateSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ data: null, error: '参数错误' }, { status: 400 })
    const data = await updateCharacter(id, userId, parsed.data)
    if (!data) return NextResponse.json({ data: null, error: '角色不存在' }, { status: 404 })
    return NextResponse.json({ data, error: null })
  } catch {
    return NextResponse.json({ data: null, error: '更新角色失败' }, { status: 500 })
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 })

  try {
    const { id } = await params
    const result = await deleteCharacter(id, userId)
    if (!result) return NextResponse.json({ data: null, error: '角色不存在' }, { status: 404 })
    return NextResponse.json({ data: null, error: null })
  } catch {
    return NextResponse.json({ data: null, error: '删除角色失败' }, { status: 500 })
  }
}
