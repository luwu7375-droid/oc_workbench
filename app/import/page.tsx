import Link from 'next/link'
import { ImportForm } from '@/components/import/import-form'

export default function ImportPage() {
  return (
    <main className="max-w-2xl mx-auto px-4 py-12">
      <Link href="/" className="text-sm text-zinc-400 hover:text-zinc-600 mb-6 inline-block">← 角色库</Link>
      <h1 className="text-xl font-semibold text-zinc-900 mb-2">批量导入</h1>
      <p className="text-sm text-zinc-500 mb-6">导入历史片段、摘抄或剧情文本，自动关联角色</p>
      <ImportForm />
    </main>
  )
}
