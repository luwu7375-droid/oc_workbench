import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { z } from 'zod'
import { getItems, createItem } from '@/lib/db/items'
import { ItemType } from '@prisma/client'

const createSchema = z.object({
  content: z.string().min(1),
  title: z.string().optional(),
  itemType: z.nativeEnum(ItemType).optional(),
  branch: z.string().optional(),
  characterIds: z.array(z.string()).min(1),
})

export async function GET(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 })

  try {
    const { searchParams } = new URL(req.url)
    const characterIds = searchParams.getAll('characterId')
    const data = await getItems(userId, characterIds.length ? characterIds : undefined)
    return NextResponse.json({ data, error: null })
  } catch {
    return NextResponse.json({ data: null, error: '获取内容失败' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const parsed = createSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ data: null, error: '请填写内容并选择角色' }, { status: 400 })
    }
    const data = await createItem(userId, parsed.data)
    if (!data) return NextResponse.json({ data: null, error: '角色不存在或无权限' }, { status: 403 })
    return NextResponse.json({ data, error: null }, { status: 201 })
  } catch {
    return NextResponse.json({ data: null, error: '创建内容失败' }, { status: 500 })
  }
}
