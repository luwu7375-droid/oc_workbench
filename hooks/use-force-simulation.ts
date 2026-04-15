import { useEffect, useRef, useState } from 'react'
import type { GraphNode, GraphEdge } from '@/types'

interface ForceSimulationOptions {
  width: number
  height: number
  repelStrength?: number
  springLength?: number
  springStrength?: number
  damping?: number
  maxIterations?: number
}

export function useForceSimulation(
  nodes: GraphNode[],
  edges: GraphEdge[],
  options: ForceSimulationOptions
) {
  const {
    width,
    height,
    repelStrength = 3000,
    springLength = 120,
    springStrength = 0.05,
    damping = 0.85,
    maxIterations = 300,
  } = options

  const [positions, setPositions] = useState<Map<string, { x: number; y: number }>>(new Map())
  const [isDone, setIsDone] = useState(false)
  const iterationRef = useRef(0)
  const velocitiesRef = useRef<Map<string, { vx: number; vy: number }>>(new Map())

  useEffect(() => {
    if (nodes.length === 0) {
      setPositions(new Map())
      setIsDone(true)
      return
    }

    // 初始化位置和速度
    const initialPositions = new Map<string, { x: number; y: number }>()
    const initialVelocities = new Map<string, { vx: number; vy: number }>()

    nodes.forEach((node) => {
      initialPositions.set(node.id, {
        x: node.x ?? width / 2 + (Math.random() - 0.5) * 100,
        y: node.y ?? height / 2 + (Math.random() - 0.5) * 100,
      })
      initialVelocities.set(node.id, { vx: 0, vy: 0 })
    })

    setPositions(initialPositions)
    velocitiesRef.current = initialVelocities
    iterationRef.current = 0
    setIsDone(false)

    let animationId: number

    const simulate = () => {
      if (iterationRef.current >= maxIterations) {
        setIsDone(true)
        return
      }

      const newPositions = new Map(positions)
      const newVelocities = new Map(velocitiesRef.current)

      // 计算力
      nodes.forEach((nodeA) => {
        const posA = newPositions.get(nodeA.id)!
        const velA = newVelocities.get(nodeA.id)!
        let fx = 0
        let fy = 0

        // 斥力
        nodes.forEach((nodeB) => {
          if (nodeA.id === nodeB.id) return
          const posB = newPositions.get(nodeB.id)!
          const dx = posA.x - posB.x
          const dy = posA.y - posB.y
          const distSq = dx * dx + dy * dy + 1 // 避免除零
          const dist = Math.sqrt(distSq)
          const force = repelStrength / distSq
          fx += (dx / dist) * force
          fy += (dy / dist) * force
        })

        // 弹簧引力
        edges.forEach((edge) => {
          let otherId: string | null = null
          if (edge.source === nodeA.id) otherId = edge.target
          if (edge.target === nodeA.id) otherId = edge.source
          if (!otherId) return

          const posB = newPositions.get(otherId)!
          const dx = posB.x - posA.x
          const dy = posB.y - posA.y
          const dist = Math.sqrt(dx * dx + dy * dy + 1)
          const force = (dist - springLength) * springStrength
          fx += (dx / dist) * force
          fy += (dy / dist) * force
        })

        // 向心力
        const centerX = width / 2
        const centerY = height / 2
        fx += (centerX - posA.x) * 0.01
        fy += (centerY - posA.y) * 0.01

        // 更新速度和位置
        velA.vx = (velA.vx + fx) * damping
        velA.vy = (velA.vy + fy) * damping
        posA.x += velA.vx
        posA.y += velA.vy

        // 边界约束
        posA.x = Math.max(50, Math.min(width - 50, posA.x))
        posA.y = Math.max(50, Math.min(height - 50, posA.y))
      })

      setPositions(newPositions)
      velocitiesRef.current = newVelocities
      iterationRef.current++

      animationId = requestAnimationFrame(simulate)
    }

    animationId = requestAnimationFrame(simulate)

    return () => {
      if (animationId) cancelAnimationFrame(animationId)
    }
  }, [nodes, edges, width, height, repelStrength, springLength, springStrength, damping, maxIterations])

  return { positions, isDone }
}
