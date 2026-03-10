'use client'

import { useEffect, useRef } from 'react'
import type { Paper, Topic, ComponentRelation } from '@/data/paperStore'

interface Props {
  components: string[]
  papers: Paper[]
  topics: Topic[]
  componentRelations: ComponentRelation[]
  onNodeClick: (type: string, id: string) => void
}

export default function ComponentGraph({ components, papers, topics, componentRelations, onNodeClick }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const networkRef = useRef<{ destroy(): void; on(event: string, cb: (p: { nodes: string[] }) => void): void } | null>(null)

  useEffect(() => {
    if (!containerRef.current || components.length === 0) return
    let destroyed = false

    async function init() {
      const { Network, DataSet } = await import('vis-network/standalone')
      if (destroyed || !containerRef.current) return

      if (networkRef.current) {
        networkRef.current.destroy()
        networkRef.current = null
      }

      // Component nodes
      const nodes: object[] = components.map((comp) => ({
        id: `comp-${comp}`,
        label: comp,
        color: {
          border: '#10b981',
          background: '#10b98120',
          highlight: { border: '#10b981', background: '#10b98140' },
          hover: { border: '#10b981', background: '#10b98130' },
        },
        font: { size: 14, bold: true, color: '#2c3e50' },
        size: 46,
        shape: 'dot',
        borderWidth: 3,
        shadow: { enabled: true, x: 2, y: 2, size: 8, color: 'rgba(0,0,0,0.15)' },
      }))

      // Paper nodes – only those that have at least one component
      const papersWithComps = papers.filter((p) => p.components.length > 0)
      const addedPaperIds = new Set<string>()
      papersWithComps.forEach((p) => {
        if (addedPaperIds.has(p.id)) return
        addedPaperIds.add(p.id)
        const topic = topics.find((t) => t.id === p.topicId)
        nodes.push({
          id: `paper-${p.id}`,
          label: p.title.length > 24 ? p.title.slice(0, 24) + '…' : p.title,
          color: {
            border: topic?.color ?? '#ced4da',
            background: '#ffffff',
            highlight: { border: '#0ea5e9', background: '#e0f2fe' },
            hover: { border: topic?.color ?? '#adb5bd', background: '#f8f9fa' },
          },
          font: { size: 11, color: '#495057' },
          size: 18,
          shape: 'dot',
          borderWidth: 2,
        })
      })

      // Edges: parent → child (hierarchy)
      const edges: object[] = []
      componentRelations.forEach((rel) => {
        if (components.includes(rel.parent) && components.includes(rel.child)) {
          edges.push({
            from: `comp-${rel.parent}`,
            to: `comp-${rel.child}`,
            color: { color: '#8b5cf6', highlight: '#7c3aed', hover: '#7c3aed' },
            width: 2,
            smooth: { enabled: true, type: 'curvedCW', roundness: 0.25 },
          })
        }
      })

      // Edges: component → paper
      papers.forEach((p) => {
        p.components.forEach((comp) => {
          if (components.includes(comp)) {
            edges.push({
              from: `comp-${comp}`,
              to: `paper-${p.id}`,
              color: { color: '#dee2e6', highlight: '#adb5bd', hover: '#adb5bd' },
              width: 1.5,
              smooth: { enabled: true, type: 'curvedCW', roundness: 0.2 },
            })
          }
        })
      })

      const options = {
        physics: {
          enabled: true,
          solver: 'barnesHut' as const,
          barnesHut: {
            gravitationalConstant: -12000,
            centralGravity: 0.1,
            springLength: 220,
            springConstant: 0.04,
            damping: 0.18,
            avoidOverlap: 1,
          },
          stabilization: { iterations: 400, updateInterval: 25 },
        },
        interaction: {
          hover: true,
          dragNodes: true,
          zoomView: true,
          dragView: true,
          tooltipDelay: 200,
        },
        edges: {
          smooth: { enabled: true, type: 'continuous', roundness: 0.3 },
        },
      }

      const nodeSet = new DataSet(nodes)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const edgeSet = new DataSet(edges as any[])
      const network = new Network(containerRef.current!, { nodes: nodeSet, edges: edgeSet }, options)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      networkRef.current = network as any

      network.on('click', (params) => {
        const nodeId = (params.nodes as string[])[0]
        if (!nodeId) return
        if (nodeId.startsWith('comp-')) {
          onNodeClick('component', nodeId.replace('comp-', ''))
        } else if (nodeId.startsWith('paper-')) {
          onNodeClick('paper', nodeId.replace('paper-', ''))
        }
      })
    }

    init().catch(console.error)

    return () => {
      destroyed = true
      if (networkRef.current) {
        networkRef.current.destroy()
        networkRef.current = null
      }
    }
  }, [components, papers, topics, componentRelations, onNodeClick])

  if (components.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-text-light gap-2">
        <p className="text-base font-medium">아직 Component가 없습니다</p>
        <p className="text-sm">Topic 뷰에서 Component가 포함된 논문을 추가해 주세요</p>
      </div>
    )
  }

  return <div ref={containerRef} className="w-full h-full" />
}
