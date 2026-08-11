'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { TIME_OPTIONS, type ChangjoApplicant, type ChangjoSchedule } from '@/types/changjo'

type Status = 'idle' | 'running' | 'done' | 'error'
type SaveState = 'saved' | 'unsaved' | 'saving'

interface NextRun {
  fireAt: string
  date: string
  ok: boolean
  reason: string
  uncertain: boolean
}

interface LogLine {
  text: string
  type: 'applicant' | 'step-ok' | 'step-fail' | 'result' | 'summary' | 'plain'
}

function classifyLine(line: string): LogLine['type'] {
  if (/^\[\d+\/\d+\]/.test(line)) return 'applicant'
  if (line.includes('✓')) return 'step-ok'
  if (line.includes('✗') || line.trimStart().startsWith('실패 —')) return 'step-fail'
  if (line.trimStart().startsWith('→')) return 'result'
  if (line.startsWith('완료:')) return 'summary'
  return 'plain'
}

const lineColor: Record<LogLine['type'], string> = {
  applicant:   'text-accent-industry font-semibold',
  'step-ok':   'text-accent-hardware',
  'step-fail': 'text-red-400',
  result:      'text-primary font-semibold',
  summary:     'text-primary font-bold',
  plain:       'text-text-muted',
}

const DEFAULTS: Omit<ChangjoApplicant, 'id' | 'name'> = {
  org: '전북대학교 조형기 교수님 연구실',
  position: '석사과정생',
  contact: '',
  purpose: '연구',
  equipment: '서버 1호기',
  entryTime: '10:00',
  exitTime: '18:00',
  active: false,
}

function fmtDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function tomorrow() {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return fmtDate(d)
}

/**
 * 임시 id. crypto.randomUUID 는 보안 컨텍스트에서만 있어서
 * http://192.168.x.x 로 접속하면 undefined 다. 저장하면 서버가 정식 id 를 발급한다.
 */
let tempSeq = 0
function tempId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  tempSeq += 1
  return `temp-${Date.now().toString(36)}-${tempSeq}`
}

const inputCls =
  'w-full text-sm border border-border rounded-lg px-3 py-2 bg-white focus:outline-none focus:border-accent-industry disabled:opacity-50'

