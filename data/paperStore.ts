export interface Topic {
  id: string
  name: string
  description: string
  color: string
}

export interface Paper {
  id: string
  topicId: string
  title: string
  year: number
  authors: string
  venue: string
  summary: string
  problem: string
  method: string
  results: string
  limitations: string
  components: string[]
  codeUrl: string
}

export interface PaperData {
  topics: Topic[]
  papers: Paper[]
}

export type ClickedNode =
  | { type: 'topic'; data: Topic }
  | { type: 'paper'; data: Paper; topic: Topic | null }
  | { type: 'component'; name: string; papers: Paper[] }

export const TOPIC_COLORS = [
  '#7c3aed', '#0ea5e9', '#10b981', '#f59e0b',
  '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16',
  '#f97316', '#ec4899',
]

export async function loadPaperData(): Promise<PaperData> {
  try {
    const res = await fetch('/api/papers')
    if (!res.ok) return { topics: [], papers: [] }
    return (await res.json()) as PaperData
  } catch {
    return { topics: [], papers: [] }
  }
}

export async function savePaperData(data: PaperData): Promise<void> {
  await fetch('/api/papers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
}

export function generateId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}
