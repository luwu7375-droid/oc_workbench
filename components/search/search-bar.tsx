'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function SearchBar() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<{ characters: { id: string; name: string }[]; items: { id: string; content: string; title: string | null; characters: { character: { id: string } }[] }[] } | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSearch(q: string) {
    setQuery(q)
    if (!q.trim()) { setResults(null); return }
    setLoading(true)
    const res = await fetch('/api/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: q }),
    })
    const json = await res.json()
    setLoading(false)
    if (!json.error) setResults(json.data)
  }

  return (
    <div className="relative mb-8">
      <input
        value={query}
        onChange={(e) => handleSearch(e.target.value)}
        placeholder="搜索角色或内容..."
        className="w-full border border-zinc-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-zinc-400 bg-zinc-50"
      />
      {loading && <span className="absolute right-3 top-2.5 text-xs text-zinc-400">搜索中...</span>}
      {results && query && (
        <div className="absolute top-full mt-1 w-full bg-white border border-zinc-100 rounded-xl shadow-lg z-10 overflow-hidden">
          {results.characters.length === 0 && results.items.length === 0 ? (
            <p className="text-sm text-zinc-400 px-4 py-3">无结果</p>
          ) : (
            <>
              {results.characters.map((c) => (
                <button key={c.id} onClick={() => { setQuery(''); setResults(null); router.push(`/characters/${c.id}`) }}
                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-zinc-50 flex items-center gap-2">
                  <span className="text-zinc-400 text-xs">角色</span>
                  <span className="text-zinc-900">{c.name}</span>
                </button>
              ))}
              {results.items.map((i) => (
                <button key={i.id} onClick={() => { setQuery(''); setResults(null); router.push(`/characters/${i.characters[0]?.character.id}`) }}
                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-zinc-50 flex items-center gap-2">
                  <span className="text-zinc-400 text-xs">内容</span>
                  <span className="text-zinc-600 truncate">{i.title || i.content}</span>
                </button>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  )
}
