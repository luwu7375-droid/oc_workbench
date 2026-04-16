'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function SearchBar() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<{ characters: { id: string; name: string }[]; items: { id: string; content: string; title: string | null; characters: { character: { id: string } }[] }[]; keywords?: string[] } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchMode, setSearchMode] = useState<'keyword' | 'semantic'>('keyword')
  const router = useRouter()

  async function handleSearch(q: string, mode: 'keyword' | 'semantic' = searchMode) {
    setQuery(q)
    if (!q.trim()) { setResults(null); setError(null); return }
    setLoading(true)
    setError(null)

    const endpoint = mode === 'semantic' ? '/api/search/semantic' : '/api/search'
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: q }),
    })
    const json = await res.json()
    setLoading(false)

    if (json.error) {
      setError(json.error)
      setResults(null)
    } else {
      setResults(json.data)
    }
  }

  async function handleSemanticSearch() {
    if (!query.trim()) return
    setSearchMode('semantic')
    await handleSearch(query, 'semantic')
  }

  return (
    <div className="relative mb-8">
      <div className="flex gap-2">
        <input
          value={query}
          onChange={(e) => { setSearchMode('keyword'); handleSearch(e.target.value, 'keyword') }}
          placeholder="搜索角色或内容..."
          className="flex-1 border border-zinc-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-zinc-400 bg-zinc-50"
        />
        <button
          onClick={handleSemanticSearch}
          disabled={loading || !query.trim()}
          className="px-4 py-2.5 text-sm bg-zinc-900 text-white rounded-xl hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
        >
          语义搜索
        </button>
      </div>
      {loading && <span className="absolute right-28 top-2.5 text-xs text-zinc-400">搜索中...</span>}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      {results && query && (
        <div className="absolute top-full mt-1 w-full bg-white border border-zinc-100 rounded-xl shadow-lg z-10 overflow-hidden">
          {searchMode === 'semantic' && results.keywords && results.keywords.length > 0 && (
            <div className="px-4 py-2 bg-zinc-50 border-b border-zinc-100">
              <span className="text-xs text-zinc-500">关键词: </span>
              <span className="text-xs text-zinc-700">{results.keywords.join(', ')}</span>
            </div>
          )}
          {results.characters.length === 0 && results.items.length === 0 ? (
            <p className="text-sm text-zinc-400 px-4 py-3">无结果</p>
          ) : (
            <>
              {results.characters.map((c) => (
                <button key={c.id} onClick={() => { setQuery(''); setResults(null); setError(null); router.push(`/characters/${c.id}`) }}
                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-zinc-50 flex items-center gap-2">
                  <span className="text-zinc-400 text-xs">角色</span>
                  <span className="text-zinc-900">{c.name}</span>
                </button>
              ))}
              {results.items.map((i) => (
                <button key={i.id} onClick={() => { setQuery(''); setResults(null); setError(null); router.push(`/characters/${i.characters[0]?.character.id}`) }}
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
