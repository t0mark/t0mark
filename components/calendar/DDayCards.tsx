'use client'

import type { CalendarData, DDayColorClass } from '@/types/calendar'

interface DDayCardsProps {
  dDay: CalendarData['dDay']
}

function getDDayColor(diffDays: number): DDayColorClass {
  if (diffDays <= 7) return 'urgent'
  if (diffDays <= 14) return 'warning'
  if (diffDays <= 30) return 'caution'
  if (diffDays <= 60) return 'normal'
  return 'distant'
}

const colorMap: Record<DDayColorClass, { bg: string; text: string; ring: string; stroke: string }> = {
  urgent:  { bg: 'bg-red-50',    text: 'text-red-600',    ring: 'ring-red-200',    stroke: '#ef4444' },
  warning: { bg: 'bg-orange-50', text: 'text-orange-500', ring: 'ring-orange-200', stroke: '#f97316' },
  caution: { bg: 'bg-yellow-50', text: 'text-yellow-600', ring: 'ring-yellow-200', stroke: '#eab308' },
  normal:  { bg: 'bg-blue-50',   text: 'text-blue-500',   ring: 'ring-blue-200',   stroke: '#3b82f6' },
  distant: { bg: 'bg-gray-50',   text: 'text-gray-500',   ring: 'ring-gray-200',   stroke: '#9ca3af' },
}

export default function DDayCards({ dDay }: DDayCardsProps) {
  const entries = Object.entries(dDay)
  const today = new Date()
  const yearStart = new Date(today.getFullYear(), 0, 1)
  const yearEnd = new Date(today.getFullYear() + 1, 0, 1)
  const totalDays = Math.ceil((yearEnd.getTime() - yearStart.getTime()) / 86400000)

  return (
    <div className="grid grid-cols-2 gap-2">
      {entries.map(([key, data]) => {
        const targetDate = new Date(data.targetDate)
        const diffDays = Math.ceil((targetDate.getTime() - today.getTime()) / 86400000)
        const colorClass = getDDayColor(diffDays)
        const colors = colorMap[colorClass]

        // 원형 진행률 (연 기준)
        const progress = Math.max(0, Math.min(100, (diffDays / totalDays) * 100))
        const circumference = 283
        const offset = circumference - (circumference * progress) / 100

        return (
          <div
            key={key}
            className={`${colors.bg} ${colors.ring} ring-1 rounded-xl p-3 flex flex-col items-center gap-1`}
          >
            {/* 원형 진행바 */}
            <div className="relative w-14 h-14">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="none" stroke="#e5e7eb" strokeWidth="8" />
                <circle
                  cx="50" cy="50" r="45" fill="none"
                  stroke={colors.stroke} strokeWidth="8"
                  strokeDasharray={circumference}
                  strokeDashoffset={offset}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset 0.6s ease' }}
                />
              </svg>
              <div className={`absolute inset-0 flex items-center justify-center text-xs font-bold ${colors.text}`}>
                D-{diffDays}
              </div>
            </div>
            <span className="text-[10px] font-semibold text-center text-gray-600 leading-tight">{key}</span>
          </div>
        )
      })}
    </div>
  )
}
