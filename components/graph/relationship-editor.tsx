'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { GraphEdge, GraphNode, CreateRelationshipInput } from '@/types'

interface RelationshipEditorProps {
  mode: 'create' | 'edit'
  relationship?: GraphEdge
  characters: GraphNode[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (input: CreateRelationshipInput) => Promise<void>
  onDelete?: (id: string) => Promise<void>
}

export function RelationshipEditor({
  mode,
  relationship,
  characters,
  open,
  onOpenChange,
  onSave,
  onDelete,
}: RelationshipEditorProps) {
  const [fromId, setFromId] = useState(relationship?.source ?? '')
  const [toId, setToId] = useState(relationship?.target ?? '')
  const [label, setLabel] = useState(relationship?.label ?? '')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    if (!fromId || !toId || !label.trim()) return

    setLoading(true)
    try {
      await onSave({ fromId, toId, label: label.trim(), note: note.trim() || undefined })
      onOpenChange(false)
      // 重置表单
      setFromId('')
      setToId('')
      setLabel('')
      setNote('')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!relationship || !onDelete) return
    if (!confirm('确定删除这条关系吗？')) return

    setLoading(true)
    try {
      await onDelete(relationship.id)
      onOpenChange(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? '新建关系' : '编辑关系'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {mode === 'create' && (
            <>
              <div>
                <Label htmlFor="from">关系发起方</Label>
                <select
                  id="from"
                  value={fromId}
                  onChange={(e) => setFromId(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md"
                  disabled={loading}
                >
                  <option value="">选择角色</option>
                  {characters.map((char) => (
                    <option key={char.id} value={char.id}>
                      {char.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="to">关系接收方</Label>
                <select
                  id="to"
                  value={toId}
                  onChange={(e) => setToId(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md"
                  disabled={loading}
                >
                  <option value="">选择角色</option>
                  {characters.map((char) => (
                    <option key={char.id} value={char.id}>
                      {char.name}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          <div>
            <Label htmlFor="label">关系标签</Label>
            <Input
              id="label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="如：师徒、情侣、宿敌"
              maxLength={50}
              disabled={loading}
            />
          </div>

          <div>
            <Label htmlFor="note">备注（可选）</Label>
            <Textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="补充说明"
              maxLength={500}
              disabled={loading}
            />
          </div>

          <div className="flex justify-between">
            <div>
              {mode === 'edit' && onDelete && (
                <Button variant="destructive" onClick={handleDelete} disabled={loading}>
                  删除
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                取消
              </Button>
              <Button onClick={handleSave} disabled={loading || !fromId || !toId || !label.trim()}>
                {loading ? '保存中...' : '保存'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
