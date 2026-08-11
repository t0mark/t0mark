import type { ChildProcess } from 'child_process'
import { runVisit, parseIsoDate } from '@/lib/changjo/runner'
import { loadApplicants } from '@/lib/changjo/applicants'

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const { date, only, dryRun } = body as {
    date?: string
    only?: string[]
    dryRun?: boolean
  }

  const bad = (error: string) =>
    new Response(JSON.stringify({ error }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })

  const targetDate = typeof date === 'string' ? date : ''
  const parsed = parseIsoDate(targetDate)
  if (!parsed) return bad('신청일이 필요합니다 (실재하는 YYYY-MM-DD)')

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  if (parsed < today) return bad('지난 날짜로는 신청할 수 없습니다.')

  const ids = Array.isArray(only) ? only.filter((v): v is string => typeof v === 'string') : []
  const all = loadApplicants().applicants
  const targets = ids.length ? all.filter((a) => ids.includes(a.id)) : all.filter((a) => a.active)
  if (targets.length === 0) return bad('활성화된 신청자가 없습니다. 신청할 사람을 활성화해 주세요.')

  const encoder = new TextEncoder()
  let child: ChildProcess | null = null

  const stream = new ReadableStream({
    start(controller) {
      let closed = false
      const push = (payload: unknown) => {
        if (closed) return
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`))
        } catch {
          closed = true
        }
      }

      const handle = runVisit(
        { date: targetDate, only: ids, dryRun: Boolean(dryRun) },
        (line) => push({ line }),
      )
      child = handle.child

      handle.done.then((code) => {
        push({ done: true, code })
        closed = true
        try { controller.close() } catch { /* 이미 닫힘 */ }
      })
    },
    // 브라우저가 연결을 끊으면 chromium 이 그대로 남는다 — 같이 정리한다.
    cancel() {
      child?.kill('SIGTERM')
      const doomed = child
      setTimeout(() => { if (doomed && doomed.exitCode === null) doomed.kill('SIGKILL') }, 5000)
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
