'use client'

import { ExternalLink } from 'lucide-react'
import type { CalendarData } from '@/types/calendar'

function deadlineRank(deadline?: string): number {
  if (deadline === 'ASAP') return 0
  if (deadline && deadline !== 'TYT') return 1
  if (deadline === 'TYT') return 2
  return 3
}

interface HomeNoteProps {
  data: CalendarData | null
  notionUrls: Record<string, string>
}

export default function HomeNote({ data, notionUrls }: HomeNoteProps) {
  if (!data) return <div className="loading-spinner scale-75" />

  const flat = Object.entries(data.todos).flatMap(([category, catData]) =>
    catData.items
      .filter((item) => item.text && item.text.trim())
      .map((item) => ({
        key: `${category}::${item.text}`,
        icon: catData.icon,
        text: item.text,
        deadline: item.deadline,
      }))
  )

  flat.sort((a, b) => {
    const ra = deadlineRank(a.deadline)
    const rb = deadlineRank(b.deadline)
    if (ra !== rb) return ra - rb
    if (ra === 1) return a.deadline!.localeCompare(b.deadline!)
    return a.text.localeCompare(b.text, 'ko')
  })

  const items = flat.map((item, idx) => {
    const rank = deadlineRank(item.deadline)
    const prevRank = idx > 0 ? deadlineRank(flat[idx - 1].deadline) : -1
    const showDivider = rank >= 2 && prevRank < 2
    return { ...item, showDivider }
  })

  if (items.length === 0) {
    return <p className="text-xs text-text-light italic">TODO 항목이 없습니다</p>
  }

  return (
    <div className="bg-white rounded-xl shadow-card border border-border overflow-hidden">
      <ul>
        {items.map(({ key, icon, text, showDivider }, idx) => {
          const url = notionUrls[key]
          const inner = (
            <div className="flex items-center gap-2 px-4 py-2.5 group hover:bg-bg-light transition-colors">
              <span className="shrink-0">{icon}</span>
              <span className="flex-1 text-sm text-text-muted">{text}</span>
              {url
                ? <ExternalLink className="w-3.5 h-3.5 shrink-0 text-text-light group-hover:text-primary transition-colors" />
                : <span className="text-[10px] text-text-light italic shrink-0">동기화 중...</span>
              }
            </div>
          )
          return (
            <li key={key}>
              {showDivider && (
                <div className="flex items-center gap-2 px-4 py-1.5 border-t border-b border-border bg-bg-light">
                  <div className="flex-1 border-t border-dashed border-border" />
                  <span className="text-[10px] font-semibold text-text-light uppercase tracking-widest">TYT</span>
                  <div className="flex-1 border-t border-dashed border-border" />
                </div>
              )}
              {url ? (
                <a href={url} target="_blank" rel="noreferrer" className="block">
                  {inner}
                </a>
              ) : (
                <div className="cursor-default opacity-70">{inner}</div>
              )}
              {idx < items.length - 1 && !items[idx + 1].showDivider && (
                <div className="border-t border-border mx-4" />
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
