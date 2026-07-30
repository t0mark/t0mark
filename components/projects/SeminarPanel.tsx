'use client'

import { useEffect, useRef, useState } from 'react'

interface SeminarSchedule {
  enabled: boolean
  dayOfWeek: number
  hour: number
  minute: number
}

interface LogLine {
  text: string
  type: 'ok' | 'fail' | 'result' | 'plain'
}

function classify(line: string): LogLine['type'] {
  if (line.startsWith('✓')) return 'ok'
  if (line.startsWith('✗')) return 'fail'
  if (line.startsWith('  →')) return 'result'
  return 'plain'
}

const lineColor: Record<LogLine['type'], string> = {
  ok:     'text-accent-hardware',
  fail:   'text-red-400',
  result: 'text-primary',
  plain:  'text-text-muted',
}

const DAY_OPTIONS = [
  { value: 0, label: '일' },
  { value: 1, label: '월' },
  { value: 2, label: '화' },
  { value: 3, label: '수' },
  { value: 4, label: '목' },
  { value: 5, label: '금' },
  { value: 6, label: '토' },
]

type RunStatus = 'idle' | 'running' | 'done' | 'error'

export default function SeminarPanel() {
  // ── 스케줄 상태 ───────────────────────────
  const [schedule, setSchedule] = useState<SeminarSchedule | null>(null)
  const [scheduleDesc, setScheduleDesc] = useState('')
  const [savingSchedule, setSavingSchedule] = useState(false)
  const [scheduleSaved, setScheduleSaved] = useState<'saved' | 'unsaved'>('saved')

  // ── 수동 실행 상태 ───────────────────────────
  const [date, setDate] = useState('')
  const [status, setStatus] = useState<RunStatus>('idle')
  const [logs, setLogs] = useState<LogLine[]>([])
  const logRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/api/projects/seminar/schedule')
      .then((r) => r.json())
      .then((d: { schedule: SeminarSchedule; description: string }) => {
        setSchedule(d.schedule)
        setScheduleDesc(d.description)
      })
      .catch(() => { /* ignore */ })
  }, [])

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight
  }, [logs])

  function updateSchedule(patch: Partial<SeminarSchedule>) {
    setSchedule((prev) => (prev ? { ...prev, ...patch } : prev))
    setScheduleSaved('unsaved')
  }

  async function saveSchedule() {
    if (!schedule) return
    setSavingSchedule(true)
    try {
      const res = await fetch('/api/projects/seminar/schedule', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(schedule),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'save failed')
      setSchedule(data.schedule)
      setScheduleDesc(data.description)
      setScheduleSaved('saved')
    } catch {
      setScheduleSaved('unsaved')
    } finally {
      setSavingSchedule(false)
    }
  }

  async function runNow() {
    setStatus('running')
    setLogs([])
    const res = await fetch('/api/projects/seminar/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: date || undefined }),
    })
    if (!res.ok || !res.body) {
      setStatus('error')
      setLogs([{ text: '서버 오류', type: 'fail' }])
      return
    }
    const reader = res.body.getReader()
    const dec = new TextDecoder()
    let buf = ''
    let gotError = false
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buf += dec.decode(value, { stream: true })
      const parts = buf.split('\n\n')
      buf = parts.pop() ?? ''
      for (const part of parts) {
        const dataLine = part.split('\n').find((l) => l.startsWith('data: '))
        if (!dataLine) continue
        try {
          const payload = JSON.parse(dataLine.slice(6))
          if (typeof payload.line === 'string') {
            const text = payload.line
            setLogs((prev) => [...prev, { text, type: classify(text) }])
          } else if (payload.done && payload.error) {
            gotError = true
          }
        } catch { /* ignore */ }
      }
    }
    setStatus(gotError ? 'error' : 'done')
  }

  const statusBadge = {
    idle:    null,
    running: <span className="ml-auto flex items-center gap-2 text-sm text-accent-industry font-semibold"><span className="w-2 h-2 rounded-full bg-accent-industry animate-pulse" />실행 중</span>,
    done:    <span className="ml-auto text-sm text-accent-hardware font-semibold">완료</span>,
    error:   <span className="ml-auto text-sm text-red-500 font-semibold">오류</span>,
  }[status]

  return (
    <div className="bg-white rounded-xl border border-border shadow-card p-6 sm:col-span-2">
      {/* 헤더 */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-lg bg-accent-research/10 flex items-center justify-center text-xl">
          🎓
        </div>
        <div>
          <h3 className="font-bold text-primary text-base">세미나 논문 동기화</h3>
          <p className="text-sm text-text-light">슬라이드 → Seminar_Paper_List</p>
        </div>
        {statusBadge}
      </div>

      {/* 자동 실행 스케줄 */}
      <div className="bg-bg-light rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-primary">자동 실행 스케줄</p>
          {schedule && (
            <label className="flex items-center gap-2 text-xs text-text-muted cursor-pointer">
              <input
                type="checkbox"
                checked={schedule.enabled}
                onChange={(e) => updateSchedule({ enabled: e.target.checked })}
              />
              활성화
            </label>
          )}
        </div>

        {schedule ? (
          <>
            <div className="grid grid-cols-3 gap-2 items-end">
              <div>
                <label className="text-xs text-text-light block mb-1">요일</label>
                <select
                  value={schedule.dayOfWeek}
                  onChange={(e) => updateSchedule({ dayOfWeek: parseInt(e.target.value, 10) })}
                  className="w-full text-sm border border-border rounded-lg px-2.5 py-2 bg-white focus:outline-none focus:border-accent-research"
                >
                  {DAY_OPTIONS.map((d) => (
                    <option key={d.value} value={d.value}>{d.label}요일</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-text-light block mb-1">시</label>
                <input
                  type="number"
                  min={0}
                  max={23}
                  value={schedule.hour}
                  onChange={(e) => updateSchedule({ hour: Math.max(0, Math.min(23, parseInt(e.target.value, 10) || 0)) })}
                  className="w-full text-sm border border-border rounded-lg px-2.5 py-2 bg-white focus:outline-none focus:border-accent-research"
                />
              </div>
              <div>
                <label className="text-xs text-text-light block mb-1">분</label>
                <input
                  type="number"
                  min={0}
                  max={59}
                  value={schedule.minute}
                  onChange={(e) => updateSchedule({ minute: Math.max(0, Math.min(59, parseInt(e.target.value, 10) || 0)) })}
                  className="w-full text-sm border border-border rounded-lg px-2.5 py-2 bg-white focus:outline-none focus:border-accent-research"
                />
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between">
              <p className="text-xs text-text-light">
                {schedule.enabled ? `현재: ${scheduleDesc}` : '비활성화됨'}
              </p>
              <button
                onClick={saveSchedule}
                disabled={savingSchedule || scheduleSaved === 'saved'}
                className="text-xs font-semibold bg-primary text-white px-3 py-1.5 rounded-lg hover:bg-primary-light disabled:opacity-50 transition-colors"
              >
                {savingSchedule ? '저장 중...' : scheduleSaved === 'saved' ? '저장됨' : '저장'}
              </button>
            </div>
          </>
        ) : (
          <div className="loading-spinner scale-75" />
        )}
      </div>

      {/* 수동 실행 */}
      <div className="border border-border rounded-lg p-4">
        <p className="text-sm font-semibold text-primary mb-3">수동 실행</p>

        <div className="grid grid-cols-[1fr_auto] gap-2 items-end">
          <div>
            <label className="text-xs text-text-light block mb-1">대상 날짜 (비우면 최근 파일)</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              disabled={status === 'running'}
              className="w-full text-sm border border-border rounded-lg px-3 py-2 focus:outline-none focus:border-accent-research disabled:opacity-50"
            />
          </div>
          <button
            onClick={runNow}
            disabled={status === 'running'}
            className="py-2 px-4 rounded-lg text-sm font-semibold bg-accent-research text-white hover:bg-accent-research/90 transition-colors disabled:opacity-50 whitespace-nowrap"
          >
            {status === 'running' ? '실행 중...' : '지금 동기화'}
          </button>
        </div>

        {logs.length > 0 && (
          <div className="mt-4">
            <p className="text-xs text-text-light font-medium mb-1.5">실행 로그</p>
            <div
              ref={logRef}
              className="bg-bg-light rounded-lg p-3 max-h-56 overflow-y-auto space-y-0.5"
            >
              {logs.map((log, i) => (
                <p key={i} className={`text-xs font-mono whitespace-pre-wrap break-words ${lineColor[log.type]}`}>
                  {log.text}
                </p>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
