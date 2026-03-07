export type RoutineRecurrence = 'daily' | 'weekly' | 'monthly' | 'every-semester' | 'annually'

export interface RoutineItem {
  id: string
  text: string
  recurrence: RoutineRecurrence
  checked: boolean
}

export interface RoutineData {
  items: RoutineItem[]
  lastReset: {
    daily: string    // ISO timestamp
    weekly: string
    monthly: string
  }
}
