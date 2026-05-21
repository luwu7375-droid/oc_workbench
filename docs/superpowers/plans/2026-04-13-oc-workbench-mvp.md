# OC Workbench MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a single-user OC creation workbench with character management, content attachment, multi-character co-occurrence view, and shared timeline.

**Architecture:** Next.js 14 full-stack app with Prisma + PostgreSQL. Server Components for data fetching, Client Components for interactions. shadcn/ui for UI, dnd-kit for drag-and-drop timeline.

**Tech Stack:** Next.js 14, TypeScript, Tailwind CSS, Prisma, PostgreSQL (Supabase), shadcn/ui, dnd-kit

---

## File Structure

### Database Layer
- `prisma/schema.prisma` - Database schema (Character, Item tables)
- `lib/prisma.ts` - Prisma client singleton
- `lib/db/characters.ts` - Character CRUD operations
- `lib/db/items.ts` - Item CRUD operations

### Type Definitions
- `types/index.ts` - Shared TypeScript types

### API Routes
- `app/api/characters/route.ts` - GET, POST characters
- `app/api/characters/[id]/route.ts` - GET, PATCH, DELETE character
- `app/api/items/route.ts` - GET, POST items
- `app/api/items/[id]/route.ts` - GET, PATCH, DELETE item
- `app/api/search/route.ts` - Global search
- `app/api/upload/route.ts` - Image upload

### UI Components
- `components/ui/*` - shadcn/ui base components
- `components/characters/character-card.tsx` - Character display card
- `components/characters/character-form.tsx` - Create/edit character form
- `components/items/item-card.tsx` - Content item display
- `components/items/item-form.tsx` - Create/edit item form
- `components/timeline/timeline-view.tsx` - Draggable timeline
- `components/search/search-bar.tsx` - Search input

### Pages
- `app/page.tsx` - Home/character library
- `app/characters/new/page.tsx` - Create character
- `app/characters/[id]/page.tsx` - Character detail page
- `app/co-occurrence/page.tsx` - Multi-character co-occurrence
- `app/timeline/page.tsx` - Shared timeline
- `app/import/page.tsx` - Import content

---

## Task 1: 安装依赖与环境配置

**Files:**
- Create: `.env`
- Create: `lib/prisma.ts`
- Modify: `package.json`

- [ ] **Step 1: 安装依赖**

```bash
cd /Users/weidian/oc-workbench
npm install prisma @prisma/client @supabase/supabase-js zod sonner
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
npm install @tiptap/react @tiptap/pm @tiptap/starter-kit
npx prisma init
```

- [ ] **Step 2: 安装 shadcn/ui**

```bash
npx shadcn@latest init
```

提示选择：Style = Default，Base color = Zinc，CSS variables = yes

- [ ] **Step 3: 安装 shadcn 组件**

```bash
npx shadcn@latest add button input textarea dialog tabs badge
```

- [ ] **Step 4: 创建 `.env`**

```
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"
NEXT_PUBLIC_SUPABASE_URL="https://[PROJECT-REF].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="[ANON-KEY]"
```

- [ ] **Step 5: 创建 `lib/prisma.ts`**

```typescript
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

- [ ] **Step 6: Commit**

```bash
git add lib/prisma.ts .gitignore
git commit -m "chore: install dependencies and configure prisma"
```

---

## Task 2: 数据库 Schema 与类型定义

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `types/index.ts`

- [ ] **Step 1: 写 `prisma/schema.prisma`**

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Character {
  id        String          @id @default(cuid())
  name      String
  note      String?
  avatar    String?
  createdAt DateTime        @default(now())
  updatedAt DateTime        @updatedAt
  items     ItemCharacter[]
}

model Item {
  id             String          @id @default(cuid())
  content        String
  title          String?
  itemType       ItemType        @default(reference)
  pinned         Boolean         @default(false)
  image          String?
  fictionalOrder Int?
  fictionalStage String?
  isPublic       Boolean         @default(false)
  createdAt      DateTime        @default(now())
  updatedAt      DateTime        @updatedAt
  characters     ItemCharacter[]
}

model ItemCharacter {
  item        Item      @relation(fields: [itemId], references: [id], onDelete: Cascade)
  itemId      String
  character   Character @relation(fields: [characterId], references: [id], onDelete: Cascade)
  characterId String

  @@id([itemId, characterId])
}

enum ItemType {
  profile
  snippet
  reference
  image
  state_card
}
```

- [ ] **Step 2: 执行迁移**

```bash
npx prisma migrate dev --name init
```

Expected: `✔ Generated Prisma Client`

- [ ] **Step 3: 创建 `types/index.ts`**

```typescript
import type { Character, Item, ItemType } from '@prisma/client'

export type { Character, Item, ItemType }

export type ItemWithCharacters = Item & {
  characters: { character: Character }[]
}

export type CharacterWithItems = Character & {
  items: { item: Item }[]
}

export type ApiResponse<T> = {
  data: T | null
  error: string | null
}
```

