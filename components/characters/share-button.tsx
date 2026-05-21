'use client'
import { toast } from 'sonner'

export function ShareButton({ characterId, hasPublicProfiles }: { characterId: string; hasPublicProfiles: boolean }) {
  if (!hasPublicProfiles) return null

  async function handleShare() {
    const url = `${window.location.origin}/characters/${characterId}/public`
    try {
      await navigator.clipboard.writeText(url)
      toast.success('链接已复制')
    } catch {
      toast.error('复制失败')
    }
  }

  return (
    <button
      onClick={handleShare}
      className="px-3 py-1.5 rounded-lg border border-zinc-200 text-zinc-700 text-sm hover:bg-zinc-50"
    >
      公开分享
    </button>
  )
}
