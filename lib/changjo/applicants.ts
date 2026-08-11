import { readFileSync, writeFileSync, existsSync, renameSync } from 'fs'
import { randomUUID } from 'crypto'
import { join } from 'path'
import { TIME_OPTIONS, type ChangjoApplicant, type ChangjoApplicantData } from '@/types/changjo'

export const applicantsPath = join(process.cwd(), 'data', 'changjo-applicants.json')

const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/

export const APPLICANT_DEFAULTS: Omit<ChangjoApplicant, 'id' | 'name'> = {
  org: '전북대학교 조형기 교수님 연구실',
  position: '석사과정생',
  contact: '',
  purpose: '연구',
  equipment: '서버 1호기',
  entryTime: '10:00',
  exitTime: '18:00',
  active: false,
}

function str(v: unknown, fallback: string): string {
  return typeof v === 'string' && v.trim() ? v.trim() : fallback
}

function time(v: unknown, fallback: string): string {
  return typeof v === 'string' && TIME_RE.test(v.trim()) ? v.trim() : fallback
}

/** 외부 입력을 신뢰 가능한 형태로 정규화. id 가 없으면 새로 발급한다. */
export function normalizeApplicant(raw: unknown): ChangjoApplicant {
  const o = (raw ?? {}) as Partial<ChangjoApplicant>
  return {
    id:        str(o.id, randomUUID()),
    name:      str(o.name, ''),
    org:       str(o.org, APPLICANT_DEFAULTS.org),
    position:  str(o.position, APPLICANT_DEFAULTS.position),
    contact:   typeof o.contact === 'string' ? o.contact.trim() : '',
    purpose:   str(o.purpose, APPLICANT_DEFAULTS.purpose),
    equipment: str(o.equipment, APPLICANT_DEFAULTS.equipment),
    entryTime: time(o.entryTime, APPLICANT_DEFAULTS.entryTime),
    exitTime:  time(o.exitTime, APPLICANT_DEFAULTS.exitTime),
    active:    Boolean(o.active),
  }
}

export function loadApplicants(): ChangjoApplicantData {
  if (!existsSync(applicantsPath)) return { applicants: [] }
  try {
    const data = JSON.parse(readFileSync(applicantsPath, 'utf-8')) as Partial<ChangjoApplicantData>
    const list = Array.isArray(data.applicants) ? data.applicants : []
    return { applicants: list.map(normalizeApplicant) }
  } catch {
    return { applicants: [] }
  }
}

export function saveApplicants(data: ChangjoApplicantData): void {
  const tmpPath = applicantsPath + '.tmp'
  writeFileSync(tmpPath, JSON.stringify(data, null, 2), 'utf-8')
  renameSync(tmpPath, applicantsPath)
}

/** 저장 전 유효성 검사. 문제가 있으면 사람이 읽을 수 있는 메시지를 돌려준다. */
export function validateApplicants(list: ChangjoApplicant[]): string | null {
  if (list.length > 20) return '신청자는 최대 20명까지 등록할 수 있습니다.'
  const seen = new Set<string>()
  for (const a of list) {
    if (!a.name) return '이름이 비어 있는 신청자가 있습니다.'
    if (seen.has(a.id)) return `신청자 id 가 중복되었습니다: ${a.id}`
    seen.add(a.id)
    if (!a.contact) return `${a.name}: 연락처를 입력해 주세요.`
    if (!a.equipment) return `${a.name}: 사용 장비를 입력해 주세요.`
    for (const [label, v] of [['입장', a.entryTime], ['퇴장', a.exitTime]] as const) {
      if (!(TIME_OPTIONS as readonly string[]).includes(v)) {
        return `${a.name}: ${label} 시간 "${v}" 은(는) 폼에서 선택할 수 없습니다. ${TIME_OPTIONS[0]}~${TIME_OPTIONS[TIME_OPTIONS.length - 1]} 정시만 가능합니다.`
      }
    }
    if (a.exitTime <= a.entryTime) return `${a.name}: 퇴장 시간이 입장 시간보다 빠르거나 같습니다.`
  }
  return null
}
