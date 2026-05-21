# Clerk 用户认证 + 数据隔离 Implementation Plan

**Goal:** 为现有 oc-workbench 接入 Clerk 认证，所有数据按 userId 隔离，未登录用户强制跳转登录页。

**Architecture:** 安装 `@clerk/nextjs`，在 middleware 保护所有非公开路由；Prisma schema 的 `Character` 和 `CharacterGroup` 模型新增 `userId` 字段；所有 API route 从 `auth()` 取 `userId` 后传入 db 查询层做过滤。

**Tech Stack:** `@clerk/nextjs`、Prisma migration、Next.js App Router middleware

---

## Task 1: 安装 Clerk 并配置环境变量

**Files:**
- Modify: `package.json`（依赖）
- Modify: `.env`（新增 Clerk 环境变量）
- Modify: `app/layout.tsx`

- [ ] **Step 1: 安装 Clerk**

  ```bash
  cd /Users/weidian/oc-workbench/.worktrees/mvp-p0
  npm install @clerk/nextjs
  ```

  Expected: 安装成功，`package.json` 中出现 `@clerk/nextjs`

- [ ] **Step 2: 在 Clerk Dashboard 创建应用**

  前往 https://dashboard.clerk.com，创建新应用，选择 Email 登录，关闭所有其他登录方式（Phone、Google、GitHub 等）。

  复制以下两个值：
  - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
  - `CLERK_SECRET_KEY`

- [ ] **Step 3: 添加环境变量到 `.env`**

  在 `.env` 文件末尾追加：

  ```env
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxx
  CLERK_SECRET_KEY=sk_test_xxxxxxxx
  NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
  NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
  NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
  NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/
  ```

- [ ] **Step 4: 包裹 ClerkProvider**

  将 `app/layout.tsx` 改为：

  ```tsx
  import type { Metadata } from 'next'
  import { ClerkProvider } from '@clerk/nextjs'
  import { Toaster } from 'sonner'
  import './globals.css'

  export const metadata: Metadata = {
    title: 'OC Workbench',
    description: 'OC 创作工作台',
  }

  export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
      <ClerkProvider>
        <html lang="zh">
          <body className="bg-white text-zinc-900 antialiased font-sans">
            {children}
            <Toaster position="bottom-right" />
          </body>
        </html>
      </ClerkProvider>
    )
  }
  ```

- [ ] **Step 5: 验证编译通过**

  ```bash
  cd /Users/weidian/oc-workbench/.worktrees/mvp-p0
  npm run build 2>&1 | tail -20
  ```

  Expected: 编译成功，无 Clerk 相关报错

- [ ] **Step 6: Commit**

  ```bash
  git add app/layout.tsx package.json package-lock.json
  git commit -m "feat: install Clerk and wrap ClerkProvider in root layout"
  ```

---

## Task 2: 添加 Middleware 保护路由

**Files:**
- Create: `middleware.ts`（项目根目录，与 `app/` 同级）

- [ ] **Step 1: 创建 `middleware.ts`**

  ```ts
  import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

  const isPublicRoute = createRouteMatcher([
    '/sign-in(.*)',
    '/sign-up(.*)',
    '/characters/(.*)/public',
  ])

  export default clerkMiddleware(async (auth, request) => {
    if (!isPublicRoute(request)) await auth.protect()
  })

  export const config = {
    matcher: ['/((?!_next|.*\\..*).*)'],
  }
  ```

- [ ] **Step 2: 启动开发服务器验证跳转**

  ```bash
  npm run dev
  ```

  打开浏览器访问 http://localhost:3000，应跳转到 `/sign-in`。

- [ ] **Step 3: Commit**

  ```bash
  git add middleware.ts
  git commit -m "feat: add Clerk middleware to protect all non-public routes"
  ```

---

## Task 3: 创建登录/注册页面

**Files:**
- Create: `app/sign-in/[[...sign-in]]/page.tsx`
- Create: `app/sign-up/[[...sign-up]]/page.tsx`

