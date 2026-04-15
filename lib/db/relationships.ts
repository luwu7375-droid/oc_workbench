import { prisma } from '@/lib/prisma'
import type { CreateRelationshipInput, RelationshipWithCharacters, GraphData, GraphNode } from '@/types'

const characterSelect = { id: true, name: true, avatar: true }

export async function getRelationships(): Promise<RelationshipWithCharacters[]> {
  const result = await prisma.characterRelationship.findMany({
    include: { from: { select: characterSelect }, to: { select: characterSelect } },
    orderBy: { createdAt: 'asc' },
  })
  return result as RelationshipWithCharacters[]
}

export async function getRelationshipsBetween(
  aId: string,
  bId: string,
): Promise<RelationshipWithCharacters[]> {
  const result = await prisma.characterRelationship.findMany({
    where: {
      OR: [
        { fromId: aId, toId: bId },
        { fromId: bId, toId: aId },
      ],
    },
    include: { from: { select: characterSelect }, to: { select: characterSelect } },
  })
  return result as RelationshipWithCharacters[]
}

export async function createRelationship(
  input: CreateRelationshipInput,
): Promise<RelationshipWithCharacters> {
  const result = await prisma.characterRelationship.upsert({
    where: { fromId_toId_label: { fromId: input.fromId, toId: input.toId, label: input.label } },
    create: input,
    update: { note: input.note },
    include: { from: { select: characterSelect }, to: { select: characterSelect } },
  })
  return result as RelationshipWithCharacters
}

export async function updateRelationship(
  id: string,
  data: Partial<Pick<CreateRelationshipInput, 'label' | 'note'>>,
): Promise<RelationshipWithCharacters> {
  const result = await prisma.characterRelationship.update({
    where: { id },
    data,
    include: { from: { select: characterSelect }, to: { select: characterSelect } },
  })
  return result as RelationshipWithCharacters
}

export async function deleteRelationship(id: string): Promise<void> {
  await prisma.characterRelationship.delete({ where: { id } })
}

export function toGraphData(relationships: RelationshipWithCharacters[]): GraphData {
  const nodeMap = new Map<string, GraphNode>()

  for (const r of relationships) {
    if (!nodeMap.has(r.from.id)) nodeMap.set(r.from.id, { ...r.from })
    if (!nodeMap.has(r.to.id)) nodeMap.set(r.to.id, { ...r.to })
  }

  return {
    nodes: Array.from(nodeMap.values()),
    edges: relationships.map((r) => ({
      id: r.id,
      source: r.fromId,
      target: r.toId,
      label: r.label,
    })),
  }
}
