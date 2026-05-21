'use client'
import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import type { ItemWithCharacters } from '@/types'

export function StateCardDisplay({
  item,
  onEdit
}: {
  item: ItemWithCharacters
  onEdit: () => void
}) {
  // 解析 content JSON
  const data = (() => {
    try {
      return JSON.parse(item.content)
    } catch {
      return { traits: [], stage: '', relationships: '' }
    }
  })()

  return (
    <div className="rounded-xl border-2 border-zinc-200 bg-gradient-to-br from-zinc-50 to-white p-6 shadow-sm">
      <div className="flex items-start justify-between mb-4">
        <h3 className="text-base font-semibold text-zinc-900">当前状态</h3>
        <button
          onClick={onEdit}
          className="text-xs text-zinc-400 hover:text-zinc-600 transition-colors"
        >
          编辑
        </button>
      </div>

      {/* 性格关键词 */}
      {data.traits && data.traits.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-medium text-zinc-500 mb-2">性格关键词</p>
          <div className="flex flex-wrap gap-1.5">
            {data.traits.map((trait: string, idx: number) => (
              <Badge key={idx} variant="outline" className="bg-white">
                {trait}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* 所处阶段 */}
      {data.stage && (
        <div className="mb-4">
          <p className="text-xs font-medium text-zinc-500 mb-2">所处阶段</p>
          <p className="text-sm text-zinc-700">{data.stage}</p>
        </div>
      )}

      {/* 关系现状 */}
      {data.relationships && (
        <div>
          <p className="text-xs font-medium text-zinc-500 mb-2">关系现状</p>
          <p className="text-sm text-zinc-700 whitespace-pre-wrap">{data.relationships}</p>
        </div>
      )}

      {/* 空状态提示 */}
      {!data.traits?.length && !data.stage && !data.relationships && (
        <p className="text-sm text-zinc-400 text-center py-4">暂无内容</p>
      )}
    </div>
  )
}