- [ ] **Step 1: 创建登录页**

  ```tsx
  // app/sign-in/[[...sign-in]]/page.tsx
  import { SignIn } from '@clerk/nextjs'

  export default function SignInPage() {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <SignIn />
      </div>
    )
  }
  ```

- [ ] **Step 2: 创建注册页**

  ```tsx
  // app/sign-up/[[...sign-up]]/page.tsx
  import { SignUp } from '@clerk/nextjs'

  export default function SignUpPage() {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <SignUp />
      </div>
    )
  }
  ```

- [ ] **Step 3: 手动验证**

  访问 http://localhost:3000/sign-in，应看到 Clerk 登录表单（邮箱输入框）。
  访问 http://localhost:3000/sign-up，应看到 Clerk 注册表单。

- [ ] **Step 4: Commit**

  ```bash
  git add app/sign-in app/sign-up
  git commit -m "feat: add Clerk sign-in and sign-up pages"
  ```

---

## Task 4: Prisma Schema 加 userId 字段

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: 更新 `schema.prisma`**

  将 `Character` 和 `CharacterGroup` 模型改为：

  ```prisma
  model Character {
    id                String                  @id @default(cuid())
    userId            String
    name              String
    note              String?
    avatar            String?
    createdAt         DateTime                @default(now())
    updatedAt         DateTime                @updatedAt
    items             ItemCharacter[]
    relationshipsFrom CharacterRelationship[] @relation("RelationshipFrom")
    relationshipsTo   CharacterRelationship[] @relation("RelationshipTo")

    @@index([userId])
  }

  model CharacterGroup {
    id           String   @id @default(cuid())
    userId       String
    name         String
    characterIds String[]
    createdAt    DateTime @default(now())
    updatedAt    DateTime @updatedAt

    @@index([userId])
  }
  ```

- [ ] **Step 2: 执行 migration**

  ```bash
  npx prisma migrate dev --name add_user_id_to_character_and_group
  ```

  Expected: 输出 `The following migration(s) have been applied` 并成功。

- [ ] **Step 3: 重新生成 Prisma client**

  ```bash
  npx prisma generate
  ```

- [ ] **Step 4: Commit**

  ```bash
  git add prisma/schema.prisma prisma/migrations/
  git commit -m "feat: add userId field to Character and CharacterGroup models"
  ```

---

## Task 5: 更新 lib/db/characters.ts 加 userId 过滤

**Files:**
- Modify: `lib/db/characters.ts`

- [ ] **Step 1: 重写 `characters.ts`**

  ```ts
  import { prisma } from '@/lib/prisma'

  export async function getCharacters(userId: string) {
    return prisma.character.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    })
  }

  export async function getCharacterById(id: string, userId: string) {
    return prisma.character.findFirst({
      where: { id, userId },
      include: { items: { include: { item: true } } },
    })
  }

  export async function createCharacter(
    userId: string,
    data: { name: string; note?: string; avatar?: string }
  ) {
    return prisma.character.create({ data: { ...data, userId } })
  }

  export async function updateCharacter(
    id: string,
    userId: string,
    data: { name?: string; note?: string; avatar?: string }
  ) {
    const character = await prisma.character.findFirst({ where: { id, userId } })
    if (!character) return null
    return prisma.character.update({ where: { id }, data })
  }

  export async function deleteCharacter(id: string, userId: string) {
    const character = await prisma.character.findFirst({ where: { id, userId } })
    if (!character) return null
    return prisma.character.delete({ where: { id } })
  }
  ```

- [ ] **Step 2: 验证 TypeScript 编译**

  ```bash
  npx tsc --noEmit 2>&1 | head -30
  ```

  Expected: 报错只来自 API routes（还没更新），`characters.ts` 本身无错误。

- [ ] **Step 3: Commit**

  ```bash
  git add lib/db/characters.ts
  git commit -m "feat: add userId filtering to character db queries"
  ```

---

## Task 6: 更新 lib/db/character-groups.ts 加 userId 过滤

**Files:**
- Modify: `lib/db/character-groups.ts`

