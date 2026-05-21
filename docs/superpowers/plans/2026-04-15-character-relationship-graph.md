# 角色关系图谱 — 实现计划

**日期**: 2026-04-15
**分支**: feature/mvp-p0
**目标**: 在现有 OC Workbench 基础上，新增角色间关系数据模型和力导向关系图谱页面，支持手动编辑和 AI 导入时自动提取关系三元组。

---

## 1. 背景与约束

### 现有数据模型
```
Character   — id, name, note, avatar, createdAt, updatedAt
Item        — id, content, title, itemType, pinned, image, fictionalOrder, fictionalStage, isPublic
ItemCharacter — itemId, characterId  (多对多中间表)
```

### 现有技术栈
- Next.js 16 App Router + React 19
- Prisma 7 + PostgreSQL
- shadcn/ui + Tailwind CSS v4
- DeepSeek v3（via OpenRouter）用于 AI 解析
- **无** `@visx`、`d3`、`react-force-graph` 等图形库（需新增或用纯 SVG）

### 设计原则
- 保持文件组织一致：`lib/db/` 封装查询，`app/api/` 暴露路由，`components/` 放 UI
- API 统一返回 `ApiResponse<T>` 格式
- 不破坏现有 P0 功能

---

## 2. 数据库层

### 2.1 新增 CharacterRelationship 模型

**文件**: `prisma/schema.prisma`

在现有三个模型后追加：

```prisma
model CharacterRelationship {
  id          String   @id @default(cuid())
  fromId      String
  toId        String
  label       String   // 关系描述，如"师徒"、"情侣"、"宿敌"
  note        String?  // 可选补充说明
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  from        Character @relation("RelationshipFrom", fields: [fromId], references: [id], onDelete: Cascade)
  to          Character @relation("RelationshipTo",   fields: [toId],   references: [id], onDelete: Cascade)

  @@unique([fromId, toId, label])  // 同一对角色+同一标签唯一
}
```

同时在 `Character` 模型中追加反向关联字段：
```prisma
  relationshipsFrom CharacterRelationship[] @relation("RelationshipFrom")
  relationshipsTo   CharacterRelationship[] @relation("RelationshipTo")
```

**执行迁移**：
```bash
npx prisma migrate dev --name add_character_relationship
npx prisma generate
```

### 2.2 设计说明
- **有向存储，无向展示**：`fromId → toId` 有方向，但图谱渲染时双向展示同一条边，避免重复边。
- **`@@unique([fromId, toId, label])`**：允许同一对角色有多种关系标签（如 A→B 既是"朋友"也是"同事"），但禁止完全重复。
- **Cascade 删除**：角色删除时自动清除其所有关系记录。

---

## 3. 类型层

### 3.1 更新 `types/index.ts`

追加以下类型（不修改现有类型）：

```typescript
import type { CharacterRelationship } from '@prisma/client'

// 导出 Prisma 原始类型
export type { CharacterRelationship }

// 关系 + 两端角色信息（用于图谱渲染）
export type RelationshipWithCharacters = CharacterRelationship & {
  from: Pick<Character, 'id' | 'name' | 'avatar'>
  to:   Pick<Character, 'id' | 'name' | 'avatar'>
}

// 图谱节点（力导向图数据结构）
export type GraphNode = {
  id:     string
  name:   string
  avatar: string | null
  // 运行时由力导向算法填充
  x?:  number
  y?:  number
  vx?: number
  vy?: number
}

// 图谱边
export type GraphEdge = {
  id:     string   // relationship.id
  source: string   // fromId
  target: string   // toId
  label:  string
}

// 图谱完整数据
export type GraphData = {
  nodes: GraphNode[]
  edges: GraphEdge[]
}

// API 请求体：创建 / 更新关系
export type CreateRelationshipInput = {
  fromId: string
  toId:   string
  label:  string
  note?:  string
}
```

---

## 4. 数据库查询层

### 4.1 新建 `lib/db/relationships.ts`

