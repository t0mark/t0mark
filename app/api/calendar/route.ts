import { NextResponse } from 'next/server'
import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import yaml from 'js-yaml'
import type { CalendarData } from '@/types/calendar'

const filePath = join(process.cwd(), 'data', 'calendar-data.yaml')

export async function GET() {
  try {
    const data = yaml.load(readFileSync(filePath, 'utf-8')) as CalendarData
    return NextResponse.json(data)
  } catch (error) {
    console.error('calendar-data.yaml 로드 실패:', error)
    return NextResponse.json({ error: 'Failed to load calendar data' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json() as CalendarData
    const yamlStr = yaml.dump(body, { lineWidth: -1 })
    writeFileSync(filePath, yamlStr, 'utf-8')
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('calendar-data.yaml 저장 실패:', error)
    return NextResponse.json({ error: 'Failed to save calendar data' }, { status: 500 })
  }
}
