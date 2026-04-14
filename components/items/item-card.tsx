'use client'
import { useState } from 'react'
import { toast } from 'sonner'
import type { ItemWithCharacters } from '@/types'

export function ItemCard({ item, onUpdate }: { item: ItemWithCharacters; onUpdate: () => void }) {
  const [pinned, setPinned] = useState(item.pinned)
  const [deleted, setDeleted] = useState(false)

  async function togglePin() {
    const res = await fetch(`/api/items/${item.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pinned: !pinned }),
    })
    const json = await res.json()
    if (json.error) { toast.error(json.error); return }
    setPinned(!pinned)
    onUpdate()
  }

  async function handleDelete() {
    if (!confirm('确认删除？')) return
    const res = await fetch(`/api/items/${item.id}`, { method: 'DELETE' })
    const json = await res.json()
    if (json.error) { toast.error(json.error); return }
    setDeleted(true)
    onUpdate()
  }

  if (deleted) return null

  return (
    <div className={`rounded-xl border p-4 ${pinned ? 'border-zinc-300 bg-zinc-50' : 'border-zinc-100'}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          {item.title && <p className="font-medium text-zinc-900 text-sm mb-1">{item.title}</p>}
          <p className="text-sm text-zinc-600 whitespace-pre-wrap line-clamp-4">{item.content}</p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={togglePin} className="text-zinc-300 hover:text-zinc-600 text-xs mt-0.5">
            {pinned ? '📌' : '·'}
          </button>
          <button onClick={handleDelete} className="text-zinc-200 hover:text-red-400 text-xs mt-0.5 ml-1">✕</button>
        </div>
      </div>
      <div className="mt-2 flex items-center gap-2">
        <span className="text-xs text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded-full">{item.itemType}</span>
        {item.fictionalStage && (
          <span className="text-xs text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded-full">{item.fictionalStage}</span>
        )}
      </div>
    </div>
  )
}