```typescript
import { prisma } from '@/lib/prisma'
import type { CreateRelationshipInput, RelationshipWithCharacters } from '@/types'

const characterSelect = { id: true, name: true, avatar: true }

// 查询某个 workbook（当前全局）所有关系
export async function getRelationships(): Promise<RelationshipWithCharacters[]> {
  return prisma.characterRelationship.findMany({
    include: { from: { select: characterSelect }, to: { select: characterSelect } },
    orderBy: { createdAt: 'asc' },
  })
}

// 查询某两个角色之间的关系
export async function getRelationshipsBetween(
  aId: string,
  bId: string,
): Promise<RelationshipWithCharacters[]> {
  return prisma.characterRelationship.findMany({
    where: {
      OR: [
        { fromId: aId, toId: bId },
        { fromId: bId, toId: aId },
      ],
    },
    include: { from: { select: characterSelect }, to: { select: characterSelect } },
  })
}

// 创建关系（幂等：已存在则返回现有记录）
export async function createRelationship(
  input: CreateRelationshipInput,
): Promise<RelationshipWithCharacters> {
  return prisma.characterRelationship.upsert({
    where: { fromId_toId_label: { fromId: input.fromId, toId: input.toId, label: input.label } },
    create: input,
    update: { note: input.note },
    include: { from: { select: characterSelect }, to: { select: characterSelect } },
  })
}

// 更新关系标签/备注
export async function updateRelationship(
  id: string,
  data: Partial<Pick<CreateRelationshipInput, 'label' | 'note'>>,
): Promise<RelationshipWithCharacters> {
  return prisma.characterRelationship.update({
    where: { id },
    data,
    include: { from: { select: characterSelect }, to: { select: characterSelect } },
  })
}

// 删除关系
export async function deleteRelationship(id: string): Promise<void> {
  await prisma.characterRelationship.delete({ where: { id } })
}

// 将关系列表转换为图谱数据结构
export function toGraphData(
  relationships: RelationshipWithCharacters[],
): import('@/types').GraphData {
  const nodeMap = new Map<string, import('@/types').GraphNode>()

  for (const r of relationships) {
    if (!nodeMap.has(r.from.id)) nodeMap.set(r.from.id, { ...r.from })
    if (!nodeMap.has(r.to.id))   nodeMap.set(r.to.id,   { ...r.to   })
  }

  return {
    nodes: Array.from(nodeMap.values()),
    edges: relationships.map((r) => ({
      id:     r.id,
      source: r.fromId,
      target: r.toId,
      label:  r.label,
    })),
  }
}
```

---

## 5. API 层

### 5.1 `app/api/relationships/route.ts`

处理 `GET`（全部列表）和 `POST`（创建）。

```typescript
// GET  /api/relationships          → ApiResponse<RelationshipWithCharacters[]>
// POST /api/relationships          → ApiResponse<RelationshipWithCharacters>
//   body: CreateRelationshipInput

import { NextResponse } from 'next/server'
import { getRelationships, createRelationship } from '@/lib/db/relationships'
import { z } from 'zod'

const CreateSchema = z.object({
  fromId: z.string().cuid(),
  toId:   z.string().cuid(),
  label:  z.string().min(1).max(50),
  note:   z.string().max(500).optional(),
})

export async function GET() {
  try {
    const data = await getRelationships()
    return NextResponse.json({ data, error: null })
  } catch {
    return NextResponse.json({ data: null, error: 'Failed to fetch relationships' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const parsed = CreateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ data: null, error: parsed.error.message }, { status: 400 })
    }
    const data = await createRelationship(parsed.data)
    return NextResponse.json({ data, error: null }, { status: 201 })
  } catch {
    return NextResponse.json({ data: null, error: 'Failed to create relationship' }, { status: 500 })
  }
}
```

### 5.2 `app/api/relationships/[id]/route.ts`

处理 `PATCH`（更新）和 `DELETE`（删除）。

