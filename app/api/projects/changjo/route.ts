import { spawn } from 'child_process'
import { join } from 'path'

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const { start, end, equipment } = body as {
    start?: string
    end?: string
    equipment?: string
  }

  if (!start || !/^\d{4}-\d{2}-\d{2}$/.test(start)) {
    return new Response(JSON.stringify({ error: '시작 날짜가 필요합니다 (YYYY-MM-DD)' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }
  if (end && !/^\d{4}-\d{2}-\d{2}$/.test(end)) {
    return new Response(JSON.stringify({ error: '종료 날짜 형식이 잘못되었습니다 (YYYY-MM-DD)' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const scriptPath = join(process.cwd(), 'scripts', 'changjo-visit.js')
  const args = ['--headless', '--start', start]
  if (end) args.push('--end', end)
  if (equipment) args.push('--equipment', equipment)

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    start(controller) {
      const child = spawn('node', [scriptPath, ...args], {
        env: { ...process.env, CHROMIUM_PATH: '/usr/bin/chromium' },
      })

      const send = (line: string) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ line })}\n\n`))
      }

      let buf = ''
      const flush = (chunk: string) => {
        buf += chunk
        const lines = buf.split('\n')
        buf = lines.pop() ?? ''
        for (const line of lines) {
          if (line.trim()) send(line)
        }
      }

      child.stdout.on('data', (d: Buffer) => flush(d.toString()))
      child.stderr.on('data', (d: Buffer) => flush(d.toString()))

      child.on('close', (code: number) => {
        if (buf.trim()) send(buf)
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true, code })}\n\n`))
        controller.close()
      })

      child.on('error', (err: Error) => {
        send(`오류: ${err.message}`)
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true, code: -1 })}\n\n`))
        controller.close()
      })
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
