import { NextResponse } from 'next/server'
import { getUserId } from '@/lib/auth'
import { z } from 'zod'
import { getCharacters, createCharacter } from '@/lib/db/characters'

const createSchema = z.object({
  name: z.string().min(1),
  note: z.string().optional(),
  avatar: z.string().optional(),
})

export async function GET() {
  const userId = getUserId()

  try {
    const data = await getCharacters(userId)
    return NextResponse.json({ data, error: null })
  } catch {
    return NextResponse.json({ data: null, error: '获取角色失败' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const userId = getUserId()

  try {
    const body = await req.json()
    const parsed = createSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ data: null, error: '请输入角色名' }, { status: 400 })
    }
    const data = await createCharacter(userId, parsed.data)
    return NextResponse.json({ data, error: null }, { status: 201 })
  } catch {
    return NextResponse.json({ data: null, error: '创建角色失败' }, { status: 500 })
  }
}