```typescript
// PATCH  /api/relationships/:id   → ApiResponse<RelationshipWithCharacters>
//   body: { label?: string; note?: string }
// DELETE /api/relationships/:id   → ApiResponse<null>

import { NextResponse } from 'next/server'
import { updateRelationship, deleteRelationship } from '@/lib/db/relationships'
import { z } from 'zod'

const UpdateSchema = z.object({
  label: z.string().min(1).max(50).optional(),
  note:  z.string().max(500).optional(),
})

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json()
    const parsed = UpdateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ data: null, error: parsed.error.message }, { status: 400 })
    }
    const data = await updateRelationship(params.id, parsed.data)
    return NextResponse.json({ data, error: null })
  } catch {
    return NextResponse.json({ data: null, error: 'Failed to update relationship' }, { status: 500 })
  }
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  try {
    await deleteRelationship(params.id)
    return NextResponse.json({ data: null, error: null })
  } catch {
    return NextResponse.json({ data: null, error: 'Failed to delete relationship' }, { status: 500 })
  }
}
```

### 5.3 `app/api/relationships/graph/route.ts`（可选，直接返回图谱数据）

```typescript
// GET /api/relationships/graph  → ApiResponse<GraphData>

import { NextResponse } from 'next/server'
import { getRelationships, toGraphData } from '@/lib/db/relationships'

export async function GET() {
  try {
    const relationships = await getRelationships()
    const data = toGraphData(relationships)
    return NextResponse.json({ data, error: null })
  } catch {
    return NextResponse.json({ data: null, error: 'Failed to build graph data' }, { status: 500 })
  }
}
```

---

## 6. AI 导入扩展

### 6.1 修改 `app/api/import/narrative/route.ts`

**目标**：在现有 prompt 中追加关系提取指令，并在创建角色/片段后批量写入关系。

#### Prompt 变更（仅追加，不修改现有结构）

现有返回结构：
```json
{
  "characters": [{ "name": "...", "profile": "..." }],
  "snippets":   [{ "content": "...", "characterNames": ["..."] }]
}
```

扩展为：
```json
{
  "characters": [...],
  "snippets":   [...],
  "relationships": [
    { "from": "角色A", "to": "角色B", "label": "师徒" },
    { "from": "角色A", "to": "角色C", "label": "宿敌" }
  ]
}
```

Prompt 追加内容（在现有 prompt 末尾）：
```
同时，提取文本中角色之间的明确关系，填入 relationships 数组。
每条关系包含：
- from: 关系发起方角色名（必须出现在 characters 列表中）
- to: 关系接收方角色名（必须出现在 characters 列表中）
- label: 关系描述，2-6个汉字，如"师徒"、"情侣"、"宿敌"、"同伴"
如无明确关系，返回空数组 []。
```

#### 处理逻辑追加（在现有创建逻辑后）

```typescript
// 在现有角色创建完成、得到 characterMap: Map<name, id> 后追加：

const { relationships = [] } = parsed  // AI 返回的关系三元组

for (const rel of relationships) {
  const fromId = characterMap.get(rel.from)
  const toId   = characterMap.get(rel.to)
  if (fromId && toId && fromId !== toId) {
    await createRelationship({ fromId, toId, label: rel.label }).catch(() => {
      // 忽略重复冲突，幂等操作
    })
  }
}
```

---

## 7. 图谱组件

### 7.1 技术选型：纯 SVG 力导向图

**不引入新依赖**，使用自定义 React Hook 实现简化版力导向模拟，避免 d3 的体积和 SSR 问题。

力导向核心（Hook）：`hooks/use-force-simulation.ts`

```typescript
// 简化力模型：斥力 + 弹簧引力 + 向心力
// 每帧用 requestAnimationFrame 驱动，React state 更新节点位置
export function useForceSimulation(nodes: GraphNode[], edges: GraphEdge[]) {
  // 返回 { positions: Map<id, {x,y}>, isDone: boolean }
}
```

模拟参数（可调）：
- 斥力强度：`k_repel = 3000`
- 弹簧自然长度：`l_spring = 120px`
- 弹簧刚度：`k_spring = 0.05`
- 向心力：`center = { x: width/2, y: height/2 }`
- 阻尼：`damping = 0.85`
- 最大迭代次数：`300` 帧后停止

### 7.2 `components/graph/character-graph.tsx`

主图谱组件，接收 `GraphData`，渲染 SVG。

