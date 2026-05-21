import { getUserId } from '@/lib/auth'

/**
 * Bridge API 使用固定的 userId 来标识 Workbench 所有者。
 */
export function getBridgeUserId(): string {
  return getUserId()
}
