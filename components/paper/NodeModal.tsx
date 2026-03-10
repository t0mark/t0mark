'use client'

import { useState } from 'react'
import { X, Trash2, Pencil, Plus } from 'lucide-react'
import type { ClickedNode, Topic, Paper, ComponentRelation } from '@/data/paperStore'

interface Props {
  node: ClickedNode
  topics: Topic[]
  allComponentNames: string[]
  componentRelations: ComponentRelation[]
  onClose: () => void
  onDelete?: () => void
  onUpdate?: (updated: Topic | Paper) => void
  onUpdateRelations?: (relations: ComponentRelation[]) => void
}

const INPUT = 'w-full px-3 py-2 text-sm border border-border rounded-lg bg-bg-light focus:outline-none focus:border-accent-industry transition-colors'
const TEXTAREA = INPUT + ' resize-none'

function isDescendant(target: string, ancestor: string, relations: ComponentRelation[]): boolean {
  return relations
    .filter((r) => r.parent === ancestor)
    .some((r) => r.child === target || isDescendant(target, r.child, relations))
}

export default function NodeModal({ node, topics, allComponentNames, componentRelations, onClose, onDelete, onUpdate, onUpdateRelations }: Props) {
  const [confirming, setConfirming] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  // Topic edit state
  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')

  // Paper edit state
  const [editTopicId, setEditTopicId] = useState('')
  const [editTitle, setEditTitle] = useState('')
  const [editYear, setEditYear] = useState(0)
  const [editAuthors, setEditAuthors] = useState('')
  const [editVenue, setEditVenue] = useState('')
  const [editSummary, setEditSummary] = useState('')
  const [editProblem, setEditProblem] = useState('')
  const [editMethod, setEditMethod] = useState('')
  const [editResults, setEditResults] = useState('')
  const [editLimitations, setEditLimitations] = useState('')
  const [editComponents, setEditComponents] = useState<string[]>([])
  const [editCodeUrl, setEditCodeUrl] = useState('')
  const [compInput, setCompInput] = useState('')

  const canDelete = node.type === 'paper' || node.type === 'topic'
  const canEdit = node.type === 'paper' || node.type === 'topic'

  const startEdit = () => {
    if (node.type === 'topic') {
      setEditName(node.data.name)
      setEditDescription(node.data.description)
    } else if (node.type === 'paper') {
      setEditTopicId(node.data.topicId)
      setEditTitle(node.data.title)
      setEditYear(node.data.year)
      setEditAuthors(node.data.authors)
      setEditVenue(node.data.venue)
      setEditSummary(node.data.summary)
      setEditProblem(node.data.problem)
      setEditMethod(node.data.method)
      setEditResults(node.data.results)
      setEditLimitations(node.data.limitations)
      setEditComponents([...node.data.components])
      setEditCodeUrl(node.data.codeUrl)
    }
    setConfirming(false)
    setIsEditing(true)
  }

  const handleSave = () => {
    if (node.type === 'topic') {
      if (!editName.trim()) return
      onUpdate?.({ ...node.data, name: editName.trim(), description: editDescription.trim() })
    } else if (node.type === 'paper') {
      if (!editTitle.trim()) return
      onUpdate?.({
        ...node.data,
        topicId: editTopicId,
        title: editTitle.trim(),
        year: editYear,
        authors: editAuthors.trim(),
        venue: editVenue.trim(),
        summary: editSummary.trim(),
        problem: editProblem.trim(),
        method: editMethod.trim(),
        results: editResults.trim(),
        limitations: editLimitations.trim(),
        components: editComponents,
        codeUrl: editCodeUrl.trim(),
      })
    }
    setIsEditing(false)
  }

  const addComponent = () => {
    const trimmed = compInput.trim()
    if (trimmed && !editComponents.includes(trimmed)) {
      setEditComponents([...editComponents, trimmed])
    }
    setCompInput('')
  }

  const removeComponent = (c: string) => setEditComponents(editComponents.filter((x) => x !== c))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={isEditing ? undefined : onClose} />
      <div className="relative bg-white rounded-2xl shadow-float w-full max-w-2xl max-h-[88vh] overflow-hidden flex flex-col">

        {/* Header */}
        <div className="flex items-start justify-between p-6 pb-4 border-b border-border shrink-0">
          <div className="flex-1 min-w-0 pr-4">
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
            {isEditing ? (
              <>
                <button
                  onClick={handleSave}
                  className="px-3 py-1.5 text-xs font-medium text-white bg-accent-industry rounded-lg hover:opacity-90 transition-opacity"
                >
                  Save
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1.5 text-xs text-text-light hover:text-primary transition-colors"
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                {canEdit && (
                  <button
                    onClick={startEdit}
                    className="p-1.5 rounded-lg hover:bg-bg-light text-text-light hover:text-primary transition-colors"
                    title="Edit"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                )}
                {canDelete && !confirming && (
                  <button
                    onClick={() => setConfirming(true)}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-text-light hover:text-red-500 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-bg-light">
                  <X className="w-5 h-5 text-text-light" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Delete confirm banner */}
        {confirming && (
          <div className="bg-red-50 border-b border-red-100 px-6 py-3 flex items-center justify-between shrink-0">
            <p className="text-sm text-red-700 font-medium">
              {node.type === 'topic'
                ? 'All papers linked to this topic will also be deleted. Continue?'
                : 'Delete this paper?'}
            </p>
            <div className="flex gap-2 ml-4 shrink-0">
              <button
                onClick={() => setConfirming(false)}
                className="px-3 py-1 text-xs text-text-light hover:text-primary transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => { onDelete?.(); onClose() }}
                className="px-3 py-1 text-xs font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        )}

        {/* Body */}
        <div className="overflow-y-auto p-6 space-y-5">

          {/* ── TOPIC ── */}
          {node.type === 'topic' && (
            isEditing ? (
              <div className="space-y-4">
                <FormField label="Name *">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className={INPUT}
                    autoFocus
                  />
                </FormField>
                <FormField label="Description">
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    rows={3}
                    className={TEXTAREA}
                  />
                </FormField>
              </div>
            ) : (
              <>
                <Field label="Name" value={node.data.name} />
                <Field label="Description" value={node.data.description || '—'} />
              </>
            )
          )}

          {/* ── COMPONENT ── */}
          {node.type === 'component' && (() => {
            const currentParent = componentRelations.find((r) => r.child === node.name)?.parent ?? ''
            const children = componentRelations.filter((r) => r.parent === node.name).map((r) => r.child)
            const selectableParents = allComponentNames.filter(
              (c) => c !== node.name && !isDescendant(c, node.name, componentRelations)
            )

            const handleParentChange = (newParent: string) => {
              let next = componentRelations.filter((r) => r.child !== node.name)
              if (newParent) next = [...next, { parent: newParent, child: node.name }]
              onUpdateRelations?.(next)
            }

            return (
              <>
                <div className="space-y-4">
                  <FormField label="Parent Component">
                    <select value={currentParent} onChange={(e) => handleParentChange(e.target.value)} className={INPUT}>
                      <option value="">— None —</option>
                      {selectableParents.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </FormField>

                  {children.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-text-light uppercase tracking-wider mb-2">Children</p>
                      <div className="flex flex-wrap gap-2">
                        {children.map((c) => (
                          <span key={c} className="px-2.5 py-1 bg-purple-50 border border-purple-200 rounded-full text-xs text-purple-700 font-medium">{c}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <hr className="border-border" />

                <div>
                  <p className="text-xs font-semibold text-text-light uppercase tracking-wider mb-2">Papers ({node.papers.length})</p>
                  {node.papers.length > 0 ? (
                    <div className="space-y-2">
                      {node.papers.map((p) => (
                        <div key={p.id} className="p-3 bg-bg-light rounded-lg border border-border">
                          <p className="text-sm font-medium text-primary">{p.title}</p>
                          <p className="text-xs text-text-light mt-0.5">{p.year} · {p.venue}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-text-light">—</p>
                  )}
                </div>
              </>
            )
          })()}

          {/* ── PAPER ── */}
          {node.type === 'paper' && (
            isEditing ? (
              <div className="space-y-6">
                <section>
                  <SectionTitle>Properties</SectionTitle>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField label="Topic *">
                      <select value={editTopicId} onChange={(e) => setEditTopicId(e.target.value)} className={INPUT}>
                        {topics.map((t) => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </select>
                    </FormField>
                    <FormField label="Year">
                      <input
                        type="number"
                        value={editYear}
                        onChange={(e) => setEditYear(Number(e.target.value))}
                        className={INPUT}
                        min={1900}
                        max={2099}
                      />
                    </FormField>
                    <FormField label="Title *" className="col-span-2">
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className={INPUT}
                        autoFocus
                      />
                    </FormField>
                    <FormField label="Authors">
                      <input
                        type="text"
                        value={editAuthors}
                        onChange={(e) => setEditAuthors(e.target.value)}
                        className={INPUT}
                      />
                    </FormField>
                    <FormField label="Venue">
                      <input
                        type="text"
                        value={editVenue}
                        onChange={(e) => setEditVenue(e.target.value)}
                        className={INPUT}
                      />
                    </FormField>
                  </div>
                </section>

                <hr className="border-border" />

                <section>
                  <SectionTitle>Content</SectionTitle>
                  <div className="space-y-4">
                    <FormField label="Summary">
                      <textarea value={editSummary} onChange={(e) => setEditSummary(e.target.value)} rows={3} className={TEXTAREA} />
                    </FormField>
                    <FormField label="Problem">
                      <textarea value={editProblem} onChange={(e) => setEditProblem(e.target.value)} rows={2} className={TEXTAREA} />
                    </FormField>
                    <FormField label="Method">
                      <textarea value={editMethod} onChange={(e) => setEditMethod(e.target.value)} rows={2} className={TEXTAREA} />
                    </FormField>
                    <FormField label="Results">
                      <textarea value={editResults} onChange={(e) => setEditResults(e.target.value)} rows={2} className={TEXTAREA} />
                    </FormField>
                    <FormField label="Limitations">
                      <textarea value={editLimitations} onChange={(e) => setEditLimitations(e.target.value)} rows={2} className={TEXTAREA} />
                    </FormField>
                    <FormField label="Component">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={compInput}
                          onChange={(e) => setCompInput(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addComponent() } }}
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
                      {editComponents.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {editComponents.map((c) => (
                            <span
                              key={c}
                              className="flex items-center gap-1.5 px-2.5 py-1 bg-bg-light border border-border rounded-full text-xs text-text-muted"
                            >
                              {c}
                              <button type="button" onClick={() => removeComponent(c)}>
                                <X className="w-3 h-3 hover:text-red-500 transition-colors" />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </FormField>
                    <FormField label="Code URL">
                      <input
                        type="url"
                        value={editCodeUrl}
                        onChange={(e) => setEditCodeUrl(e.target.value)}
                        placeholder="https://github.com/..."
                        className={INPUT}
                      />
                    </FormField>
                  </div>
                </section>
              </div>
            ) : (
              <>
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
                    <div>
                      <dt className="text-xs font-semibold text-text-light uppercase tracking-wider mb-1">Code URL</dt>
                      <dd className="text-sm text-text-muted">
                        {node.data.codeUrl ? (
                          <a href={node.data.codeUrl} target="_blank" rel="noreferrer" className="text-accent-industry hover:underline break-all">
                            {node.data.codeUrl}
                          </a>
                        ) : '—'}
                      </dd>
                    </div>
                  </div>
                </section>
              </>
            )
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
