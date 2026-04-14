'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ItemType } from '@prisma/client'

const TYPE_LABELS: Record<ItemType, string> = {
  profile: '设定资料',
  snippet: '创作片段',
  reference: '摘抄参考',
  image: '图片参考',
  state_card: '当前状态',
}

export function ItemForm({ characterId, defaultType }: { characterId: string; defaultType?: ItemType }) {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [itemType, setItemType] = useState<ItemType>(defaultType ?? 'profile')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim()) { toast.error('请填写内容'); return }
    setLoading(true)
    const res = await fetch('/api/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: title.trim() || undefined, content: content.trim(), itemType, characterIds: [characterId] }),
    })
    const json = await res.json()
    setLoading(false)
    if (json.error) { toast.error(json.error); return }
    router.push(`/characters/${characterId}`)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label className="block text-sm font-medium text-zinc-700 mb-1">类型</label>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(TYPE_LABELS) as ItemType[]).map((t) => (
            <button key={t} type="button" onClick={() => setItemType(t)}
              className={`px-3 py-1 rounded-full text-sm border transition-colors ${itemType === t ? 'bg-zinc-900 text-white border-zinc-900' : 'border-zinc-200 text-zinc-600 hover:bg-zinc-50'}`}>
              {TYPE_LABELS[t]}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-zinc-700 mb-1">标题 <span className="text-zinc-400 font-normal">（选填）</span></label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="给这条内容起个标题"
          className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400" />
      </div>
      <div>
        <label className="block text-sm font-medium text-zinc-700 mb-1">内容 <span className="text-red-400">*</span></label>
        <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="输入内容…" rows={8}
          className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400 resize-none" />
      </div>
      <button type="submit" disabled={loading}
        className="w-full rounded-lg bg-zinc-900 text-white py-2 text-sm font-medium hover:bg-zinc-700 disabled:opacity-50 transition-colors">
        {loading ? '保存中…' : '保存'}
      </button>
    </form>
  )
}