```tsx
'use client'
// Props:
// - data: GraphData
// - width?: number  (默认 800)
// - height?: number (默认 600)
// - onEdgeClick?: (edge: GraphEdge) => void
// - onNodeClick?: (node: GraphNode) => void

// 渲染结构：
// <svg>
//   <defs>  — 箭头 marker（可选，有向模式）
//   <g class="edges">
//     {edges.map} — <line> + <text> 关系标签（居中）
//   <g class="nodes">
//     {nodes.map} — <circle> 或 <image>（头像）+ <text> 角色名
// </svg>
```

节点交互：
- 拖拽节点：mousedown → mousemove → mouseup 更新该节点位置，暂停模拟
- 点击节点：回调 `onNodeClick`，可跳转角色页
- 点击边：回调 `onEdgeClick`，可弹出编辑/删除弹窗

### 7.3 `components/graph/relationship-editor.tsx`

内联编辑弹窗（复用 shadcn `Dialog`）：

```tsx
// 用于：
// 1. 新建关系（选择两个角色 + 输入标签）
// 2. 编辑关系标签/备注
// 3. 删除关系
// Props:
// - mode: 'create' | 'edit'
// - relationship?: GraphEdge  （edit 模式传入）
// - characters: GraphNode[]   （create 模式显示选择器）
// - onSave: (input) => void
// - onDelete?: (id) => void
```

---

## 8. 图谱页面

### 8.1 `app/graph/page.tsx`

```tsx
// 路由：/graph
// 服务端 fetch 图谱数据，传给客户端组件

import { getRelationships, toGraphData } from '@/lib/db/relationships'
import GraphPageClient from './page-client'

export default async function GraphPage() {
  const relationships = await getRelationships()
  const graphData     = toGraphData(relationships)
  const characters    = await getCharacters()   // 用于创建新关系时选择角色
  return <GraphPageClient graphData={graphData} characters={characters} />
}
```

### 8.2 `app/graph/page-client.tsx`（客户端交互）

功能：
- 渲染 `CharacterGraph`
- 顶部工具栏：
  - "新建关系"按钮 → 打开 `RelationshipEditor`（create 模式）
  - 角色筛选下拉：选中后只显示该角色相关节点和边
- 点击边 → 打开 `RelationshipEditor`（edit 模式）
- 点击节点 → `router.push('/characters/[id]')`
- 乐观更新：操作后重新 fetch 或本地更新 state

### 8.3 导航入口

在现有导航栏（推测为 `components/layout/` 或 `app/layout.tsx`）中添加图谱链接：

```tsx
<Link href="/graph">关系图谱</Link>
```

---

## 9. 实现顺序（建议）

| 步骤 | 内容 | 依赖 |
|------|------|------|
| 1 | 更新 `schema.prisma` + 执行迁移 + `prisma generate` | — |
| 2 | 更新 `types/index.ts` | 步骤 1 |
| 3 | 新建 `lib/db/relationships.ts` | 步骤 1-2 |
| 4 | 新建 API 路由（relationships + graph） | 步骤 3 |
| 5 | 扩展 AI 导入 prompt 和处理逻辑 | 步骤 3 |
| 6 | 实现 `hooks/use-force-simulation.ts` | — |
| 7 | 实现 `components/graph/character-graph.tsx` | 步骤 6 |
| 8 | 实现 `components/graph/relationship-editor.tsx` | 步骤 4 |
| 9 | 实现 `app/graph/page.tsx` + `page-client.tsx` | 步骤 4、7、8 |
| 10 | ��加导航入口 + 端到端测试 | 步骤 9 |

---

## 10. 关键决策记录

| 决策 | 选项 | 选择理由 |
|------|------|----------|
| 图形库 | @visx/network vs d3 vs 纯 SVG | 纯 SVG — 无新依赖，规模小，可控 |
| 关系方向 | 有向 vs 无向 | 有向存储（数据准确）、无向展示（图谱简洁） |
| 重复关系 | 禁止 vs 允许多标签 | 允许多标签（同对角色可有多种关系），唯一约束加 label |
| AI 提取 | 独立接口 vs 附加到导入 | 附加到现有导入 — 用户体验更流畅，无需额外操作 |
| 页面数据获取 | 服务端 vs 客户端 fetch | 服务端 fetch 初始数据，客户端乐观更新 |
