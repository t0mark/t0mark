'use client'

import { useEffect, useState } from 'react'
import type { ClaudeUsageResponse, ClaudeUsageWindow } from '@/types/claude-usage'

const REFRESH_INTERVAL_MS = 5 * 60 * 1000
const WARNING_PERCENT = 70
const DANGER_PERCENT = 90
const MINUTE_MS = 60 * 1000
const HOUR_MS = 60 * MINUTE_MS
const DAY_MS = 24 * HOUR_MS

// 사용률 구간에 맞는 막대 색상 선택
function barColorClass(utilization: number): string {
  if (utilization >= DANGER_PERCENT) return 'bg-red-500'
  if (utilization >= WARNING_PERCENT) return 'bg-amber-500'
  return 'bg-primary'
}

// 리셋까지 남은 시간을 짧은 문구로 변환
function formatRemaining(resetsAt: string | null): string {
  if (!resetsAt) return ''
  const remainingMs = new Date(resetsAt).getTime() - Date.now()
  if (isNaN(remainingMs) || remainingMs <= 0) return ''
  if (remainingMs >= DAY_MS) return `${Math.floor(remainingMs / DAY_MS)}일 ${Math.floor((remainingMs % DAY_MS) / HOUR_MS)}시간`
  if (remainingMs >= HOUR_MS) return `${Math.floor(remainingMs / HOUR_MS)}시간 ${Math.floor((remainingMs % HOUR_MS) / MINUTE_MS)}분`
  return `${Math.max(1, Math.floor(remainingMs / MINUTE_MS))}분`
}

export default function HomeClaudeUsage() {
  const [data, setData] = useState<ClaudeUsageResponse | null>(null)
  const [error, setError] = useState(false)

  // 화면 진입 시 조회하고 주기적으로 갱신
  useEffect(() => {
    const loadUsage = () => {
      fetch('/api/claude-usage')
        .then((res) => { if (!res.ok) throw new Error(); return res.json() })
        .then((fetched: ClaudeUsageResponse) => {
          setData(fetched)
          setError(false)
        })
        .catch(() => setError(true))
    }

    loadUsage()
    const refreshTimer = setInterval(loadUsage, REFRESH_INTERVAL_MS)
    return () => clearInterval(refreshTimer)
  }, [])

  return (
    <div className="bg-white rounded-xl p-4 shadow-card">
      <h2 className="text-xs font-bold text-primary uppercase tracking-wide mb-3">Claude Usage</h2>
      {error && <p className="text-xs text-red-400">데이터 로드 실패</p>}
      {!data && !error && <div className="loading-spinner scale-75" />}
      {data && data.accounts.length === 0 && (
        <p className="text-xs text-text-muted">등록된 계정이 없습니다.</p>
      )}
      <div className="space-y-3">
        {data?.accounts.map((account) => (
          <div key={account.label}>
            <p className="text-xs font-semibold text-primary mb-1 truncate">{account.label}</p>
            {account.error ? (
              <p className="text-[11px] text-red-400">{account.error}</p>
            ) : (
              <div className="space-y-1">
                <UsageBar name="5시간" usageWindow={account.fiveHour} />
                <UsageBar name="7일" usageWindow={account.sevenDay} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

interface UsageBarProps {
  name: string
  usageWindow: ClaudeUsageWindow | null
}

function UsageBar({ name, usageWindow }: UsageBarProps) {
  const utilization = usageWindow?.utilization ?? 0
  const remaining = usageWindow ? formatRemaining(usageWindow.resetsAt) : ''

  return (
    <div title={remaining ? `${remaining} 후 리셋` : undefined}>
      <div className="flex justify-between text-[11px] text-text-muted mb-0.5">
        <span>{name}{remaining && ` · ${remaining}`}</span>
        <span>{usageWindow ? `${Math.round(utilization)}%` : '-'}</span>
      </div>
      <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${barColorClass(utilization)}`}
          style={{ width: `${Math.min(100, Math.max(0, utilization))}%` }}
        />
      </div>
    </div>
  )
}
