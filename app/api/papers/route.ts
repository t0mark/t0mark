import { NextResponse } from 'next/server'
import { readFileSync, writeFileSync, renameSync } from 'fs'
import { join } from 'path'
import type { PaperData } from '@/data/paperStore'

const filePath = join(process.cwd(), 'data', 'papers.json')

export async function GET() {
  try {
    const data = JSON.parse(readFileSync(filePath, 'utf-8')) as PaperData
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ topics: [], papers: [] })
  }
}

export async function POST(request: Request) {
  try {
    const data = (await request.json()) as PaperData
    const tmpPath = filePath + '.tmp'
    writeFileSync(tmpPath, JSON.stringify(data, null, 2), 'utf-8')
    renameSync(tmpPath, filePath)
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('papers.json 저장 실패:', error)
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 })
  }
}
