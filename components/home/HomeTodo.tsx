'use client'

import { useEffect, useState } from 'react'
import type { CalendarData } from '@/types/calendar'
import { Plus, X } from 'lucide-react'

export default function HomeTodo() {
  const [data, setData] = useState<CalendarData | null>(null)
  const [error, setError] = useState(false)
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')

  useEffect(() => {
    fetch('/api/calendar')
      .then((res) => { if (!res.ok) throw new Error(); return res.json() })
      .then(setData)
      .catch(() => setError(true))
  }, [])

  async function save(updated: CalendarData) {
    setData(updated)
    await fetch('/api/calendar', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated),
    })
  }

  function startEdit(category: string, index: number) {
    if (!data) return
    setEditingKey(`${category}:${index}`)
    setEditValue(data.todos[category].items[index])
  }

  function commitEdit(category: string, index: number) {
    if (!data) return
    const trimmed = editValue.trim()
    const items = [...data.todos[category].items]
    if (trimmed === '') {
      items.splice(index, 1)
    } else {
      items[index] = trimmed
    }
    save({ ...data, todos: { ...data.todos, [category]: { ...data.todos[category], items } } })
    setEditingKey(null)
  }

  function deleteItem(category: string, index: number) {
    if (!data) return
    const items = data.todos[category].items.filter((_, i) => i !== index)
    save({ ...data, todos: { ...data.todos, [category]: { ...data.todos[category], items } } })
    setEditingKey(null)
  }

  function addItem(category: string) {
    if (!data) return
    const items = [...data.todos[category].items, '']
    const newIndex = items.length - 1
    const updated = { ...data, todos: { ...data.todos, [category]: { ...data.todos[category], items } } }
    setData(updated)
    setEditingKey(`${category}:${newIndex}`)
    setEditValue('')
  }

  if (error) return <p className="text-xs text-red-400">데이터 로드 실패</p>
  if (!data) return <div className="loading-spinner scale-75" />

  const todos = Object.entries(data.todos)

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {todos.map(([category, catData]) => (
        <div key={category} className="bg-white rounded-xl shadow-card border border-border p-4">
          <p className="text-sm font-bold text-primary mb-2.5 flex items-center gap-1.5">
            <span>{catData.icon}</span>
            <span>{category}</span>
          </p>
          <ul className="space-y-1.5">
            {catData.items.map((item, i) => {
              const key = `${category}:${i}`
              const isEditing = editingKey === key
              return (
                <li key={i} className="flex items-start gap-2 group">
                  <span className="mt-1 shrink-0 w-3 h-3 rounded-full border border-border bg-bg-light" />
                  {isEditing ? (
                    <input
                      autoFocus
                      className="flex-1 text-sm text-text-muted leading-snug bg-transparent border-b border-primary outline-none min-w-0"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={() => commitEdit(category, i)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') e.currentTarget.blur()
                        if (e.key === 'Escape') setEditingKey(null)
                      }}
                    />
                  ) : (
                    <span
                      className="flex-1 text-sm text-text-muted leading-snug cursor-text"
                      onClick={() => startEdit(category, i)}
                    >
                      {item}
                    </span>
                  )}
                  {!isEditing && (
                    <button
                      onClick={() => deleteItem(category, i)}
                      className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-text-light hover:text-red-400"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </li>
              )
            })}
            {catData.items.length === 0 && editingKey !== `${category}:0` && (
              <li className="text-xs text-text-light italic">항목 없음</li>
            )}
          </ul>
          <button
            onClick={() => addItem(category)}
            className="mt-3 flex items-center gap-1 text-xs text-text-light hover:text-primary transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            추가
          </button>
        </div>
      ))}
    </div>
  )
}
