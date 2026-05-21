import type { Character, Item, ItemType, CharacterRelationship } from '@prisma/client'

export type { Character, Item, ItemType, CharacterRelationship }

export type ItemWithCharacters = Item & {
  characters: { character: Character }[]
}

export type CharacterWithItems = Character & {
  items: { item: Item }[]
}

export type RelationshipWithCharacters = CharacterRelationship & {
  from: Pick<Character, 'id' | 'name' | 'avatar'>
  to: Pick<Character, 'id' | 'name' | 'avatar'>
}

export type GraphNode = {
  id: string
  name: string
  avatar: string | null
  x?: number
  y?: number
  vx?: number
  vy?: number
}

export type GraphEdge = {
  id: string
  source: string
  target: string
  label: string
}

export type GraphData = {
  nodes: GraphNode[]
  edges: GraphEdge[]
}

export type CreateRelationshipInput = {
  fromId: string
  toId: string
  label: string
  note?: string
}

export type ApiResponse<T> = {
  data: T | null
  error: string | null
}
