import Link from 'next/link'
import { CharacterForm } from '@/components/characters/character-form'

export default function NewCharacterPage() {
  return (
    <main className="max-w-md mx-auto px-4 py-12">
      <Link href="/" className="text-sm text-zinc-400 hover:text-zinc-600 mb-6 inline-block">← 返回角色库</Link>
      <h1 className="text-xl font-semibold text-zinc-900 mb-6">新建角色</h1>
      <CharacterForm />
    </main>
  )
}
