'use client'
import { useState, useRef } from 'react'
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
  const fileInputRef = useRef<HTMLInputElement>(null)

  const isProfileMode = !defaultType || ['profile', 'reference', 'image', 'state_card'].includes(defaultType)
  const availableTypes = isProfileMode
    ? (['profile', 'reference', 'image', 'state_card'] as ItemType[])
    : (['snippet'] as ItemType[])

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 1024 * 1024) {
      toast.error('图片大小不能超过 1MB')
      return
    }

    setLoading(true)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('characterId', characterId)

    try {
      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })
      const uploadJson = await uploadRes.json()
      if (uploadJson.error) {
        toast.error(uploadJson.error)
        return
      }
      setContent(uploadJson.data.url)
    } catch {
      toast.error('上传失败')
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim()) { toast.error('请填写内容'); return }
    setLoading(true)
    const res = await fetch('/api/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: title.trim() || undefined,
        content: content.trim(),
        itemType,
        characterIds: [characterId],
        image: itemType === 'image' ? content : undefined,
      }),
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
          {availableTypes.map((t) => (
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
      {itemType === 'image' ? (
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">图片 <span className="text-red-400">*</span></label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
          {content ? (
            <div className="relative">
              <img src={content} alt="预览" className="w-full rounded-lg border border-zinc-200" />
              <button
                type="button"
                onClick={() => setContent('')}
                className="absolute top-2 right-2 bg-black/50 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-black/70"
              >
                ✕
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
              className="w-full h-32 rounded-lg border-2 border-dashed border-zinc-200 hover:border-zinc-400 flex items-center justify-center text-sm text-zinc-400 hover:text-zinc-600 transition-colors"
            >
              {loading ? '上传中...' : '点击上传图片'}
            </button>
          )}
        </div>
      ) : (
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">内容 <span className="text-red-400">*</span></label>
          <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="输入内容…" rows={8}
            className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400 resize-none" />
        </div>
      )}
      <button type="submit" disabled={loading}
        className="w-full rounded-lg bg-zinc-900 text-white py-2 text-sm font-medium hover:bg-zinc-700 disabled:opacity-50 transition-colors">
        {loading ? '保存中…' : '保存'}
      </button>
    </form>
  )
}