- [ ] **Step 4: Commit**

```bash
git add prisma/ types/
git commit -m "feat: database schema and shared types"
```

---

## Task 3: 角色 API

**Files:**
- Create: `lib/db/characters.ts`
- Create: `app/api/characters/route.ts`
- Create: `app/api/characters/[id]/route.ts`

- [ ] **Step 1: 创建 `lib/db/characters.ts`**

```typescript
import { prisma } from '@/lib/prisma'

export async function getCharacters() {
  return prisma.character.findMany({ orderBy: { updatedAt: 'desc' } })
}

export async function getCharacterById(id: string) {
  return prisma.character.findUnique({
    where: { id },
    include: { items: { include: { item: true } } },
  })
}

export async function createCharacter(data: { name: string; note?: string; avatar?: string }) {
  return prisma.character.create({ data })
}

export async function updateCharacter(id: string, data: { name?: string; note?: string; avatar?: string }) {
  return prisma.character.update({ where: { id }, data })
}

export async function deleteCharacter(id: string) {
  return prisma.character.delete({ where: { id } })
}
```

- [ ] **Step 2: 创建 `app/api/characters/route.ts`**

```typescript
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getCharacters, createCharacter } from '@/lib/db/characters'

const createSchema = z.object({
  name: z.string().min(1),
  note: z.string().optional(),
  avatar: z.string().optional(),
})

export async function GET() {
  try {
    const data = await getCharacters()
    return NextResponse.json({ data, error: null })
  } catch {
    return NextResponse.json({ data: null, error: '获取角色失败' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const parsed = createSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ data: null, error: '请输入角色名' }, { status: 400 })
    }
    const data = await createCharacter(parsed.data)
    return NextResponse.json({ data, error: null }, { status: 201 })
  } catch {
    return NextResponse.json({ data: null, error: '创建角色失败' }, { status: 500 })
  }
}
```

- [ ] **Step 3: 创建 `app/api/characters/[id]/route.ts`**

```typescript
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getCharacterById, updateCharacter, deleteCharacter } from '@/lib/db/characters'

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  note: z.string().optional(),
  avatar: z.string().optional(),
})

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const data = await getCharacterById(params.id)
    if (!data) return NextResponse.json({ data: null, error: '角色不存在' }, { status: 404 })
    return NextResponse.json({ data, error: null })
  } catch {
    return NextResponse.json({ data: null, error: '获取角色失败' }, { status: 500 })
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json()
    const parsed = updateSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ data: null, error: '参数错误' }, { status: 400 })
    const data = await updateCharacter(params.id, parsed.data)
    return NextResponse.json({ data, error: null })
  } catch {
    return NextResponse.json({ data: null, error: '更新角色失败' }, { status: 500 })
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    await deleteCharacter(params.id)
    return NextResponse.json({ data: null, error: null })
  } catch {
    return NextResponse.json({ data: null, error: '删除角色失败' }, { status: 500 })
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add lib/db/characters.ts app/api/characters/
git commit -m "feat: character CRUD API"
```

---

## Task 4: 内容项 API

**Files:**
- Create: `lib/db/items.ts`
- Create: `app/api/items/route.ts`
- Create: `app/api/items/[id]/route.ts`

- [ ] **Step 1: 创建 `lib/db/items.ts`**

```typescript
import { prisma } from '@/lib/prisma'
import { ItemType } from '@prisma/client'

export async function getItems(characterIds?: string[]) {
  return prisma.item.findMany({
    where: characterIds?.length
      ? { characters: { some: { characterId: { in: characterIds } } } }
      : undefined,
    include: { characters: { include: { character: true } } },
    orderBy: [{ pinned: 'desc' }, { updatedAt: 'desc' }],
  })
}

export async function getItemById(id: string) {
  return prisma.item.findUnique({
    where: { id },
    include: { characters: { include: { character: true } } },
  })
}

export async function createItem(data: {
  content: string
  title?: string
  itemType?: ItemType
  characterIds: string[]
}) {
  const { characterIds, ...rest } = data
  return prisma.item.create({
    data: {
      ...rest,
      characters: { create: characterIds.map((characterId) => ({ characterId })) },
    },
    include: { characters: { include: { character: true } } },
  })
}

export async function updateItem(id: string, data: {
  content?: string
  title?: string
  itemType?: ItemType
  pinned?: boolean
  fictionalOrder?: number
  fictionalStage?: string
  characterIds?: string[]
}) {
  const { characterIds, ...rest } = data
  if (characterIds) {
    await prisma.itemCharacter.deleteMany({ where: { itemId: id } })
    await prisma.itemCharacter.createMany({
      data: characterIds.map((characterId) => ({ itemId: id, characterId })),
    })
  }
  return prisma.item.update({
    where: { id },
    data: rest,
    include: { characters: { include: { character: true } } },
  })
}

export async function deleteItem(id: string) {
  return prisma.item.delete({ where: { id } })
}
```

