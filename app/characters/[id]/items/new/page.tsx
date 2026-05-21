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

  const isProfile = defaultType === 'profile' || defaultType === 'reference' || defaultType === 'image' || defaultType === 'state_card'
  const title = isProfile ? '新增资料' : '新增片段'
  const description = isProfile
    ? '添加角色设定、参考图片、摘抄等资料性内容'
    : '添加剧情片段、灵感记录等创作内容'

  return (
    <main className="max-w-md mx-auto px-4 py-12">
      <Link href={`/characters/${id}`} className="text-sm text-zinc-400 hover:text-zinc-600 mb-6 inline-block">
        ← 返回角色页
      </Link>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-zinc-900 mb-1">{title}</h1>
        <p className="text-sm text-zinc-500">{description}</p>
      </div>
      <ItemForm characterId={id} defaultType={defaultType} />
    </main>
  )
}
