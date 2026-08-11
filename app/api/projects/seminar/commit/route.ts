import { NextResponse } from 'next/server'
import { runCommit } from '@/lib/seminar/sync'
import type { ParsedPaper } from '@/lib/seminar/types'

interface Match {
  row: number | null
  paper: ParsedPaper | null
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as { matches?: Match[]; sheetTitle?: string }
    if (!Array.isArray(body.matches)) {
      return NextResponse.json({ error: 'matches array required' }, { status: 400 })
    }
    if (!body.sheetTitle) {
      return NextResponse.json({ error: 'sheetTitle required' }, { status: 400 })
    }
    const result = await runCommit({ matches: body.matches, sheetTitle: body.sheetTitle })
    return NextResponse.json({ ok: true, ...result })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('seminar commit 실패:', err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
