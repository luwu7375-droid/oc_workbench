import { prisma } from '@/lib/prisma'

export async function getCharacterGroups() {
  return prisma.characterGroup.findMany({ orderBy: { updatedAt: 'desc' } })
}

export async function getCharacterGroupById(id: string) {
  return prisma.characterGroup.findUnique({ where: { id } })
}

export async function createCharacterGroup(data: { name: string; characterIds: string[] }) {
  return prisma.characterGroup.create({ data })
}

export async function updateCharacterGroup(id: string, data: { name?: string; characterIds?: string[] }) {
  return prisma.characterGroup.update({ where: { id }, data })
}

export async function deleteCharacterGroup(id: string) {
  return prisma.characterGroup.delete({ where: { id } })
}