- [ ] **Step 1: 重写 `character-groups.ts`**

  ```ts
  import { prisma } from '@/lib/prisma'

  export async function getCharacterGroups(userId: string) {
    return prisma.characterGroup.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    })
  }

  export async function getCharacterGroupById(id: string, userId: string) {
    return prisma.characterGroup.findFirst({ where: { id, userId } })
  }

  export async function createCharacterGroup(
    userId: string,
    data: { name: string; characterIds: string[] }
  ) {
    return prisma.characterGroup.create({ data: { ...data, userId } })
  }

  export async function updateCharacterGroup(
    id: string,
    userId: string,
    data: { name?: string; characterIds?: string[] }
  ) {
    const group = await prisma.characterGroup.findFirst({ where: { id, userId } })
    if (!group) return null
    return prisma.characterGroup.update({ where: { id }, data })
  }

  export async function deleteCharacterGroup(id: string, userId: string) {
    const group = await prisma.characterGroup.findFirst({ where: { id, userId } })
    if (!group) return null
    return prisma.characterGroup.delete({ where: { id } })
  }
  ```

- [ ] **Step 2: Commit**

  ```bash
  git add lib/db/character-groups.ts
  git commit -m "feat: add userId filtering to character-groups db queries"
  ```

---

## Task 7: 更新 lib/db/items.ts 加 userId 验证

**Files:**
- Modify: `lib/db/items.ts`

- [ ] **Step 1: 重写 `items.ts`**

  ```ts
  import { prisma } from '@/lib/prisma'
  import { ItemType } from '@prisma/client'

  export async function getItems(userId: string, characterIds?: string[]) {
    return prisma.item.findMany({
      where: characterIds?.length
        ? {
            characters: {
              some: {
                characterId: { in: characterIds },
                character: { userId },
              },
            },
          }
        : { characters: { some: { character: { userId } } } },
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

  export async function createItem(
    userId: string,
    data: {
      content: string
      title?: string
      itemType?: ItemType
      branch?: string
      characterIds: string[]
    }
  ) {
    // 验证所有 characterIds 都属于当前用户
    const { characterIds, ...rest } = data
    const ownedCount = await prisma.character.count({
      where: { id: { in: characterIds }, userId },
    })
    if (ownedCount !== characterIds.length) return null

    return prisma.item.create({
      data: {
        ...rest,
        characters: { create: characterIds.map((characterId) => ({ characterId })) },
      },
      include: { characters: { include: { character: true } } },
    })
  }

  export async function updateItem(
    id: string,
    userId: string,
    data: {
      content?: string
      title?: string
      itemType?: ItemType
      pinned?: boolean
      fictionalOrder?: number
      fictionalStage?: string
      branch?: string
      characterIds?: string[]
    }
  ) {
    // 验证 item 通过关联 character 属于当前用户
    const item = await prisma.item.findFirst({
      where: { id, characters: { some: { character: { userId } } } },
    })
    if (!item) return null

    const { characterIds, ...rest } = data
    if (characterIds) {
      // 验证新 characterIds 都属于当前用户
      const ownedCount = await prisma.character.count({
        where: { id: { in: characterIds }, userId },
      })
      if (ownedCount !== characterIds.length) return null

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

  export async function deleteItem(id: string, userId: string) {
    const item = await prisma.item.findFirst({
      where: { id, characters: { some: { character: { userId } } } },
    })
    if (!item) return null
    return prisma.item.delete({ where: { id } })
  }
  ```

- [ ] **Step 2: Commit**

  ```bash
  git add lib/db/items.ts
  git commit -m "feat: add userId ownership validation to item db queries"
  ```

---

## Task 8: 更新 API Routes — Characters

**Files:**
- Modify: `app/api/characters/route.ts`
- Modify: `app/api/characters/[id]/route.ts`