- [ ] **Step 2: 创建 `app/api/items/route.ts`**

```typescript
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getItems, createItem } from '@/lib/db/items'
import { ItemType } from '@prisma/client'

const createSchema = z.object({
  content: z.string().min(1),
  title: z.string().optional(),
  itemType: z.nativeEnum(ItemType).optional(),
  characterIds: z.array(z.string()).min(1),
})

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const characterIds = searchParams.getAll('characterId')
    const data = await getItems(characterIds.length ? characterIds : undefined)
    return NextResponse.json({ data, error: null })
  } catch {
    return NextResponse.json({ data: null, error: '获取内容失败' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const parsed = createSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ data: null, error: '请填写内容并选择角色' }, { status: 400 })
    }
    const data = await createItem(parsed.data)
    return NextResponse.json({ data, error: null }, { status: 201 })
  } catch {
    return NextResponse.json({ data: null, error: '创建内容失败' }, { status: 500 })
  }
}
```

- [ ] **Step 3: 创建 `app/api/items/[id]/route.ts`**

```typescript
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getItemById, updateItem, deleteItem } from '@/lib/db/items'
import { ItemType } from '@prisma/client'

const updateSchema = z.object({
  content: z.string().min(1).optional(),
  title: z.string().optional(),
  itemType: z.nativeEnum(ItemType).optional(),
  pinned: z.boolean().optional(),
  fictionalOrder: z.number().int().optional(),
  fictionalStage: z.string().optional(),
  characterIds: z.array(z.string()).optional(),
})

export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    const data = await getItemById(params.id)
    if (!data) return NextResponse.json({ data: null, error: '内容不存在' }, { status: 404 })
    return NextResponse.json({ data, error: null })
  } catch {
    return NextResponse.json({ data: null, error: '获取内容失败' }, { status: 500 })
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json()
    const parsed = updateSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ data: null, error: '参数错误' }, { status: 400 })
    const data = await updateItem(params.id, parsed.data)
    return NextResponse.json({ data, error: null })
  } catch {
    return NextResponse.json({ data: null, error: '更新内容失败' }, { status: 500 })
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    await deleteItem(params.id)
    return NextResponse.json({ data: null, error: null })
  } catch {
    return NextResponse.json({ data: null, error: '删除内容失败' }, { status: 500 })
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add lib/db/items.ts app/api/items/
git commit -m "feat: item CRUD API"
```

---

## Task 5: 搜索 API + 全局布局

**Files:**
- Create: `app/api/search/route.ts`
- Modify: `app/layout.tsx`
- Create: `components/search/search-bar.tsx`

- [ ] **Step 1: 创建 `app/api/search/route.ts`**

```typescript
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  try {
    const { query } = await req.json()
    if (!query || typeof query !== 'string') {
      return NextResponse.json({ data: null, error: '请输入搜索关键词' }, { status: 400 })
    }
    const [characters, items] = await Promise.all([
      prisma.character.findMany({
        where: { OR: [{ name: { contains: query } }, { note: { contains: query } }] },
        take: 10,
      }),
      prisma.item.findMany({
        where: { OR: [{ title: { contains: query } }, { content: { contains: query } }] },
        include: { characters: { include: { character: true } } },
        take: 20,
      }),
    ])
    return NextResponse.json({ data: { characters, items }, error: null })
  } catch {
    return NextResponse.json({ data: null, error: '搜索失败' }, { status: 500 })
  }
}
```

- [ ] **Step 2: 更新 `app/layout.tsx` 添加 Sonner toast provider**

```typescript
import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import { Toaster } from 'sonner'
import './globals.css'

const geist = Geist({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'OC Workbench',
  description: 'OC 创作工作台',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh">
      <body className={`${geist.className} bg-white text-zinc-900 antialiased`}>
        {children}
        <Toaster position="bottom-right" />
      </body>
    </html>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add app/api/search/ app/layout.tsx
git commit -m "feat: search API and global layout"
```

---

## Task 6: 首页 / 角色库

**Files:**
- Modify: `app/page.tsx`
- Create: `components/characters/character-card.tsx`

- [ ] **Step 1: 创建 `components/characters/character-card.tsx`**

