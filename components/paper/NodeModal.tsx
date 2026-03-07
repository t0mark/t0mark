'use client'

import { useState } from 'react'
import { X, Trash2 } from 'lucide-react'
import type { ClickedNode } from '@/data/paperStore'

interface Props {
  node: ClickedNode
  onClose: () => void
  onDelete?: () => void
}

export default function NodeModal({ node, onClose, onDelete }: Props) {
  const [confirming, setConfirming] = useState(false)

  const canDelete = node.type === 'paper' || node.type === 'topic'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-float w-full max-w-2xl max-h-[88vh] overflow-hidden flex flex-col">

        {/* Header */}
        <div className="flex items-start justify-between p-6 pb-4 border-b border-border shrink-0">
          <div className="flex-1 min-w-0 pr-4">
            <span className={`inline-block text-xs font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full mb-2 ${
              node.type === 'topic'
                ? 'bg-purple-100 text-purple-700'
                : node.type === 'component'
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-sky-100 text-sky-700'
            }`}>
              {node.type === 'topic' ? 'Topic' : node.type === 'component' ? 'Component' : '논문'}
            </span>
            <h2 className="text-lg font-bold text-primary leading-snug">
              {node.type === 'topic'
                ? node.data.name
                : node.type === 'paper'
                ? node.data.title
                : node.name}
            </h2>
            {node.type === 'paper' && node.topic && (
              <p className="text-sm text-text-light mt-0.5">{node.topic.name}</p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {canDelete && !confirming && (
              <button
                onClick={() => setConfirming(true)}
                className="p-1.5 rounded-lg hover:bg-red-50 text-text-light hover:text-red-500 transition-colors"
                title="삭제"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-bg-light">
              <X className="w-5 h-5 text-text-light" />
            </button>
          </div>
        </div>

        {/* 삭제 확인 배너 */}
        {confirming && (
          <div className="bg-red-50 border-b border-red-100 px-6 py-3 flex items-center justify-between shrink-0">
            <p className="text-sm text-red-700 font-medium">
              {node.type === 'topic'
                ? 'Topic과 연결된 논문이 모두 삭제됩니다. 계속하시겠습니까?'
                : '이 논문을 삭제하시겠습니까?'}
            </p>
            <div className="flex gap-2 ml-4 shrink-0">
              <button
                onClick={() => setConfirming(false)}
                className="px-3 py-1 text-xs text-text-light hover:text-primary transition-colors"
              >
                취소
              </button>
              <button
                onClick={() => { onDelete?.(); onClose() }}
                className="px-3 py-1 text-xs font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors"
              >
                삭제
              </button>
            </div>
          </div>
        )}

        {/* Body */}
        <div className="overflow-y-auto p-6 space-y-5">

          {/* ── TOPIC ── */}
          {node.type === 'topic' && (
            <>
              <Field label="Name" value={node.data.name} />
              <Field label="Description" value={node.data.description || '—'} />
            </>
          )}

          {/* ── COMPONENT ── */}
          {node.type === 'component' && (
            <>
              <p className="text-sm text-text-muted">
                이 Component를 사용하는 논문: {node.papers.length}개
              </p>
              <div className="space-y-2">
                {node.papers.map((p) => (
                  <div key={p.id} className="p-3 bg-bg-light rounded-lg border border-border">
                    <p className="text-sm font-medium text-primary">{p.title}</p>
                    <p className="text-xs text-text-light mt-0.5">{p.year} · {p.venue}</p>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ── PAPER ── */}
          {node.type === 'paper' && (
            <>
              {/* Properties */}
              <section>
                <SectionTitle>Properties</SectionTitle>
                <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                  <Field label="Title" value={node.data.title} className="col-span-2" />
                  <Field label="Year" value={String(node.data.year)} />
                  <Field label="Venue" value={node.data.venue || '—'} />
                  <Field label="Authors" value={node.data.authors || '—'} className="col-span-2" />
                </div>
              </section>

              <hr className="border-border" />

              {/* Content */}
              <section>
                <SectionTitle>Content</SectionTitle>
                <div className="space-y-4">
                  <Field label="Summary" value={node.data.summary || '—'} />
                  <Field label="Problem" value={node.data.problem || '—'} />
                  <Field label="Method" value={node.data.method || '—'} />
                  <Field label="Results" value={node.data.results || '—'} />
                  <Field label="Limitations" value={node.data.limitations || '—'} />
                  <Field
                    label="Components"
                    value={node.data.components.length > 0 ? node.data.components.join(', ') : '—'}
                  />
                </div>
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xs font-bold text-primary uppercase tracking-widest mb-3">{children}</h3>
  )
}

function Field({ label, value, className = '' }: { label: string; value: string; className?: string }) {
  return (
    <div className={className}>
      <dt className="text-xs font-semibold text-text-light uppercase tracking-wider mb-1">{label}</dt>
      <dd className="text-sm text-text-muted leading-relaxed whitespace-pre-wrap">{value}</dd>
    </div>
  )
}
