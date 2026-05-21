'use client'
import { useState } from 'react'
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { toast } from 'sonner'
import type { ItemWithCharacters } from '@/types'

function SortableItem({ item, onStageChange }: { item: ItemWithCharacters; onStageChange: (id: string, stage: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.id })
  const [editing, setEditing] = useState(false)
  const [stage, setStage] = useState(item.fictionalStage ?? '')
  const style = { transform: CSS.Transform.toString(transform), transition }

  return (
    <div ref={setNodeRef} style={style} className="flex gap-3 items-start rounded-xl border border-zinc-100 p-4 bg-white">
      <button {...attributes} {...listeners} className="mt-1 text-zinc-300 hover:text-zinc-500 cursor-grab active:cursor-grabbing">⠿</button>
      <div className="flex-1 min-w-0">
        {item.title && <p className="font-medium text-sm text-zinc-900 mb-1">{item.title}</p>}
        <p className="text-sm text-zinc-600 line-clamp-3 whitespace-pre-wrap">{item.content}</p>
        <div className="mt-2">
          {editing ? (
            <input autoFocus value={stage} onChange={(e) => setStage(e.target.value)}
              onBlur={() => { setEditing(false); onStageChange(item.id, stage) }}
              onKeyDown={(e) => { if (e.key === 'Enter') { setEditing(false); onStageChange(item.id, stage) } }}
              placeholder="阶段标签（如：早期、转折后）"
              className="text-xs border border-zinc-200 rounded px-2 py-0.5 outline-none focus:border-zinc-400" />
          ) : (
            <button onClick={() => setEditing(true)} className="text-xs text-zinc-400 hover:text-zinc-600">
              {stage || '+ 添加阶段标签'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export function TimelineView({ initialItems }: { initialItems: ItemWithCharacters[] }) {
  const [items, setItems] = useState(
    [...initialItems].sort((a, b) => (a.fictionalOrder ?? 999999) - (b.fictionalOrder ?? 999999))
  )
  const sensors = useSensors(useSensor(PointerSensor))

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = items.findIndex((i) => i.id === active.id)
    const newIndex = items.findIndex((i) => i.id === over.id)
    const next = arrayMove(items, oldIndex, newIndex)
    setItems(next)
    await Promise.all(next.map((item, idx) =>
      fetch(`/api/items/${item.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fictionalOrder: idx }) })
    ))
  }

  async function handleStageChange(id: string, stage: string) {
    const res = await fetch(`/api/items/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fictionalStage: stage }) })
    const json = await res.json()
    if (json.error) toast.error(json.error)
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-2">
          {items.map((item) => <SortableItem key={item.id} item={item} onStageChange={handleStageChange} />)}
        </div>
      </SortableContext>
    </DndContext>
  )
}
