import { NextResponse } from 'next/server'
import { loadSchedule, saveSchedule, formatSchedule } from '@/lib/changjo/schedule'
import { reloadChangjoCron, previewNextRun } from '@/lib/changjo/cron'
import type { ChangjoSchedule } from '@/types/changjo'

export async function GET() {
  const schedule = loadSchedule()
  return NextResponse.json({
    schedule,
    description: formatSchedule(schedule),
    nextRun: await previewNextRun(),
  })
}

export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as Partial<ChangjoSchedule>

    const schedule: ChangjoSchedule = {
      enabled: Boolean(body.enabled),
      hour: typeof body.hour === 'number' ? body.hour : 18,
      minute: typeof body.minute === 'number' ? body.minute : 0,
    }
    if (!Number.isInteger(schedule.hour) || schedule.hour < 0 || schedule.hour > 23) {
      return NextResponse.json({ error: '시는 0-23 사이여야 합니다' }, { status: 400 })
    }
    if (!Number.isInteger(schedule.minute) || schedule.minute < 0 || schedule.minute > 59) {
      return NextResponse.json({ error: '분은 0-59 사이여야 합니다' }, { status: 400 })
    }

    saveSchedule(schedule)
    await reloadChangjoCron()
    return NextResponse.json({
      ok: true,
      schedule,
      description: formatSchedule(schedule),
      nextRun: await previewNextRun(),
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}
