import { readFileSync, writeFileSync, existsSync, renameSync } from 'fs'
import { join } from 'path'

const filePath = join(process.cwd(), 'data', 'seminar-schedule.json')

export interface SeminarSchedule {
  enabled: boolean
  dayOfWeek: number  // 0 (Sun) – 6 (Sat)
  hour: number       // 0 – 23
  minute: number     // 0 – 59
}

const DEFAULT: SeminarSchedule = {
  enabled: false,
  dayOfWeek: 1,
  hour: 10,
  minute: 0,
}

export function loadSchedule(): SeminarSchedule {
  if (!existsSync(filePath)) return { ...DEFAULT }
  try {
    const data = JSON.parse(readFileSync(filePath, 'utf-8')) as Partial<SeminarSchedule>
    return {
      enabled: Boolean(data.enabled),
      dayOfWeek: typeof data.dayOfWeek === 'number' ? data.dayOfWeek : DEFAULT.dayOfWeek,
      hour: typeof data.hour === 'number' ? data.hour : DEFAULT.hour,
      minute: typeof data.minute === 'number' ? data.minute : DEFAULT.minute,
    }
  } catch {
    return { ...DEFAULT }
  }
}

export function saveSchedule(schedule: SeminarSchedule): void {
  const tmpPath = filePath + '.tmp'
  writeFileSync(tmpPath, JSON.stringify(schedule, null, 2), 'utf-8')
  renameSync(tmpPath, filePath)
}

export function toCronExpression(s: SeminarSchedule): string {
  return `${s.minute} ${s.hour} * * ${s.dayOfWeek}`
}

const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토']

export function formatSchedule(s: SeminarSchedule): string {
  const hh = String(s.hour).padStart(2, '0')
  const mm = String(s.minute).padStart(2, '0')
  return `매주 ${DAY_NAMES[s.dayOfWeek]}요일 ${hh}:${mm}`
}
