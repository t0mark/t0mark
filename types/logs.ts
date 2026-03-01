export interface LogRow {
  day: string
  category: string
  items: string[]
}

export interface LogWeek {
  week: string
  rows: LogRow[]
}

export interface LogData {
  logs: LogWeek[]
}
