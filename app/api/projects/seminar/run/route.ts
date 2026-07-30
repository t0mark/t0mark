import { runFull } from '@/lib/seminar/sync'

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({} as { date?: string }))
  const dateHint = typeof body.date === 'string' && body.date ? body.date : undefined

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      const write = (obj: unknown) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`))
      }
      const emit = (line: string) => write({ line })

      try {
        const result = await runFull({ dateHint }, emit)
        write({ done: true, result })
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        emit(`✗ 오류: ${msg}`)
        write({ done: true, error: msg })
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    },
  })
}
