import Link from 'next/link'
import { getUserId } from '@/lib/auth'
import { getCharacters } from '@/lib/db/characters'
import { getItems } from '@/lib/db/items'
import { CharacterSelector } from '@/components/characters/character-selector'
import { TimelineView } from '@/components/timeline/timeline-view'
import { BranchFilter } from '@/components/items/branch-filter'
import type { ItemWithCharacters } from '@/types'

export const dynamic = 'force-dynamic'

export default async function TimelinePage({
  searchParams,
}: {
  searchParams: Promise<{ ids?: string | string[]; branch?: string }>
}) {
  const userId = getUserId()
  const { ids, branch } = await searchParams
  const allCharacters = await getCharacters(userId)
  const selectedIds = Array.isArray(ids)
    ? ids
    : ids
    ? [ids]
    : []

  const items = selectedIds.length >= 1 ? await getItems(userId, selectedIds) as ItemWithCharacters[] : []
  const snippetItems = items.filter((i) => i.itemType === 'snippet')
  const timelineItems = selectedIds.length >= 2
    ? snippetItems.filter((item) => {
        const itemCharIds = item.characters.map((c) => c.character.id)
        return selectedIds.every((id) => itemCharIds.includes(id))
      })
    : snippetItems

  const branches = Array.from(new Set(timelineItems.map((i) => i.branch).filter(Boolean))) as string[]
  const filteredItems = branch ? timelineItems.filter((i) => i.branch === branch) : timelineItems

  return (
    <main className="max-w-2xl mx-auto px-4 py-12">
      <Link href="/" className="text-sm text-zinc-400 hover:text-zinc-600 mb-6 inline-block">← 角色库</Link>
      <h1 className="text-xl font-semibold text-zinc-900 mb-4">
        {selectedIds.length >= 2 ? '共现时间轴' : '单角色时间轴'}
      </h1>
      <CharacterSelector characters={allCharacters} selectedIds={selectedIds} />
      {selectedIds.length > 0 && branches.length > 0 && (
        <BranchFilter branches={branches} />
      )}
      {selectedIds.length === 0 ? (
        <p className="text-sm text-zinc-400 py-8 text-center">请选择角色</p>
      ) : filteredItems.length === 0 ? (
        <p className="text-sm text-zinc-400 py-8 text-center">暂无内容</p>
      ) : (
        <TimelineView initialItems={filteredItems} />
      )}
    </main>
  )
}
