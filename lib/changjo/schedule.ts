import { readFileSync, writeFileSync, existsSync, renameSync } from 'fs'
import { join } from 'path'
import type { ChangjoSchedule } from '@/types/changjo'

const filePath = join(process.cwd(), 'data', 'changjo-schedule.json')

const DEFAULT: ChangjoSchedule = {
  enabled: false,
  hour: 18,
  minute: 0,
}

export function loadSchedule(): ChangjoSchedule {
  if (!existsSync(filePath)) return { ...DEFAULT }
  try {
    const data = JSON.parse(readFileSync(filePath, 'utf-8')) as Partial<ChangjoSchedule>
    return {
      enabled: Boolean(data.enabled),
      hour: typeof data.hour === 'number' ? data.hour : DEFAULT.hour,
      minute: typeof data.minute === 'number' ? data.minute : DEFAULT.minute,
    }
  } catch {
    return { ...DEFAULT }
  }
}

export function saveSchedule(schedule: ChangjoSchedule): void {
  const tmpPath = filePath + '.tmp'
  writeFileSync(tmpPath, JSON.stringify(schedule, null, 2), 'utf-8')
  renameSync(tmpPath, filePath)
}

/** 매일 실행. 실행 시점의 "다음 날"을 신청하므로 요일 조건은 런타임에서 판정한다. */
export function toCronExpression(s: ChangjoSchedule): string {
  return `${s.minute} ${s.hour} * * *`
}

export function formatSchedule(s: ChangjoSchedule): string {
  const hh = String(s.hour).padStart(2, '0')
  const mm = String(s.minute).padStart(2, '0')
  return `매일 ${hh}:${mm} · 다음 날이 평일일 때만 신청`
}
