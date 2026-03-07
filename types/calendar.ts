export interface DDayItem {
  targetDate: string
}

export interface TodoItem {
  text: string
  deadline?: string // ISO date string, 'ASAP', or 'TYT'
}

export interface CategoryData {
  icon: string
  items: string[]
}

export interface TodoCategoryData {
  icon: string
  items: TodoItem[]
}

// backward-compat aliases
export type TaskCategory = CategoryData
export type TodoCategory = TodoCategoryData

export interface PriorityEntry {
  category: string
  text: string
}

export interface CalendarData {
  dDay: Record<string, DDayItem>
  tasks: Record<string, CategoryData>
  todos: Record<string, TodoCategoryData>
  priorityOrder?: PriorityEntry[]
}

export type DDayColorClass = 'urgent' | 'warning' | 'caution' | 'normal' | 'distant'

export interface TimeProgress {
  year: number
  month: number
  week: number
  day: number
}
