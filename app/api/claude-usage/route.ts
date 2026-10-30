import { NextResponse } from 'next/server'
import { getClaudeUsage } from '@/lib/claude-usage/fetcher'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    return NextResponse.json(await getClaudeUsage())
  } catch (error) {
    console.error('Claude 사용량 조회 실패:', error)
    return NextResponse.json({ error: 'Failed to load Claude usage' }, { status: 500 })
  }
}
