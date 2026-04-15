@AGENTS.md

# OC Workbench — 开发指南

## 项目简介

面向 OC（Original Character）创作者的创作工作台。核心功能：角色管理、内容挂载、多角色共现、共现时间轴。

产品文档：`~/oc-workbench/oc助手.md`

## 技术栈

- **框架**：Next.js（App Router）
- **样式**：Tailwind CSS + shadcn/ui
- **数据库**：PostgreSQL（Prisma Accelerate 托管，原 Supabase 连接池因密码同步问题弃用）
- **ORM**：Prisma 7（breaking change：schema.prisma 中 datasource 不填 `url`，由 PrismaClient 构造函数传 `accelerateUrl`）
- **拖拽**：dnd-kit
- **富文本**：TipTap
- **部署**：Vercel
- **AI 调用**：OpenRouter API（key 存于 `ANTHROPIC_API_KEY` 环境变量）

## 核心数据模型

```
Character              角色，所有内容的锚点
Item                   挂载到角色下的内容（profile/snippet/reference/image/state_card）
CharacterRelationship  角色关系（from/to/label/note），支持关系图谱
CharacterGroup         角色组合，用于快速进入共现页（P1）
NarrativeLine          剧情线（P2）
```

Item 关键字段：`item_type`, `linked_characters[]`, `fictional_order`, `fictional_stage`, `pinned`
CharacterRelationship 关键字段：`fromId`, `toId`, `label`, `note`

## 目录结构

```
app/
  page.tsx                首页/角色库
  characters/
    new/page.tsx          新建角色
    [id]/page.tsx         角色页
  co-occurrence/page.tsx  多角色共现页
  timeline/page.tsx       共现时间轴
  import/page.tsx         导入页（两种模式）
  graph/
    page.tsx              角色关系图谱页
    page-client.tsx       图谱客户端交互
  api/
    characters/           角色 CRUD
    characters/[id]/      单个角色 CRUD
    items/                内容项 CRUD
    items/[id]/           单个内容项 CRUD
    relationships/        关系 CRUD
    relationships/[id]/   单个关系 CRUD
    relationships/graph/  图谱数据接口
    import/narrative/     AI 剧情解析导入（含关系提取）
    search/               全局搜索
    upload/               图片上传（返回 base64 data URL）
components/
  ui/                     shadcn/ui 组件（不要手动修改）
  characters/
    character-card.tsx    角色卡片
    character-form.tsx    新建角色表单
    character-header.tsx  角色页头部（含头像上传、备注内联编辑）
    character-selector.tsx 角色多选组件
    character-tabs.tsx    资料/创作 Tab
    delete-character-button.tsx 删除角色按钮
  items/
    item-card.tsx         内容项卡片
    item-form.tsx         新增内容项表单（支持图片上传）
  import/
    import-form.tsx       批量导入表单（内容导入 + 剧情导入两个 Tab）
  search/
    search-bar.tsx        搜索栏
  timeline/
    timeline-view.tsx     共现时间轴视图（dnd-kit 拖拽排序）
  graph/
    character-graph.tsx   角色关系图谱（纯 SVG 力导向图）
    relationship-editor.tsx 关系编辑弹窗
lib/
  prisma.ts               Prisma client 单例（含 Accelerate 扩展）
  utils.ts                通用工具函数
  db/
    characters.ts         角色数据库查询
    items.ts              内容项数据库查询
    relationships.ts      关系数据库查询 + 图谱数据转换
hooks/
  use-force-simulation.ts 力导向图模拟 Hook
prisma/
  schema.prisma           数据库 schema
types/
  index.ts                共享 TypeScript 类型
```

## 开发规范

- 所有数据库操作写在 `lib/db/` 下，不在组件里直接调用 Prisma
- Server Components 优先，只在需要交互的地方用 `"use client"`
- 样式只用 Tailwind，不写自定义 CSS 文件
- 组件用 shadcn/ui，需要新组件先查 https://ui.shadcn.com/docs/components

