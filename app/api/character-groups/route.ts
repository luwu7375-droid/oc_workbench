import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { z } from 'zod'
import { getCharacterGroups, createCharacterGroup } from '@/lib/db/character-groups'

const createSchema = z.object({
  name: z.string().min(1),
  characterIds: z.array(z.string()).min(2),
})

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 })

  try {
    const data = await getCharacterGroups(userId)
    return NextResponse.json({ data, error: null })
  } catch {
    return NextResponse.json({ data: null, error: '获取角色组失败' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const parsed = createSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ data: null, error: '请输入角色组名称并选择至少 2 个角色' }, { status: 400 })
    }
    const data = await createCharacterGroup(userId, parsed.data)
    return NextResponse.json({ data, error: null }, { status: 201 })
  } catch {
    return NextResponse.json({ data: null, error: '创建角色组失败' }, { status: 500 })
  }
}
