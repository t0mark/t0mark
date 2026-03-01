'use client'

import { useEffect, useState } from 'react'
import type { TimeProgress } from '@/types/calendar'

function calculateProgress(now: Date): TimeProgress {
  const yearStart = new Date(now.getFullYear(), 0, 1)
  const yearEnd = new Date(now.getFullYear() + 1, 0, 1)
  const year = (now.getTime() - yearStart.getTime()) / (yearEnd.getTime() - yearStart.getTime())

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  const month = (now.getTime() - monthStart.getTime()) / (monthEnd.getTime() - monthStart.getTime())

  const dayOfWeek = now.getDay() === 0 ? 7 : now.getDay()
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() - dayOfWeek + 1)
  weekStart.setHours(0, 0, 0, 0)
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 7)
  const week = (now.getTime() - weekStart.getTime()) / (weekEnd.getTime() - weekStart.getTime())

  const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const dayEnd = new Date(dayStart)
  dayEnd.setDate(dayStart.getDate() + 1)
  const day = (now.getTime() - dayStart.getTime()) / (dayEnd.getTime() - dayStart.getTime())

  return {
    year: Math.max(0, Math.min(1, year)),
    month: Math.max(0, Math.min(1, month)),
    week: Math.max(0, Math.min(1, week)),
    day: Math.max(0, Math.min(1, day)),
  }
}

const LABELS: { key: keyof TimeProgress; label: string }[] = [
  { key: 'year', label: 'Year' },
  { key: 'month', label: 'Month' },
  { key: 'week', label: 'Week' },
  { key: 'day', label: 'Day' },
]

export default function ProgressBars() {
  const [progress, setProgress] = useState<TimeProgress>(() => calculateProgress(new Date()))

  // 1분마다 갱신
  useEffect(() => {
    const id = setInterval(() => setProgress(calculateProgress(new Date())), 60000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="space-y-2">
      {LABELS.map(({ key, label }) => {
        const pct = Math.round(progress[key] * 100)
        return (
          <div key={key}>
            <div className="flex justify-between text-[10px] text-text-light mb-0.5">
              <span className="font-medium">{label}</span>
              <span>{pct}%</span>
            </div>
            <div className="w-full h-1.5 bg-bg-gray rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary to-accent-research transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