```typescript
import Link from 'next/link'
import type { Character } from '@/types'

export function CharacterCard({ character }: { character: Character }) {
  return (
    <Link href={`/characters/${character.id}`}>
      <div className="flex items-center gap-3 rounded-xl border border-zinc-100 p-4 hover:bg-zinc-50 transition-colors">
        {character.avatar ? (
          <img src={character.avatar} alt={character.name} className="h-10 w-10 rounded-full object-cover" />
        ) : (
          <div className="h-10 w-10 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-400 text-sm font-medium">
            {character.name[0]}
          </div>
        )}
        <div>
          <p className="font-medium text-zinc-900">{character.name}</p>
          {character.note && <p className="text-sm text-zinc-400">{character.note}</p>}
        </div>
      </div>
    </Link>
  )
}
```

- [ ] **Step 2: 更新 `app/page.tsx`**

```typescript
import Link from 'next/link'
import { getCharacters } from '@/lib/db/characters'
import { CharacterCard } from '@/components/characters/character-card'

export default async function HomePage() {
  const characters = await getCharacters()

  return (
    <main className="max-w-2xl mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-semibold text-zinc-900">角色库</h1>
        <div className="flex gap-2">
          <Link href="/import">
            <button className="px-4 py-2 rounded-lg bg-zinc-900 text-white text-sm font-medium hover:bg-zinc-700 transition-colors">
              导入内容
            </button>
          </Link>
          <Link href="/characters/new">
            <button className="px-4 py-2 rounded-lg border border-zinc-200 text-zinc-700 text-sm font-medium hover:bg-zinc-50 transition-colors">
              新建角色
            </button>
          </Link>
        </div>
      </div>

      {characters.length === 0 ? (
        <div className="text-center py-20 text-zinc-400">
          <p className="text-lg mb-2">还没有角色</p>
          <p className="text-sm">点击「导入内容」或「新建角色」开始</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {characters.map((c) => (
            <CharacterCard key={c.id} character={c} />
          ))}
        </div>
      )}
    </main>
  )
}
```

- [ ] **Step 3: 启动开发服务器验证页面可访问**

```bash
npm run dev
```

访问 http://localhost:3000，应看到「角色库」页面，空状态提示正常显示。

- [ ] **Step 4: Commit**

```bash
git add app/page.tsx components/characters/character-card.tsx
git commit -m "feat: home page with character list"
```

---

## Task 7: 新建角色页

**Files:**
- Create: `app/characters/new/page.tsx`
- Create: `components/characters/character-form.tsx`

- [ ] **Step 1: 创建 `components/characters/character-form.tsx`**

```typescript
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

export function CharacterForm() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) { toast.error('请输入角色名'); return }
    setLoading(true)
    const res = await fetch('/api/characters', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim(), note: note.trim() || undefined }),
    })
    const json = await res.json()
    setLoading(false)
    if (json.error) { toast.error(json.error); return }
    router.push(`/characters/${json.data.id}`)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label className="block text-sm font-medium text-zinc-700 mb-1">角色名 <span className="text-red-400">*</span></label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="输入角色名"
          className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-zinc-700 mb-1">一句话备注 <span className="text-zinc-400 font-normal">（选填）</span></label>
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="简单描述这个角色"
          className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="mt-2 w-full rounded-lg bg-zinc-900 text-white py-2 text-sm font-medium hover:bg-zinc-700 disabled:opacity-50 transition-colors"
      >
        {loading ? '创建中…' : '创建角色'}
      </button>
    </form>
  )
}
```

- [ ] **Step 2: 创建 `app/characters/new/page.tsx`**

```typescript
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
```

- [ ] **Step 3: 验证**

访问 http://localhost:3000/characters/new，填写角色名后点击创建，应跳转到角色页（404 暂时正常，Task 8 实现）。

- [ ] **Step 4: Commit**

```bash
git add app/characters/new/ components/characters/character-form.tsx
git commit -m "feat: create character page"
```

---

## Task 8: 角色页

**Files:**
- Create: `app/characters/[id]/page.tsx`
- Create: `components/items/item-card.tsx`

- [ ] **Step 1: 创建 `components/items/item-card.tsx`**

