'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

export function CharacterForm() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) { toast.error('请输入角色名'); return }
    setLoading(true)
    const res = await fetch('/api/characters', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim(), note: note.trim() || undefined }),
    })
    const json = await res.json()
    setLoading(false)
    if (json.error) { toast.error(json.error); return }
    router.push(`/characters/${json.data.id}`)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label className="block text-sm font-medium text-zinc-700 mb-1">角色名 <span className="text-red-400">*</span></label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="输入角色名"
          className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-zinc-700 mb-1">一句话备注 <span className="text-zinc-400 font-normal">（选填）</span></label>
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="简单描述这个角色"
          className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="mt-2 w-full rounded-lg bg-zinc-900 text-white py-2 text-sm font-medium hover:bg-zinc-700 disabled:opacity-50 transition-colors"
      >
        {loading ? '创建中…' : '创建角色'}
      </button>
    </form>
  )
}
