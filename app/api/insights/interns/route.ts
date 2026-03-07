import { NextResponse } from 'next/server'
import { readFileSync, existsSync } from 'fs'
import path from 'path'

const DATA_FILE = path.join(process.cwd(), 'data', 'interns.json')

export async function GET() {
  if (!existsSync(DATA_FILE)) {
    return NextResponse.json({ lastUpdated: null, items: [] })
  }
  try {
    const data = JSON.parse(readFileSync(DATA_FILE, 'utf-8'))
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ lastUpdated: null, items: [] })
  }
}
