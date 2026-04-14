import Link from 'next/link'
import { ItemForm } from '@/components/items/item-form'
import { ItemType } from '@prisma/client'

export default function NewItemPage({
  params,
  searchParams,
}: {
  params: { id: string }
  searchParams: { type?: string }
}) {
  const defaultType = (searchParams.type as ItemType) ?? 'profile'
  return (
    <main className="max-w-md mx-auto px-4 py-12">
      <Link href={`/characters/${params.id}`} className="text-sm text-zinc-400 hover:text-zinc-600 mb-6 inline-block">
        ← 返回角色页
      </Link>
      <h1 className="text-xl font-semibold text-zinc-900 mb-6">新增内容</h1>
      <ItemForm characterId={params.id} defaultType={defaultType} />
    </main>
  )
}
