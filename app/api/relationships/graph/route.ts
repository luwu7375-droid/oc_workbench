import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getRelationships, toGraphData } from '@/lib/db/relationships'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 })

  try {
    const relationships = await getRelationships(userId)
    const data = toGraphData(relationships)
    return NextResponse.json({ data, error: null })
  } catch {
    return NextResponse.json({ data: null, error: 'Failed to build graph data' }, { status: 500 })
  }
}
