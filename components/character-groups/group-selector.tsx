'use client'

import { useRouter } from 'next/navigation'

interface CharacterGroup {
  id: string
  name: string
  characterIds: string[]
}

interface GroupSelectorProps {
  groups: CharacterGroup[]
  currentIds: string[]
}

export function GroupSelector({ groups, currentIds }: GroupSelectorProps) {
  const router = useRouter()

  const handleSelect = (group: CharacterGroup) => {
    const query = group.characterIds.map((id) => `ids=${id}`).join('&')
    router.push(`/co-occurrence?${query}`)
  }

  if (groups.length === 0) return null

  const currentGroupId = groups.find(
    (g) =>
      g.characterIds.length === currentIds.length &&
      g.characterIds.every((id) => currentIds.includes(id))
  )?.id

  return (
    <div className="mb-4">
      <select
        value={currentGroupId || ''}
        onChange={(e) => {
          const group = groups.find((g) => g.id === e.target.value)
          if (group) handleSelect(group)
        }}
        className="px-3 py-2 border border-zinc-200 rounded-lg text-sm text-zinc-700 bg-white hover:bg-zinc-50"
      >
        <option value="">快速切换角色组</option>
        {groups.map((group) => (
          <option key={group.id} value={group.id}>
            {group.name}
          </option>
        ))}
      </select>
    </div>
  )
}
