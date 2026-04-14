import type { Character, Item, ItemType } from '@prisma/client'

export type { Character, Item, ItemType }

export type ItemWithCharacters = Item & {
  characters: { character: Character }[]
}

export type CharacterWithItems = Character & {
  items: { item: Item }[]
}

export type ApiResponse<T> = {
  data: T | null
  error: string | null
}
