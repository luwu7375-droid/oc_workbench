'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface CharacterGroup {
  id: string
  name: string
  characterIds: string[]
}

interface Character {
  id: string
  name: string
}

interface GroupListProps {
  groups: CharacterGroup[]
  characters: Character[]
}

export function GroupList({ groups, characters }: GroupListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const router = useRouter()

  const handleDelete = async (id: string) => {
    if (!confirm('确定删除此角色组？')) return

    setDeletingId(id)
    try {
      const res = await fetch(`/api/character-groups/${id}`, { method: 'DELETE' })
      const json = await res.json()
      if (json.error) {
        alert(json.error)
      } else {
        router.refresh()
      }
    } catch {
      alert('删除失败')
    } finally {
      setDeletingId(null)
    }
  }

  const getCharacterNames = (characterIds: string[]) => {
    return characterIds
      .map((id) => characters.find((c) => c.id === id)?.name)
      .filter(Boolean)
      .join('、')
  }

  if (groups.length === 0) return null

  return (
    <div className="mb-8">
      <h2 className="text-lg font-semibold text-zinc-900 mb-3">角色组</h2>
      <div className="flex flex-col gap-2">
        {groups.map((group) => (
          <div
            key={group.id}
            className="flex items-center justify-between p-3 border border-zinc-200 rounded-lg hover:bg-zinc-50"
          >
            <Link
              href={`/co-occurrence?${group.characterIds.map((id) => `ids=${id}`).join('&')}`}
              className="flex-1"
            >
              <div className="font-medium text-zinc-900 text-sm">{group.name}</div>
              <div className="text-xs text-zinc-500 mt-1">{getCharacterNames(group.characterIds)}</div>
            </Link>
            <button
              onClick={() => handleDelete(group.id)}
              disabled={deletingId === group.id}
              className="ml-3 text-xs text-zinc-400 hover:text-red-600 disabled:opacity-50"
            >
              删除
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
