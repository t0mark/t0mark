'use client'

import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type { CalendarData, CategoryData, TodoItem } from '@/types/calendar'
import DDayCards from './DDayCards'
import TaskList from './TaskList'
import ProgressBars from './ProgressBars'
import TodoList from './TodoList'
import { Pencil, X, Plus, Trash2, GripVertical } from 'lucide-react'

type EditSection = 'dday' | 'tasks' | 'todos' | null
type Section = 'tasks' | 'todos'

export default function CalendarClient() {
  const [data, setData] = useState<CalendarData | null>(null)
  const [error, setError] = useState(false)
  const [editSection, setEditSection] = useState<EditSection>(null)
  const [draft, setDraft] = useState<CalendarData | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/calendar')
      .then((res) => { if (!res.ok) throw new Error(); return res.json() })
      .then(setData)
      .catch(() => setError(true))
  }, [])

  const openEdit = (section: EditSection) => {
    if (!data || !section) return
    setDraft(JSON.parse(JSON.stringify(data)))
    setEditSection(section)
  }

  const closeEdit = () => {
    setEditSection(null)
    setDraft(null)
  }

  const save = async () => {
    if (!draft) return
    setSaving(true)
    try {
      const res = await fetch('/api/calendar', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft),
      })
      if (!res.ok) throw new Error()
      setData(draft)
      closeEdit()
    } catch {
      alert('저장에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  // ── D-DAY mutations ──────────────────────────────────────────────────────

  const addDDay = () => {
    if (!draft) return
    const today = new Date().toISOString().split('T')[0]
    let name = '새 항목'
    let i = 1
    while (name in draft.dDay) name = `새 항목 ${i++}`
    setDraft({ ...draft, dDay: { ...draft.dDay, [name]: { targetDate: today } } })
  }

  const updateDDayName = (idx: number, newName: string) => {
    if (!draft) return
    const entries = Object.entries(draft.dDay)
    entries[idx] = [newName, entries[idx][1]]
    setDraft({ ...draft, dDay: Object.fromEntries(entries) })
  }

  const updateDDayDate = (idx: number, date: string) => {
    if (!draft) return
    const entries = Object.entries(draft.dDay)
    entries[idx] = [entries[idx][0], { targetDate: date }]
    setDraft({ ...draft, dDay: Object.fromEntries(entries) })
  }

  const deleteDDay = (idx: number) => {
    if (!draft) return
    const entries = Object.entries(draft.dDay)
    entries.splice(idx, 1)
    setDraft({ ...draft, dDay: Object.fromEntries(entries) })
  }

  // ── Category mutations (tasks / todos 공통) ───────────────────────────────

  const sectionEntries = (d: CalendarData, s: Section) =>
    Object.entries(d[s]) as [string, CategoryData][]

  const fromEntries = (entries: [string, CategoryData][]) =>
    Object.fromEntries(entries) as Record<string, CategoryData>

  const addCategory = (section: Section) => {
    if (!draft) return
    let name = '새 카테고리'
    let i = 1
    while (name in draft[section]) name = `새 카테고리 ${i++}`
    setDraft({ ...draft, [section]: { ...draft[section], [name]: { icon: '📌', items: [] } } })
  }

  const updateCategoryName = (section: Section, catIdx: number, newName: string) => {
    if (!draft) return
    const entries = sectionEntries(draft, section)
    entries[catIdx] = [newName, entries[catIdx][1]]
    setDraft({ ...draft, [section]: fromEntries(entries) })
  }

  const updateCategoryIcon = (section: Section, catIdx: number, icon: string) => {
    if (!draft) return
    const entries = sectionEntries(draft, section)
    entries[catIdx] = [entries[catIdx][0], { ...entries[catIdx][1], icon }]
    setDraft({ ...draft, [section]: fromEntries(entries) })
  }

  const deleteCategory = (section: Section, catIdx: number) => {
    if (!draft) return
    const entries = sectionEntries(draft, section)
    entries.splice(catIdx, 1)
    setDraft({ ...draft, [section]: fromEntries(entries) })
  }

  const addItem = (section: Section, catIdx: number) => {
    if (!draft) return
    const entries = sectionEntries(draft, section)
    const [name, cat] = entries[catIdx]
    const newItem = section === 'todos' ? { text: '' } as unknown as string : ''
    entries[catIdx] = [name, { ...cat, items: [...cat.items, newItem] }]
    setDraft({ ...draft, [section]: fromEntries(entries) })
  }

  const updateItem = (section: Section, catIdx: number, itemIdx: number, value: string) => {
    if (!draft) return
    const entries = sectionEntries(draft, section)
    const [name, cat] = entries[catIdx]
    const items = [...cat.items]
    if (section === 'todos') {
      const existing = items[itemIdx] as unknown as TodoItem
      items[itemIdx] = { ...existing, text: value } as unknown as string
    } else {
      items[itemIdx] = value
    }
    entries[catIdx] = [name, { ...cat, items }]
    setDraft({ ...draft, [section]: fromEntries(entries) })
  }

  const updateItemDeadline = (catIdx: number, itemIdx: number, deadline: string | undefined) => {
    if (!draft) return
    const entries = sectionEntries(draft, 'todos')
    const [name, cat] = entries[catIdx]
    const items = [...cat.items]
    const existing = items[itemIdx] as unknown as TodoItem
    items[itemIdx] = (deadline ? { ...existing, deadline } : { text: existing.text }) as unknown as string
    entries[catIdx] = [name, { ...cat, items }]
    setDraft({ ...draft, todos: fromEntries(entries) })
  }

  const deleteItem = (section: Section, catIdx: number, itemIdx: number) => {
    if (!draft) return
    const entries = sectionEntries(draft, section)
    const [name, cat] = entries[catIdx]
    entries[catIdx] = [name, { ...cat, items: cat.items.filter((_, i) => i !== itemIdx) }]
    setDraft({ ...draft, [section]: fromEntries(entries) })
  }

  const reorderCategories = (section: Section, fromIdx: number, toIdx: number) => {
    if (!draft || fromIdx === toIdx) return
    const entries = sectionEntries(draft, section)
    const [moved] = entries.splice(fromIdx, 1)
    entries.splice(toIdx, 0, moved)
    setDraft({ ...draft, [section]: fromEntries(entries) })
  }

  const reorderItems = (section: Section, catIdx: number, fromIdx: number, toIdx: number) => {
    if (!draft || fromIdx === toIdx) return
    const entries = sectionEntries(draft, section)
    const [name, cat] = entries[catIdx]
    const items = [...cat.items]
    const [moved] = items.splice(fromIdx, 1)
    items.splice(toIdx, 0, moved)
    entries[catIdx] = [name, { ...cat, items }]
    setDraft({ ...draft, [section]: fromEntries(entries) })
  }

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <>
      <main className="max-w-main mx-auto p-5 2xl:h-[calc(100vh-64px)] 2xl:overflow-hidden">
        <div className="grid gap-5 grid-cols-1 2xl:grid-cols-[14rem_1fr_13rem] 2xl:h-full">
        {/* ===== 가운데 Google Calendar ===== */}
        <div className="order-1 2xl:order-2 2xl:col-start-2 2xl:row-start-1 flex flex-col gap-3 min-w-0">
          <a
            href="https://calendar.google.com/"
            target="_blank"
            rel="noreferrer"
            className="text-sm font-semibold text-primary hover:text-primary-light transition-colors flex items-center gap-1.5"
          >
            📅 Google Calendar
          </a>
          <div className="flex-1 min-h-[780px] bg-white rounded-xl shadow-card overflow-hidden">
            <iframe
              src="https://calendar.google.com/calendar/embed?height=600&wkst=1&ctz=Asia%2FSeoul&showPrint=0&src=YTk2NTM2MDA5QGdtYWlsLmNvbQ&src=a28uc291dGhfa29yZWEjaG9saWRheUBncm91cC52LmNhbGVuZGFyLmdvb2dsZS5jb20&color=%237986cb&color=%230b8043"
              width="100%"
              height="100%"
              frameBorder={0}
              scrolling="no"
              title="Google Calendar"
            />
          </div>
        </div>

        {/* ===== 왼쪽 사이드바 ===== */}
        <aside className="order-2 2xl:order-1 2xl:col-start-1 2xl:row-start-1 flex flex-col gap-4 overflow-y-auto">
          <div className="bg-white rounded-xl p-4 shadow-card">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-bold text-primary uppercase tracking-wide">D-DAY</h2>
              {data && (
                <button
                  onClick={() => openEdit('dday')}
                  className="p-1 text-text-muted hover:text-primary transition-colors rounded"
                  title="D-DAY 편집"
                >
                  <Pencil className="w-3 h-3" />
                </button>
              )}
            </div>
            {error && <p className="text-xs text-red-400">데이터 로드 실패</p>}
            {!data && !error && <div className="loading-spinner scale-75" />}
            {data?.dDay && <DDayCards dDay={data.dDay} />}
          </div>

          <div className="bg-white rounded-xl p-4 shadow-card">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-bold text-primary uppercase tracking-wide">Tasks</h2>
              {data && (
                <button
                  onClick={() => openEdit('tasks')}
                  className="p-1 text-text-muted hover:text-primary transition-colors rounded"
                  title="Tasks 편집"
                >
                  <Pencil className="w-3 h-3" />
                </button>
              )}
            </div>
            {data?.tasks && <TaskList tasks={data.tasks} />}
          </div>

          <div className="bg-white rounded-xl p-4 shadow-card">
            <ProgressBars />
          </div>
        </aside>

        {/* ===== 오른쪽 TODO ===== */}
        <aside className="order-3 2xl:col-start-3 2xl:row-start-1 overflow-y-auto">
          <div className="bg-white rounded-xl p-4 shadow-card">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-bold text-primary uppercase tracking-wide">TODO</h2>
              {data && (
                <button
                  onClick={() => openEdit('todos')}
                  className="p-1 text-text-muted hover:text-primary transition-colors rounded"
                  title="TODO 편집"
                >
                  <Pencil className="w-3 h-3" />
                </button>
              )}
            </div>
            {data?.todos && <TodoList todos={data.todos} />}
          </div>
        </aside>

        </div>
        <div className="scroll-progress">
          <div className="scroll-progress-bar" id="scrollBar" />
        </div>
      </main>

      {/* ===== D-DAY 편집 패널 ===== */}
      {editSection === 'dday' && draft && (
        <EditPanel title="D-DAY" saving={saving} onSave={save} onClose={closeEdit}>
          <div className="flex justify-end mb-3">
            <button
              onClick={addDDay}
              className="flex items-center gap-1 text-xs text-accent-industry hover:underline"
            >
              <Plus className="w-3 h-3" /> 추가
            </button>
          </div>
          <div className="space-y-2">
            {Object.entries(draft.dDay).map(([name, item], idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  value={name}
                  onChange={(e) => updateDDayName(idx, e.target.value)}
                  className="flex-1 min-w-0 text-xs border border-border rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="이름"
                />
                <input
                  type="date"
                  value={item.targetDate}
                  onChange={(e) => updateDDayDate(idx, e.target.value)}
                  className="text-xs border border-border rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <button
                  onClick={() => deleteDDay(idx)}
                  className="text-gray-300 hover:text-red-400 transition-colors shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </EditPanel>
      )}

      {/* ===== Tasks 편집 패널 ===== */}
      {editSection === 'tasks' && draft && (
        <EditPanel title="Tasks" saving={saving} onSave={save} onClose={closeEdit}>
          <CategoryEditBody
            section="tasks"
            draft={draft}
            onAddCategory={() => addCategory('tasks')}
            onUpdateCategoryName={(ci, v) => updateCategoryName('tasks', ci, v)}
            onUpdateCategoryIcon={(ci, v) => updateCategoryIcon('tasks', ci, v)}
            onDeleteCategory={(ci) => deleteCategory('tasks', ci)}
            onAddItem={(ci) => addItem('tasks', ci)}
            onUpdateItem={(ci, ii, v) => updateItem('tasks', ci, ii, v)}
            onDeleteItem={(ci, ii) => deleteItem('tasks', ci, ii)}
            onReorderCategories={(from, to) => reorderCategories('tasks', from, to)}
            onReorderItems={(ci, from, to) => reorderItems('tasks', ci, from, to)}
          />
        </EditPanel>
      )}

      {/* ===== TODO 편집 패널 ===== */}
      {editSection === 'todos' && draft && (
        <EditPanel title="TODO" saving={saving} onSave={save} onClose={closeEdit}>
          <CategoryEditBody
            section="todos"
            draft={draft}
            onAddCategory={() => addCategory('todos')}
            onUpdateCategoryName={(ci, v) => updateCategoryName('todos', ci, v)}
            onUpdateCategoryIcon={(ci, v) => updateCategoryIcon('todos', ci, v)}
            onDeleteCategory={(ci) => deleteCategory('todos', ci)}
            onAddItem={(ci) => addItem('todos', ci)}
            onUpdateItem={(ci, ii, v) => updateItem('todos', ci, ii, v)}
            onUpdateItemDeadline={(ci, ii, d) => updateItemDeadline(ci, ii, d)}
            onDeleteItem={(ci, ii) => deleteItem('todos', ci, ii)}
            onReorderCategories={(from, to) => reorderCategories('todos', from, to)}
            onReorderItems={(ci, from, to) => reorderItems('todos', ci, from, to)}
          />
        </EditPanel>
      )}
    </>
  )
}

// ── 슬라이드 편집 패널 래퍼 ──────────────────────────────────────────────────

interface EditPanelProps {
  title: string
  saving: boolean
  onSave: () => void
  onClose: () => void
  children: ReactNode
}

function EditPanel({ title, saving, onSave, onClose, children }: EditPanelProps) {
  return (
    <div className="fixed inset-0 z-[1001] flex">
      <div className="flex-1 bg-black/30" onClick={onClose} />
      <div className="w-[420px] bg-white h-full shadow-2xl flex flex-col border-l border-border">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <h2 className="text-sm font-bold text-primary">{title} 편집</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={onSave}
              disabled={saving}
              className="text-xs font-semibold bg-primary text-white px-3 py-1.5 rounded-lg hover:bg-primary-light disabled:opacity-50 transition-colors"
            >
              {saving ? '저장 중...' : '저장'}
            </button>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-5">
          {children}
        </div>
      </div>
    </div>
  )
}

// ── 카테고리 편집 바디 (Tasks / TODO 공용) ────────────────────────────────────

interface CategoryEditBodyProps {
  section: Section
  draft: CalendarData
  onAddCategory: () => void
  onUpdateCategoryName: (catIdx: number, value: string) => void
  onUpdateCategoryIcon: (catIdx: number, value: string) => void
  onDeleteCategory: (catIdx: number) => void
  onAddItem: (catIdx: number) => void
  onUpdateItem: (catIdx: number, itemIdx: number, value: string) => void
  onUpdateItemDeadline?: (catIdx: number, itemIdx: number, deadline: string | undefined) => void
  onDeleteItem: (catIdx: number, itemIdx: number) => void
  onReorderCategories: (fromIdx: number, toIdx: number) => void
  onReorderItems: (catIdx: number, fromIdx: number, toIdx: number) => void
}

function getItemText(item: string): string {
  if (item && typeof item === 'object' && 'text' in (item as object)) {
    return (item as unknown as TodoItem).text
  }
  return item
}

function getItemDeadline(item: string): string | undefined {
  if (item && typeof item === 'object' && 'deadline' in (item as object)) {
    return (item as unknown as TodoItem).deadline
  }
  return undefined
}

function InlineDeadlineBadge({ deadline }: { deadline: string }) {
  if (deadline === 'ASAP') return (
    <span className="shrink-0 text-[9px] font-semibold px-1 py-0.5 rounded bg-red-100 text-red-600">ASAP</span>
  )
  if (deadline === 'TYT') return (
    <span className="shrink-0 text-[9px] font-semibold px-1 py-0.5 rounded bg-gray-100 text-gray-500">TYT</span>
  )
  const d = new Date(deadline)
  return (
    <span className="shrink-0 text-[9px] font-semibold px-1 py-0.5 rounded bg-blue-50 text-blue-500">
      {d.getMonth() + 1}/{d.getDate()}
    </span>
  )
}

function CategoryEditBody({
  section, draft,
  onAddCategory, onUpdateCategoryName, onUpdateCategoryIcon,
  onDeleteCategory, onAddItem, onUpdateItem, onUpdateItemDeadline, onDeleteItem,
  onReorderCategories, onReorderItems,
}: CategoryEditBodyProps) {
  const entries = Object.entries(draft[section]) as [string, CategoryData][]

  const [dragCatIdx, setDragCatIdx] = useState<number | null>(null)
  const [overCatIdx, setOverCatIdx] = useState<number | null>(null)
  const [dragItem, setDragItem] = useState<{ ci: number; ii: number } | null>(null)
  const [overItem, setOverItem] = useState<{ ci: number; ii: number } | null>(null)

  return (
    <div>
      <div className="flex justify-end mb-3">
        <button
          onClick={onAddCategory}
          className="flex items-center gap-1 text-xs text-accent-industry hover:underline"
        >
          <Plus className="w-3 h-3" /> 카테고리 추가
        </button>
      </div>
      <div className="space-y-3">
        {entries.map(([category, catData], catIdx) => (
          <div
            key={catIdx}
            draggable
            onDragStart={(e) => { e.dataTransfer.effectAllowed = 'move'; setDragCatIdx(catIdx) }}
            onDragOver={(e) => { e.preventDefault(); setOverCatIdx(catIdx) }}
            onDrop={(e) => {
              e.preventDefault()
              if (dragCatIdx !== null) onReorderCategories(dragCatIdx, catIdx)
              setDragCatIdx(null); setOverCatIdx(null)
            }}
            onDragEnd={() => { setDragCatIdx(null); setOverCatIdx(null) }}
            className={`bg-bg-light rounded-xl p-3 transition-all ${
              overCatIdx === catIdx && dragCatIdx !== catIdx ? 'ring-2 ring-primary/40' : ''
            } ${dragCatIdx === catIdx ? 'opacity-40' : ''}`}
          >
            {/* 카테고리 헤더 */}
            <div className="flex items-center gap-2 mb-2">
              <GripVertical className="w-4 h-4 text-gray-300 cursor-grab shrink-0" />
              <input
                value={catData.icon}
                onChange={(e) => onUpdateCategoryIcon(catIdx, e.target.value)}
                className="w-9 text-center text-sm border border-border rounded-lg px-1 py-1 focus:outline-none"
                placeholder="📌"
              />
              <input
                value={category}
                onChange={(e) => onUpdateCategoryName(catIdx, e.target.value)}
                className="flex-1 text-xs font-semibold border border-border rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <button
                onClick={() => onDeleteCategory(catIdx)}
                className="text-gray-300 hover:text-red-400 transition-colors shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
            {/* 아이템 목록 */}
            <div className="space-y-1.5 pl-1">
              {catData.items.map((item, itemIdx) => (
                <div
                  key={itemIdx}
                  draggable
                  onDragStart={(e) => { e.stopPropagation(); e.dataTransfer.effectAllowed = 'move'; setDragItem({ ci: catIdx, ii: itemIdx }) }}
                  onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setOverItem({ ci: catIdx, ii: itemIdx }) }}
                  onDrop={(e) => {
                    e.preventDefault(); e.stopPropagation()
                    if (dragItem && dragItem.ci === catIdx) onReorderItems(catIdx, dragItem.ii, itemIdx)
                    setDragItem(null); setOverItem(null)
                  }}
                  onDragEnd={() => { setDragItem(null); setOverItem(null) }}
                  className={`flex items-center gap-2 rounded transition-all ${
                    overItem?.ci === catIdx && overItem?.ii === itemIdx && dragItem?.ii !== itemIdx
                      ? 'ring-1 ring-primary/40'
                      : ''
                  } ${dragItem?.ci === catIdx && dragItem?.ii === itemIdx ? 'opacity-40' : ''}`}
                >
                  <GripVertical className="w-3 h-3 text-gray-300 cursor-grab shrink-0" />
                  <div className="flex-1 flex flex-col gap-1 min-w-0">
                    <input
                      value={getItemText(item)}
                      onChange={(e) => onUpdateItem(catIdx, itemIdx, e.target.value)}
                      className="w-full text-xs border border-border rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary"
                      placeholder="항목"
                    />
                    {onUpdateItemDeadline && (
                      <div className="flex items-center gap-1 flex-wrap">
                        {(['ASAP', 'TYT'] as const).map((opt) => (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => onUpdateItemDeadline(catIdx, itemIdx, getItemDeadline(item) === opt ? undefined : opt)}
                            className={`text-[10px] font-semibold px-1.5 py-0.5 rounded transition-colors ${
                              getItemDeadline(item) === opt
                                ? opt === 'ASAP' ? 'bg-red-500 text-white' : 'bg-gray-500 text-white'
                                : opt === 'ASAP' ? 'bg-red-100 text-red-600 hover:bg-red-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                            }`}
                          >
                            {opt}
                          </button>
                        ))}
                        <input
                          type="date"
                          value={(() => { const d = getItemDeadline(item); return d && d !== 'ASAP' && d !== 'TYT' ? d : '' })()}
                          onChange={(e) => onUpdateItemDeadline(catIdx, itemIdx, e.target.value || undefined)}
                          className="text-[10px] border border-border rounded px-1 py-0.5 outline-none focus:border-primary text-text-muted"
                        />
                        {getItemDeadline(item) && (
                          <button
                            type="button"
                            onClick={() => onUpdateItemDeadline(catIdx, itemIdx, undefined)}
                            className="text-text-light hover:text-red-400"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => onDeleteItem(catIdx, itemIdx)}
                    className="text-gray-300 hover:text-red-400 transition-colors shrink-0"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              <button
                onClick={() => onAddItem(catIdx)}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-primary transition-colors mt-1"
              >
                <Plus className="w-3 h-3" /> 항목 추가
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
