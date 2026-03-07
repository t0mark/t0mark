'use client'

import { useEffect, useRef } from 'react'
import type { Topic, Paper } from '@/data/paperStore'

interface Props {
  topics: Topic[]
  papers: Paper[]
  onNodeClick: (type: string, id: string) => void
}

export default function TopicGraph({ topics, papers, onNodeClick }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const networkRef = useRef<{ destroy(): void; on(event: string, cb: (p: { nodes: string[] }) => void): void } | null>(null)

  useEffect(() => {
    if (!containerRef.current) return
    let destroyed = false

    async function init() {
      const { Network, DataSet } = await import('vis-network/standalone')
      if (destroyed || !containerRef.current) return

      if (networkRef.current) {
        networkRef.current.destroy()
        networkRef.current = null
      }

      const nodes: object[] = topics.map((t) => ({
        id: `topic-${t.id}`,
        label: t.name,
        color: {
          border: t.color,
          background: t.color + '28',
          highlight: { border: t.color, background: t.color + '50' },
          hover: { border: t.color, background: t.color + '40' },
        },
        font: { size: 15, bold: true, color: '#2c3e50' },
        size: 52,
        shape: 'dot',
        borderWidth: 3,
        shadow: { enabled: true, x: 2, y: 2, size: 8, color: 'rgba(0,0,0,0.15)' },
      }))

      papers.forEach((p) => {
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

      const edges = papers
        .filter((p) => topics.some((t) => t.id === p.topicId))
        .map((p) => ({
          from: `topic-${p.topicId}`,
          to: `paper-${p.id}`,
          color: { color: '#dee2e6', highlight: '#adb5bd', hover: '#adb5bd' },
          width: 1.5,
          smooth: { enabled: true, type: 'curvedCW', roundness: 0.2 },
        }))

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
        if (nodeId.startsWith('topic-')) {
          onNodeClick('topic', nodeId.replace('topic-', ''))
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
  }, [topics, papers, onNodeClick])

  return <div ref={containerRef} className="w-full h-full" />
}
