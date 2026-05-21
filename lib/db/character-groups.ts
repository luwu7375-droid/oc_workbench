import { prisma } from '@/lib/prisma'

export async function getCharacterGroups(userId: string) {
  return prisma.characterGroup.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
  })
}

export async function getCharacterGroupById(id: string, userId: string) {
  return prisma.characterGroup.findFirst({ where: { id, userId } })
}

export async function createCharacterGroup(
  userId: string,
  data: { name: string; characterIds: string[] }
) {
  return prisma.characterGroup.create({ data: { ...data, userId } })
}

export async function updateCharacterGroup(
  id: string,
  userId: string,
  data: { name?: string; characterIds?: string[] }
) {
  const group = await prisma.characterGroup.findFirst({ where: { id, userId } })
  if (!group) return null
  return prisma.characterGroup.update({ where: { id }, data })
}

export async function deleteCharacterGroup(id: string, userId: string) {
  const group = await prisma.characterGroup.findFirst({ where: { id, userId } })
  if (!group) return null
  return prisma.characterGroup.delete({ where: { id } })
}
