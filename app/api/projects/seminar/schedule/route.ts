import { NextResponse } from 'next/server'
import { loadSchedule, saveSchedule, formatSchedule, type SeminarSchedule } from '@/lib/seminar/schedule'
import { reloadSeminarCron } from '@/lib/seminar/cron'

export async function GET() {
  const schedule = loadSchedule()
  return NextResponse.json({ schedule, description: formatSchedule(schedule) })
}

export async function PUT(request: Request) {
  try {
    const body = await request.json() as Partial<SeminarSchedule>

    const schedule: SeminarSchedule = {
      enabled: Boolean(body.enabled),
      dayOfWeek: typeof body.dayOfWeek === 'number' ? body.dayOfWeek : 1,
      hour: typeof body.hour === 'number' ? body.hour : 10,
      minute: typeof body.minute === 'number' ? body.minute : 0,
    }
    if (schedule.dayOfWeek < 0 || schedule.dayOfWeek > 6) {
      return NextResponse.json({ error: 'dayOfWeek must be 0-6' }, { status: 400 })
    }
    if (schedule.hour < 0 || schedule.hour > 23) {
      return NextResponse.json({ error: 'hour must be 0-23' }, { status: 400 })
    }
    if (schedule.minute < 0 || schedule.minute > 59) {
      return NextResponse.json({ error: 'minute must be 0-59' }, { status: 400 })
    }

    saveSchedule(schedule)
    await reloadSeminarCron()
    return NextResponse.json({ ok: true, schedule, description: formatSchedule(schedule) })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 400 })
  }
}
