import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getCharacters, createCharacter } from '@/lib/db/characters'

const createSchema = z.object({
  name: z.string().min(1),
  note: z.string().optional(),
  avatar: z.string().optional(),
})

export async function GET() {
  try {
    const data = await getCharacters()
    return NextResponse.json({ data, error: null })
  } catch {
    return NextResponse.json({ data: null, error: '获取角色失败' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const parsed = createSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ data: null, error: '请输入角色名' }, { status: 400 })
    }
    const data = await createCharacter(parsed.data)
    return NextResponse.json({ data, error: null }, { status: 201 })
  } catch {
    return NextResponse.json({ data: null, error: '创建角色失败' }, { status: 500 })
  }
}
