'use client'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import type { Character } from '@/types'

export function CharacterHeader({ character }: { character: Character }) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [note, setNote] = useState(character.note ?? '')
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handleNoteUpdate() {
    setEditing(false)
    if (note === (character.note ?? '')) return
    const res = await fetch(`/api/characters/${character.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ note: note.trim() || null }),
    })
    const json = await res.json()
    if (json.error) {
      toast.error(json.error)
      setNote(character.note ?? '')
    } else {
      router.refresh()
    }
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 1024 * 1024) {
      toast.error('图片大小不能超过 1MB')
      return
    }

    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('characterId', character.id)

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

      const updateRes = await fetch(`/api/characters/${character.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatar: uploadJson.data.url }),
      })
      const updateJson = await updateRes.json()
      if (updateJson.error) {
        toast.error(updateJson.error)
      } else {
        router.refresh()
      }
    } catch {
      toast.error('上传失败')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="flex items-center gap-4 mb-8">
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className="relative group"
      >
        {character.avatar ? (
          <img
            src={character.avatar}
            alt={character.name}
            className="h-14 w-14 rounded-full object-cover"
          />
        ) : (
          <div className="h-14 w-14 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-400 text-lg font-medium">
            {character.name[0]}
          </div>
        )}
        <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs">
          {uploading ? '...' : '上传'}
        </div>
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleAvatarUpload}
        className="hidden"
      />
      <div className="flex-1">
        <h1 className="text-xl font-semibold text-zinc-900">{character.name}</h1>
        {editing ? (
          <input
            autoFocus
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onBlur={handleNoteUpdate}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleNoteUpdate()
              if (e.key === 'Escape') {
                setNote(character.note ?? '')
                setEditing(false)
              }
            }}
            placeholder="添加备注"
            className="text-sm text-zinc-600 mt-0.5 border-b border-zinc-300 outline-none focus:border-zinc-500 w-full"
          />
        ) : (
          <button
            onClick={() => setEditing(true)}
            className="text-sm text-zinc-400 mt-0.5 hover:text-zinc-600 text-left"
          >
            {character.note || '+ 添加备注'}
          </button>
        )}
      </div>
    </div>
  )
}
