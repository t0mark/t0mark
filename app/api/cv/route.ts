import { NextResponse } from 'next/server'
import { readFileSync, writeFileSync, renameSync } from 'fs'
import { join } from 'path'
import type { CVData } from '@/types/cv'

const filePath = join(process.cwd(), 'data', 'cv.json')
const PASSWORD = '5297'

export async function GET() {
  try {
    const data = JSON.parse(readFileSync(filePath, 'utf-8')) as CVData
    return NextResponse.json(data)
  } catch (error) {
    console.error('cv.json 로드 실패:', error)
    return NextResponse.json({ error: 'Failed to load CV' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  const password = request.headers.get('x-cv-password')
  if (password !== PASSWORD) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  try {
    const body = await request.json() as CVData
    const tmpPath = filePath + '.tmp'
    writeFileSync(tmpPath, JSON.stringify(body, null, 2), 'utf-8')
    renameSync(tmpPath, filePath)
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('cv.json 저장 실패:', error)
    return NextResponse.json({ error: 'Failed to save CV' }, { status: 500 })
  }
}
