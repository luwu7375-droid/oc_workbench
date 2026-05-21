'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import type { ItemWithCharacters } from '@/types'

export function StateCardForm({
  characterId,
  existingItem,
  open,
  onOpenChange
}: {
  characterId: string
  existingItem?: ItemWithCharacters
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  // 解析现有数据
  const existingData = existingItem ? (() => {
    try {
      return JSON.parse(existingItem.content)
    } catch {
      return { traits: [], stage: '', relationships: '' }
    }
  })() : { traits: [], stage: '', relationships: '' }

  const [traits, setTraits] = useState<string[]>(existingData.traits || [])
  const [traitInput, setTraitInput] = useState('')
  const [stage, setStage] = useState(existingData.stage || '')
  const [relationships, setRelationships] = useState(existingData.relationships || '')

  function addTrait() {
    const trimmed = traitInput.trim()
    if (!trimmed) return
    if (traits.includes(trimmed)) {
      toast.error('关键词已存在')
      return
    }
    setTraits([...traits, trimmed])
    setTraitInput('')
  }

  function removeTrait(trait: string) {
    setTraits(traits.filter(t => t !== trait))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const content = JSON.stringify({
      traits,
      stage: stage.trim(),
      relationships: relationships.trim()
    })

    setLoading(true)

    try {
      const url = existingItem ? `/api/items/${existingItem.id}` : '/api/items'
      const method = existingItem ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          itemType: 'state_card',
          characterIds: [characterId],
          title: '当前状态'
        })
      })

      const json = await res.json()
      if (json.error) {
        toast.error(json.error)
        return
      }

      toast.success(existingItem ? '状态卡已更新' : '状态卡已创建')
      onOpenChange(false)
      router.refresh()
    } catch {
      toast.error('保存失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{existingItem ? '编辑' : '添加'}当前状态卡</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-2">
          {/* 性格关键词 */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">
              性格关键词
            </label>
            <div className="flex gap-2 mb-2">
              <input
                value={traitInput}
                onChange={(e) => setTraitInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addTrait()
                  }
                }}
                placeholder="输入关键词后按回车"
                className="flex-1 rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
              />
              <button
                type="button"
                onClick={addTrait}
                className="px-4 py-2 rounded-lg bg-zinc-100 text-zinc-700 text-sm hover:bg-zinc-200 transition-colors"
              >
                添加
              </button>
            </div>
            {traits.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {traits.map((trait, idx) => (
                  <Badge
                    key={idx}
                    variant="outline"
                    className="bg-white cursor-pointer hover:bg-zinc-50"
                    onClick={() => removeTrait(trait)}
                  >
                    {trait} <span className="ml-1 text-zinc-400">×</span>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* 所处阶段 */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">
              所处阶段
            </label>
            <input
              value={stage}
              onChange={(e) => setStage(e.target.value)}
              placeholder="���如：大学时期、职业初期、退休后..."
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
            />
          </div>

          {/* 关系现状 */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">
              关系现状
            </label>
            <textarea
              value={relationships}
              onChange={(e) => setRelationships(e.target.value)}
              placeholder="描述与其他角色的关系现状..."
              rows={6}
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400 resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-zinc-900 text-white py-2.5 text-sm font-medium hover:bg-zinc-700 disabled:opacity-50 transition-colors"
          >
            {loading ? '保存中...' : '保存'}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
