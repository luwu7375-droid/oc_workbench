import { prisma } from '@/lib/prisma'

export async function getCharacters() {
  return prisma.character.findMany({ orderBy: { updatedAt: 'desc' } })
}

export async function getCharacterById(id: string) {
  return prisma.character.findUnique({
    where: { id },
    include: { items: { include: { item: true } } },
  })
}

export async function createCharacter(data: { name: string; note?: string; avatar?: string }) {
  return prisma.character.create({ data })
}

export async function updateCharacter(id: string, data: { name?: string; note?: string; avatar?: string }) {
  return prisma.character.update({ where: { id }, data })
}

export async function deleteCharacter(id: string) {
  return prisma.character.delete({ where: { id } })
}