export default function ChangjoPanel() {
  // ── 신청자 ────────────────────────────────
  const [applicants, setApplicants] = useState<ChangjoApplicant[] | null>(null)
  const [saveState, setSaveState] = useState<SaveState>('saved')
  const [saveError, setSaveError] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)

  // ── 스케줄 ────────────────────────────────
  const [schedule, setSchedule] = useState<ChangjoSchedule | null>(null)
  const [scheduleDesc, setScheduleDesc] = useState('')
  const [nextRun, setNextRun] = useState<NextRun | null>(null)
  const [scheduleSaveState, setScheduleSaveState] = useState<SaveState>('saved')

  // ── 실행 ──────────────────────────────────
  const [date, setDate] = useState(tomorrow)
  const [status, setStatus] = useState<Status>('idle')
  const [logs, setLogs] = useState<LogLine[]>([])
  const [runError, setRunError] = useState('')
  const logRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    fetch('/api/projects/changjo/applicants')
      .then((r) => r.json())
      .then((d: { applicants: ChangjoApplicant[] }) => setApplicants(d.applicants ?? []))
      .catch(() => setApplicants([]))

    fetch('/api/projects/changjo/schedule')
      .then((r) => r.json())
      .then((d: { schedule: ChangjoSchedule; description: string; nextRun: NextRun }) => {
        setSchedule(d.schedule)
        setScheduleDesc(d.description)
        setNextRun(d.nextRun)
      })
      .catch(() => { /* 무시 */ })
  }, [])

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight
  }, [logs])

  // 실행 중 페이지를 떠나면 서버 쪽 chromium 도 정리되도록 연결을 끊는다
  useEffect(() => () => abortRef.current?.abort(), [])

  const patch = useCallback((id: string, p: Partial<ChangjoApplicant>) => {
    setApplicants((prev) => (prev ? prev.map((a) => (a.id === id ? { ...a, ...p } : a)) : prev))
    setSaveState('unsaved')
    setSaveError('')
  }, [])

  function addApplicant() {
    const id = tempId()
    setApplicants((prev) => [...(prev ?? []), { id, name: '', ...DEFAULTS }])
    setExpanded(id)
    setSaveState('unsaved')
  }

  function removeApplicant(id: string) {
    setApplicants((prev) => (prev ? prev.filter((a) => a.id !== id) : prev))
    if (expanded === id) setExpanded(null)
    setSaveState('unsaved')
  }

  async function saveApplicants() {
    if (!applicants) return
    setSaveState('saving')
    setSaveError('')
    try {
      const res = await fetch('/api/projects/changjo/applicants', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicants }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? '저장 실패')
      setApplicants(data.applicants)
      setSaveState('saved')
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : '저장 실패')
      setSaveState('unsaved')
    }
  }

  async function saveSchedule() {
    if (!schedule) return
    setScheduleSaveState('saving')
    try {
      const res = await fetch('/api/projects/changjo/schedule', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(schedule),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? '저장 실패')
      setSchedule(data.schedule)
      setScheduleDesc(data.description)
      setNextRun(data.nextRun)
      setScheduleSaveState('saved')
    } catch {
      setScheduleSaveState('unsaved')
    }
  }

  const activeCount = applicants?.filter((a) => a.active).length ?? 0

  async function run() {
    setStatus('running')
    setLogs([])
    setRunError('')

    const controller = new AbortController()
    abortRef.current = controller

    let exitCode = 0
    try {
      const res = await fetch('/api/projects/changjo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date }),
        signal: controller.signal,
      })

      if (!res.ok || !res.body) {
        const msg = await res.json().then((d) => d.error).catch(() => '서버 오류')
        setRunError(msg ?? '서버 오류')
        setStatus('error')
        return
      }

      const reader = res.body.getReader()
      const dec = new TextDecoder()
      let buf = ''

      for (;;) {
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
            if (payload.done) exitCode = payload.code ?? 0
            else if (typeof payload.line === 'string') {
              setLogs((prev) => [...prev, { text: payload.line, type: classifyLine(payload.line) }])
            }
          } catch { /* 부분 청크 무시 */ }
        }
      }
      setStatus(exitCode === 0 ? 'done' : 'error')
    } catch (err) {
      if (controller.signal.aborted) {
        setLogs((prev) => [...prev, { text: '사용자가 중단했습니다.', type: 'step-fail' }])
        setStatus('error')
      } else {
        setRunError(err instanceof Error ? err.message : '실행 실패')
        setStatus('error')
      }
    } finally {
      abortRef.current = null
    }
  }

  function stop() {
    abortRef.current?.abort()
  }

  const statusBadge = {
    idle: null,
    running: (
      <span className="ml-auto flex items-center gap-2 text-sm text-accent-industry font-semibold">
        <span className="w-2 h-2 rounded-full bg-accent-industry animate-pulse" />실행 중
      </span>
    ),
    done:  <span className="ml-auto text-sm text-accent-hardware font-semibold">완료</span>,
    error: <span className="ml-auto text-sm text-red-500 font-semibold">오류</span>,
  }[status]

  return (
    <div className="bg-white rounded-xl border border-border shadow-card p-6">
      {/* 헤더 */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-lg bg-accent-industry/10 flex items-center justify-center text-xl">
          🏢
        </div>
        <div>
          <h3 className="font-bold text-primary text-base">창조2관 방문 신청</h3>
          <p className="text-sm text-text-light">Notion 폼 자동화 · 신청자 {applicants?.length ?? 0}명 중 {activeCount}명 활성화</p>
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
                onChange={(e) => {
                  setSchedule({ ...schedule, enabled: e.target.checked })
                  setScheduleSaveState('unsaved')
                }}
              />
              활성화
            </label>
          )}
        </div>

        {schedule ? (
          <>
            <div className="grid grid-cols-[auto_auto_1fr] gap-2 items-end">
              <div className="w-20">
                <label className="text-xs text-text-light block mb-1">시</label>
                <input
                  type="number" min={0} max={23} value={schedule.hour}
                  onChange={(e) => {
                    setSchedule({ ...schedule, hour: Math.max(0, Math.min(23, parseInt(e.target.value, 10) || 0)) })
                    setScheduleSaveState('unsaved')
                  }}
                  className={inputCls}
                />
              </div>
              <div className="w-20">
                <label className="text-xs text-text-light block mb-1">분</label>
                <input
                  type="number" min={0} max={59} value={schedule.minute}
                  onChange={(e) => {
                    setSchedule({ ...schedule, minute: Math.max(0, Math.min(59, parseInt(e.target.value, 10) || 0)) })
                    setScheduleSaveState('unsaved')
                  }}
                  className={inputCls}
                />
              </div>
              <p className="text-xs text-text-light pb-2.5 leading-relaxed">
                매일 이 시각에 <span className="font-semibold text-text-base">다음 날</span> 방문을 신청합니다.
                주말·공휴일은 자동으로 건너뜁니다.
              </p>
            </div>

            <div className="mt-3 flex items-center justify-between gap-3">
              <div className="text-xs text-text-light min-w-0">
                {schedule.enabled ? (
                  <>
                    <span className="block truncate">현재: {scheduleDesc}</span>
                    {nextRun && (
                      <span className="block truncate mt-0.5">
                        다음 실행 {nextRun.fireAt} → 신청일 {nextRun.date}{' '}
                        <span className={nextRun.ok ? 'text-accent-hardware' : 'text-red-500'}>
                          ({nextRun.ok ? nextRun.reason : `건너뜀 — ${nextRun.reason}`})
                        </span>
                      </span>
                    )}
                  </>
                ) : (
                  '비활성화됨'
                )}
              </div>
              <button
                onClick={saveSchedule}
                disabled={scheduleSaveState !== 'unsaved'}
                className="text-xs font-semibold bg-primary text-white px-3 py-1.5 rounded-lg hover:bg-primary-light disabled:opacity-50 transition-colors whitespace-nowrap"
              >
                {scheduleSaveState === 'saving' ? '저장 중...' : scheduleSaveState === 'saved' ? '저장됨' : '저장'}
              </button>
            </div>
          </>
        ) : (
          <div className="loading-spinner scale-75" />
        )}
      </div>

      {/* 신청자 목록 */}
      <div className="border border-border rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-primary">신청자</p>
          <div className="flex items-center gap-2">
            <button
              onClick={addApplicant}
              disabled={status === 'running' || !applicants}
              className="text-xs font-semibold border border-border text-text-base px-3 py-1.5 rounded-lg hover:bg-bg-light disabled:opacity-50 transition-colors"
            >
              + 신청자 추가
            </button>
            <button
              onClick={saveApplicants}
              disabled={saveState !== 'unsaved'}
              className="text-xs font-semibold bg-primary text-white px-3 py-1.5 rounded-lg hover:bg-primary-light disabled:opacity-50 transition-colors"
            >
              {saveState === 'saving' ? '저장 중...' : saveState === 'saved' ? '저장됨' : '저장'}
            </button>
          </div>
        </div>

        {saveError && <p className="text-xs text-red-500 mb-2">{saveError}</p>}

        {!applicants ? (
          <div className="loading-spinner scale-75" />
        ) : applicants.length === 0 ? (
          <p className="text-sm text-text-light py-4 text-center">
            등록된 신청자가 없습니다. &lsquo;신청자 추가&rsquo;로 시작하세요.
          </p>
        ) : (
          <div className="space-y-2">
            {applicants.map((a) => {
              const open = expanded === a.id
              return (
                <div
                  key={a.id}
                  className={`rounded-lg border transition-colors ${
                    a.active ? 'border-accent-industry/50 bg-accent-industry/5' : 'border-border bg-white'
                  }`}
                >
                  {/* 요약 줄 */}
                  <div className="flex items-center gap-3 px-3 py-2.5">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={a.active}
                      aria-label={`${a.name || '신규 신청자'} 신청 대상 활성화`}
                      onClick={() => patch(a.id, { active: !a.active })}
                      disabled={status === 'running'}
                      className={`relative w-9 h-5 shrink-0 rounded-full transition-colors disabled:opacity-50 ${
                        a.active ? 'bg-accent-industry' : 'bg-border'
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${
                          a.active ? 'left-[18px]' : 'left-0.5'
                        }`}
                      />
                    </button>

                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-text-base truncate">
                        {a.name || <span className="text-text-light font-normal">이름 없음</span>}
                      </p>
                      <p className="text-xs text-text-light truncate">
                        {a.equipment} · {a.entryTime}~{a.exitTime} · {a.org}
                      </p>
                    </div>

                    <button
                      onClick={() => setExpanded(open ? null : a.id)}
                      className="text-xs text-text-light hover:text-primary px-2 py-1 rounded transition-colors shrink-0"
                    >
                      {open ? '접기' : '편집'}
                    </button>
                    <button
                      onClick={() => removeApplicant(a.id)}
                      disabled={status === 'running'}
                      aria-label={`${a.name || '신규 신청자'} 삭제`}
                      className="text-xs text-text-light hover:text-red-500 px-2 py-1 rounded transition-colors disabled:opacity-50 shrink-0"
                    >
                      삭제
                    </button>
                  </div>

                  {/* 상세 편집 */}
                  {open && (
                    <div className="px-3 pb-3 pt-1 border-t border-border/60 grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {([
                        ['이름 *', 'name', '양현웅'],
                        ['소속 / 기관 *', 'org', '전북대학교 ○○ 교수님 연구실'],
                        ['직급 *', 'position', '석사과정생'],
                        ['연락처 *', 'contact', '010-0000-0000'],
                        ['사용 장비 *', 'equipment', '서버 1호기'],
                        ['방문 목적 *', 'purpose', '연구'],
                      ] as const).map(([label, key, ph]) => (
                        <div key={key}>
                          <label className="text-xs text-text-light block mb-1">{label}</label>
                          <input
                            type="text"
                            value={a[key]}
                            placeholder={ph}
                            onChange={(e) => patch(a.id, { [key]: e.target.value })}
                            disabled={status === 'running'}
                            className={inputCls}
                          />
                        </div>
                      ))}

                      {/* 폼이 정시 선택지만 받으므로 자유 입력 대신 선택 목록으로 둔다 */}
                      {([
                        ['입장 시간', 'entryTime'],
                        ['퇴장 시간', 'exitTime'],
                      ] as const).map(([label, key]) => (
                        <div key={key}>
                          <label className="text-xs text-text-light block mb-1">{label}</label>
                          <select
                            value={a[key]}
                            onChange={(e) => patch(a.id, { [key]: e.target.value })}
                            disabled={status === 'running'}
                            className={inputCls}
                          >
                            {!(TIME_OPTIONS as readonly string[]).includes(a[key]) && (
                              <option value={a[key]}>{a[key]} (선택 불가)</option>
                            )}
                            {TIME_OPTIONS.map((t) => (
                              <option key={t} value={t}>{t}</option>
                            ))}
                          </select>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* 수동 실행 */}
      <div className="border border-border rounded-lg p-4">
        <p className="text-sm font-semibold text-primary mb-3">수동 실행</p>

        <div className="grid grid-cols-[1fr_auto] gap-2 items-end">
          <div>
            <label className="text-xs text-text-light block mb-1">신청일</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              disabled={status === 'running'}
              className={inputCls}
            />
          </div>
          {status === 'running' ? (
            <button
              onClick={stop}
              className="py-2 px-4 rounded-lg text-sm font-semibold border border-red-300 text-red-500 hover:bg-red-50 transition-colors whitespace-nowrap"
            >
              중단
            </button>
          ) : (
            <button
              onClick={run}
              disabled={!date || activeCount === 0 || saveState === 'unsaved'}
              className="py-2 px-4 rounded-lg text-sm font-semibold bg-accent-industry text-white hover:bg-accent-industry/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            >
              {activeCount}명 신청
            </button>
          )}
        </div>

        {saveState === 'unsaved' && (
          <p className="text-xs text-text-light mt-2">저장하지 않은 변경이 있습니다. 저장 후 실행할 수 있습니다.</p>
        )}
        {activeCount === 0 && saveState !== 'unsaved' && (
          <p className="text-xs text-text-light mt-2">신청할 사람을 활성화해 주세요.</p>
        )}
        {runError && <p className="text-xs text-red-500 mt-2">{runError}</p>}

        {logs.length > 0 && (
          <div className="mt-4">
            <p className="text-xs text-text-light font-medium mb-1.5">실행 로그</p>
            <div ref={logRef} className="bg-bg-light rounded-lg p-3 max-h-72 overflow-y-auto space-y-0.5">
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
