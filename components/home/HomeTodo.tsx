'use client'

import { useState } from 'react'
import type { CalendarData, TodoItem } from '@/types/calendar'
import { Plus, X, GripVertical } from 'lucide-react'

function DeadlineBadge({ deadline }: { deadline: string }) {
  if (deadline === 'ASAP') return (
    <span className="shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-red-100 text-red-600">ASAP</span>
  )
  if (deadline === 'TYT') return (
    <span className="shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">TYT</span>
  )
  const d = new Date(deadline)
  return (
    <span className="shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-50 text-blue-500">
      {d.getMonth() + 1}/{d.getDate()}
    </span>
  )
}

interface HomeTodoProps {
  data: CalendarData | null
  onSave: (updated: CalendarData) => void
}

export default function HomeTodo({ data, onSave }: HomeTodoProps) {
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const [editDeadline, setEditDeadline] = useState<string | undefined>(undefined)
  const [dragging, setDragging] = useState<{ category: string; index: number } | null>(null)
  const [overCategory, setOverCategory] = useState<string | null>(null)

  function moveItem(fromCat: string, fromIdx: number, toCat: string) {
    if (!data || fromCat === toCat) return
    const item = data.todos[fromCat]?.items[fromIdx]
    if (!item) return
    const nextTodos = { ...data.todos }
    nextTodos[fromCat] = {
      ...nextTodos[fromCat],
      items: nextTodos[fromCat].items.filter((_, i) => i !== fromIdx),
    }
    nextTodos[toCat] = {
      ...nextTodos[toCat],
      items: [...nextTodos[toCat].items, item],
    }
    onSave({ ...data, todos: nextTodos })
  }

  function startEdit(category: string, index: number) {
    if (!data) return
    const item = data.todos[category].items[index]
    setEditingKey(`${category}:${index}`)
    setEditText(item.text)
    setEditDeadline(item.deadline)
  }

  function commitEdit(category: string, index: number) {
    if (!data) return
    const trimmed = editText.trim()
    const items = [...data.todos[category].items]
    if (trimmed === '') {
      items.splice(index, 1)
    } else {
      items[index] = { text: trimmed, ...(editDeadline ? { deadline: editDeadline } : {}) }
    }
    onSave({ ...data, todos: { ...data.todos, [category]: { ...data.todos[category], items } } })
    setEditingKey(null)
  }

  function deleteItem(category: string, index: number) {
    if (!data) return
    const items = data.todos[category].items.filter((_, i) => i !== index)
    onSave({ ...data, todos: { ...data.todos, [category]: { ...data.todos[category], items } } })
    setEditingKey(null)
  }

  function addItem(category: string) {
    if (!data) return
    const newIndex = data.todos[category].items.length
    const items: TodoItem[] = [...data.todos[category].items, { text: '' }]
    onSave({ ...data, todos: { ...data.todos, [category]: { ...data.todos[category], items } } })
    setEditingKey(`${category}:${newIndex}`)
    setEditText('')
    setEditDeadline(undefined)
  }

  function toggleQuickDeadline(option: 'ASAP' | 'TYT') {
    setEditDeadline((prev) => (prev === option ? undefined : option))
  }

  function deadlineRank(deadline?: string): number {
    if (deadline === 'ASAP') return 0
    if (deadline && deadline !== 'TYT') return 1  // ISO date
    if (deadline === 'TYT') return 2
    return 3  // no deadline
  }

  function sortedItems(items: TodoItem[]): { item: TodoItem; originalIdx: number }[] {
    return items
      .map((item, originalIdx) => ({ item, originalIdx }))
      .sort((a, b) => {
        const ra = deadlineRank(a.item.deadline)
        const rb = deadlineRank(b.item.deadline)
        if (ra !== rb) return ra - rb
        // 날짜끼리는 오름차순
        if (ra === 1) return a.item.deadline!.localeCompare(b.item.deadline!)
        return a.item.text.localeCompare(b.item.text, 'ko')
      })
  }

  if (!data) return <div className="loading-spinner scale-75" />

  const todos = Object.entries(data.todos)

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {todos.map(([category, catData]) => (
        <div
          key={category}
          onDragOver={(e) => {
            if (!dragging || dragging.category === category) return
            e.preventDefault()
            e.dataTransfer.dropEffect = 'move'
            if (overCategory !== category) setOverCategory(category)
          }}
          onDragLeave={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
              setOverCategory((prev) => (prev === category ? null : prev))
            }
          }}
          onDrop={(e) => {
            e.preventDefault()
            if (dragging && dragging.category !== category) {
              moveItem(dragging.category, dragging.index, category)
            }
            setDragging(null)
            setOverCategory(null)
          }}
          className={`bg-white rounded-xl shadow-card border p-4 transition-all ${
            overCategory === category ? 'border-primary ring-2 ring-primary/30' : 'border-border'
          }`}
        >
          <p className="text-sm font-bold text-primary mb-2.5 flex items-center gap-1.5">
            <span>{catData.icon}</span>
            <span>{category}</span>
          </p>
          <ul className="space-y-1.5">
            {sortedItems(catData.items).map(({ item, originalIdx: i }) => {
              const key = `${category}:${i}`
              const isEditing = editingKey === key
              const isDraggingThis = dragging?.category === category && dragging?.index === i
              return (
                <li
                  key={i}
                  draggable={!isEditing}
                  onDragStart={(e) => {
                    if (isEditing) { e.preventDefault(); return }
                    e.dataTransfer.effectAllowed = 'move'
                    setDragging({ category, index: i })
                  }}
                  onDragEnd={() => { setDragging(null); setOverCategory(null) }}
                  className={`flex flex-col gap-1 group transition-opacity ${isDraggingThis ? 'opacity-40' : ''}`}
                  onBlur={isEditing ? (e) => {
                    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
                      commitEdit(category, i)
                    }
                  } : undefined}
                >
                  <div className="flex items-start gap-2">
                    <GripVertical
                      className="mt-0.5 shrink-0 w-3 h-3 text-gray-300 group-hover:text-gray-400 cursor-grab active:cursor-grabbing"
                    />
                    {isEditing ? (
                      <input
                        autoFocus
                        className="flex-1 text-sm text-text-muted leading-snug bg-transparent border-b border-primary outline-none min-w-0"
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') commitEdit(category, i)
                          if (e.key === 'Escape') setEditingKey(null)
                        }}
                      />
                    ) : (
                      <>
                        <span
                          className="flex-1 text-sm text-text-muted leading-snug cursor-text"
                          onClick={() => startEdit(category, i)}
                        >
                          {item.text}
                        </span>
                        {item.deadline && <DeadlineBadge deadline={item.deadline} />}
                      </>
                    )}
                    {!isEditing && (
                      <button
                        onClick={() => deleteItem(category, i)}
                        className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-text-light hover:text-red-400"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  {isEditing && (
                    <div className="ml-5 flex items-center gap-1 flex-wrap">
                      {(['ASAP', 'TYT'] as const).map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => toggleQuickDeadline(opt)}
                          className={`text-[10px] font-semibold px-1.5 py-0.5 rounded transition-colors ${
                            editDeadline === opt
                              ? opt === 'ASAP' ? 'bg-red-500 text-white' : 'bg-gray-500 text-white'
                              : opt === 'ASAP' ? 'bg-red-100 text-red-600 hover:bg-red-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                      <input
                        type="date"
                        value={editDeadline && editDeadline !== 'ASAP' && editDeadline !== 'TYT' ? editDeadline : ''}
                        onChange={(e) => setEditDeadline(e.target.value || undefined)}
                        onMouseDown={(e) => e.stopPropagation()}
                        className="text-[10px] border border-border rounded px-1 py-0.5 outline-none focus:border-primary text-text-muted"
                      />
                      {editDeadline && (
                        <button
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => setEditDeadline(undefined)}
                          className="text-text-light hover:text-red-400"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => commitEdit(category, i)}
                        className="ml-auto text-[10px] font-medium text-primary hover:opacity-70 transition-opacity"
                      >
                        저장
                      </button>
                    </div>
                  )}
                </li>
              )
            })}
            {catData.items.length === 0 && !editingKey?.startsWith(`${category}:`) && (
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
