import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getCharacterById } from '@/lib/db/characters'
import { getItems } from '@/lib/db/items'
import { CharacterTabs } from '@/components/characters/character-tabs'

export default async function CharacterPage({ params }: { params: { id: string } }) {
  const character = await getCharacterById(params.id)
  if (!character) notFound()

  const allItems = await getItems([params.id])
  const profileItems = allItems.filter((i) => ['profile', 'reference', 'image', 'state_card'].includes(i.itemType))
  const snippetItems = allItems.filter((i) => i.itemType === 'snippet')

  return (
    <main className="max-w-2xl mx-auto px-4 py-12">
      <Link href="/" className="text-sm text-zinc-400 hover:text-zinc-600 mb-6 inline-block">← 角色库</Link>
      <div className="flex items-center gap-4 mb-8">
        {character.avatar ? (
          <img src={character.avatar} alt={character.name} className="h-14 w-14 rounded-full object-cover" />
        ) : (
          <div className="h-14 w-14 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-400 text-lg font-medium">
            {character.name[0]}
          </div>
        )}
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">{character.name}</h1>
          {character.note && <p className="text-sm text-zinc-400 mt-0.5">{character.note}</p>}
        </div>
      </div>
      <div className="flex gap-2 mb-6">
        <Link href={`/characters/${params.id}/items/new?type=profile`}>
          <button className="px-3 py-1.5 rounded-lg border border-zinc-200 text-zinc-700 text-sm hover:bg-zinc-50">+ 新增资料</button>
        </Link>
        <Link href={`/characters/${params.id}/items/new?type=snippet`}>
          <button className="px-3 py-1.5 rounded-lg border border-zinc-200 text-zinc-700 text-sm hover:bg-zinc-50">+ 新增片段</button>
        </Link>
        <Link href={`/co-occurrence?ids=${params.id}`}>
          <button className="px-3 py-1.5 rounded-lg border border-zinc-200 text-zinc-700 text-sm hover:bg-zinc-50">多角色共现</button>
        </Link>
      </div>
      <CharacterTabs profileItems={profileItems} snippetItems={snippetItems} characterId={params.id} />
    </main>
  )
}
