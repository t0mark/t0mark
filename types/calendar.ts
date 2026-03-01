export interface DDayItem {
  targetDate: string
}

export interface CategoryData {
  icon: string
  items: string[]
}

// backward-compat aliases
export type TaskCategory = CategoryData
export type TodoCategory = CategoryData

export interface CalendarData {
  dDay: Record<string, DDayItem>
  tasks: Record<string, CategoryData>
  todos: Record<string, CategoryData>
}

export type DDayColorClass = 'urgent' | 'warning' | 'caution' | 'normal' | 'distant'

export interface TimeProgress {
  year: number
  month: number
  week: number
  day: number
}
