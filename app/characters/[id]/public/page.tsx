import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import type { ItemWithCharacters } from '@/types'

export const dynamic = 'force-dynamic'

export default async function CharacterPublicPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const character = await prisma.character.findUnique({ where: { id } })
  if (!character) notFound()

  const allItems = await prisma.item.findMany({
    where: { characters: { some: { characterId: id } } },
    include: { characters: { include: { character: true } } },
    orderBy: [{ pinned: 'desc' }, { updatedAt: 'desc' }],
  }) as ItemWithCharacters[]
  const publicProfiles = allItems.filter((i) => i.itemType === 'profile' && i.isPublic)

  return (
    <main className="min-h-screen bg-zinc-50">
      <div className="max-w-2xl mx-auto px-4 py-16">
        {/* 角色头部 */}
        <div className="flex flex-col items-center mb-12">
          {character.avatar ? (
            <img
              src={character.avatar}
              alt={character.name}
              className="h-24 w-24 rounded-full object-cover mb-4"
            />
          ) : (
            <div className="h-24 w-24 rounded-full bg-white border-2 border-zinc-200 flex items-center justify-center text-zinc-400 text-3xl font-medium mb-4">
              {character.name[0]}
            </div>
          )}
          <h1 className="text-2xl font-semibold text-zinc-900 mb-2">{character.name}</h1>
          {character.note && (
            <p className="text-sm text-zinc-500 text-center max-w-md">{character.note}</p>
          )}
        </div>

        {/* 公开资料列表 */}
        {publicProfiles.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-zinc-400 text-sm">该角色暂无公开资料</p>
          </div>
        ) : (
          <div className="space-y-4">
            {publicProfiles.map((item) => (
              <div key={item.id} className="bg-white rounded-xl border border-zinc-200 p-6">
                {item.title && (
                  <h2 className="font-medium text-zinc-900 text-base mb-3">{item.title}</h2>
                )}
                <p className="text-sm text-zinc-600 whitespace-pre-wrap leading-relaxed">
                  {item.content}
                </p>
                {item.fictionalStage && (
                  <div className="mt-4 pt-4 border-t border-zinc-100">
                    <span className="text-xs text-zinc-400 bg-zinc-50 px-2 py-1 rounded-full">
                      {item.fictionalStage}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* 底部 */}
        <div className="mt-16 pt-8 border-t border-zinc-200 text-center">
          <p className="text-xs text-zinc-400">由 OC Workbench 创建</p>
        </div>
      </div>
    </main>
  )
}
