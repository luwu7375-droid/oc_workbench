import Link from 'next/link'
import { getCharacters } from '@/lib/db/characters'
import { getItems } from '@/lib/db/items'
import { ItemCard } from '@/components/items/item-card'
import { CharacterSelector } from '@/components/characters/character-selector'

export const dynamic = 'force-dynamic'

export default async function CoOccurrencePage({
  searchParams,
}: {
  searchParams: Promise<{ ids?: string | string[] }>
}) {
  const { ids } = await searchParams
  const allCharacters = await getCharacters()
  const selectedIds = Array.isArray(ids)
    ? ids
    : ids
    ? [ids]
    : []

  const items = selectedIds.length >= 2 ? await getItems(selectedIds) : []
  const coItems = items.filter((item) => {
    const itemCharIds = item.characters.map((c) => c.character.id)
    return selectedIds.every((id) => itemCharIds.includes(id))
  })

  return (
    <main className="max-w-2xl mx-auto px-4 py-12">
      <Link href="/" className="text-sm text-zinc-400 hover:text-zinc-600 mb-6 inline-block">← 角色库</Link>
      <h1 className="text-xl font-semibold text-zinc-900 mb-4">多角色共现</h1>
      <CharacterSelector characters={allCharacters} selectedIds={selectedIds} />
      {selectedIds.length < 2 ? (
        <p className="text-sm text-zinc-400 py-8 text-center">请选择 2 个及以上角色</p>
      ) : coItems.length === 0 ? (
        <p className="text-sm text-zinc-400 py-8 text-center">暂无共同内容</p>
      ) : (
        <div className="flex flex-col gap-2">
          {coItems.map((item) => (
            <ItemCard key={item.id} item={item} onUpdate={() => {}} />
          ))}
        </div>
      )}
      {selectedIds.length >= 2 && (
        <div className="mt-6">
          <Link href={`/timeline?${selectedIds.map((id) => `ids=${id}`).join('&')}`}>
            <button className="px-3 py-1.5 rounded-lg border border-zinc-200 text-zinc-700 text-sm hover:bg-zinc-50">切换到时间轴</button>
          </Link>
        </div>
      )}
    </main>
  )
}
