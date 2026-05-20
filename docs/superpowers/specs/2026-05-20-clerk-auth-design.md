# OC 助手 · 核心角色管理 + 用户认证 设计文档

> 创建时间：2026-05-20
> 状态：已通过 brainstorming 审核，待实现

---

## 背景

现有 oc-workbench 代码库已有完整的角色 CRUD、Item 系统、多角色共现、时间轴、关系图谱等功能，但缺少用户认证系统，所有数据全局共享、无用户隔离。

本文档描述为现有代码库接入 Clerk 认证、并完成数据按用户隔离的完整设计。

---

## 技术选型

| 项目 | 选择 | 理由 |
|------|------|------|
| 认证方案 | Clerk | 开箱即用，Next.js 集成顺滑，不干扰现有 Prisma 数据层 |
| 数据隔离方式 | Clerk userId 直接写入 Prisma | MVP 阶段无需本地 User 表，简单直接 |
| 登录方式 | 仅邮箱登录 | 在 Clerk Dashboard 配置，关闭 Phone、OAuth、Web3 等所有其他方式 |

---

## 认证架构

### 请求流程

```
用户访问任意页面
    ↓
Next.js middleware（clerkMiddleware）
    ↓
未登录 → 重定向到 /sign-in
已登录 → 放行，userId 注入 request context
    ↓
Server Component / API Route 调用 auth() 取 userId
    ↓
所有数据库查询带 WHERE userId = clerkUserId
```

### 路由保护策略

- **公开路由**：`/sign-in`、`/sign-up`、`/characters/[id]/public`
- **保护路由**：其余所有路由，未登录强制跳转 `/sign-in`

### userId 来源

始终从服务端 `auth()` 取，不依赖前端传入：

```typescript
import { auth } from '@clerk/nextjs/server'
const { userId } = await auth()
```

---

## 数据库 Schema 变更

### 需要新增 userId 的模型

**Character**（新增 `userId` 字段 + 索引）

```prisma
model Character {
  id        String   @id @default(cuid())
  userId    String
  name      String
  note      String?
  avatar    String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  items             ItemCharacter[]
  relationshipsFrom CharacterRelationship[] @relation("from")
  relationshipsTo   CharacterRelationship[] @relation("to")

  @@index([userId])
}
```

**CharacterGroup**（新增 `userId` 字段 + 索引）

```prisma
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

### 不需要修改的模型

- **Item**：通过 `ItemCharacter` → `Character.userId` 隔离，无需单独加 userId
- **CharacterRelationship**：通过 `fromId` → `Character.userId` 隔离，无需单独加 userId

### Migration 说明

现有数据库无用户数据（无认证阶段产生的数据无需保留），直接加字段，无历史数据迁移问题。

---

## API 层数据隔离

### 统一模式

```typescript
export async function GET(request: Request) {
  const { userId } = await auth()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const data = await getCharacters(userId)
  return Response.json({ data })
}
```

### 各端点变更

**Characters**
- `GET /api/characters` → 查询加 `WHERE userId = ?`
- `POST /api/characters` → 写入 `userId`
- `GET /api/characters/[id]` → 验证 `userId` 匹配，不匹配返回 404
- `PATCH /api/characters/[id]` → 同上
- `DELETE /api/characters/[id]` → 同上

**CharacterGroup**
- 所有操作加 userId 过滤，模式同 Characters

**Items**
- `GET /api/items?characterId=` → 先验证 Character 属于当前 userId，再取 Items
- `POST /api/items` → 验证 `characterIds` 里每个 Character 都属于当前 userId
- `PATCH /api/items/[id]` → 通过关联 Character 验证归属
- `DELETE /api/items/[id]` → 同上

**Relationships**
- 通过 `fromId` 对应的 Character 验证 userId

**Search**
- `POST /api/search` → 所有查询加 userId 过滤

### 安全原则

- 所有写操作在执行前验证资源归属
- 不匹配一律返回 404（不暴露资源是否存在）
- 不依赖前端传入 userId，始终从服务端 `auth()` 取

---

## 前端变更

### 1. 根 Layout 包裹 ClerkProvider

```tsx
// app/layout.tsx
import { ClerkProvider } from '@clerk/nextjs'

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html><body>{children}</body></html>
    </ClerkProvider>
  )
}
```

### 2. Middleware

新建 `middleware.ts`：

```typescript
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

### 3. 登录/注册页面

```
app/
  sign-in/[[...sign-in]]/page.tsx   ← 渲染 <SignIn />
  sign-up/[[...sign-up]]/page.tsx   ← 渲染 <SignUp />
```

### 4. 导航栏

在根 layout 或现有 header 组件加入 `<UserButton />`（Clerk 提供，含退出登录）。

### 5. Server Component

现有 Server Component 结构基本不变，userId 只在服务端使用，不传给前端。

---

## Clerk Dashboard 配置

- 开启：Email address 登录
- 关闭：Phone number、所有 OAuth（Google、GitHub 等）、Web3

---

## 测试策略

手动验证以下场景，不引入自动化测试框架：

**认证流程**
- [ ] 未登录访问 `/` → 跳转 `/sign-in`
- [ ] 注册新账号 → 跳转回首页，看到空角色库
- [ ] 退出登录 → 跳转 `/sign-in`

**数据隔离**
- [ ] 用户 A 创建角色，用户 B 登录后看不到
- [ ] 用户 B 直接访问用户 A 的 `/characters/[id]` → 404
- [ ] 公开分享页 `/characters/[id]/public` 未登录可访问

**现有功能回归**
- [ ] 角色 CRUD 正常
- [ ] Item 创建/编辑正常
- [ ] 搜索返回当前用户数据
- [ ] CharacterGroup 正常

---

## 不在本子项目范围内

以下功能已有代码，待后续子项目与认证系统整合：

- 多角色共现页（`/co-occurrence`）
- 共现时间轴（`/timeline`）
- 关系图谱（`/graph`）
- AI 导入（叙事解析、摘要生成）
- 资产导出系统
