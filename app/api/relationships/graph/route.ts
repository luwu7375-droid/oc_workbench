import { NextResponse } from 'next/server'
import { getUserId } from '@/lib/auth'
import { getRelationships, toGraphData } from '@/lib/db/relationships'

export async function GET() {
  const userId = await getUserId()

  try {
    const relationships = await getRelationships(userId)
    const data = toGraphData(relationships)
    return NextResponse.json({ data, error: null })
  } catch {
    return NextResponse.json({ data: null, error: 'Failed to build graph data' }, { status: 500 })
  }
}
