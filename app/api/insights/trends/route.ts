import { NextResponse } from 'next/server'
import { readFileSync, existsSync } from 'fs'
import path from 'path'

const DATA_FILE = path.join(process.cwd(), 'data', 'robotics_trends.json')

export async function GET() {
  try {
    if (!existsSync(DATA_FILE)) {
      return NextResponse.json({ lastUpdated: null, items: [] })
    }
    const raw = readFileSync(DATA_FILE, 'utf-8')
    const data = JSON.parse(raw)
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ lastUpdated: null, items: [] })
  }
}
