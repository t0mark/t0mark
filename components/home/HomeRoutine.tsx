'use client'

import { useEffect, useState } from 'react'
import type { RoutineData, RoutineItem, RoutineRecurrence } from '@/types/routine'
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react'

const RECURRENCE_LABELS: Record<RoutineRecurrence, string> = {
  daily:           'Daily',
  weekly:          'Weekly',
  monthly:         'Monthly',
  'every-semester': 'Semester',
  annually:        'Annually',
}

const RECURRENCE_COLORS: Record<RoutineRecurrence, string> = {
  daily:           'bg-blue-50 text-blue-500',
  weekly:          'bg-violet-50 text-violet-500',
  monthly:         'bg-emerald-50 text-emerald-600',
  'every-semester': 'bg-orange-50 text-orange-500',
  annually:        'bg-red-50 text-red-500',
}

const RECURRENCE_OPTIONS: RoutineRecurrence[] = [
  'daily', 'weekly', 'monthly', 'every-semester', 'annually',
]

interface EditState {
  id: string
  text: string
  recurrence: RoutineRecurrence
}

function saveToServer(data: RoutineData) {
  fetch('/api/routine', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
}

export default function HomeRoutine() {
  const [data, setData] = useState<RoutineData | null>(null)
  const [error, setError] = useState(false)
  const [edit, setEdit] = useState<EditState | null>(null)
  const [adding, setAdding] = useState(false)
  const [newText, setNewText] = useState('')
  const [newRecurrence, setNewRecurrence] = useState<RoutineRecurrence>('daily')

  useEffect(() => {
    fetch('/api/routine')
      .then((res) => { if (!res.ok) throw new Error(); return res.json() })
      .then((d: RoutineData) => setData(d))
      .catch(() => setError(true))
  }, [])

  function mutate(items: RoutineItem[]) {
    if (!data) return
    const updated: RoutineData = { ...data, items }
    setData(updated)
    saveToServer(updated)
  }

  function toggleCheck(id: string) {
    if (!data) return
    mutate(data.items.map((item) =>
      item.id === id ? { ...item, checked: !item.checked } : item
    ))
  }

  function startEdit(item: RoutineItem) {
    setEdit({ id: item.id, text: item.text, recurrence: item.recurrence })
  }

  function commitEdit() {
    if (!data || !edit || !edit.text.trim()) return
    mutate(data.items.map((item) =>
      item.id === edit.id
        ? { ...item, text: edit.text.trim(), recurrence: edit.recurrence }
        : item
    ))
    setEdit(null)
  }

  function deleteItem(id: string) {
    if (!data) return
    mutate(data.items.filter((item) => item.id !== id))
  }

  function commitAdd() {
    if (!data || !newText.trim()) return
    const newItem: RoutineItem = {
      id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`,
      text: newText.trim(),
      recurrence: newRecurrence,
      checked: false,
    }
    mutate([...data.items, newItem])
    setNewText('')
    setNewRecurrence('daily')
    setAdding(false)
  }

  if (error) return <p className="text-xs text-red-400">데이터 로드 실패</p>
  if (!data) return <div className="loading-spinner scale-75" />

  return (
    <div className="bg-white rounded-xl shadow-card border border-border p-4 h-full">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-text-light">
          {data.items.filter((i) => i.checked).length}/{data.items.length}
        </span>
        <button
          onClick={() => { setAdding(true); setNewText(''); setNewRecurrence('daily') }}
          className="flex items-center gap-1 text-xs text-accent-industry hover:underline"
        >
          <Plus className="w-3 h-3" /> 추가
        </button>
      </div>

      {data.items.length === 0 && !adding && (
        <p className="text-xs text-text-light italic">항목 없음</p>
      )}

      <ul className="space-y-1">
        {data.items.map((item) => {
          const isEditing = edit?.id === item.id

          return (
            <li
              key={item.id}
              className="flex items-center gap-2 px-1 py-1.5 rounded-lg group hover:bg-bg-light transition-colors"
            >
              {/* 체크박스 */}
              <button
                onClick={() => toggleCheck(item.id)}
                className={`shrink-0 w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                  item.checked
                    ? 'bg-primary border-primary text-white'
                    : 'border-border-dark hover:border-primary'
                }`}
              >
                {item.checked && <Check className="w-2.5 h-2.5" />}
              </button>

              {isEditing ? (
                /* 편집 모드 */
                <>
                  <input
                    autoFocus
                    value={edit.text}
                    onChange={(e) => setEdit({ ...edit, text: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') commitEdit()
                      if (e.key === 'Escape') setEdit(null)
                    }}
                    className="flex-1 min-w-0 text-xs border border-primary/40 rounded px-1.5 py-0.5 outline-none"
                  />
                  <select
                    value={edit.recurrence}
                    onChange={(e) => setEdit({ ...edit, recurrence: e.target.value as RoutineRecurrence })}
                    className="text-xs border border-border rounded px-1 py-0.5 outline-none focus:border-primary text-text-muted"
                  >
                    {RECURRENCE_OPTIONS.map((r) => (
                      <option key={r} value={r}>{RECURRENCE_LABELS[r]}</option>
                    ))}
                  </select>
                  <button onClick={commitEdit} className="text-primary hover:opacity-70 transition-opacity shrink-0">
                    <Check className="w-3 h-3" />
                  </button>
                  <button onClick={() => setEdit(null)} className="text-gray-300 hover:text-gray-500 transition-colors shrink-0">
                    <X className="w-3 h-3" />
                  </button>
                </>
              ) : (
                /* 뷰 모드 */
                <>
                  <span className={`flex-1 min-w-0 text-sm transition-all ${
                    item.checked
                      ? 'line-through italic text-text-light opacity-50'
                      : 'text-text-muted'
                  }`}>
                    {item.text}
                  </span>
                  <span className={`shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded ${RECURRENCE_COLORS[item.recurrence]}`}>
                    {RECURRENCE_LABELS[item.recurrence]}
                  </span>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <button
                      onClick={() => startEdit(item)}
                      className="text-text-light hover:text-primary transition-colors"
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => deleteItem(item.id)}
                      className="text-text-light hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </>
              )}
            </li>
          )
        })}
      </ul>

      {/* 새 항목 추가 폼 */}
      {adding && (
        <div className="flex items-center gap-2 mt-2 px-1">
          <div className="w-4 h-4 shrink-0" />
          <input
            autoFocus
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitAdd()
              if (e.key === 'Escape') setAdding(false)
            }}
            placeholder="루틴 내용"
            className="flex-1 min-w-0 text-xs border border-primary/40 rounded px-1.5 py-0.5 outline-none"
          />
          <select
            value={newRecurrence}
            onChange={(e) => setNewRecurrence(e.target.value as RoutineRecurrence)}
            className="text-xs border border-border rounded px-1 py-0.5 outline-none focus:border-primary text-text-muted"
          >
            {RECURRENCE_OPTIONS.map((r) => (
              <option key={r} value={r}>{RECURRENCE_LABELS[r]}</option>
            ))}
          </select>
          <button onClick={commitAdd} className="text-primary hover:opacity-70 transition-opacity shrink-0">
            <Check className="w-3 h-3" />
          </button>
          <button onClick={() => setAdding(false)} className="text-gray-300 hover:text-gray-500 transition-colors shrink-0">
            <X className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  )
}
