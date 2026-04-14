'use client'
import { useRouter, useSearchParams } from 'next/navigation'
import type { Character } from '@/types'

export function CharacterSelector({ characters, selectedIds }: { characters: Character[]; selectedIds: string[] }) {
  const router = useRouter()
  const searchParams = useSearchParams()

  function toggle(id: string) {
    const next = selectedIds.includes(id)
      ? selectedIds.filter((x) => x !== id)
      : [...selectedIds, id]
    const params = new URLSearchParams(searchParams.toString())
    params.delete('ids')
    next.forEach((x) => params.append('ids', x))
    router.push(`/co-occurrence?${params.toString()}`)
  }

  return (
    <div className="flex flex-wrap gap-2 mb-6">
      {characters.map((c) => (
        <button key={c.id} onClick={() => toggle(c.id)}
          className={`px-3 py-1 rounded-full text-sm border transition-colors ${selectedIds.includes(c.id) ? 'bg-zinc-900 text-white border-zinc-900' : 'border-zinc-200 text-zinc-600 hover:bg-zinc-50'}`}>
          {c.name}
        </button>
      ))}
    </div>
  )
}
