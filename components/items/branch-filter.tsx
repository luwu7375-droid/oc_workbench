'use client'
import { useRouter, useSearchParams } from 'next/navigation'

export function BranchFilter({ branches }: { branches: string[] }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentBranch = searchParams.get('branch') || ''

  function handleChange(value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set('branch', value)
    } else {
      params.delete('branch')
    }
    router.push(`?${params.toString()}`)
  }

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-zinc-700 mb-2">筛选分支线</label>
      <select
        value={currentBranch}
        onChange={(e) => handleChange(e.target.value)}
        className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
      >
        <option value="">全部（含主线）</option>
        {branches.map((b) => (
          <option key={b} value={b}>{b}</option>
        ))}
      </select>
    </div>
  )
}
