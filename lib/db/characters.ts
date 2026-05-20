import { prisma } from '@/lib/prisma'

export async function getCharacters(userId: string) {
  return prisma.character.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
  })
}

export async function getCharacterById(id: string, userId: string) {
  return prisma.character.findFirst({
    where: { id, userId },
    include: { items: { include: { item: true } } },
  })
}

export async function createCharacter(
  userId: string,
  data: { name: string; note?: string; avatar?: string }
) {
  return prisma.character.create({ data: { ...data, userId } })
}

export async function updateCharacter(
  id: string,
  userId: string,
  data: { name?: string; note?: string; avatar?: string }
) {
  const character = await prisma.character.findFirst({ where: { id, userId } })
  if (!character) return null
  return prisma.character.update({ where: { id }, data })
}

export async function deleteCharacter(id: string, userId: string) {
  const character = await prisma.character.findFirst({ where: { id, userId } })
  if (!character) return null
  return prisma.character.delete({ where: { id } })
}
