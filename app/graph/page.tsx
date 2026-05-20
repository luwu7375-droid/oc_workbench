import { auth } from '@clerk/nextjs/server'
import { getRelationships, toGraphData } from '@/lib/db/relationships'
import { getCharacters } from '@/lib/db/characters'
import GraphPageClient from './page-client'

export default async function GraphPage() {
  const { userId } = await auth()
  const relationships = await getRelationships(userId!)
  const graphData = toGraphData(relationships)
  const characters = await getCharacters(userId!)

  return <GraphPageClient graphData={graphData} characters={characters} />
}
