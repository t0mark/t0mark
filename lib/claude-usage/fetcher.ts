import { execFile } from 'child_process'
import { existsSync, readdirSync } from 'fs'
import { homedir } from 'os'
import { join } from 'path'
import { promisify } from 'util'
import type { ClaudeAccountUsage, ClaudeUsageResponse, ClaudeUsageWindow } from '@/types/claude-usage'

const CACHE_TTL_MS = 5 * 60 * 1000
const COMMAND_TIMEOUT_MS = 60 * 1000
const ONE_DAY_MS = 24 * 60 * 60 * 1000
const ACCOUNTS_DIR = join(homedir(), '.claude-usage')
const VSCODE_EXTENSIONS_DIR = join(homedir(), '.vscode-server', 'extensions')
const CLI_EXTENSION_PREFIX = 'anthropic.claude-code-'
const CLI_BINARY_SUBPATH = join('resources', 'native-binary', 'claude')
const USAGE_COMMAND_ARGS = ['-p', '/usage', '--output-format', 'json', '--no-session-persistence']
const SESSION_LABEL = 'Current session'
const WEEK_LABEL = 'Current week (all models)'
const ACCOUNT_DISPLAY_ORDER = ['woong5297', 'iwagoho', 'a96536009', 'tomark']

const execFileAsync = promisify(execFile)

interface ClaudeUsageCacheState {
  cachedUsage: ClaudeUsageResponse | null
  cachedAt: number
  pendingUsage: Promise<ClaudeUsageResponse> | null
}

// 서버 시작 코드와 API 라우트가 같은 캐시를 쓰도록 전역 객체에 보관
const globalCacheHolder = globalThis as typeof globalThis & { __claudeUsageCache?: ClaudeUsageCacheState }
const usageCache = (globalCacheHolder.__claudeUsageCache ??= { cachedUsage: null, cachedAt: 0, pendingUsage: null })

// 환경변수, VS Code 확장의 최신 버전, PATH 순서로 CLI 실행 파일을 찾음
function resolveCliPath(): string {
  if (process.env.CLAUDE_CLI_PATH) return process.env.CLAUDE_CLI_PATH
  if (!existsSync(VSCODE_EXTENSIONS_DIR)) return 'claude'

  const cliPaths = readdirSync(VSCODE_EXTENSIONS_DIR)
    .filter((name) => name.startsWith(CLI_EXTENSION_PREFIX))
    .sort((a, b) => b.localeCompare(a, undefined, { numeric: true }))
    .map((name) => join(VSCODE_EXTENSIONS_DIR, name, CLI_BINARY_SUBPATH))

  return cliPaths.find((cliPath) => existsSync(cliPath)) ?? 'claude'
}

// 지정한 표시 순서의 위치를 반환하고, 목록에 없는 계정은 맨 뒤로 보냄
function displayOrderIndex(label: string): number {
  const orderIndex = ACCOUNT_DISPLAY_ORDER.indexOf(label)
  return orderIndex === -1 ? ACCOUNT_DISPLAY_ORDER.length : orderIndex
}

// 계정별 로그인 폴더 이름을 표시 순서대로 정렬해 계정 목록으로 사용
function listAccountLabels(): string[] {
  return readdirSync(ACCOUNTS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort((a, b) => displayOrderIndex(a) - displayOrderIndex(b) || a.localeCompare(b))
}

// "Nov 4, 1am" 또는 "4:50am" 형식의 리셋 시각을 ISO 문자열로 변환
function parseResetTime(resetText: string): string | null {
  const now = new Date()
  const hasDate = resetText.includes(',')
  const [datePart, timePart] = hasDate
    ? resetText.split(',').map((part) => part.trim())
    : [now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), resetText.trim()]

  const clockTime = timePart.replace(/^(\d+)(am|pm)$/i, '$1:00$2').replace(/(am|pm)$/i, ' $1')
  const resetDate = new Date(`${datePart}, ${now.getFullYear()} ${clockTime}`)
  if (isNaN(resetDate.getTime())) return null

  // 표시된 시각이 이미 지났으면 다음 날 또는 다음 해의 시각으로 보정
  if (resetDate < now) {
    if (hasDate) resetDate.setFullYear(resetDate.getFullYear() + 1)
    else resetDate.setTime(resetDate.getTime() + ONE_DAY_MS)
  }
  return resetDate.toISOString()
}

// /usage 결과 문구에서 지정한 항목의 사용률과 리셋 시각을 추출
function parseUsageWindow(usageText: string, label: string): ClaudeUsageWindow | null {
  const line = usageText.split('\n').find((text) => text.startsWith(`${label}:`))
  const matched = line?.match(/([\d.]+)% used(?: · resets (.+?))?(?: \(.*\))?$/)
  if (!matched) return null

  return {
    utilization: Number(matched[1]),
    resetsAt: matched[2] ? parseResetTime(matched[2]) : null,
  }
}

// 공식 CLI 로 계정 하나의 사용량 조회
async function fetchAccountUsage(cliPath: string, label: string): Promise<ClaudeAccountUsage> {
  try {
    const { stdout } = await execFileAsync(cliPath, USAGE_COMMAND_ARGS, {
      cwd: ACCOUNTS_DIR,
      env: { ...process.env, CLAUDE_CONFIG_DIR: join(ACCOUNTS_DIR, label) },
      timeout: COMMAND_TIMEOUT_MS,
    })

    const { result, is_error: isError } = JSON.parse(stdout) as { result?: string; is_error?: boolean }
    const usageText = result ?? ''
    const fiveHour = parseUsageWindow(usageText, SESSION_LABEL)
    const sevenDay = parseUsageWindow(usageText, WEEK_LABEL)

    if (isError || (!fiveHour && !sevenDay)) {
      console.error(`[ClaudeUsage] ${label} 사용량 응답 해석 실패: ${usageText.slice(0, 200)}`)
      return { label, fiveHour: null, sevenDay: null, error: '조회 실패 (로그인 확인 필요)' }
    }

    return { label, fiveHour, sevenDay, error: null }
  } catch (error) {
    console.error(`[ClaudeUsage] ${label} CLI 실행 오류:`, error instanceof Error ? error.message : error)
    return { label, fiveHour: null, sevenDay: null, error: '조회 실패' }
  }
}

// 모든 계정을 동시에 조회하고 결과를 캐시에 저장
async function refreshUsage(): Promise<ClaudeUsageResponse> {
  const cliPath = resolveCliPath()
  const accounts = await Promise.all(listAccountLabels().map((label) => fetchAccountUsage(cliPath, label)))
  const usage = { accounts, fetchedAt: new Date().toISOString() }
  usageCache.cachedUsage = usage
  usageCache.cachedAt = Date.now()
  console.log(`[ClaudeUsage] ${accounts.length}개 계정 조회 완료`)
  return usage
}

// 사용량을 새로 조회하고, 동시 요청은 진행 중인 조회 하나로 합침
export function refreshClaudeUsage(): Promise<ClaudeUsageResponse> {
  usageCache.pendingUsage ??= refreshUsage().finally(() => { usageCache.pendingUsage = null })
  return usageCache.pendingUsage
}

// 캐시가 있으면 즉시 반환하고, 만료된 경우 백그라운드에서 갱신
export async function getClaudeUsage(): Promise<ClaudeUsageResponse> {
  if (!usageCache.cachedUsage) return refreshClaudeUsage()

  if (Date.now() - usageCache.cachedAt >= CACHE_TTL_MS) {
    refreshClaudeUsage().catch((error) => console.error('[ClaudeUsage] 백그라운드 갱신 실패:', error))
  }
  return usageCache.cachedUsage
}
