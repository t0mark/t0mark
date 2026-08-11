'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import type { CalendarData } from '@/types/calendar'
import HomePriority from './HomePriority'
import HomeTodo from './HomeTodo'
import HomeNote from './HomeNote'

export default function HomeContent() {
  const [data, setData] = useState<CalendarData | null>(null)
  const [notionUrls, setNotionUrls] = useState<Record<string, string>>({})
  const [error, setError] = useState(false)
  const syncTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const syncNotion = useCallback(() => {
    if (syncTimer.current) clearTimeout(syncTimer.current)
    syncTimer.current = setTimeout(() => {
      fetch('/api/notion/sync', { method: 'POST' })
        .then((res) => (res.ok ? res.json() : null))
        .then((r: { urls?: Record<string, string> } | null) => {
          if (r?.urls) setNotionUrls(r.urls)
        })
        .catch(() => { /* graceful degradation */ })
    }, 800)
  }, [])

  useEffect(() => {
    fetch('/api/calendar')
      .then((res) => { if (!res.ok) throw new Error(); return res.json() })
      .then((d: CalendarData) => {
        setData(d)
        syncNotion()
      })
      .catch(() => setError(true))
  }, [syncNotion])

  const save = useCallback((updated: CalendarData) => {
    setData(updated)
    fetch('/api/calendar', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated),
    }).then(() => syncNotion())
  }, [syncNotion])

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

      <section className="mt-10">
        <h2 className="text-sm font-bold text-primary uppercase tracking-widest mb-4">Note</h2>
        <HomeNote data={data} notionUrls={notionUrls} />
      </section>
    </>
  )
}
