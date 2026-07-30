import type { ScheduledTask } from 'node-cron'
import { loadSchedule, toCronExpression, formatSchedule } from './schedule'
import { runFull } from './sync'

let currentTask: ScheduledTask | null = null

export async function registerSeminarCron(): Promise<void> {
  if (currentTask) {
    currentTask.stop()
    currentTask = null
  }

  const schedule = loadSchedule()
  if (!schedule.enabled) {
    console.log('[Cron] seminar 스케줄 비활성화')
    return
  }

  const cron = await import('node-cron')
  const expr = toCronExpression(schedule)

  currentTask = cron.schedule(expr, async () => {
    console.log(`[Cron] seminar 자동 동기화 시작 (${new Date().toISOString()})`)
    try {
      const emit = (line: string) => console.log(`[Seminar] ${line}`)
      const result = await runFull({}, emit)
      console.log(`[Cron] seminar 완료: ${result.fileName} → ${result.updated}행 반영`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error(`[Cron] seminar 실패: ${msg}`)
    }
  })
  console.log(`[Cron] seminar 등록: ${formatSchedule(schedule)} (${expr})`)
}

export async function reloadSeminarCron(): Promise<void> {
  await registerSeminarCron()
}
