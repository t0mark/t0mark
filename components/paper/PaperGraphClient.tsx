'use client'

import { useState, useEffect, useCallback } from 'react'
import { Search, Plus, X, FileDown } from 'lucide-react'
import dynamic from 'next/dynamic'
import {
  loadPaperData,
  savePaperData,
  generateId,
  TOPIC_COLORS,
} from '@/data/paperStore'
import type { Topic, Paper, PaperData, ClickedNode } from '@/data/paperStore'
import NodeModal from './NodeModal'
import AddTopicModal from './AddTopicModal'
import AddPaperModal from './AddPaperModal'

const TopicGraph = dynamic(() => import('./TopicGraph'), { ssr: false })
const ComponentGraph = dynamic(() => import('./ComponentGraph'), { ssr: false })

type Tab = 'topic' | 'component'

export default function PaperGraphClient() {
  const [data, setData] = useState<PaperData>({ topics: [], papers: [] })
  const [tab, setTab] = useState<Tab>('topic')
  const [clickedNode, setClickedNode] = useState<ClickedNode | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddTopic, setShowAddTopic] = useState(false)
  const [showAddPaper, setShowAddPaper] = useState(false)

  useEffect(() => {
    loadPaperData().then(setData)
  }, [])

  const saveData = useCallback((newData: PaperData) => {
    setData(newData)
    savePaperData(newData) // fire-and-forget
  }, [])

  const handleNodeClick = useCallback(
    (type: string, id: string) => {
      if (type === 'topic') {
        const topic = data.topics.find((t) => t.id === id)
        if (topic) setClickedNode({ type: 'topic', data: topic })
      } else if (type === 'paper') {
        const paper = data.papers.find((p) => p.id === id)
        if (paper) {
          const topic = data.topics.find((t) => t.id === paper.topicId) ?? null
          setClickedNode({ type: 'paper', data: paper, topic })
        }
      } else if (type === 'component') {
        const papers = data.papers.filter((p) => p.components.includes(id))
        setClickedNode({ type: 'component', name: id, papers })
      }
    },
    [data]
  )

  const handleAddTopic = useCallback(
    (topic: Omit<Topic, 'id' | 'color'>) => {
      const color = TOPIC_COLORS[data.topics.length % TOPIC_COLORS.length]
      const newTopic: Topic = { ...topic, id: generateId(), color }
      saveData({ ...data, topics: [...data.topics, newTopic] })
      setShowAddTopic(false)
    },
    [data, saveData]
  )

  const handleAddPaper = useCallback(
    (paper: Omit<Paper, 'id'>) => {
      const newPaper: Paper = { ...paper, id: generateId() }
      saveData({ ...data, papers: [...data.papers, newPaper] })
      setShowAddPaper(false)
    },
    [data, saveData]
  )

  const handleDelete = useCallback(() => {
    if (!clickedNode) return
    if (clickedNode.type === 'paper') {
      saveData({ ...data, papers: data.papers.filter((p) => p.id !== clickedNode.data.id) })
    } else if (clickedNode.type === 'topic') {
      saveData({
        topics: data.topics.filter((t) => t.id !== clickedNode.data.id),
        papers: data.papers.filter((p) => p.topicId !== clickedNode.data.id),
      })
    }
    setClickedNode(null)
  }, [clickedNode, data, saveData])

  const handleExportXlsx = useCallback(async () => {
    const xlsx = await import('xlsx')
    const rows = data.papers
      .map((p) => {
        const topic = data.topics.find((t) => t.id === p.topicId)
        return {
          주제: topic?.name ?? '',
          Year: p.year,
          Conference: p.venue,
          '3줄 요약': p.summary,
          'Code URL': p.codeUrl,
        }
      })
      .sort((a, b) => {
        if (a.주제 !== b.주제) return a.주제.localeCompare(b.주제)
        if (a.Year !== b.Year) return a.Year - b.Year
        return 0
      })
    const ws = xlsx.utils.json_to_sheet(rows)
    const wb = xlsx.utils.book_new()
    xlsx.utils.book_append_sheet(wb, ws, 'Papers')
    xlsx.writeFile(wb, 'papers.xlsx')
  }, [data])

  const allComponents = Array.from(new Set(data.papers.flatMap((p) => p.components)))

  const searchResults = searchQuery.trim()
    ? data.papers.filter(
        (p) =>
          p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.venue.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : []

  const openPaperNode = (p: Paper) => {
    const topic = data.topics.find((t) => t.id === p.topicId) ?? null
    setClickedNode({ type: 'paper', data: p, topic })
    setSearchQuery('')
  }

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-bg-light">
      {/* ── Top bar ── */}
      <div className="bg-white border-b border-border px-6 py-3 flex items-center gap-4 shrink-0">
        {/* Tabs */}
        <div className="flex gap-1 bg-bg-light rounded-lg p-1 shrink-0">
          {(['topic', 'component'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                tab === t
                  ? 'bg-white text-primary shadow-card'
                  : 'text-text-light hover:text-primary'
              }`}
            >
              {t === 'topic' ? 'Topic' : 'Component'}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-light pointer-events-none" />
          <input
            type="text"
            placeholder="제목 또는 게재지로 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-8 py-1.5 text-sm border border-border rounded-lg bg-bg-light focus:outline-none focus:border-accent-industry transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2"
            >
              <X className="w-4 h-4 text-text-light hover:text-primary" />
            </button>
          )}

          {/* Search dropdown */}
          {searchQuery && searchResults.length > 0 && (
            <div className="absolute top-full mt-1 left-0 right-0 bg-white border border-border rounded-lg shadow-hover z-50 max-h-72 overflow-y-auto">
              {searchResults.map((p) => (
                <button
                  key={p.id}
                  onClick={() => openPaperNode(p)}
                  className="w-full text-left px-4 py-3 hover:bg-bg-light border-b border-border last:border-0 transition-colors"
                >
                  <p className="text-sm font-medium text-primary truncate">{p.title}</p>
                  <p className="text-xs text-text-light mt-0.5">{p.year} · {p.venue}</p>
                </button>
              ))}
            </div>
          )}
          {searchQuery && searchResults.length === 0 && (
            <div className="absolute top-full mt-1 left-0 right-0 bg-white border border-border rounded-lg shadow-card p-3 text-sm text-text-light text-center z-50">
              검색 결과 없음
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 ml-auto shrink-0">
          <button
            onClick={handleExportXlsx}
            disabled={data.papers.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-accent-hardware border border-accent-hardware rounded-lg hover:bg-emerald-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <FileDown className="w-4 h-4" /> xlsx 저장
          </button>
          <button
            onClick={() => setShowAddTopic(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-accent-research border border-accent-research rounded-lg hover:bg-purple-50 transition-colors"
          >
            <Plus className="w-4 h-4" /> Topic 추가
          </button>
          <button
            onClick={() => setShowAddPaper(true)}
            disabled={data.topics.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-accent-industry rounded-lg hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" /> 논문 추가
          </button>
        </div>
      </div>

      {/* ── Graph area ── */}
      <div className="flex-1 relative overflow-hidden">
        {data.topics.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-text-light">
            <p className="text-base font-medium">아직 Topic이 없습니다</p>
            <p className="text-sm">상단의 <span className="font-semibold text-accent-research">Topic 추가</span> 버튼을 눌러 시작하세요</p>
          </div>
        ) : tab === 'topic' ? (
          <TopicGraph
            topics={data.topics}
            papers={data.papers}
            onNodeClick={handleNodeClick}
          />
        ) : (
          <ComponentGraph
            components={allComponents}
            papers={data.papers}
            topics={data.topics}
            onNodeClick={handleNodeClick}
          />
        )}
      </div>

      {/* ── Modals ── */}
      {clickedNode && (
        <NodeModal node={clickedNode} onClose={() => setClickedNode(null)} onDelete={handleDelete} />
      )}
      {showAddTopic && (
        <AddTopicModal onAdd={handleAddTopic} onClose={() => setShowAddTopic(false)} />
      )}
      {showAddPaper && (
        <AddPaperModal
          topics={data.topics}
          onAdd={handleAddPaper}
          onClose={() => setShowAddPaper(false)}
        />
      )}
    </div>
  )
}
