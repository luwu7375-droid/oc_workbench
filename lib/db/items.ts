import { prisma } from '@/lib/prisma'
import { ItemType } from '@prisma/client'

export async function getItems(userId: string, characterIds?: string[]) {
  return prisma.item.findMany({
    where: characterIds?.length
      ? {
          characters: {
            some: {
              characterId: { in: characterIds },
              character: { userId },
            },
          },
        }
      : { characters: { some: { character: { userId } } } },
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

export async function createItem(
  userId: string,
  data: {
    content: string
    title?: string
    itemType?: ItemType
    branch?: string
    characterIds: string[]
  }
) {
  const { characterIds, ...rest } = data
  const ownedCount = await prisma.character.count({
    where: { id: { in: characterIds }, userId },
  })
  if (ownedCount !== characterIds.length) return null

  return prisma.item.create({
    data: {
      ...rest,
      characters: { create: characterIds.map((characterId) => ({ characterId })) },
    },
    include: { characters: { include: { character: true } } },
  })
}

export async function updateItem(
  id: string,
  userId: string,
  data: {
    content?: string
    title?: string
    itemType?: ItemType
    pinned?: boolean
    fictionalOrder?: number
    fictionalStage?: string
    branch?: string
    characterIds?: string[]
  }
) {
  const item = await prisma.item.findFirst({
    where: { id, characters: { some: { character: { userId } } } },
  })
  if (!item) return null

  const { characterIds, ...rest } = data
  if (characterIds) {
    const ownedCount = await prisma.character.count({
      where: { id: { in: characterIds }, userId },
    })
    if (ownedCount !== characterIds.length) return null

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

export async function deleteItem(id: string, userId: string) {
  const item = await prisma.item.findFirst({
    where: { id, characters: { some: { character: { userId } } } },
  })
  if (!item) return null
  return prisma.item.delete({ where: { id } })
}
