import { getRelationships, toGraphData } from '@/lib/db/relationships'
import { getCharacters } from '@/lib/db/characters'
import GraphPageClient from './page-client'

export default async function GraphPage() {
  const relationships = await getRelationships()
  const graphData = toGraphData(relationships)
  const characters = await getCharacters()

  return <GraphPageClient graphData={graphData} characters={characters} />
}