```typescript
'use client'
import { useState } from 'react'
import { toast } from 'sonner'
import type { ItemWithCharacters } from '@/types'

export function ItemCard({ item, onUpdate }: { item: ItemWithCharacters; onUpdate: () => void }) {
  const [pinned, setPinned] = useState(item.pinned)

  async function togglePin() {
    const res = await fetch(`/api/items/${item.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pinned: !pinned }),
    })
    const json = await res.json()
    if (json.error) { toast.error(json.error); return }
    setPinned(!pinned)
    onUpdate()
  }

  return (
    <div className={`rounded-xl border p-4 ${pinned ? 'border-zinc-300 bg-zinc-50' : 'border-zinc-100'}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          {item.title && <p className="font-medium text-zinc-900 text-sm mb-1">{item.title}</p>}
          <p className="text-sm text-zinc-600 whitespace-pre-wrap line-clamp-4">{item.content}</p>
        </div>
        <button onClick={togglePin} className="text-zinc-300 hover:text-zinc-600 shrink-0 text-xs mt-0.5">
          {pinned ? '📌' : '·'}
        </button>
      </div>
      <div className="mt-2 flex items-center gap-2">
        <span className="text-xs text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded-full">{item.itemType}</span>
        {item.fictionalStage && (
          <span className="text-xs text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded-full">{item.fictionalStage}</span>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: 创建 `app/characters/[id]/page.tsx`**

```typescript
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getCharacterById } from '@/lib/db/characters'
import { getItems } from '@/lib/db/items'
import { ItemCard } from '@/components/items/item-card'

export default async function CharacterPage({ params }: { params: { id: string } }) {
  const character = await getCharacterById(params.id)
  if (!character) notFound()

  const allItems = await getItems([params.id])
  const profileItems = allItems.filter((i) => ['profile', 'reference', 'image', 'state_card'].includes(i.itemType))
  const snippetItems = allItems.filter((i) => i.itemType === 'snippet')

  return (
    <main className="max-w-2xl mx-auto px-4 py-12">
      <Link href="/" className="text-sm text-zinc-400 hover:text-zinc-600 mb-6 inline-block">← 角色库</Link>

      {/* 角色基础信息 */}
      <div className="flex items-center gap-4 mb-8">
        {character.avatar ? (
          <img src={character.avatar} alt={character.name} className="h-14 w-14 rounded-full object-cover" />
        ) : (
          <div className="h-14 w-14 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-400 text-lg font-medium">
            {character.name[0]}
          </div>
        )}
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">{character.name}</h1>
          {character.note && <p className="text-sm text-zinc-400 mt-0.5">{character.note}</p>}
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="flex gap-2 mb-6">
        <Link href={`/characters/${params.id}/items/new?type=profile`}>
          <button className="px-3 py-1.5 rounded-lg border border-zinc-200 text-zinc-700 text-sm hover:bg-zinc-50">+ 新增资料</button>
        </Link>
        <Link href={`/characters/${params.id}/items/new?type=snippet`}>
          <button className="px-3 py-1.5 rounded-lg border border-zinc-200 text-zinc-700 text-sm hover:bg-zinc-50">+ 新增片段</button>
        </Link>
        <Link href={`/co-occurrence?ids=${params.id}`}>
          <button className="px-3 py-1.5 rounded-lg border border-zinc-200 text-zinc-700 text-sm hover:bg-zinc-50">多角色共现</button>
        </Link>
      </div>

      {/* 内容 Tabs（客户端组件处理切换） */}
      <CharacterTabs profileItems={profileItems} snippetItems={snippetItems} characterId={params.id} />
    </main>
  )
}
```

- [ ] **Step 3: 创建 `components/characters/character-tabs.tsx`（客户端 Tab 切换）**

```typescript
'use client'
import { useState } from 'react'
import { ItemCard } from '@/components/items/item-card'
import type { ItemWithCharacters } from '@/types'
import { useRouter } from 'next/navigation'

export function CharacterTabs({
  profileItems,
  snippetItems,
  characterId,
}: {
  profileItems: ItemWithCharacters[]
  snippetItems: ItemWithCharacters[]
  characterId: string
}) {
  const [tab, setTab] = useState<'profile' | 'snippet'>('profile')
  const router = useRouter()
  const items = tab === 'profile' ? profileItems : snippetItems

  return (
    <div>
      <div className="flex gap-1 mb-4 border-b border-zinc-100">
        {(['profile', 'snippet'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === t ? 'border-zinc-900 text-zinc-900' : 'border-transparent text-zinc-400 hover:text-zinc-600'
            }`}
          >
            {t === 'profile' ? '资料' : '创作'}
          </button>
        ))}
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-zinc-400 py-8 text-center">暂无内容</p>
      ) : (
        <div className="flex flex-col gap-2">
          {items.map((item) => (
            <ItemCard key={item.id} item={item} onUpdate={() => router.refresh()} />
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 4: 在 `app/characters/[id]/page.tsx` 中导入 CharacterTabs**

在文件顶部添加：
```typescript
import { CharacterTabs } from '@/components/characters/character-tabs'
```

- [ ] **Step 5: Commit**

```bash
git add app/characters/[id]/ components/characters/character-tabs.tsx components/items/item-card.tsx
git commit -m "feat: character detail page with tabs"
```

---

## Task 9: 新增内容项页

**Files:**
- Create: `app/characters/[id]/items/new/page.tsx`
- Create: `components/items/item-form.tsx`

- [ ] **Step 1: 创建 `components/items/item-form.tsx`**

```typescript
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ItemType } from '@prisma/client'

const TYPE_LABELS: Record<ItemType, string> = {
  profile: '设定资料',
  snippet: '创作片段',
  reference: '摘抄参考',
  image: '图片参考',
  state_card: '当前状态',
}

export function ItemForm({ characterId, defaultType }: { characterId: string; defaultType?: ItemType }) {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [itemType, setItemType] = useState<ItemType>(defaultType ?? 'profile')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!content.trim()) { toast.error('请填写内容'); return }
    setLoading(true)
    const res = await fetch('/api/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: title.trim() || undefined,
        content: content.trim(),
        itemType,
        characterIds: [characterId],
      }),
    })
    const json = await res.json()
    setLoading(false)
    if (json.error) { toast.error(json.error); return }
    router.push(`/characters/${characterId}`)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label className="block text-sm font-medium text-zinc-700 mb-1">类型</label>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(TYPE_LABELS) as ItemType[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setItemType(t)}
              className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                itemType === t ? 'bg-zinc-900 text-white border-zinc-900' : 'border-zinc-200 text-zinc-600 hover:bg-zinc-50'
              }`}
            >
              {TYPE_LABELS[t]}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-zinc-700 mb-1">标题 <span className="text-zinc-400 font-normal">（选填）</span></label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="给这条内容起个标题"
          className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-zinc-700 mb-1">内容 <span className="text-red-400">*</span></label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="输入内容…"
          rows={8}
          className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400 resize-none"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-zinc-900 text-white py-2 text-sm font-medium hover:bg-zinc-700 disabled:opacity-50 transition-colors"
      >
        {loading ? '保存中…' : '保存'}
      </button>
    </form>
  )
}
```

