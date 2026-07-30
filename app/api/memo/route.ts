import { NextResponse } from 'next/server'
import { readFileSync, writeFileSync, renameSync } from 'fs'
import { join } from 'path'
import type { MemoData } from '@/types/memo'

const filePath = join(process.cwd(), 'data', 'memos.json')

export async function GET() {
  try {
    const data = JSON.parse(readFileSync(filePath, 'utf-8')) as MemoData
    return NextResponse.json(data)
  } catch (error) {
    console.error('memos.json 로드 실패:', error)
    return NextResponse.json({ error: 'Failed to load memo' }, { status: 500 })
  }
}

async function save(request: Request) {
  try {
    const body = await request.json() as MemoData
    const tmpPath = filePath + '.tmp'
    writeFileSync(tmpPath, JSON.stringify(body, null, 2), 'utf-8')
    renameSync(tmpPath, filePath)
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('memos.json 저장 실패:', error)
    return NextResponse.json({ error: 'Failed to save memo' }, { status: 500 })
  }
}

export const PUT = save
export const POST = save
