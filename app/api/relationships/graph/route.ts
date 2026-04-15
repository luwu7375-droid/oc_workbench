import { NextResponse } from 'next/server'
import { getRelationships, toGraphData } from '@/lib/db/relationships'

export async function GET() {
  try {
    const relationships = await getRelationships()
    const data = toGraphData(relationships)
    return NextResponse.json({ data, error: null })
  } catch {
    return NextResponse.json({ data: null, error: 'Failed to build graph data' }, { status: 500 })
  }
}