- [ ] **Step 2: 创建 `app/characters/[id]/items/new/page.tsx`**

```typescript
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
```

- [ ] **Step 3: Commit**

```bash
git add app/characters/[id]/items/ components/items/item-form.tsx
git commit -m "feat: new item page"
```

---

## Task 10: 多角色共现页

**Files:**
- Create: `app/co-occurrence/page.tsx`
- Create: `components/characters/character-selector.tsx`

- [ ] **Step 1: 创建 `components/characters/character-selector.tsx`**

```typescript
'use client'
import { useRouter, useSearchParams } from 'next/navigation'
import type { Character } from '@/types'

export function CharacterSelector({ characters, selectedIds }: { characters: Character[]; selectedIds: string[] }) {
  const router = useRouter()
  const searchParams = useSearchParams()

  function toggle(id: string) {
    const next = selectedIds.includes(id)
      ? selectedIds.filter((x) => x !== id)
      : [...selectedIds, id]
    const params = new URLSearchParams(searchParams.toString())
    params.delete('ids')
    next.forEach((x) => params.append('ids', x))
    router.push(`/co-occurrence?${params.toString()}`)
  }

  return (
    <div className="flex flex-wrap gap-2 mb-6">
      {characters.map((c) => (
        <button
          key={c.id}
          onClick={() => toggle(c.id)}
          className={`px-3 py-1 rounded-full text-sm border transition-colors ${
            selectedIds.includes(c.id)
              ? 'bg-zinc-900 text-white border-zinc-900'
              : 'border-zinc-200 text-zinc-600 hover:bg-zinc-50'
          }`}
        >
          {c.name}
        </button>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: 创建 `app/co-occurrence/page.tsx`**

```typescript
import Link from 'next/link'
import { getCharacters } from '@/lib/db/characters'
import { getItems } from '@/lib/db/items'
import { ItemCard } from '@/components/items/item-card'
import { CharacterSelector } from '@/components/characters/character-selector'

