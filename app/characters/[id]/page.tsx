import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getCharacterById } from '@/lib/db/characters'
import { getItems } from '@/lib/db/items'
import { CharacterTabs } from '@/components/characters/character-tabs'
import { DeleteCharacterButton } from '@/components/characters/delete-character-button'
import { CharacterHeader } from '@/components/characters/character-header'
import { StateCardSection } from '@/components/items/state-card-section'
import type { ItemWithCharacters } from '@/types'

export const dynamic = 'force-dynamic'

export default async function CharacterPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const character = await getCharacterById(id)
  if (!character) notFound()

  const allItems = await getItems([id]) as ItemWithCharacters[]
  const stateCard = allItems.find((i) => i.itemType === 'state_card')
  const profileItems = allItems.filter((i) => ['profile', 'reference', 'image'].includes(i.itemType))
  const snippetItems = allItems.filter((i) => i.itemType === 'snippet')

  return (
    <main className="max-w-2xl mx-auto px-4 py-12">
      <Link href="/" className="text-sm text-zinc-400 hover:text-zinc-600 mb-6 inline-block">← 角色库</Link>
      <CharacterHeader character={character} />
      <div className="flex gap-2 mb-6">
        <Link href={`/characters/${id}/items/new?type=profile`}>
          <button className="px-3 py-1.5 rounded-lg border border-zinc-200 text-zinc-700 text-sm hover:bg-zinc-50">+ 新增资料</button>
        </Link>
        <Link href={`/characters/${id}/items/new?type=snippet`}>
          <button className="px-3 py-1.5 rounded-lg border border-zinc-200 text-zinc-700 text-sm hover:bg-zinc-50">+ 新增片段</button>
        </Link>
        <Link href={`/timeline?ids=${id}`}>
          <button className="px-3 py-1.5 rounded-lg border border-zinc-200 text-zinc-700 text-sm hover:bg-zinc-50">查看时间轴</button>
        </Link>
        <Link href={`/co-occurrence?ids=${id}`}>
          <button className="px-3 py-1.5 rounded-lg border border-zinc-200 text-zinc-700 text-sm hover:bg-zinc-50">多角色共现</button>
        </Link>
        <div className="ml-auto">
          <DeleteCharacterButton id={id} />
        </div>
      </div>

      {/* 当前状态卡区域 */}
      <StateCardSection characterId={id} stateCard={stateCard} />

      <CharacterTabs profileItems={profileItems} snippetItems={snippetItems} characterId={id} />
    </main>
  )
}
