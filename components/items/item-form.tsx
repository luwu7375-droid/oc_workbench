'use client'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ItemType } from '@prisma/client'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

const TYPE_LABELS: Record<ItemType, string> = {
  profile: '设定资料',
  snippet: '创作片段',
  reference: '摘抄参考',
  image: '图片参考',
  state_card: '当前状态',
}

interface RecalledReference {
  id: string
  title: string
  content: string
}

export function ItemForm({ characterId, defaultType }: { characterId: string; defaultType?: ItemType }) {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [itemType, setItemType] = useState<ItemType>(defaultType ?? 'profile')
  const [branch, setBranch] = useState('')
  const [loading, setLoading] = useState(false)
  const [recalling, setRecalling] = useState(false)
  const [showRecallDialog, setShowRecallDialog] = useState(false)
  const [recalledReferences, setRecalledReferences] = useState<RecalledReference[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

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
        branch: branch.trim() || undefined,
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

  async function handleRecallReferences() {
    const textarea = textareaRef.current
    if (!textarea) return

    // 获取选中文本或全部文本
    const selectedText = textarea.value.substring(textarea.selectionStart, textarea.selectionEnd)
    const textToAnalyze = selectedText.trim() || content.trim()

    if (!textToAnalyze) {
      toast.error('请先输入或选中文本')
      return
    }

    setRecalling(true)
    try {
      const res = await fetch('/api/ai/recall-references', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: textToAnalyze,
          characterIds: [characterId],
        }),
      })
      const json = await res.json()
      if (json.error) {
        toast.error(json.error)
        return
      }
      setRecalledReferences(json.data)
      if (json.data.length === 0) {
        toast.info('未找到相关摘抄')
      } else {
        setShowRecallDialog(true)
      }
    } catch {
      toast.error('召回失败')
    } finally {
      setRecalling(false)
    }
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
      <div>
        <label className="block text-sm font-medium text-zinc-700 mb-1">分支线 <span className="text-zinc-400 font-normal">（选填，如"IF线-A与B相遇"）</span></label>
        <input value={branch} onChange={(e) => setBranch(e.target.value)} placeholder="留空表示主线"
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
          {itemType === 'snippet' && (
            <button
              type="button"
              onClick={handleRecallReferences}
              disabled={recalling || loading}
              className="mb-2 px-3 py-1.5 rounded-lg border border-zinc-200 text-sm text-zinc-600 hover:bg-zinc-50 disabled:opacity-50 transition-colors"
            >
              {recalling ? '召回中...' : '召回相关摘抄'}
            </button>
          )}
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="输入内容…"
            rows={8}
            className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400 resize-none"
          />
        </div>
      )}
      <button type="submit" disabled={loading}
        className="w-full rounded-lg bg-zinc-900 text-white py-2 text-sm font-medium hover:bg-zinc-700 disabled:opacity-50 transition-colors">
        {loading ? '保存中…' : '保存'}
      </button>

      <Dialog open={showRecallDialog} onOpenChange={setShowRecallDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>相关摘抄</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 mt-4">
            {recalledReferences.map((ref) => (
              <div key={ref.id} className="p-4 rounded-lg border border-zinc-200 hover:border-zinc-300 transition-colors">
                <h3 className="font-medium text-zinc-900 mb-2">{ref.title}</h3>
                <p className="text-sm text-zinc-600 whitespace-pre-wrap">{ref.content}</p>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </form>
  )
}
