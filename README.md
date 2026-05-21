# OC Workbench

面向 OC（Original Character）创作者的创作工作台。支持角色管理、内容挂载、多角色共现、共现时间轴、角色关系图谱。

## 一键运行（Electron 桌面版）

### 前置条件

- Node.js 18+
- 已有 Prisma Accelerate 数据库连接串（`DATABASE_URL`）
- 可选：OpenRouter API Key（`ANTHROPIC_API_KEY`，用于 AI 剧情解析）

### 步骤

```bash
# 1. 克隆并安装依赖
git clone https://github.com/luwu7375-droid/oc_workbench.git
cd oc_workbench
npm install

# 2. 创建配置文件
cp .env.example .env.local
# 编辑 .env.local，填入你的 DATABASE_URL 和 ANTHROPIC_API_KEY

# 3. 加密配置 + 构建 + 打包（一步完成）
npm run electron:dist
```

打包产物在 `dist-electron/` 目录，macOS 生成 `.dmg`，Windows 生成 `.exe`。

### 配置文件说明

`.env.local` 需要填写：

```
DATABASE_URL=prisma+postgres://accelerate.prisma-data.net/...
ANTHROPIC_API_KEY=sk-or-...
```

`npm run electron:dist` 会自动把这些变量加密后内嵌进应用，最终用户无需配置环境变量。

---

## 开发模式（Web）

```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000)

## 开发模式（Electron）

```bash
npm run electron:dev
```

## 技术栈

- Next.js 16 (App Router)
- Tailwind CSS + shadcn/ui
- Prisma 7 + Prisma Accelerate (PostgreSQL)
- Electron 42
- dnd-kit（拖拽排序）
- TipTap（富文本）
