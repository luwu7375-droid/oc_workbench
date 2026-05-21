/**
 * Bridge API 使用环境变量中配置的固定 userId 来标识 Workbench 所有者。
 * Tavern Bridge 是本地无认证端点，不走 Clerk。
 */
export function getBridgeUserId(): string {
  const userId = process.env.BRIDGE_USER_ID
  if (!userId) throw new Error('BRIDGE_USER_ID 环境变量未配置')
  return userId
}
