import type { ScheduledTask } from 'node-cron'
import { loadSchedule, toCronExpression, formatSchedule } from './schedule'
import { checkBusinessDay, formatDate } from './holidays'
import { loadApplicants } from './applicants'
import { runVisit } from './runner'

const TIMEZONE = 'Asia/Seoul'

let currentTask: ScheduledTask | null = null
let running = false

/** 실행 시점 기준 다음 날 */
function nextDay(from = new Date()): Date {
  const d = new Date(from.getFullYear(), from.getMonth(), from.getDate())
  d.setDate(d.getDate() + 1)
  return d
}

export async function runScheduledVisit(now = new Date()): Promise<void> {
  if (running) {
    console.warn('[Cron] changjo 이전 실행이 아직 진행 중 — 이번 회차 건너뜀')
    return
  }

  const target = nextDay(now)
  const check = await checkBusinessDay(target)
  if (!check.ok) {
    console.log(`[Cron] changjo 건너뜀: ${check.date} 은(는) ${check.reason}`)
    return
  }
  if (check.uncertain) {
    console.warn(`[Cron] changjo ${check.date}: ${check.reason} — 공휴일이면 수동으로 취소하세요`)
  }

  const active = loadApplicants().applicants.filter((a) => a.active)
  if (active.length === 0) {
    console.log('[Cron] changjo 건너뜀: 활성화된 신청자가 없습니다')
    return
  }

  running = true
  console.log(`[Cron] changjo 자동 신청 시작 — ${check.date} (${active.length}명)`)
  try {
    const { done } = runVisit({ date: check.date }, (line) => console.log(`[Changjo] ${line}`))
    const code = await done
    console.log(`[Cron] changjo 종료 (exit ${code})`)
  } catch (err) {
    console.error('[Cron] changjo 실패:', err instanceof Error ? err.message : err)
  } finally {
    running = false
  }
}

export async function registerChangjoCron(): Promise<void> {
  if (currentTask) {
    currentTask.stop()
    currentTask = null
  }

  const schedule = loadSchedule()
  if (!schedule.enabled) {
    console.log('[Cron] changjo 스케줄 비활성화')
    return
  }

  const cron = await import('node-cron')
  const expr = toCronExpression(schedule)

  currentTask = cron.schedule(expr, () => { void runScheduledVisit() }, { timezone: TIMEZONE })
  console.log(`[Cron] changjo 등록: ${formatSchedule(schedule)} (${expr} ${TIMEZONE})`)
}

export async function reloadChangjoCron(): Promise<void> {
  await registerChangjoCron()
}

/**
 * 다음 실행이 언제 일어나고 어떤 날짜를 신청하게 되는지 미리 보여준다 (UI 표시용).
 * 오늘 예정 시각이 이미 지났으면 다음 회차는 내일이므로 신청일은 모레가 된다.
 */
export async function previewNextRun(now = new Date()) {
  const { hour, minute } = loadSchedule()
  const fireAt = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute, 0, 0)
  if (fireAt <= now) fireAt.setDate(fireAt.getDate() + 1)

  const check = await checkBusinessDay(nextDay(fireAt))
  return { fireAt: formatDate(fireAt), ...check }
}
