import { auth } from '@clerk/nextjs/server'

/**
 * 返回当前登录用户的 userId。
 * 未登录时抛出异常（middleware 已保护路由，正常情况不会触发）。
 */
export async function getUserId(): Promise<string> {
  const { userId } = await auth()
  if (!userId) throw new Error('Unauthorized')
  return userId
}
