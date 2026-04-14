'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ItemCard } from '@/components/items/item-card'
import type { ItemWithCharacters } from '@/types'

export function CharacterTabs({
  profileItems,
  snippetItems,
  characterId,
}: {
  profileItems: ItemWithCharacters[]
  snippetItems: ItemWithCharacters[]
  characterId: string
}) {
  const [tab, setTab] = useState<'profile' | 'snippet'>('profile')
  const router = useRouter()
  const items = tab === 'profile' ? profileItems : snippetItems

  return (
    <div>
      <div className="flex gap-1 mb-4 border-b border-zinc-100">
        {(['profile', 'snippet'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${tab === t ? 'border-zinc-900 text-zinc-900' : 'border-transparent text-zinc-400 hover:text-zinc-600'}`}>
            {t === 'profile' ? '资料' : '创作'}
          </button>
        ))}
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-zinc-400 py-8 text-center">暂无内容</p>
      ) : (
        <div className="flex flex-col gap-2">
          {items.map((item) => (
            <ItemCard key={item.id} item={item} onUpdate={() => router.refresh()} />
          ))}
        </div>
      )}
    </div>
  )
}
