'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CharacterGraph } from '@/components/graph/character-graph'
import { RelationshipEditor } from '@/components/graph/relationship-editor'
import { Button } from '@/components/ui/button'
import type { GraphData, GraphEdge, GraphNode, Character, CreateRelationshipInput } from '@/types'
import { toast } from 'sonner'

interface GraphPageClientProps {
  graphData: GraphData
  characters: Character[]
}

export default function GraphPageClient({ graphData: initialData, characters }: GraphPageClientProps) {
  const router = useRouter()
  const [graphData, setGraphData] = useState(initialData)
  const [editorOpen, setEditorOpen] = useState(false)
  const [editorMode, setEditorMode] = useState<'create' | 'edit'>('create')
  const [selectedEdge, setSelectedEdge] = useState<GraphEdge | undefined>()
  const [selectedCharacterId, setSelectedCharacterId] = useState<string>('')

  const graphNodes: GraphNode[] = characters.map((c) => ({
    id: c.id,
    name: c.name,
    avatar: c.avatar,
  }))

  const handleCreateRelationship = () => {
    setEditorMode('create')
    setSelectedEdge(undefined)
    setEditorOpen(true)
  }

  const handleEdgeClick = (edge: GraphEdge) => {
    setEditorMode('edit')
    setSelectedEdge(edge)
    setEditorOpen(true)
  }

  const handleNodeClick = (node: GraphNode) => {
    router.push(`/characters/${node.id}`)
  }

  const handleSave = async (input: CreateRelationshipInput) => {
    try {
      if (editorMode === 'create') {
        const res = await fetch('/api/relationships', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
        })
        if (!res.ok) throw new Error('创建失败')
        toast.success('关系创建成功')
      } else if (selectedEdge) {
        const res = await fetch(`/api/relationships/${selectedEdge.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ label: input.label, note: input.note }),
        })
        if (!res.ok) throw new Error('更新失败')
        toast.success('关系更新成功')
      }
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '操作失败')
      throw error
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/relationships/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('删除失败')
      toast.success('关系删除成功')
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '删除失败')
      throw error
    }
  }

  // 筛选逻辑
  const filteredData = selectedCharacterId
    ? {
        nodes: graphData.nodes.filter(
          (n) =>
            n.id === selectedCharacterId ||
            graphData.edges.some(
              (e) =>
                (e.source === selectedCharacterId && e.target === n.id) ||
                (e.target === selectedCharacterId && e.source === n.id)
            )
        ),
        edges: graphData.edges.filter(
          (e) => e.source === selectedCharacterId || e.target === selectedCharacterId
        ),
      }
    : graphData

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">角色关系图谱</h1>
        <div className="flex gap-4">
          <select
            value={selectedCharacterId}
            onChange={(e) => setSelectedCharacterId(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="">全部角色</option>
            {characters.map((char) => (
              <option key={char.id} value={char.id}>
                {char.name}
              </option>
            ))}
          </select>
          <Button onClick={handleCreateRelationship}>新建关系</Button>
        </div>
      </div>

      <CharacterGraph
        data={filteredData}
        width={1000}
        height={700}
        onEdgeClick={handleEdgeClick}
        onNodeClick={handleNodeClick}
      />

      <RelationshipEditor
        mode={editorMode}
        relationship={selectedEdge}
        characters={graphNodes}
        open={editorOpen}
        onOpenChange={setEditorOpen}
        onSave={handleSave}
        onDelete={editorMode === 'edit' ? handleDelete : undefined}
      />
    </div>
  )
}
