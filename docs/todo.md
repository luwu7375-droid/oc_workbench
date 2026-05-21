# OC Workbench — MVP 后待办事项

> 创建日期：2026-05-21
> 说明：以下功能在 MVP 阶段有意跳过，待核心流程稳定后迭代。

---

## T1. 用户认证（注册 / 登录）

**背景：** MVP 阶段使用硬编码 userId，单用户本地运行。后续需要支持多用户或将 Workbench 部署到云端时必须升级。

**待做：**
- 安装 Clerk（`npm install @clerk/nextjs`）
- 在 `app/layout.tsx` 中包裹 `ClerkProvider`
- 创建 `app/sign-in/[[...sign-in]]/page.tsx` 和 `app/sign-up/[[...sign-up]]/page.tsx`
- 创建 `middleware.ts`，用 `clerkMiddleware()` 保护所有非公开路由
- 将 `lib/auth.ts` 中的 `getUserId()` 改为异步版本，调用 Clerk 的 `auth()`
- 所有调用方加 `await`（API 路由已是 async，Server Component 页面已是 async，改动量小）

**可扩展性保障（已做）：**
- 数据库 schema 中 `Character` 和 `CharacterGroup` 已有 `userId` 字段，无需改 schema
- 所有数据库查询已按 `userId` 过滤，数据隔离逻辑完整
- 认证逻辑集中在 `lib/auth.ts` 的 `getUserId()` 一处，升级只需改这一个函数

**优先级：** 部署到云端或多用户场景前必须完成。本地单用户使用可暂缓。

---

## T2. 公开分享页认证

**背景：** `app/characters/[id]/public/page.tsx` 是公开页面，不需要登录即可访问。升级认证后需要确认该页面不被 middleware 拦截。

**待做：**
- middleware 的 `matcher` 排除 `/characters/[id]/public` 路径
- 确认公开页面的数据查询不依赖 userId（当前实现已通过 characterId 直接查询，无需 userId）

**优先级：** 随 T1 一起处理。

---

## T3. Tavern Bridge 认证

**背景：** MVP 阶段 Bridge API（`/api/tavern/*`）完全无认证，任何本地进程都���以调用。

**待做：**
- 在 Workbench 生成并存储 `OC_TAVERN_BRIDGE_TOKEN`（环境变量）
- 所有 Bridge 请求带 `X-OC-Bridge-Token` header
- `lib/tavern-bridge.ts` 中增加 token 校验逻辑
- 插件 settings.html 提供 Token 输入框

**优先级：** 中。本地单机使用风险低，但暴露到局域网时需要。

---

## T4. 部署配置

**背景：** 当前只在本地开发环境运行，未部署到生产环境。

**待做：**
- 配置 Vercel 部署（`vercel.json` 或直接通过 Vercel Dashboard）
- 设置生产环境变量（`DATABASE_URL`、`ANTHROPIC_API_KEY`、Clerk keys）
- 确认 Prisma Accelerate 连接在 Vercel serverless 环境下正常工作
- 配置自定义域名（可选）

**优先级：** 需要多设备访问或分享给他人时处理。
