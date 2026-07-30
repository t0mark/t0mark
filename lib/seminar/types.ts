export interface ParsedPaper {
  title: string
  venue: string
  year: string
  presenter: string
}

export interface WeekBlock {
  date: string           // 'YYYY-MM-DD'
  dateRow: number        // 1-indexed row number in sheet
  headerRow: number
  presenterRows: Array<{ row: number; name: string }>
}

export interface SlideElement {
  text: string
  y: number
  placeholderType: string | null
}

export interface SlideDump {
  slideIndex: number
  elements: SlideElement[]
  pageHeight: number
}

export interface SyncEvent {
  type: 'info' | 'ok' | 'warn' | 'error' | 'result'
  message: string
}

export interface PreviewResult {
  fileName: string
  fileDate: string
  papers: ParsedPaper[]
  block: {
    date: string
    presenterRows: Array<{ row: number; name: string }>
  } | null
  matches: Array<{
    presenter: string
    row: number | null
    paper: ParsedPaper | null
  }>
}
