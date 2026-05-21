import Link from 'next/link'
import { getUserId } from '@/lib/auth'
import { getCharacters } from '@/lib/db/characters'
import { getCharacterGroups } from '@/lib/db/character-groups'
import { CharacterCard } from '@/components/characters/character-card'
import { SearchBar } from '@/components/search/search-bar'
import { GroupList } from '@/components/character-groups/group-list'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const userId = await getUserId()
  const characters = await getCharacters(userId)
  const characterGroups = await getCharacterGroups(userId)

  return (
    <main className="max-w-2xl mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-zinc-900">角色库</h1>
        <div className="flex gap-2">
          <Link href="/graph">
            <button className="px-4 py-2 rounded-lg border border-zinc-200 text-zinc-700 text-sm font-medium hover:bg-zinc-50 transition-colors">
              关系图谱
            </button>
          </Link>
          <Link href="/import">
            <button className="px-4 py-2 rounded-lg bg-zinc-900 text-white text-sm font-medium hover:bg-zinc-700 transition-colors">
              导入内容
            </button>
          </Link>
          <Link href="/characters/new">
            <button className="px-4 py-2 rounded-lg border border-zinc-200 text-zinc-700 text-sm font-medium hover:bg-zinc-50 transition-colors">
              新建角色
            </button>
          </Link>
        </div>
      </div>

      <SearchBar />

      <GroupList groups={characterGroups} characters={characters} />

      {characters.length === 0 ? (
        <div className="text-center py-20 text-zinc-400">
          <p className="text-lg mb-2">还没有角色</p>
          <p className="text-sm">点击「导入内容」或「新建角色」开始</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {characters.map((c) => (
            <CharacterCard key={c.id} character={c} />
          ))}
        </div>
      )}
    </main>
  )
}
