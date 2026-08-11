import { readFileSync, writeFileSync, existsSync, mkdirSync, renameSync } from 'fs'
import { join } from 'path'

const cacheDir  = join(process.cwd(), 'data', '.cache')
const cachePath = join(cacheDir, 'kr-holidays.json')

const API = (year: number) => `https://date.nager.at/api/v3/PublicHolidays/${year}/KR`
const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000  // 30일

/**
 * Nager.Date 가 공휴일로 내려주지만 실제로는 관공서 공휴일이 아닌 날.
 * 제헌절은 2008년부터 공휴일에서 제외됐다 (국경일이지만 정상 근무일).
 */
const NOT_ACTUALLY_HOLIDAY = new Set(['제헌절'])

/** API 를 못 쓸 때 쓰는 내장 표. 확인된 값이라 조용히 틀리지 않는다. */
const FALLBACK: Record<string, Record<string, string>> = {
  '2026': {
    '2026-01-01': '새해', '2026-02-16': '설날', '2026-02-17': '설날', '2026-02-18': '설날',
    '2026-03-02': '3·1절', '2026-05-01': '노동절', '2026-05-05': '어린이날',
    '2026-05-25': '부처님 오신 날', '2026-06-03': '지방 선거일', '2026-06-06': '현충일',
    '2026-08-17': '광복절', '2026-09-24': '추석', '2026-09-25': '추석', '2026-09-26': '추석',
    '2026-10-05': '개천절', '2026-10-09': '한글날', '2026-12-25': '크리스마스',
  },
  '2027': {
    '2027-01-01': '새해', '2027-02-06': '설날', '2027-02-08': '설날', '2027-02-09': '설날',
    '2027-03-01': '3·1절', '2027-05-03': '노동절', '2027-05-05': '어린이날',
    '2027-05-13': '부처님 오신 날', '2027-06-06': '현충일', '2027-08-16': '광복절',
    '2027-09-14': '추석', '2027-09-15': '추석', '2027-09-16': '추석',
    '2027-10-04': '개천절', '2027-10-11': '한글날', '2027-12-25': '크리스마스',
  },
}

type CacheFile = Record<string, { fetchedAt: number; days: Record<string, string> }>

function readCache(): CacheFile {
  if (!existsSync(cachePath)) return {}
  try {
    return JSON.parse(readFileSync(cachePath, 'utf-8')) as CacheFile
  } catch {
    return {}
  }
}

function writeCache(cache: CacheFile): void {
  try {
    mkdirSync(cacheDir, { recursive: true })
    const tmpPath = cachePath + '.tmp'
    writeFileSync(tmpPath, JSON.stringify(cache, null, 2), 'utf-8')
    renameSync(tmpPath, cachePath)
  } catch (err) {
    console.warn('[Changjo] 공휴일 캐시 저장 실패:', err instanceof Error ? err.message : err)
  }
}

export type HolidaySource = 'api' | 'cache' | 'fallback' | 'none'

/** 해당 연도의 공휴일 표(YYYY-MM-DD → 이름)를 돌려준다. */
export async function loadHolidays(
  year: number,
): Promise<{ days: Record<string, string>; source: HolidaySource }> {
  const key = String(year)
  const cache = readCache()
  const hit = cache[key]
  if (hit && Date.now() - hit.fetchedAt < CACHE_TTL_MS) {
    return { days: hit.days, source: 'cache' }
  }

  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 10_000)
    const res = await fetch(API(year), { signal: controller.signal })
    clearTimeout(timer)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)

    const raw = (await res.json()) as Array<{ date: string; localName: string }>
    const days: Record<string, string> = {}
    for (const h of raw) {
      if (!h?.date || NOT_ACTUALLY_HOLIDAY.has(h.localName)) continue
      days[h.date] = h.localName
    }
    if (Object.keys(days).length === 0) throw new Error('빈 응답')

    cache[key] = { fetchedAt: Date.now(), days }
    writeCache(cache)
    return { days, source: 'api' }
  } catch (err) {
    console.warn(
      `[Changjo] 공휴일 API 조회 실패(${year}):`,
      err instanceof Error ? err.message : err,
    )
    if (hit) return { days: hit.days, source: 'cache' }
    if (FALLBACK[key]) return { days: FALLBACK[key], source: 'fallback' }
    return { days: {}, source: 'none' }
  }
}

export function formatDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토']

export interface BusinessDayCheck {
  ok: boolean
  date: string
  reason: string
  /** 공휴일 정보를 확보하지 못한 채 통과시킨 경우 true */
  uncertain: boolean
}

/**
 * 평일(주말·공휴일 제외) 여부를 판정한다.
 * 공휴일 표를 전혀 확보하지 못하면 주말 여부만 보고 통과시키되 uncertain 을 세운다.
 */
export async function checkBusinessDay(d: Date): Promise<BusinessDayCheck> {
  const date = formatDate(d)
  const dow = d.getDay()
  if (dow === 0 || dow === 6) {
    return { ok: false, date, reason: `주말(${DAY_NAMES[dow]}요일)`, uncertain: false }
  }

  const { days, source } = await loadHolidays(d.getFullYear())
  if (source === 'none') {
    return {
      ok: true,
      date,
      reason: `평일(${DAY_NAMES[dow]}요일) · 공휴일 정보 확인 불가`,
      uncertain: true,
    }
  }
  if (days[date]) {
    return { ok: false, date, reason: `공휴일(${days[date]})`, uncertain: false }
  }
  return { ok: true, date, reason: `평일(${DAY_NAMES[dow]}요일)`, uncertain: false }
}