- [ ] **Step 1: 更新 `app/api/characters/route.ts`**

  ```ts
  import { NextResponse } from 'next/server'
  import { auth } from '@clerk/nextjs/server'
  import { z } from 'zod'
  import { getCharacters, createCharacter } from '@/lib/db/characters'

  const createSchema = z.object({
    name: z.string().min(1),
    note: z.string().optional(),
    avatar: z.string().optional(),
  })

  export async function GET() {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 })

    try {
      const data = await getCharacters(userId)
      return NextResponse.json({ data, error: null })
    } catch {
      return NextResponse.json({ data: null, error: '获取角色失败' }, { status: 500 })
    }
  }

  export async function POST(req: Request) {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 })

    try {
      const body = await req.json()
      const parsed = createSchema.safeParse(body)
      if (!parsed.success) {
        return NextResponse.json({ data: null, error: '请输入角色名' }, { status: 400 })
      }
      const data = await createCharacter(userId, parsed.data)
      return NextResponse.json({ data, error: null }, { status: 201 })
    } catch {
      return NextResponse.json({ data: null, error: '创建角色失败' }, { status: 500 })
    }
  }
  ```

- [ ] **Step 2: 更新 `app/api/characters/[id]/route.ts`**

  ```ts
  import { NextResponse } from 'next/server'
  import { auth } from '@clerk/nextjs/server'
  import { z } from 'zod'
  import { getCharacterById, updateCharacter, deleteCharacter } from '@/lib/db/characters'

  const updateSchema = z.object({
    name: z.string().min(1).optional(),
    note: z.string().optional(),
    avatar: z.string().optional(),
  })

  export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 })

    try {
      const { id } = await params
      const data = await getCharacterById(id, userId)
      if (!data) return NextResponse.json({ data: null, error: '角色不存在' }, { status: 404 })
      return NextResponse.json({ data, error: null })
    } catch {
      return NextResponse.json({ data: null, error: '获取角色失败' }, { status: 500 })
    }
  }

  export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 })

    try {
      const { id } = await params
      const body = await req.json()
      const parsed = updateSchema.safeParse(body)
      if (!parsed.success) return NextResponse.json({ data: null, error: '参数错误' }, { status: 400 })
      const data = await updateCharacter(id, userId, parsed.data)
      if (!data) return NextResponse.json({ data: null, error: '角色不存在' }, { status: 404 })
      return NextResponse.json({ data, error: null })
    } catch {
      return NextResponse.json({ data: null, error: '更新角色失败' }, { status: 500 })
    }
  }

  export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 })

    try {
      const { id } = await params
      const result = await deleteCharacter(id, userId)
      if (!result) return NextResponse.json({ data: null, error: '角色不存在' }, { status: 404 })
      return NextResponse.json({ data: null, error: null })
    } catch {
      return NextResponse.json({ data: null, error: '删除角色失败' }, { status: 500 })
    }
  }
  ```

- [ ] **Step 3: Commit**

  ```bash
  git add app/api/characters/route.ts app/api/characters/[id]/route.ts
  git commit -m "feat: add Clerk auth to characters API routes"
  ```

---

## Task 9: 更新 API Routes — Items

**Files:**
- Modify: `app/api/items/route.ts`
- Modify: `app/api/items/[id]/route.ts`

- [ ] **Step 1: 更新 `app/api/items/route.ts`**

  ```ts
  import { NextResponse } from 'next/server'
  import { auth } from '@clerk/nextjs/server'
  import { z } from 'zod'
  import { getItems, createItem } from '@/lib/db/items'
  import { ItemType } from '@prisma/client'

  const createSchema = z.object({
    content: z.string().min(1),
    title: z.string().optional(),
    itemType: z.nativeEnum(ItemType).optional(),
    branch: z.string().optional(),
    characterIds: z.array(z.string()).min(1),
  })

  export async function GET(req: Request) {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 })

    try {
      const { searchParams } = new URL(req.url)
      const characterIds = searchParams.getAll('characterId')
      const data = await getItems(userId, characterIds.length ? characterIds : undefined)
      return NextResponse.json({ data, error: null })
    } catch {
      return NextResponse.json({ data: null, error: '获取内容失败' }, { status: 500 })
    }
  }

  export async function POST(req: Request) {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 })

    try {
      const body = await req.json()
      const parsed = createSchema.safeParse(body)
      if (!parsed.success) {
        return NextResponse.json({ data: null, error: '请填写内容并选择角色' }, { status: 400 })
      }
      const data = await createItem(userId, parsed.data)
      if (!data) return NextResponse.json({ data: null, error: '角色不存在或无权限' }, { status: 403 })
      return NextResponse.json({ data, error: null }, { status: 201 })
    } catch {
      return NextResponse.json({ data: null, error: '创建内容失败' }, { status: 500 })
    }
  }
  ```

