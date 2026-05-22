/**
 * Bridge API 使用环境变量中配置的固定 userId 来标识 Workbench 所有者。
 * Tavern Bridge 是本地无认证端点，不走 Clerk。
 */
export function getBridgeUserId(): string {
  const userId = process.env.BRIDGE_USER_ID
  if (!userId) throw new Error('BRIDGE_USER_ID 环境变量未配置')
  return userId
}

/**
 * 验证 Bridge Token。
 * BRIDGE_TOKEN 未配置时跳过验证（本地开发兼容）。
 * 返回 true 表示通过，false 表示拒绝。
 */
export function verifyBridgeToken(req: Request): boolean {
  const expected = process.env.BRIDGE_TOKEN
  if (!expected) return true // 未配置则不启用认证
  const auth = req.headers.get('Authorization') ?? ''
  return auth === `Bearer ${expected}`
}
