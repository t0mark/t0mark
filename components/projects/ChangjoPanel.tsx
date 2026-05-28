'use client'

import { useEffect, useRef, useState } from 'react'

const DEFAULT_EQ = '서버 1호기'

type Status = 'idle' | 'running' | 'done' | 'error'

interface LogLine {
  text: string
  type: 'date' | 'step-ok' | 'step-fail' | 'result' | 'summary' | 'plain'
}

function classifyLine(line: string): LogLine['type'] {
  if (/^\[\d+\/\d+\]/.test(line)) return 'date'
  if (/✓/.test(line)) return 'step-ok'
  if (/✗/.test(line)) return 'step-fail'
  if (/→/.test(line)) return 'result'
  if (/완료:/.test(line)) return 'summary'
  return 'plain'
}

const lineColor: Record<LogLine['type'], string> = {
  date:       'text-accent-industry font-semibold',
  'step-ok':  'text-accent-hardware',
  'step-fail':'text-red-400',
  result:     'text-primary font-semibold',
  summary:    'text-primary font-bold',
  plain:      'text-text-muted',
}

export default function ChangjoPanel() {
  const today = new Date()
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

  const [start, setStart]             = useState(fmt(today))
  const [end, setEnd]                 = useState('')
  const [equipment, setEquipment]     = useState(DEFAULT_EQ)
  const [status, setStatus]           = useState<Status>('idle')
  const [logs, setLogs]               = useState<LogLine[]>([])
  const [currentStep, setCurrentStep] = useState('')
  const logRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight
    }
  }, [logs])

  async function run() {
    setStatus('running')
    setLogs([])
    setCurrentStep('')

    const res = await fetch('/api/projects/changjo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ start, end: end || undefined, equipment }),
    })

    if (!res.ok || !res.body) {
      setStatus('error')
      setLogs([{ text: '서버 오류', type: 'plain' }])
      return
    }

    const reader  = res.body.getReader()
    const dec     = new TextDecoder()
    let   buf     = ''
    let   exitCode = 0

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buf += dec.decode(value, { stream: true })
      const parts = buf.split('\n\n')
      buf = parts.pop() ?? ''

      for (const part of parts) {
        const dataLine = part.split('\n').find(l => l.startsWith('data: '))
        if (!dataLine) continue
        try {
          const payload = JSON.parse(dataLine.slice(6))
          if (payload.done) {
            exitCode = payload.code ?? 0
          } else if (typeof payload.line === 'string') {
            const text = payload.line
            const type = classifyLine(text)

            if (type === 'plain' && /^\s{4}\S/.test(text) && /\.\.\.$/.test(text.trim())) {
              setCurrentStep(text.trim().replace(/\.\.\.$/, ''))
            } else {
              setCurrentStep('')
            }

            setLogs(prev => [...prev, { text, type }])
          }
        } catch (_) {}
      }
    }

    setCurrentStep('')
    setStatus(exitCode === 0 ? 'done' : 'error')
  }

  const statusBadge = {
    idle:    null,
    running: <span className="ml-auto flex items-center gap-2 text-sm text-accent-industry font-semibold"><span className="w-2 h-2 rounded-full bg-accent-industry animate-pulse" />실행 중</span>,
    done:    <span className="ml-auto text-sm text-accent-hardware font-semibold">완료</span>,
    error:   <span className="ml-auto text-sm text-red-500 font-semibold">오류</span>,
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
          <p className="text-sm text-text-light">Notion 폼 자동화</p>
        </div>
        {statusBadge}
      </div>

      {/* 폼 */}
      <div className="space-y-3.5">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm text-text-light block mb-1.5">시작 날짜 *</label>
            <input
              type="date"
              value={start}
              onChange={e => setStart(e.target.value)}
              disabled={status === 'running'}
              className="w-full text-sm border border-border rounded-lg px-3 py-2 focus:outline-none focus:border-accent-industry disabled:opacity-50"
            />
          </div>
          <div>
            <label className="text-sm text-text-light block mb-1.5">종료 날짜 (선택)</label>
            <input
              type="date"
              value={end}
              onChange={e => setEnd(e.target.value)}
              disabled={status === 'running'}
              className="w-full text-sm border border-border rounded-lg px-3 py-2 focus:outline-none focus:border-accent-industry disabled:opacity-50"
            />
          </div>
        </div>

        <div>
          <label className="text-sm text-text-light block mb-1.5">사용 장비</label>
          <input
            type="text"
            value={equipment}
            onChange={e => setEquipment(e.target.value)}
            disabled={status === 'running'}
            placeholder={DEFAULT_EQ}
            className="w-full text-sm border border-border rounded-lg px-3 py-2 focus:outline-none focus:border-accent-industry disabled:opacity-50"
          />
        </div>

        <button
          onClick={run}
          disabled={status === 'running' || !start}
          className="w-full py-2.5 rounded-lg text-sm font-semibold bg-accent-industry text-white hover:bg-accent-industry/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {status === 'running' ? '신청 중...' : '신청 실행'}
        </button>
      </div>

      {/* 실시간 로그 */}
      {(logs.length > 0 || currentStep) && (
        <div className="mt-4">
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-sm text-text-light font-medium">실행 로그</p>
            {currentStep && (
              <span className="text-sm text-accent-industry animate-pulse">{currentStep} 처리 중...</span>
            )}
          </div>
          <div
            ref={logRef}
            className="bg-bg-light rounded-lg p-3 max-h-60 overflow-y-auto space-y-0.5"
          >
            {logs.map((log, i) => (
              <p key={i} className={`text-sm font-mono whitespace-pre ${lineColor[log.type]}`}>
                {log.text}
              </p>
            ))}
            {currentStep && (
              <p className="text-sm font-mono text-accent-industry">
                {'    '}{currentStep}... <span className="animate-pulse">▋</span>
              </p>
            )}
          </div>
        </div>
      )}

      {/* 고정 정보 */}
      <div className="mt-4 pt-4 border-t border-border grid grid-cols-2 gap-2">
        {[
          ['신청자', '양현웅'],
          ['소속', '조형기 교수님 연구실'],
          ['입장', '10:00'],
          ['퇴장', '18:00'],
        ].map(([k, v]) => (
          <div key={k} className="bg-bg-light rounded-lg px-3 py-2">
            <p className="text-xs text-text-light">{k}</p>
            <p className="text-sm font-semibold text-text-base">{v}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
