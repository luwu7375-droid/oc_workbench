import Link from 'next/link'
import { ImportForm } from '@/components/import/import-form'

export default function ImportPage() {
  return (
    <main className="max-w-md mx-auto px-4 py-12">
      <Link href="/" className="text-sm text-zinc-400 hover:text-zinc-600 mb-6 inline-block">← 角色库</Link>
      <h1 className="text-xl font-semibold text-zinc-900 mb-6">批量导入角色</h1>
      <ImportForm />
    </main>
  )
}
