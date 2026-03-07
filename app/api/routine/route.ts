import { NextResponse } from 'next/server'
import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import type { RoutineData } from '@/types/routine'

const filePath = join(process.cwd(), 'data', 'routine.json')

const KST_OFFSET_MS = 9 * 60 * 60 * 1000 // UTC+9
const RESET_HOUR_KST = 3

/** KST 기준 "가장 최근 daily 리셋 경계" (매일 03:00 KST) */
function lastDailyBoundary(): Date {
  const nowUTC = Date.now()
  const kstMs = nowUTC + KST_OFFSET_MS
  const kst = new Date(kstMs)

  // KST 날짜/시간 기준으로 오늘 03:00 KST = (오늘 KST날짜 03:00) → UTC로 변환
  const todayResetKST = Date.UTC(
    kst.getUTCFullYear(), kst.getUTCMonth(), kst.getUTCDate(),
    RESET_HOUR_KST, 0, 0, 0,
  ) - KST_OFFSET_MS

  return nowUTC >= todayResetKST
    ? new Date(todayResetKST)
    : new Date(todayResetKST - 86400_000)
}

/** KST 기준 "가장 최근 weekly 리셋 경계" (매주 일요일 03:00 KST) */
function lastWeeklyBoundary(): Date {
  const nowUTC = Date.now()
  const kstMs = nowUTC + KST_OFFSET_MS
  const kst = new Date(kstMs)

  const dayOfWeek = kst.getUTCDay() // 0 = 일요일
  const lastSundayResetKST = Date.UTC(
    kst.getUTCFullYear(), kst.getUTCMonth(), kst.getUTCDate() - dayOfWeek,
    RESET_HOUR_KST, 0, 0, 0,
  ) - KST_OFFSET_MS

  return nowUTC >= lastSundayResetKST
    ? new Date(lastSundayResetKST)
    : new Date(lastSundayResetKST - 7 * 86400_000)
}

/** KST 기준 "가장 최근 monthly 리셋 경계" (매월 1일 03:00 KST) */
function lastMonthlyBoundary(): Date {
  const nowUTC = Date.now()
  const kstMs = nowUTC + KST_OFFSET_MS
  const kst = new Date(kstMs)

  const thisMonthResetKST = Date.UTC(
    kst.getUTCFullYear(), kst.getUTCMonth(), 1,
    RESET_HOUR_KST, 0, 0, 0,
  ) - KST_OFFSET_MS

  if (nowUTC >= thisMonthResetKST) return new Date(thisMonthResetKST)

  // 이번 달 경계 아직 안 지났으면 → 저번 달 1일
  const prevMonthResetKST = Date.UTC(
    kst.getUTCFullYear(), kst.getUTCMonth() - 1, 1,
    RESET_HOUR_KST, 0, 0, 0,
  ) - KST_OFFSET_MS
  return new Date(prevMonthResetKST)
}

function applyAutoReset(data: RoutineData): { data: RoutineData; changed: boolean } {
  let changed = false
  const lastReset = { ...data.lastReset }

  const checks: { recurrence: 'daily' | 'weekly' | 'monthly'; boundary: Date }[] = [
    { recurrence: 'daily',   boundary: lastDailyBoundary() },
    { recurrence: 'weekly',  boundary: lastWeeklyBoundary() },
    { recurrence: 'monthly', boundary: lastMonthlyBoundary() },
  ]

  const items = data.items.map((item) => ({ ...item }))

  for (const { recurrence, boundary } of checks) {
    const lastResetTime = new Date(lastReset[recurrence]).getTime()
    if (lastResetTime < boundary.getTime()) {
      // 체크 해제
      for (const item of items) {
        if (item.recurrence === recurrence && item.checked) {
          item.checked = false
          changed = true
        }
      }
      lastReset[recurrence] = boundary.toISOString()
      changed = true
    }
  }

  return { data: { items, lastReset }, changed }
}

export async function GET() {
  try {
    const raw = readFileSync(filePath, 'utf-8')
    const data = JSON.parse(raw) as RoutineData

    const { data: updated, changed } = applyAutoReset(data)

    if (changed) {
      writeFileSync(filePath, JSON.stringify(updated, null, 2), 'utf-8')
    }

    return NextResponse.json(updated)
  } catch (error) {
    console.error('routine.json 로드 실패:', error)
    return NextResponse.json({ error: 'Failed to load routine data' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json() as RoutineData
    writeFileSync(filePath, JSON.stringify(body, null, 2), 'utf-8')
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('routine.json 저장 실패:', error)
    return NextResponse.json({ error: 'Failed to save routine data' }, { status: 500 })
  }
}
