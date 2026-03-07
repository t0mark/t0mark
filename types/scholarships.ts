export type ScholarshipSource = 'saramin' | 'jobkorea'

export interface ScholarshipItem {
  id: string          // md5(url) 기반 고유 식별자
  title: string       // 공고 제목
  company: string     // 회사/기관명
  location: string    // 근무지
  deadline: string    // 마감일 (ISO string | '상시채용' | '미기재')
  postedAt: string    // 등록일 ISO string
  source: ScholarshipSource
  url: string
  tags: string[]      // 직무/분야 키워드
  salary?: string     // 장학금/지원 금액
  experience?: string // 석사/박사 구분
}

export interface ScholarshipsData {
  lastUpdated: string | null
  items: ScholarshipItem[]
}
