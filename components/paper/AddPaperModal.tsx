'use client'

import { useState } from 'react'
import { X, Plus, Trash2 } from 'lucide-react'
import type { Topic, Paper } from '@/data/paperStore'

interface Props {
  topics: Topic[]
  onAdd: (paper: Omit<Paper, 'id'>) => void
  onClose: () => void
}

const INPUT = 'w-full px-3 py-2 text-sm border border-border rounded-lg bg-bg-light focus:outline-none focus:border-accent-industry transition-colors'
const TEXTAREA = INPUT + ' resize-none'

export default function AddPaperModal({ topics, onAdd, onClose }: Props) {
  const [topicId, setTopicId] = useState(topics[0]?.id ?? '')
  const [title, setTitle] = useState('')
  const [year, setYear] = useState(new Date().getFullYear())
  const [authors, setAuthors] = useState('')
  const [venue, setVenue] = useState('')
  const [summary, setSummary] = useState('')
  const [problem, setProblem] = useState('')
  const [method, setMethod] = useState('')
  const [results, setResults] = useState('')
  const [limitations, setLimitations] = useState('')
  const [codeUrl, setCodeUrl] = useState('')
  const [components, setComponents] = useState<string[]>([])
  const [compInput, setCompInput] = useState('')

  const addComponent = () => {
    const trimmed = compInput.trim()
    if (trimmed && !components.includes(trimmed)) {
      setComponents([...components, trimmed])
    }
    setCompInput('')
  }

  const removeComponent = (c: string) => setComponents(components.filter((x) => x !== c))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !topicId) return
    onAdd({
      topicId,
      title: title.trim(),
      year,
      authors: authors.trim(),
      venue: venue.trim(),
      summary: summary.trim(),
      problem: problem.trim(),
      method: method.trim(),
      results: results.trim(),
      limitations: limitations.trim(),
      codeUrl: codeUrl.trim(),
      components,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-float w-full max-w-2xl max-h-[92vh] overflow-hidden flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4 border-b border-border shrink-0">
          <h2 className="text-base font-bold text-primary">논문 추가</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-bg-light">
            <X className="w-5 h-5 text-text-light" />
          </button>
        </div>

        {/* Scrollable form */}
        <form onSubmit={handleSubmit} className="overflow-y-auto flex flex-col flex-1">
          <div className="p-6 space-y-6">

            {/* ── Properties ── */}
            <section>
              <SectionTitle>기본 정보</SectionTitle>
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Topic *">
                  <select value={topicId} onChange={(e) => setTopicId(e.target.value)} className={INPUT}>
                    {topics.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </FormField>
                <FormField label="발행 연도">
                  <input
                    type="number"
                    value={year}
                    onChange={(e) => setYear(Number(e.target.value))}
                    className={INPUT}
                    min={1900}
                    max={2099}
                  />
                </FormField>
                <FormField label="제목 *" className="col-span-2">
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="논문 제목"
                    className={INPUT}
                    autoFocus
                    required
                  />
                </FormField>
                <FormField label="저자">
                  <input
                    type="text"
                    value={authors}
                    onChange={(e) => setAuthors(e.target.value)}
                    placeholder="저자1, 저자2, ..."
                    className={INPUT}
                  />
                </FormField>
                <FormField label="게재지">
                  <input
                    type="text"
                    value={venue}
                    onChange={(e) => setVenue(e.target.value)}
                    placeholder="예: CVPR 2024"
                    className={INPUT}
                  />
                </FormField>
              </div>
            </section>

            <hr className="border-border" />

            {/* ── Content ── */}
            <section>
              <SectionTitle>내용</SectionTitle>
              <div className="space-y-4">
                <FormField label="3줄 요약">
                  <textarea
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    rows={3}
                    placeholder="논문의 핵심 내용을 3문장으로 요약..."
                    className={TEXTAREA}
                  />
                </FormField>
                <FormField label="문제점">
                  <textarea
                    value={problem}
                    onChange={(e) => setProblem(e.target.value)}
                    rows={2}
                    placeholder="이 논문이 다루는 문제는 무엇인가?"
                    className={TEXTAREA}
                  />
                </FormField>
                <FormField label="제안 방법">
                  <textarea
                    value={method}
                    onChange={(e) => setMethod(e.target.value)}
                    rows={2}
                    placeholder="제안하는 방법 또는 접근 방식..."
                    className={TEXTAREA}
                  />
                </FormField>
                <FormField label="주요 결과">
                  <textarea
                    value={results}
                    onChange={(e) => setResults(e.target.value)}
                    rows={2}
                    placeholder="핵심 결과 및 성과..."
                    className={TEXTAREA}
                  />
                </FormField>
                <FormField label="비판 및 한계">
                  <textarea
                    value={limitations}
                    onChange={(e) => setLimitations(e.target.value)}
                    rows={2}
                    placeholder="한계점 및 비판..."
                    className={TEXTAREA}
                  />
                </FormField>
                <FormField label="Component">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={compInput}
                      onChange={(e) => setCompInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') { e.preventDefault(); addComponent() }
                      }}
                      placeholder="예: Transformer, YOLO head... (Enter로 추가)"
                      className={INPUT}
                    />
                    <button
                      type="button"
                      onClick={addComponent}
                      className="px-3 py-2 bg-bg-light border border-border rounded-lg hover:bg-border transition-colors shrink-0"
                    >
                      <Plus className="w-4 h-4 text-text-muted" />
                    </button>
                  </div>
                  {components.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {components.map((c) => (
                        <span
                          key={c}
                          className="flex items-center gap-1.5 px-2.5 py-1 bg-bg-light border border-border rounded-full text-xs text-text-muted"
                        >
                          {c}
                          <button type="button" onClick={() => removeComponent(c)}>
                            <Trash2 className="w-3 h-3 hover:text-red-500 transition-colors" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </FormField>
                <FormField label="Code URL">
                  <input
                    type="url"
                    value={codeUrl}
                    onChange={(e) => setCodeUrl(e.target.value)}
                    placeholder="https://github.com/..."
                    className={INPUT}
                  />
                </FormField>
              </div>
            </section>
          </div>

          {/* Sticky footer */}
          <div className="flex justify-end gap-3 px-6 py-4 border-t border-border bg-white shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-text-light hover:text-primary transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={!title.trim() || !topicId}
              className="px-4 py-2 text-sm font-medium text-white bg-accent-industry rounded-lg disabled:opacity-40 hover:opacity-90 transition-opacity"
            >
              추가
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xs font-bold text-primary uppercase tracking-widest mb-3">{children}</h3>
  )
}

function FormField({ label, children, className = '' }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label className="block text-xs font-semibold text-text-light uppercase tracking-wider mb-1.5">
        {label}
      </label>
      {children}
    </div>
  )
}
