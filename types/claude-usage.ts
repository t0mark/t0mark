export interface ClaudeUsageWindow {
  utilization: number
  resetsAt: string | null
}

export interface ClaudeAccountUsage {
  label: string
  fiveHour: ClaudeUsageWindow | null
  sevenDay: ClaudeUsageWindow | null
  error: string | null
}

export interface ClaudeUsageResponse {
  accounts: ClaudeAccountUsage[]
  fetchedAt: string
}
