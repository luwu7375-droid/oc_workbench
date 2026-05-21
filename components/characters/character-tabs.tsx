'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ItemCard } from '@/components/items/item-card'
import { TimelineView } from '@/components/timeline/timeline-view'
import { GenerateSummaryButton } from '@/components/characters/generate-summary-button'
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
  const [view, setView] = useState<'list' | 'timeline'>('list')
  const router = useRouter()
  const items = tab === 'profile' ? profileItems : snippetItems
  const hasPublicProfiles = profileItems.some((item) => item.isPublic && item.itemType === 'profile')

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
      {tab === 'snippet' && snippetItems.length > 0 && (
        <div className="flex gap-2 mb-4">
          <button onClick={() => setView('list')}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${view === 'list' ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'}`}>
            列表视图
          </button>
          <button onClick={() => setView('timeline')}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${view === 'timeline' ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'}`}>
            时间轴
          </button>
        </div>
      )}
      {tab === 'profile' && (
        <GenerateSummaryButton characterId={characterId} hasPublicProfiles={hasPublicProfiles} />
      )}
      {items.length === 0 ? (
        <p className="text-sm text-zinc-400 py-8 text-center">暂无内容</p>
      ) : tab === 'snippet' && view === 'timeline' ? (
        <TimelineView initialItems={snippetItems} />
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