## 设计风格

苹果简洁风：
- 大量留白，字体层级清晰
- 颜色克制，主色灰色系，强调色单一
- 圆角、阴影轻量
- 参考：Linear、Bear、Craft

## P0 功能范围（一期必做）

1. ✅ 首页/角色库
2. ✅ 新建角色（仅角色名必填）
3. ✅ 导入内容（两种模式：结构化内容导入 + AI 剧情解析导入）
4. ✅ 角色页（资料/创作两个 Tab）
5. ✅ 新增内容项（支持图片上传）
6. ✅ 多角色共现页
7. ✅ 共现时间轴（拖拽排序 + 阶段标签）
8. ✅ 基础搜索
9. ✅ 手动置顶
10. 🚧 角色关系图谱（力导向图 + 关系编辑 + AI 导入自动提取）

## 常用命令

```bash
npm run dev          # 启动开发服务器
npm run build        # 构建生产版本
npm run lint         # 代码检查
npx prisma migrate dev   # 执行数据库迁移
npx prisma studio        # 打开数据库可视化界面
npx prisma generate      # 重新生成 Prisma client
```

## API 路由约定

```
GET    /api/characters              获取角色列表
POST   /api/characters              创建角色
GET    /api/characters/[id]         获取单个角色
PATCH  /api/characters/[id]         更新角色
DELETE /api/characters/[id]         删除角色

GET    /api/items                   获取内容列表（支持 ?characterId= 过滤）
POST   /api/items                   创建内容项
PATCH  /api/items/[id]              更新内容项
DELETE /api/items/[id]              删除内容项

GET    /api/relationships           获取所有关系
POST   /api/relationships           创建关系
PATCH  /api/relationships/[id]      更新关系
DELETE /api/relationships/[id]      删除关系
GET    /api/relationships/graph     获取图谱数据（nodes + edges）

POST   /api/search                  全局搜索
POST   /api/upload                  图片上传（返回 base64 data URL，存于数据库）
POST   /api/import/narrative        AI 剧情解析导入（调用 OpenRouter API，含关系提取）
```

API 统一返回格式：
```json
{ "data": ..., "error": null }
{ "data": null, "error": "错误描述" }
```

## 类型定义

共享 TypeScript 类型统一放在 `types/index.ts`，与 Prisma 生成类型分开。

## 认证

一期为单用户本地版本，不做登录认证。数据库不加 `user_id` 字段，API 不做鉴权。

## 图片上传

- 当前实现：返回 base64 data URL，直接存入数据库（`Item.content` 或 `Character.avatar` 字段）
- 大小限制：单张建议 ≤ 1MB（base64 会增大约 33%）
- 支持格式：jpg、png、webp、gif
- 注：原计划用 Supabase Storage，因架构调整（切换至 Prisma Accelerate）改为当前方案；生产环境可再接入对象存储

## 错误处理

- API 层：try/catch，统一返回 `{ error: string }`，HTTP 状态码语义化
- 客户端：用 toast 提示用户，不用 alert
- 表单验证：用 zod

## 环境变量

```
DATABASE_URL=prisma+postgres://accelerate.prisma-data.net/...   # Prisma Accelerate 连接串
ANTHROPIC_API_KEY=                                               # OpenRouter API key（变量名沿用，实际为 OpenRouter key）
NEXT_PUBLIC_SUPABASE_URL=                                        # Supabase（暂仅用于图片，base64 方案下可留空）
NEXT_PUBLIC_SUPABASE_ANON_KEY=                                   # 同上
```

> `ANTHROPIC_API_KEY` 实际存放的是 OpenRouter 的 API key，通过 `https://openrouter.ai/api/v1/chat/completions` 调用 AI 模型。当前使用模型：`deepseek/deepseek-chat-v3-2`。
