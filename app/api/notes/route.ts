import { NextResponse } from 'next/server'
import { readFileSync, writeFileSync, renameSync } from 'fs'
import { join } from 'path'
import type { NoteData } from '@/types/notes'

const filePath = join(process.cwd(), 'data', 'notes.json')

export async function GET() {
  try {
    const data = JSON.parse(readFileSync(filePath, 'utf-8')) as NoteData
    return NextResponse.json(data)
  } catch (error) {
    console.error('notes.json 로드 실패:', error)
    return NextResponse.json({ error: 'Failed to load notes' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json() as NoteData
    const tmpPath = filePath + '.tmp'
    writeFileSync(tmpPath, JSON.stringify(body, null, 2), 'utf-8')
    renameSync(tmpPath, filePath)
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('notes.json 저장 실패:', error)
    return NextResponse.json({ error: 'Failed to save notes' }, { status: 500 })
  }
}
