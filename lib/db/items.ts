import { prisma } from '@/lib/prisma'
import { ItemType } from '@prisma/client'

export async function getItems(characterIds?: string[]) {
  return prisma.item.findMany({
    where: characterIds?.length
      ? { characters: { some: { characterId: { in: characterIds } } } }
      : undefined,
    include: { characters: { include: { character: true } } },
    orderBy: [{ pinned: 'desc' }, { updatedAt: 'desc' }],
  })
}

export async function getItemById(id: string) {
  return prisma.item.findUnique({
    where: { id },
    include: { characters: { include: { character: true } } },
  })
}

export async function createItem(data: {
  content: string
  title?: string
  itemType?: ItemType
  branch?: string
  characterIds: string[]
}) {
  const { characterIds, ...rest } = data
  return prisma.item.create({
    data: {
      ...rest,
      characters: { create: characterIds.map((characterId) => ({ characterId })) },
    },
    include: { characters: { include: { character: true } } },
  })
}

export async function updateItem(id: string, data: {
  content?: string
  title?: string
  itemType?: ItemType
  pinned?: boolean
  fictionalOrder?: number
  fictionalStage?: string
  branch?: string
  characterIds?: string[]
}) {
  const { characterIds, ...rest } = data
  if (characterIds) {
    await prisma.itemCharacter.deleteMany({ where: { itemId: id } })
    await prisma.itemCharacter.createMany({
      data: characterIds.map((characterId) => ({ itemId: id, characterId })),
    })
  }
  return prisma.item.update({
    where: { id },
    data: rest,
    include: { characters: { include: { character: true } } },
  })
}

export async function deleteItem(id: string) {
  return prisma.item.delete({ where: { id } })
}