- [ ] **Step 2: 更新 `app/api/items/[id]/route.ts`**

  ```ts
  import { NextResponse } from 'next/server'
  import { auth } from '@clerk/nextjs/server'
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
    branch: z.string().optional(),
    characterIds: z.array(z.string()).optional(),
  })

  export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 })

    try {
      const { id } = await params
      const data = await getItemById(id)
      if (!data) return NextResponse.json({ data: null, error: '内容不存在' }, { status: 404 })
      // 验证归属：item 的任一关联 character 属于当前用户
      const owned = data.characters.some((ic) => ic.character.userId === userId)
      if (!owned) return NextResponse.json({ data: null, error: '内容不存在' }, { status: 404 })
      return NextResponse.json({ data, error: null })
    } catch {
      return NextResponse.json({ data: null, error: '获取内容失败' }, { status: 500 })
    }
  }

  export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 })

    try {
      const { id } = await params
      const body = await req.json()
      const parsed = updateSchema.safeParse(body)
      if (!parsed.success) return NextResponse.json({ data: null, error: '参数错误' }, { status: 400 })
      const data = await updateItem(id, userId, parsed.data)
      if (!data) return NextResponse.json({ data: null, error: '内容不存在' }, { status: 404 })
      return NextResponse.json({ data, error: null })
    } catch {
      return NextResponse.json({ data: null, error: '更新内容失败' }, { status: 500 })
    }
  }

  export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 })

    try {
      const { id } = await params
      const result = await deleteItem(id, userId)
      if (!result) return NextResponse.json({ data: null, error: '内容不存在' }, { status: 404 })
      return NextResponse.json({ data: null, error: null })
    } catch {
      return NextResponse.json({ data: null, error: '删除内容失败' }, { status: 500 })
    }
  }
  ```

- [ ] **Step 3: Commit**

  ```bash
  git add app/api/items/route.ts app/api/items/[id]/route.ts
  git commit -m "feat: add Clerk auth to items API routes"
  ```

---

## Task 10: 更新 API Routes — CharacterGroups、Relationships、Search

**Files:**
- Modify: `app/api/character-groups/route.ts`
- Modify: `app/api/character-groups/[id]/route.ts`
- Modify: `app/api/relationships/route.ts`
- Modify: `app/api/relationships/[id]/route.ts`
- Modify: `app/api/search/route.ts`

- [ ] **Step 1: 更新 `app/api/character-groups/route.ts`**

  ```ts
  import { NextResponse } from 'next/server'
  import { auth } from '@clerk/nextjs/server'
  import { z } from 'zod'
  import { getCharacterGroups, createCharacterGroup } from '@/lib/db/character-groups'

  const createSchema = z.object({
    name: z.string().min(1),
    characterIds: z.array(z.string()).min(2),
  })

  export async function GET() {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 })

    try {
      const data = await getCharacterGroups(userId)
      return NextResponse.json({ data, error: null })
    } catch {
      return NextResponse.json({ data: null, error: '获取角色组失败' }, { status: 500 })
    }
  }

  export async function POST(req: Request) {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 })

    try {
      const body = await req.json()
      const parsed = createSchema.safeParse(body)
      if (!parsed.success) {
        return NextResponse.json({ data: null, error: '请输入角色组名称并选择至少 2 个角色' }, { status: 400 })
      }
      const data = await createCharacterGroup(userId, parsed.data)
      return NextResponse.json({ data, error: null }, { status: 201 })
    } catch {
      return NextResponse.json({ data: null, error: '创建角色组失败' }, { status: 500 })
    }
  }
  ```

