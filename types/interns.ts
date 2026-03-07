export type InternSource = 'saramin' | 'jobkorea' | 'wanted' | 'jasoseol'

export interface InternItem {
  id: string          // md5(url) 기반 고유 식별자
  title: string       // 공고 제목
  company: string     // 회사/기관명
  location: string    // 근무지
  deadline: string    // 마감일 (ISO string | '상시채용' | '미기재')
  postedAt: string    // 등록일 ISO string
  source: InternSource
  url: string
  tags: string[]      // 직무 키워드
  salary?: string     // 급여 정보
  experience?: string // 경력 조건
}

export interface InternsData {
  lastUpdated: string | null
  items: InternItem[]
}
