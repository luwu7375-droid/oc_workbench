'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface SaveGroupButtonProps {
  selectedIds: string[]
}

export function SaveGroupButton({ selectedIds }: SaveGroupButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSave = async () => {
    if (!name.trim() || selectedIds.length < 2) return

    setLoading(true)
    try {
      const res = await fetch('/api/character-groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), characterIds: selectedIds }),
      })
      const json = await res.json()
      if (json.error) {
        alert(json.error)
      } else {
        setIsOpen(false)
        setName('')
        router.refresh()
      }
    } catch {
      alert('保存失败')
    } finally {
      setLoading(false)
    }
  }

  if (selectedIds.length < 2) return null

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="px-3 py-1.5 rounded-lg border border-zinc-200 text-zinc-700 text-sm hover:bg-zinc-50"
      >
        保存为角色组
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50" onClick={() => setIsOpen(false)}>
          <div className="bg-white rounded-lg p-6 w-96 shadow-lg" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">保存角色组</h3>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="输入角色组名称"
              className="w-full px-3 py-2 border border-zinc-200 rounded-lg mb-4 text-sm"
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 text-sm text-zinc-600 hover:text-zinc-900"
              >
                取消
              </button>
              <button
                onClick={handleSave}
                disabled={!name.trim() || loading}
                className="px-4 py-2 bg-zinc-900 text-white text-sm rounded-lg hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
