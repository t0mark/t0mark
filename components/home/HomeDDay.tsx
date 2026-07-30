'use client'

import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { Pencil, Plus, Trash2, X } from 'lucide-react'
import type { CalendarData } from '@/types/calendar'
import DDayCards from '@/components/calendar/DDayCards'

export default function HomeDDay() {
  const [data, setData] = useState<CalendarData | null>(null)
  const [error, setError] = useState(false)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<CalendarData | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/calendar')
      .then((res) => { if (!res.ok) throw new Error(); return res.json() })
      .then((fetched: CalendarData) => {
        const now = new Date()
        const cutoff = now.getTime() - 3 * 86400000
        const kept = Object.fromEntries(
          Object.entries(fetched.dDay).filter(([, item]) => {
            const t = new Date(item.targetDate).getTime()
            return !isNaN(t) && t >= cutoff
          })
        )
        const removedCount = Object.keys(fetched.dDay).length - Object.keys(kept).length
        if (removedCount > 0) {
          const pruned: CalendarData = { ...fetched, dDay: kept }
          setData(pruned)
          fetch('/api/calendar', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(pruned),
          })
        } else {
          setData(fetched)
        }
      })
      .catch(() => setError(true))
  }, [])

  const openEdit = () => {
    if (!data) return
    setDraft(JSON.parse(JSON.stringify(data)))
    setEditing(true)
  }

  const closeEdit = () => {
    setEditing(false)
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

  const addDDay = () => {
    if (!draft) return
    const today = new Date().toISOString().split('T')[0]
    let name = '새 항목'
    let i = 1
    while (name in draft.dDay) name = `새 항목 ${i++}`
    setDraft({ ...draft, dDay: { ...draft.dDay, [name]: { targetDate: today } } })
  }

  const updateName = (idx: number, newName: string) => {
    if (!draft) return
    const entries = Object.entries(draft.dDay)
    entries[idx] = [newName, entries[idx][1]]
    setDraft({ ...draft, dDay: Object.fromEntries(entries) })
  }

  const updateDate = (idx: number, date: string) => {
    if (!draft) return
    const entries = Object.entries(draft.dDay)
    entries[idx] = [entries[idx][0], { targetDate: date }]
    setDraft({ ...draft, dDay: Object.fromEntries(entries) })
  }

  const remove = (idx: number) => {
    if (!draft) return
    const entries = Object.entries(draft.dDay)
    entries.splice(idx, 1)
    setDraft({ ...draft, dDay: Object.fromEntries(entries) })
  }

  return (
    <>
      <div className="bg-white rounded-xl p-4 shadow-card">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-bold text-primary uppercase tracking-wide">D-DAY</h2>
          {data && (
            <button
              onClick={openEdit}
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

      {editing && draft && (
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
            {Object.entries(draft.dDay)
              .map(([name, item], originalIdx) => ({ name, item, originalIdx }))
              .sort((a, b) => new Date(a.item.targetDate).getTime() - new Date(b.item.targetDate).getTime())
              .map(({ name, item, originalIdx }) => (
                <div key={originalIdx} className="flex items-center gap-2">
                  <input
                    value={name}
                    onChange={(e) => updateName(originalIdx, e.target.value)}
                    className="flex-1 min-w-0 text-xs border border-border rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="이름"
                  />
                  <input
                    type="date"
                    value={item.targetDate}
                    onChange={(e) => updateDate(originalIdx, e.target.value)}
                    className="text-xs border border-border rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <button
                    onClick={() => remove(originalIdx)}
                    className="text-gray-300 hover:text-red-400 transition-colors shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
          </div>
        </EditPanel>
      )}
    </>
  )
}

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
