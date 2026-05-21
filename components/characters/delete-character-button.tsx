'use client'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

export function DeleteCharacterButton({ id }: { id: string }) {
  const router = useRouter()

  async function handleDelete() {
    if (!confirm('确认删除该角色及其所有内容？')) return
    const res = await fetch(`/api/characters/${id}`, { method: 'DELETE' })
    const json = await res.json()
    if (json.error) { toast.error(json.error); return }
    router.push('/')
    router.refresh()
  }

  return (
    <button onClick={handleDelete} className="px-3 py-1.5 rounded-lg border border-zinc-200 text-red-400 text-sm hover:bg-red-50 hover:border-red-200">
      删除角色
    </button>
  )
}
