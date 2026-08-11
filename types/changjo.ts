/**
 * Notion 폼의 입장/퇴장 시간은 자유 입력이 아니라 고정 선택지다.
 * 목록에 없는 값(예: 17:30)은 폼에서 선택 자체가 안 된다.
 */
export const TIME_OPTIONS = [
  '07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00', '17:00', '18:00',
] as const

export interface ChangjoApplicant {
  id: string
  name: string
  org: string
  position: string
  contact: string
  purpose: string
  equipment: string
  entryTime: string   // "HH:MM"
  exitTime: string    // "HH:MM"
  active: boolean     // 신청 대상 여부 (수동 실행 · 자동 실행 공통)
}

export interface ChangjoApplicantData {
  applicants: ChangjoApplicant[]
}

export interface ChangjoSchedule {
  enabled: boolean
  hour: number    // 0 – 23
  minute: number  // 0 – 59
}
