import { spawn, type ChildProcess } from 'child_process'
import { join } from 'path'

export const scriptPath = join(process.cwd(), 'tools', 'changjo-visit.js')

export interface RunOptions {
  /** 신청일 (YYYY-MM-DD) */
  date: string
  /** 특정 신청자만 실행 (미지정 시 active=true 인 전원) */
  only?: string[]
  /** 폼을 채우되 제출은 하지 않음 */
  dryRun?: boolean
}

export interface RunHandle {
  child: ChildProcess
  /** 종료 코드로 resolve. spawn 자체가 실패하면 -1. */
  done: Promise<number>
}

export const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

/**
 * YYYY-MM-DD 를 로컬 Date 로 파싱한다.
 * new Date('2026-02-30') 은 3월 2일로 굴러가므로 왕복 비교로 실재하는 날짜인지 확인한다.
 */
export function parseIsoDate(str: string): Date | null {
  if (!DATE_RE.test(str)) return null
  const [y, m, d] = str.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) return null
  return date
}

/**
 * 방문 신청 스크립트를 띄우고 stdout/stderr 를 줄 단위로 흘려보낸다.
 * 호출자는 handle.child.kill() 로 언제든 중단할 수 있다.
 */
export function runVisit(opts: RunOptions, onLine: (line: string) => void): RunHandle {
  const args = ['--date', opts.date]
  if (opts.dryRun) args.push('--dry-run')
  for (const id of opts.only ?? []) args.push('--only', id)

  const child = spawn('node', [scriptPath, ...args], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      CHROMIUM_PATH: process.env.CHROMIUM_PATH || '/usr/bin/chromium',
    },
  })

  let buf = ''
  const flush = (chunk: string) => {
    buf += chunk
    const lines = buf.split('\n')
    buf = lines.pop() ?? ''
    for (const line of lines) if (line.trim()) onLine(line)
  }

  child.stdout?.on('data', (d: Buffer) => flush(d.toString()))
  child.stderr?.on('data', (d: Buffer) => flush(d.toString()))

  const done = new Promise<number>((resolve) => {
    child.on('close', (code) => {
      if (buf.trim()) onLine(buf)
      buf = ''
      resolve(code ?? -1)
    })
    child.on('error', (err: Error) => {
      onLine(`오류: ${err.message}`)
      resolve(-1)
    })
  })

  return { child, done }
}