- [ ] **Step 2: 更新 `app/api/character-groups/[id]/route.ts`**

  ```ts
  import { NextResponse } from 'next/server'
  import { auth } from '@clerk/nextjs/server'
  import { z } from 'zod'
  import { getCharacterGroupById, updateCharacterGroup, deleteCharacterGroup } from '@/lib/db/character-groups'

  const updateSchema = z.object({
    name: z.string().min(1).optional(),
    characterIds: z.array(z.string()).min(2).optional(),
  })

  export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 })

    try {
      const { id } = await params
      const data = await getCharacterGroupById(id, userId)
      if (!data) return NextResponse.json({ data: null, error: '角色组不存在' }, { status: 404 })
      return NextResponse.json({ data, error: null })
    } catch {
      return NextResponse.json({ data: null, error: '获取角色组失败' }, { status: 500 })
    }
  }

  export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 })

    try {
      const { id } = await params
      const body = await req.json()
      const parsed = updateSchema.safeParse(body)
      if (!parsed.success) return NextResponse.json({ data: null, error: '参数错误' }, { status: 400 })
      const data = await updateCharacterGroup(id, userId, parsed.data)
      if (!data) return NextResponse.json({ data: null, error: '角色组不存在' }, { status: 404 })
      return NextResponse.json({ data, error: null })
    } catch {
      return NextResponse.json({ data: null, error: '更新角色组失败' }, { status: 500 })
    }
  }

  export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 })

    try {
      const { id } = await params
      const result = await deleteCharacterGroup(id, userId)
      if (!result) return NextResponse.json({ data: null, error: '角色组不存在' }, { status: 404 })
      return NextResponse.json({ data: null, error: null })
    } catch {
      return NextResponse.json({ data: null, error: '删除角色组失败' }, { status: 500 })
    }
  }
  ```

- [ ] **Step 3: 更新 `app/api/relationships/route.ts`**

  在 `GET` / `POST` 中加入 `auth()` 校验，并将 `userId` 传入 db 查询层（确保只能操作当前用户所属的 `Character` 的关系）：

  ```ts
  import { NextResponse } from 'next/server'
  import { auth } from '@clerk/nextjs/server'
  // ... 其余 import 保持不变

  export async function GET(req: Request) {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 })
    // ... 原有逻辑，查询时加 character: { userId } 过滤
  }

  export async function POST(req: Request) {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 })
    // ... 原有逻辑，创建前验证 fromId/toId 均属于 userId
  }
  ```

- [ ] **Step 4: 更新 `app/api/relationships/[id]/route.ts`**

  同上，加入 `auth()` 校验，删除/更新前验证归属。

- [ ] **Step 5: 更新 `app/api/search/route.ts`**

  ```ts
  import { NextResponse } from 'next/server'
  import { auth } from '@clerk/nextjs/server'
  // ...

  export async function GET(req: Request) {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ data: null, error: 'Unauthorized' }, { status: 401 })
    // 所有搜索查询加 userId 过滤
  }
  ```

- [ ] **Step 6: Commit**

  ```bash
  git add app/api/character-groups/ app/api/relationships/ app/api/search/
  git commit -m "feat: add Clerk auth to character-groups, relationships, and search API routes"
  ```

---

## Task 11: 端到端验证

- [ ] **Step 1: 启动 dev server**

  ```bash
  cd /Users/weidian/oc-workbench/.worktrees/mvp-p0
  npm run dev
  ```

- [ ] **Step 2: 验证未登录跳转**

  访问 http://localhost:3000 → 应跳转到 `/sign-in`

- [ ] **Step 3: 注册 & 登录**

  通过 `/sign-up` 创建测试账号，登录后返回首页。

- [ ] **Step 4: 验证数据隔离**

  - 创建角色、角色组、内容
  - 换另一个账号登录
  - 确认看不到上一个账号的数据

- [ ] **Step 5: 最终 build 验证**

  ```bash
  npm run build 2>&1 | tail -30
  ```

  Expected: 无类型错误，build 成功。
