import { NextResponse } from 'next/server'
import { readFileSync } from 'fs'
import { join } from 'path'
import type { HardwareData } from '@/types/graduate'

export async function GET() {
  try {
    const filePath = join(process.cwd(), 'data', 'graduate', 'hardware.json')
    const fileContent = readFileSync(filePath, 'utf-8')
    const data = JSON.parse(fileContent) as HardwareData
    return NextResponse.json(data)
  } catch (error) {
    console.error('hardware.json 로드 실패:', error)
    return NextResponse.json({ error: 'Failed to load hardware data' }, { status: 500 })
  }
}
