'use client'

import { useState } from 'react'
import type { CalendarData, PriorityEntry } from '@/types/calendar'
import { GripVertical } from 'lucide-react'

interface PriorityItem {
  category: string
  text: string
  deadline?: string
}

function buildPriorityList(data: CalendarData): PriorityItem[] {
  const eligible: PriorityItem[] = []
  for (const [category, catData] of Object.entries(data.todos)) {
    for (const item of catData.items) {
      if (item.deadline && item.deadline !== 'TYT' && item.text.trim()) {
        eligible.push({ category, text: item.text, deadline: item.deadline })
      }
    }
  }

  const order = data.priorityOrder ?? []
  const ordered: PriorityItem[] = []

  for (const entry of order) {
    const found = eligible.find((e) => e.category === entry.category && e.text === entry.text)
    if (found) ordered.push(found)
  }

  for (const item of eligible) {
    if (!ordered.some((o) => o.category === item.category && o.text === item.text)) {
      ordered.push(item)
    }
  }

  return ordered
}

function DeadlineBadge({ deadline }: { deadline: string }) {
  if (deadline === 'ASAP') return (
    <span className="shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-red-100 text-red-600">ASAP</span>
  )
  const d = new Date(deadline)
  return (
    <span className="shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-50 text-blue-500">
      {d.getMonth() + 1}/{d.getDate()}
    </span>
  )
}

interface HomePriorityProps {
  data: CalendarData | null
  onSave: (updated: CalendarData) => void
}

export default function HomePriority({ data, onSave }: HomePriorityProps) {
  const [dragIdx, setDragIdx] = useState<number | null>(null)
  const [overIdx, setOverIdx] = useState<number | null>(null)

  if (!data) return <div className="loading-spinner scale-75" />

  const items = buildPriorityList(data)

  if (items.length === 0) {
    return <p className="text-xs text-text-light italic">항목 없음 (TYT 항목 제외)</p>
  }

  function handleDrop(toIdx: number) {
    if (!data || dragIdx === null || dragIdx === toIdx) return
    const newItems = [...items]
    const [moved] = newItems.splice(dragIdx, 1)
    newItems.splice(toIdx, 0, moved)
    const priorityOrder: PriorityEntry[] = newItems.map(({ category, text }) => ({ category, text }))
    onSave({ ...data, priorityOrder })
    setDragIdx(null)
    setOverIdx(null)
  }

  return (
    <div className="bg-white rounded-xl shadow-card border border-border p-4">
      <ul className="space-y-0.5">
        {items.map((item, i) => (
          <li
            key={`${item.category}::${item.text}`}
            draggable
            onDragStart={() => setDragIdx(i)}
            onDragOver={(e) => { e.preventDefault(); setOverIdx(i) }}
            onDrop={(e) => { e.preventDefault(); handleDrop(i) }}
            onDragEnd={() => { setDragIdx(null); setOverIdx(null) }}
            className={`flex items-center gap-3 px-2 py-1.5 rounded-lg transition-all select-none ${
              overIdx === i && dragIdx !== i ? 'bg-bg-light ring-1 ring-primary/30' : ''
            } ${dragIdx === i ? 'opacity-40' : ''}`}
          >
            <span className="text-xs font-bold text-text-light w-5 text-right shrink-0">{i + 1}</span>
            <GripVertical className="w-4 h-4 text-gray-300 cursor-grab shrink-0" />
            <span className="flex-1 text-sm text-text-muted">{item.text}</span>
            <span className="text-[10px] text-text-light bg-bg-light px-1.5 py-0.5 rounded shrink-0">{item.category}</span>
            {item.deadline && <DeadlineBadge deadline={item.deadline} />}
          </li>
        ))}
      </ul>
    </div>
  )
}
