'use client'

import { useEffect, useState, useCallback } from 'react'
import type { CalendarData } from '@/types/calendar'
import HomePriority from './HomePriority'
import HomeTodo from './HomeTodo'

export default function HomeContent() {
  const [data, setData] = useState<CalendarData | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    fetch('/api/calendar')
      .then((res) => { if (!res.ok) throw new Error(); return res.json() })
      .then(setData)
      .catch(() => setError(true))
  }, [])

  const save = useCallback((updated: CalendarData) => {
    setData(updated)
    fetch('/api/calendar', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated),
    })
  }, [])

  if (error) return <p className="text-xs text-red-400">데이터 로드 실패</p>

  return (
    <>
      <section>
        <h2 className="text-sm font-bold text-primary uppercase tracking-widest mb-4">Priority</h2>
        <HomePriority data={data} onSave={save} />
      </section>

      <section className="mt-10">
        <h2 className="text-sm font-bold text-primary uppercase tracking-widest mb-4">TODO</h2>
        <HomeTodo data={data} onSave={save} />
      </section>
    </>
  )
}
