/**
 * 单用户本地版本：从环境变量读取固定 userId。
 */
export async function getUserId(): Promise<string> {
  const userId = process.env.BRIDGE_USER_ID
  if (!userId) throw new Error('BRIDGE_USER_ID 环境变量未配置')
  return userId
}
