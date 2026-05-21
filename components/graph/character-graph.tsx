'use client'

import { useForceSimulation } from '@/hooks/use-force-simulation'
import type { GraphData, GraphEdge, GraphNode } from '@/types'
import { useState, useRef } from 'react'

interface CharacterGraphProps {
  data: GraphData
  width?: number
  height?: number
  onEdgeClick?: (edge: GraphEdge) => void
  onNodeClick?: (node: GraphNode) => void
}

export function CharacterGraph({
  data,
  width = 800,
  height = 600,
  onEdgeClick,
  onNodeClick,
}: CharacterGraphProps) {
  const { positions, positionsRef, isDone } = useForceSimulation(data.nodes, data.edges, { width, height })
  const [draggedNode, setDraggedNode] = useState<string | null>(null)
  const [dragOverride, setDragOverride] = useState<{ x: number; y: number } | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  // Merge simulation positions with any active drag override
  const resolvedPositions = draggedNode && dragOverride
    ? new Map(positions).set(draggedNode, dragOverride)
    : positions

  const handleMouseDown = (nodeId: string) => {
    setDraggedNode(nodeId)
    setDragOverride(null)
  }

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!draggedNode || !svgRef.current) return

    const rect = svgRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    // Keep the positionsRef in sync so the simulation doesn't fight the drag
    positionsRef.current.set(draggedNode, { x, y })
    setDragOverride({ x, y })
  }

  const handleMouseUp = () => {
    setDraggedNode(null)
    setDragOverride(null)
  }

  return (
    <svg
      ref={svgRef}
      width={width}
      height={height}
      className="border border-gray-200 rounded-lg bg-white"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <defs>
        <marker
          id="arrowhead"
          markerWidth="10"
          markerHeight="10"
          refX="25"
          refY="3"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path d="M0,0 L0,6 L9,3 z" fill="#999" />
        </marker>
      </defs>

      {/* 边 */}
      <g className="edges">
        {data.edges.map((edge) => {
          const sourcePos = resolvedPositions.get(edge.source)
          const targetPos = resolvedPositions.get(edge.target)
          if (!sourcePos || !targetPos) return null

          const midX = (sourcePos.x + targetPos.x) / 2
          const midY = (sourcePos.y + targetPos.y) / 2

          return (
            <g key={edge.id}>
              <line
                x1={sourcePos.x}
                y1={sourcePos.y}
                x2={targetPos.x}
                y2={targetPos.y}
                stroke="#999"
                strokeWidth="2"
                markerEnd="url(#arrowhead)"
                className="cursor-pointer hover:stroke-blue-500"
                onClick={() => onEdgeClick?.(edge)}
              />
              <text
                x={midX}
                y={midY}
                textAnchor="middle"
                dy="-5"
                fontSize="12"
                fill="#666"
                className="pointer-events-none select-none"
              >
                {edge.label}
              </text>
            </g>
          )
        })}
      </g>

      {/* 节点 */}
      <g className="nodes">
        {data.nodes.map((node) => {
          const pos = resolvedPositions.get(node.id)
          if (!pos) return null

          return (
            <g
              key={node.id}
              transform={`translate(${pos.x}, ${pos.y})`}
              onMouseDown={() => handleMouseDown(node.id)}
              onClick={() => onNodeClick?.(node)}
              className="cursor-pointer"
            >
              {node.avatar ? (
                <image
                  href={node.avatar}
                  x="-20"
                  y="-20"
                  width="40"
                  height="40"
                  clipPath="circle(20px at center)"
                  className="hover:opacity-80"
                />
              ) : (
                <circle r="20" fill="#ddd" className="hover:fill-gray-400" />
              )}
              <text
                y="35"
                textAnchor="middle"
                fontSize="14"
                fill="#333"
                className="pointer-events-none select-none font-medium"
              >
                {node.name}
              </text>
            </g>
          )
        })}
      </g>

      {!isDone && (
        <text x={width / 2} y={20} textAnchor="middle" fontSize="12" fill="#999">
          布局计算中...
        </text>
      )}
    </svg>
  )
}
