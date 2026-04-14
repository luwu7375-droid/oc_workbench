'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

export function ImportForm() {
  const router = useRouter()
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const lines = text.split('\n').filter((l) => l.trim())
      for (const line of lines) {
        const parts = line.split('\t')
        const name = parts[0]?.trim()
        if (!name) continue
        const note = parts[1]?.trim() ?? undefined
        await fetch('/api/characters', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, note }),
        })
      }
      toast.success('导入成功')
      router.push('/')
      router.refresh()
    } catch {
      toast.error('导入失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label className="block text-sm text-zinc-600 mb-1">
          每行一个角色，格式：名字（Tab 分隔备注）
        </label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={10}
          placeholder={'角色A\n角色B\t备注内容'}
          className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-zinc-400 font-mono"
        />
      </div>
      <button
        type="submit"
        disabled={loading || !text.trim()}
        className="px-4 py-2 rounded-lg bg-zinc-900 text-white text-sm hover:bg-zinc-700 disabled:opacity-50"
      >
        {loading ? '导入中...' : '导入'}
      </button>
    </form>
  )
}
