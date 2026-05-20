import { prisma } from '@/lib/prisma'
import type { CreateRelationshipInput, RelationshipWithCharacters, GraphData, GraphNode } from '@/types'

const characterSelect = { id: true, name: true, avatar: true, userId: true }

export async function getRelationships(userId: string): Promise<RelationshipWithCharacters[]> {
  const result = await prisma.characterRelationship.findMany({
    where: { from: { userId } },
    include: { from: { select: characterSelect }, to: { select: characterSelect } },
    orderBy: { createdAt: 'asc' },
  })
  return result as RelationshipWithCharacters[]
}

export async function getRelationshipsBetween(
  aId: string,
  bId: string,
  userId: string,
): Promise<RelationshipWithCharacters[]> {
  const result = await prisma.characterRelationship.findMany({
    where: {
      from: { userId },
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
  userId: string,
  input: CreateRelationshipInput,
): Promise<RelationshipWithCharacters | null> {
  // 验证 fromId 和 toId 都属于当前用户
  const ownedCount = await prisma.character.count({
    where: { id: { in: [input.fromId, input.toId] }, userId },
  })
  if (ownedCount !== 2) return null

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
  userId: string,
  data: Partial<Pick<CreateRelationshipInput, 'label' | 'note'>>,
): Promise<RelationshipWithCharacters | null> {
  const rel = await prisma.characterRelationship.findFirst({
    where: { id, from: { userId } },
  })
  if (!rel) return null

  const result = await prisma.characterRelationship.update({
    where: { id },
    data,
    include: { from: { select: characterSelect }, to: { select: characterSelect } },
  })
  return result as RelationshipWithCharacters
}

export async function deleteRelationship(id: string, userId: string): Promise<boolean> {
  const rel = await prisma.characterRelationship.findFirst({
    where: { id, from: { userId } },
  })
  if (!rel) return false
  await prisma.characterRelationship.delete({ where: { id } })
  return true
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
