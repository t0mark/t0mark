export type TrendSource =
  | 'arxiv'
  | 'semanticscholar'
  | 'robotreport'
  | 'ieeespectrum'
  | 'robohub'
  | 'rosdiscourse'
  | 'nvidia'
  | 'deepmind'
  | 'openai'

export interface TrendItem {
  id: string           // 고유 식별자 (URL 해시 또는 DOI 기반)
  title: string        // 영문 원제
  titleKo: string      // 한국어 번역 제목
  abstract: string     // 영문 요약
  abstractKo: string   // 한국어 번역 요약
  source: TrendSource  // 데이터 출처
  url: string          // 원문 링크
  publishedAt: string  // ISO 날짜 문자열
  authors?: string[]   // 저자 (학술 논문)
  tags?: string[]      // 카테고리/태그
}

export interface TrendsData {
  lastUpdated: string | null
  items: TrendItem[]
}
