'use client'

import { useEffect, useState } from 'react'
import type { LogData } from '@/types/logs'
import { ChevronDown, ChevronRight, X, Check, Pencil } from 'lucide-react'


function getCurrentWeekLabel(): string {
  const now = new Date()
  const day = now.getDay()
  const diffToMonday = day === 0 ? -6 : 1 - day
  const monday = new Date(now)
  monday.setDate(now.getDate() + diffToMonday)
  const saturday = new Date(monday)
  saturday.setDate(monday.getDate() + 5)
  const fmt = (d: Date) => {
    const yy = String(d.getFullYear()).slice(2)
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    return `${yy}. ${mm}. ${dd}`
  }
  return `${fmt(monday)} ~ ${fmt(saturday)}`
}

interface EditRow {
  wi: number
  ri: number
  day: string
  category: string
  items: string
}

export default function HomeLog() {
  const [data, setData] = useState<LogData | null>(null)
  const [error, setError] = useState(false)
  const [openWeeks, setOpenWeeks] = useState<Set<number>>(new Set([0]))
  const [editWeek, setEditWeek] = useState<{ wi: number; value: string } | null>(null)
  const [editRow, setEditRow] = useState<EditRow | null>(null)

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.altKey && e.key === 't') {
        e.preventDefault()
        setOpenWeeks((prev) => {
          const total = data?.logs.length ?? 0
          return prev.size === total
            ? new Set<number>()
            : new Set(Array.from({ length: total }, (_, i) => i))
        })
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [data?.logs.length])

  useEffect(() => {
    fetch('/api/logs')
      .then((res) => { if (!res.ok) throw new Error(); return res.json() })
      .then((d: LogData) => {
        const label = getCurrentWeekLabel()
        if (!d.logs.some((w) => w.week === label)) {
          const updated = { logs: [{ week: label, rows: [] }, ...d.logs] }
          setData(updated)
          fetch('/api/logs', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updated),
          })
        } else {
          setData(d)
        }
      })
      .catch(() => setError(true))
  }, [])

  async function save(updated: LogData) {
    setData(updated)
    fetch('/api/logs', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated),
    })
  }

  function toggleWeek(wi: number) {
    setOpenWeeks((prev) => {
      const s = new Set(prev)
      if (s.has(wi)) s.delete(wi)
      else s.add(wi)
      return s
    })
  }

  function commitWeek() {
    if (!data || !editWeek) return
    const updated: LogData = JSON.parse(JSON.stringify(data))
    updated.logs[editWeek.wi].week = editWeek.value
    save(updated)
    setEditWeek(null)
  }

  function startEditRow(wi: number, ri: number, placeholderDay?: string) {
    if (!data) return
    if (ri >= 0) {
      const row = data.logs[wi].rows[ri]
      setEditRow({ wi, ri, day: row.day, category: row.category, items: row.items.join('\n') })
    } else {
      // 빈 행 → 새 row 추가 후 편집
      const updated: LogData = JSON.parse(JSON.stringify(data))
      const newRi = updated.logs[wi].rows.length
      updated.logs[wi].rows.push({ day: placeholderDay ?? '', category: '', items: [] })
      setData(updated)
      setEditRow({ wi, ri: newRi, day: placeholderDay ?? '', category: '', items: '' })
    }
  }

  function commitRow() {
    if (!data || !editRow) return
    const { wi, ri } = editRow
    const updated: LogData = JSON.parse(JSON.stringify(data))
    updated.logs[wi].rows[ri] = {
      day: editRow.day.trim(),
      category: editRow.category.trim(),
      items: editRow.items.split('\n').map((s) => s.trim()).filter(Boolean),
    }
    save(updated)
    setEditRow(null)
  }

  if (error) return <p className="text-xs text-red-400">데이터 로드 실패</p>
  if (!data) return <div className="loading-spinner scale-75" />

  return (
    <div className="space-y-3">
      {data.logs.map((week, wi) => {
        const isOpen = openWeeks.has(wi)
        const displayRows = ['월', '화', '수', '목', '금', '토'].flatMap((day) => {
          const actual = week.rows
            .map((row, ri) => ({ ...row, originalRi: ri }))
            .filter((r) => r.day === day)
          if (actual.length === 0) return [{ day, category: '', items: [] as string[], originalRi: -1 }]
          return actual
        })

        return (
          <div key={wi} className="bg-white rounded-xl shadow-card border border-border overflow-hidden">
            {/* ── Accordion Header ── */}
            <div className="flex items-center gap-2 px-4 py-3 group/header">
              <button onClick={() => toggleWeek(wi)} className="shrink-0 text-text-muted hover:text-primary transition-colors">
                {isOpen
                  ? <ChevronDown className="w-3.5 h-3.5" />
                  : <ChevronRight className="w-3.5 h-3.5" />
                }
              </button>

              {editWeek?.wi === wi ? (
                <input
                  autoFocus
                  className="flex-1 text-sm font-bold text-primary bg-transparent border-b border-primary outline-none"
                  value={editWeek.value}
                  onChange={(e) => setEditWeek({ ...editWeek, value: e.target.value })}
                  onBlur={commitWeek}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') e.currentTarget.blur()
                    if (e.key === 'Escape') setEditWeek(null)
                  }}
                  placeholder="26. 03. 01 ~ 26. 03. 07"
                />
              ) : (
                <button
                  className="flex-1 text-left text-sm font-bold text-primary"
                  onClick={() => toggleWeek(wi)}
                >
                  {week.week || <span className="text-text-light font-normal italic">주차 미설정</span>}
                </button>
              )}

              <button
                onClick={() => setEditWeek({ wi, value: week.week })}
                className="p-1 text-text-light hover:text-primary transition-colors opacity-0 group-hover/header:opacity-100"
              >
                <Pencil className="w-3 h-3" />
              </button>
            </div>

            {/* ── Table ── */}
            {isOpen && (
              <div className="border-t border-border">
                <table className="w-full text-sm border-collapse">
                  <colgroup>
                    <col style={{ width: '52px' }} />
                    <col style={{ width: '160px' }} />
                    <col />
                    <col style={{ width: '44px' }} />
                  </colgroup>
                  <thead>
                    <tr className="bg-bg-light">
                      <th className="px-3 py-2 text-left text-[10px] font-bold text-text-light uppercase tracking-widest border-r border-border">요일</th>
                      <th className="px-3 py-2 text-left text-[10px] font-bold text-text-light uppercase tracking-widest border-r border-border">카테고리</th>
                      <th className="px-3 py-2 text-left text-[10px] font-bold text-text-light uppercase tracking-widest">내용</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {displayRows.map((row, di) => {
                      const { originalRi } = row
                      const isReal = originalRi >= 0
                      const isEditing = isReal && editRow?.wi === wi && editRow?.ri === originalRi
                      const isNewDay = di === 0 || row.day !== displayRows[di - 1].day

                      return (
                        <tr
                          key={di}
                          className={`group/row ${di > 0 ? 'border-t border-border' : ''}`}
                        >
                          {/* 요일 */}
                          <td className="px-3 py-2.5 border-r border-border text-center align-top">
                            {isNewDay && (
                              <span className="text-xs font-semibold text-primary">{row.day}</span>
                            )}
                          </td>

                          {/* 카테고리 */}
                          <td className="px-3 py-2.5 border-r border-border align-top">
                            {isEditing ? (
                              <input
                                autoFocus
                                value={editRow.category}
                                onChange={(e) => setEditRow({ ...editRow, category: e.target.value })}
                                className="w-full text-xs text-text-muted bg-transparent border-b border-primary outline-none"
                                placeholder="카테고리"
                              />
                            ) : (
                              <span className="text-xs text-text-muted">{row.category}</span>
                            )}
                          </td>

                          {/* 내용 */}
                          <td className="px-3 py-2.5 align-top">
                            {isEditing ? (
                              <textarea
                                value={editRow.items}
                                onChange={(e) => setEditRow({ ...editRow, items: e.target.value })}
                                className="w-full text-xs text-text-muted bg-transparent outline-none resize-none border border-primary/30 rounded px-1.5 py-1"
                                rows={Math.max(2, (editRow.items.match(/\n/g)?.length ?? 0) + 1)}
                                placeholder="항목 (한 줄에 하나씩)"
                              />
                            ) : (
                              <ul className="space-y-0.5">
                                {row.items.map((item, ii) => (
                                  <li key={ii} className="flex gap-1.5 text-xs text-text-muted">
                                    <span className="shrink-0 mt-px">•</span>
                                    <span>{item}</span>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </td>

                          {/* 액션 */}
                          <td className="px-2 align-middle">
                            {isEditing ? (
                              <div className="flex flex-col gap-1 items-center">
                                <button onClick={commitRow} className="text-primary hover:opacity-70 transition-opacity">
                                  <Check className="w-3 h-3" />
                                </button>
                                <button onClick={() => setEditRow(null)} className="text-gray-300 hover:text-gray-500 transition-colors">
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center justify-center opacity-0 group-hover/row:opacity-100 transition-opacity">
                                <button
                                  onClick={() => startEditRow(wi, originalRi, row.day)}
                                  className="text-text-light hover:text-primary transition-colors"
                                >
                                  <Pencil className="w-3 h-3" />
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>

              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