export default async function CoOccurrencePage({
  searchParams,
}: {
  searchParams: { ids?: string | string[] }
}) {
  const allCharacters = await getCharacters()
  const selectedIds = Array.isArray(searchParams.ids)
    ? searchParams.ids
    : searchParams.ids
    ? [searchParams.ids]
    : []

  const items = selectedIds.length >= 2 ? await getItems(selectedIds) : []
  // 只保留同时关联所有选中角色的 item
  const coItems = items.filter((item) => {
    const itemCharIds = item.characters.map((c) => c.character.id)
    return selectedIds.every((id) => itemCharIds.includes(id))
  })

  return (
    <main className="max-w-2xl mx-auto px-4 py-12">
      <Link href="/" className="text-sm text-zinc-400 hover:text-zinc-600 mb-6 inline-block">← 角色库</Link>
      <h1 className="text-xl font-semibold text-zinc-900 mb-4">多角色共现</h1>
      <CharacterSelector characters={allCharacters} selectedIds={selectedIds} />

      {selectedIds.length < 2 ? (
        <p className="text-sm text-zinc-400 py-8 text-center">请选择 2 个及以上角色</p>
      ) : coItems.length === 0 ? (
        <p className="text-sm text-zinc-400 py-8 text-center">暂无共同内容</p>
      ) : (
        <div className="flex flex-col gap-2">
          {coItems.map((item) => (
            <ItemCard key={item.id} item={item} onUpdate={() => {}} />
          ))}
        </div>
      )}

      {selectedIds.length >= 2 && (
        <div className="mt-6 flex gap-2">
          <Link href={`/timeline?ids=${selectedIds.join('&ids=')}`}>
            <button className="px-3 py-1.5 rounded-lg border border-zinc-200 text-zinc-700 text-sm hover:bg-zinc-50">切换到时间轴</button>
          </Link>
        </div>
      )}
    </main>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add app/co-occurrence/ components/characters/character-selector.tsx
git commit -m "feat: multi-character co-occurrence page"
```

---

## Task 11: 共现时间轴（拖拽排序 + 阶段标签）

**Files:**
- Create: `app/timeline/page.tsx`
- Create: `components/timeline/timeline-view.tsx`

- [ ] **Step 1: 创建 `components/timeline/timeline-view.tsx`**

```typescript
'use client'
import { useState } from 'react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { toast } from 'sonner'
import type { ItemWithCharacters } from '@/types'

function SortableItem({ item, onStageChange }: { item: ItemWithCharacters; onStageChange: (id: string, stage: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.id })
  const [editing, setEditing] = useState(false)
  const [stage, setStage] = useState(item.fictionalStage ?? '')

  const style = { transform: CSS.Transform.toString(transform), transition }

  return (
    <div ref={setNodeRef} style={style} className="flex gap-3 items-start rounded-xl border border-zinc-100 p-4 bg-white">
      <button {...attributes} {...listeners} className="mt-1 text-zinc-300 hover:text-zinc-500 cursor-grab active:cursor-grabbing">⠿</button>
      <div className="flex-1 min-w-0">
        {item.title && <p className="font-medium text-sm text-zinc-900 mb-1">{item.title}</p>}
        <p className="text-sm text-zinc-600 line-clamp-3 whitespace-pre-wrap">{item.content}</p>
        <div className="mt-2">
          {editing ? (
            <input
              autoFocus
              value={stage}
              onChange={(e) => setStage(e.target.value)}
              onBlur={() => { setEditing(false); onStageChange(item.id, stage) }}
              onKeyDown={(e) => { if (e.key === 'Enter') { setEditing(false); onStageChange(item.id, stage) } }}
              placeholder="阶段标签（如：早期、转折后）"
              className="text-xs border border-zinc-200 rounded px-2 py-0.5 outline-none focus:border-zinc-400"
            />
          ) : (
            <button onClick={() => setEditing(true)} className="text-xs text-zinc-400 hover:text-zinc-600">
              {stage || '+ 添加阶段标签'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export function TimelineView({ initialItems }: { initialItems: ItemWithCharacters[] }) {
  const [items, setItems] = useState(
    [...initialItems].sort((a, b) => (a.fictionalOrder ?? 999999) - (b.fictionalOrder ?? 999999))
  )
  const sensors = useSensors(useSensor(PointerSensor))

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = items.findIndex((i) => i.id === active.id)
    const newIndex = items.findIndex((i) => i.id === over.id)
    const next = arrayMove(items, oldIndex, newIndex)
    setItems(next)
    await Promise.all(
      next.map((item, idx) =>
        fetch(`/api/items/${item.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fictionalOrder: idx }),
        })
      )
    )
  }

  async function handleStageChange(id: string, stage: string) {
    const res = await fetch(`/api/items/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fictionalStage: stage }),
    })
    const json = await res.json()
    if (json.error) toast.error(json.error)
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-2">
          {items.map((item) => (
            <SortableItem key={item.id} item={item} onStageChange={handleStageChange} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}
```

- [ ] **Step 2: 创建 `app/timeline/page.tsx`**

```typescript
import Link from 'next/link'
import { getCharacters } from '@/lib/db/characters'
import { getItems } from '@/lib/db/items'
import { CharacterSelector } from '@/components/characters/character-selector'
import { TimelineView } from '@/components/timeline/timeline-view'

export default async function TimelinePage({
  searchParams,
}: {
  searchParams: { ids?: string | string[] }
}) {
  const allCharacters = await getCharacters()
  const selectedIds = Array.isArray(searchParams.ids)
    ? searchParams.ids
    : searchParams.ids
    ? [searchParams.ids]
    : []

  const items = selectedIds.length >= 1 ? await getItems(selectedIds) : []
  const timelineItems = selectedIds.length >= 2
    ? items.filter((item) => {
        const itemCharIds = item.characters.map((c) => c.character.id)
        return selectedIds.every((id) => itemCharIds.includes(id))
      })
    : items

  return (
    <main className="max-w-2xl mx-auto px-4 py-12">
      <Link href="/" className="text-sm text-zinc-400 hover:text-zinc-600 mb-6 inline-block">← 角色库</Link>
      <h1 className="text-xl font-semibold text-zinc-900 mb-4">
        {selectedIds.length >= 2 ? '共现时间轴' : '单角色时间轴'}
      </h1>
      <CharacterSelector characters={allCharacters} selectedIds={selectedIds} />
      {selectedIds.length === 0 ? (
        <p className="text-sm text-zinc-400 py-8 text-center">请选择角色</p>
      ) : timelineItems.length === 0 ? (
        <p className="text-sm text-zinc-400 py-8 text-center">暂无内容</p>
      ) : (
        <TimelineView initialItems={timelineItems} />
      )}
    </main>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add app/timeline/ components/timeline/
git commit -m "feat: timeline page with drag-and-drop sorting"
```

---

## Task 12: 导入内容页

**Files:**
- Create: `app/import/page.tsx`
- Create: `components/import/import-form.tsx`

- [ ] **Step 1: 创建 `components/import/import-form.tsx`**

```typescript
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import type { Character } from '@/types'

export function ImportForm({ characters }: { characters: Character[] }) {
  const router = useRouter()
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)

  function toggleCharacter(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (selectedIds.length === 0) { toast.error('请选择至少一个角色'); return }
    if (!content.trim()) { toast.error('请输入或粘贴内容'); return }
    setLoading(true)
    const res = await fetch('/api/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: content.trim(),
        itemType: 'reference',
        characterIds: selectedIds,
      }),
    })
    const json = await res.json()
    setLoading(false)
    if (json.error) { toast.error(json.error); return }
    if (selectedIds.length === 1) {
      router.push(`/characters/${selectedIds[0]}`)
    } else {
      router.push(`/co-occurrence?${selectedIds.map((id) => `ids=${id}`).join('&')}`)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div>
        <label className="block text-sm font-medium text-zinc-700 mb-2">选择角色 <span className="text-red-400">*</span></label>
        <div className="flex flex-wrap gap-2">
          {characters.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => toggleCharacter(c.id)}
              className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                selectedIds.includes(c.id)
                  ? 'bg-zinc-900 text-white border-zinc-900'
                  : 'border-zinc-200 text-zinc-600 hover:bg-zinc-50'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
        {characters.length === 0 && (
          <p className="text-sm text-zinc-400 mt-2">还没有角色，请先新建角色</p>
        )}
      </div>
      <div>
        <label className="block text-sm font-medium text-zinc-700 mb-1">粘贴内容 <span className="text-red-400">*</span></label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="粘贴旧内容、设定、摘抄…"
          rows={12}
          className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400 resize-none"
        />
      </div>
      <button
        type="submit"
        disabled={loading || characters.length === 0}
        className="w-full rounded-lg bg-zinc-900 text-white py-2 text-sm font-medium hover:bg-zinc-700 disabled:opacity-50 transition-colors"
      >
        {loading ? '导入中…' : '导入内容'}
      </button>
    </form>
  )
}
```

- [ ] **Step 2: 创建 `app/import/page.tsx`**

```typescript
import Link from 'next/link'
import { getCharacters } from '@/lib/db/characters'
import { ImportForm } from '@/components/import/import-form'

export default async function ImportPage() {
  const characters = await getCharacters()
  return (
    <main className="max-w-md mx-auto px-4 py-12">
      <Link href="/" className="text-sm text-zinc-400 hover:text-zinc-600 mb-6 inline-block">← 角色库</Link>
      <h1 className="text-xl font-semibold text-zinc-900 mb-6">导入内容</h1>
      <ImportForm characters={characters} />
    </main>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add app/import/ components/import/
git commit -m "feat: import content page"
```

---

## Task 13: 收尾与验证

- [ ] **Step 1: 确认 `.env` 已填写真实 Supabase 连接信息**

登录 https://supabase.com，创建项目，在 Project Settings → Database 获取连接串，填入 `.env`。

- [ ] **Step 2: 执行数据库迁移**

```bash
npx prisma migrate dev --name init
```

Expected: `✔ Generated Prisma Client`

- [ ] **Step 3: 启动开发服务器，验证完整流程**

```bash
npm run dev
```

验证路径：
1. 访问 http://localhost:3000 → 看到角色库空状态
2. 点击「新建角色」→ 填写名字 → 创建 → 跳转角色页
3. 在角色页点击「+ 新增资料」→ 填写内容 → 保存 → 回到角色页看到内容
4. 点击「多角色共现」→ 选择 2 个角色 → 看到共同内容
5. 点击「切换到时间轴」→ 拖拽排序 → 添加阶段标签
6. 回到首页点击「导���内容」→ 选角色 → 粘贴内容 → 导入

- [ ] **Step 4: 构建验证**

```bash
npm run build
```

Expected: 无 TypeScript 错误，构建成功。

- [ ] **Step 5: 最终 Commit**

```bash
git add -A
git commit -m "feat: P0 MVP complete"
```
