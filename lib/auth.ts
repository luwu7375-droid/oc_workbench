/**
 * 认证模块
 *
 * 当前实现：单用户 MVP，userId 硬编码。
 *
 * TODO: 升级为真实认证时的步骤：
 * 1. 安装 Clerk（或其他认证方案）：npm install @clerk/nextjs
 * 2. 在 app/layout.tsx 中包裹 ClerkProvider
 * 3. 创建 app/sign-in 和 app/sign-up 页面
 * 4. 创建 middleware.ts，用 clerkMiddleware() 保护路由
 * 5. 将本文件的 getUserId() 替换为：
 *      import { auth } from '@clerk/nextjs/server'
 *      export async function getUserId(): Promise<string> {
 *        const { userId } = await auth()
 *        if (!userId) throw new Error('Unauthorized')
 *        return userId
 *      }
 * 6. 所有调用方改为 await getUserId()（当前是同步调用，升级时需要加 await）
 * 7. 执行数据库迁移：Character 和 CharacterGroup 表已有 userId 字段，无需改 schema
 *
 * 注意：升级时 API 路由需要同步改为 async 调用，Server Component 页面已经是 async，无需额外改动。
 */

const HARDCODED_USER_ID = 'user_3E1IpMpFa4SnhdMOOO6hAcQjK84'

/**
 * 返回当前用户 ID。
 * MVP 阶段返回硬编码值；升级认证后替换为动态获取。
 */
export function getUserId(): string {
  return HARDCODED_USER_ID
}
