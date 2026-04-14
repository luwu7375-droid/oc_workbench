import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  try {
    const { query } = await req.json()
    if (!query || typeof query !== 'string') {
      return NextResponse.json({ data: null, error: '请输入搜索关键词' }, { status: 400 })
    }
    const [characters, items] = await Promise.all([
      prisma.character.findMany({
        where: { OR: [{ name: { contains: query } }, { note: { contains: query } }] },
        take: 10,
      }),
      prisma.item.findMany({
        where: { OR: [{ title: { contains: query } }, { content: { contains: query } }] },
        include: { characters: { include: { character: true } } },
        take: 20,
      }),
    ])
    return NextResponse.json({ data: { characters, items }, error: null })
  } catch {
    return NextResponse.json({ data: null, error: '搜索失败' }, { status: 500 })
  }
}
