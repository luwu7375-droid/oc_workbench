import Link from 'next/link'
import { auth } from '@clerk/nextjs/server'
import { getCharacters } from '@/lib/db/characters'
import { getItems } from '@/lib/db/items'
import { getCharacterGroups } from '@/lib/db/character-groups'
import { ItemCard } from '@/components/items/item-card'
import { CharacterSelector } from '@/components/characters/character-selector'
import { SaveGroupButton } from '@/components/character-groups/save-group-button'
import { GroupSelector } from '@/components/character-groups/group-selector'
import { BranchFilter } from '@/components/items/branch-filter'
import type { ItemWithCharacters } from '@/types'

export const dynamic = 'force-dynamic'

export default async function CoOccurrencePage({
  searchParams,
}: {
  searchParams: Promise<{ ids?: string | string[]; branch?: string }>
}) {
  const { userId } = await auth()
  const { ids, branch } = await searchParams
  const allCharacters = await getCharacters(userId!)
  const characterGroups = await getCharacterGroups(userId!)
  const selectedIds = Array.isArray(ids)
    ? ids
    : ids
    ? [ids]
    : []

  const items = selectedIds.length >= 2 ? await getItems(userId!, selectedIds) as ItemWithCharacters[] : []
  const snippetItems = items.filter((i) => i.itemType === 'snippet')
  const coItems = snippetItems.filter((item) => {
    const itemCharIds = item.characters.map((c) => c.character.id)
    return selectedIds.every((id) => itemCharIds.includes(id))
  })

  const branches = Array.from(new Set(coItems.map((i) => i.branch).filter(Boolean))) as string[]
  const filteredItems = branch ? coItems.filter((i) => i.branch === branch) : coItems

  return (
    <main className="max-w-2xl mx-auto px-4 py-12">
      <Link href="/" className="text-sm text-zinc-400 hover:text-zinc-600 mb-6 inline-block">← 角色库</Link>
      <h1 className="text-xl font-semibold text-zinc-900 mb-4">多角色共现</h1>
      <GroupSelector groups={characterGroups} currentIds={selectedIds} />
      <CharacterSelector characters={allCharacters} selectedIds={selectedIds} />
      {selectedIds.length >= 2 && branches.length > 0 && (
        <BranchFilter branches={branches} />
      )}
      {selectedIds.length < 2 ? (
        <p className="text-sm text-zinc-400 py-8 text-center">请选择 2 个及以上角色</p>
      ) : filteredItems.length === 0 ? (
        <p className="text-sm text-zinc-400 py-8 text-center">暂无共同内容</p>
      ) : (
        <div className="flex flex-col gap-2">
          {filteredItems.map((item) => (
            <ItemCard key={item.id} item={item} onUpdate={() => {}} />
          ))}
        </div>
      )}
      {selectedIds.length >= 2 && (
        <div className="mt-6 flex gap-2">
          <Link href={`/timeline?${selectedIds.map((id) => `ids=${id}`).join('&')}`}>
            <button className="px-3 py-1.5 rounded-lg border border-zinc-200 text-zinc-700 text-sm hover:bg-zinc-50">切换到时间轴</button>
          </Link>
          <SaveGroupButton selectedIds={selectedIds} />
        </div>
      )}
    </main>
  )
}
