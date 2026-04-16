'use client'
import { useState } from 'react'
import { toast } from 'sonner'

export function GenerateSummaryButton({
  characterId,
  hasPublicProfiles
}: {
  characterId: string
  hasPublicProfiles: boolean
}) {
  const [loading, setLoading] = useState(false)
  const [summary, setSummary] = useState<string | null>(null)

  async function handleGenerate() {
    setLoading(true)
    try {
      const res = await fetch('/api/ai/generate-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ characterId }),
      })
      const json = await res.json()

      if (json.error) {
        toast.error(json.error)
      } else {
        setSummary(json.data.summary)
        toast.success('简介生成成功')
      }
    } catch {
      toast.error('生成失败')
    } finally {
      setLoading(false)
    }
  }

  async function handleCopy() {
    if (!summary) return
    try {
      await navigator.clipboard.writeText(summary)
      toast.success('已复制到剪贴板')
    } catch {
      toast.error('复制失败')
    }
  }

  async function handleSaveAsNote() {
    if (!summary) return
    try {
      const res = await fetch(`/api/characters/${characterId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: summary }),
      })
      const json = await res.json()

      if (json.error) {
        toast.error(json.error)
      } else {
        toast.success('已保存为备注')
        window.location.reload()
      }
    } catch {
      toast.error('保存失败')
    }
  }

  if (!hasPublicProfiles) {
    return null
  }

  return (
    <div className="mt-6 p-4 bg-zinc-50 rounded-lg">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-zinc-700">AI 生成简介</h3>
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="px-3 py-1.5 rounded-lg bg-zinc-900 text-white text-sm hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? '生成中...' : '生成简介'}
        </button>
      </div>

      {summary && (
        <div className="space-y-3">
          <div className="p-3 bg-white rounded border border-zinc-200 text-sm text-zinc-700 leading-relaxed">
            {summary}
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 rounded-lg border border-zinc-200 text-zinc-700 text-sm hover:bg-zinc-50"
            >
              复制
            </button>
            <button
              onClick={handleSaveAsNote}
              className="px-3 py-1.5 rounded-lg border border-zinc-200 text-zinc-700 text-sm hover:bg-zinc-50"
            >
              保存为备注
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
