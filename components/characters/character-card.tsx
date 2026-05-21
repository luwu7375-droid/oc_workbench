import Link from 'next/link'
import type { Character } from '@/types'

export function CharacterCard({ character }: { character: Character }) {
  return (
    <Link href={`/characters/${character.id}`}>
      <div className="flex items-center gap-3 rounded-xl border border-zinc-100 p-4 hover:bg-zinc-50 transition-colors">
        {character.avatar ? (
          <img src={character.avatar} alt={character.name} className="h-10 w-10 rounded-full object-cover" />
        ) : (
          <div className="h-10 w-10 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-400 text-sm font-medium">
            {character.name[0]}
          </div>
        )}
        <div>
          <p className="font-medium text-zinc-900">{character.name}</p>
          {character.note && <p className="text-sm text-zinc-400">{character.note}</p>}
        </div>
      </div>
    </Link>
  )
}
