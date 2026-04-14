import Link from 'next/link'
import { ItemForm } from '@/components/items/item-form'
import { ItemType } from '@prisma/client'

export default async function NewItemPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ type?: string }>
}) {
  const { id } = await params
  const { type } = await searchParams
  const defaultType = (type as ItemType) ?? 'profile'
  return (
    <main className="max-w-md mx-auto px-4 py-12">
      <Link href={`/characters/${id}`} className="text-sm text-zinc-400 hover:text-zinc-600 mb-6 inline-block">
        ← 返回角色页
      </Link>
      <h1 className="text-xl font-semibold text-zinc-900 mb-6">新增内容</h1>
      <ItemForm characterId={id} defaultType={defaultType} />
    </main>
  )
}
