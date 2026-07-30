export interface NoteLine {
  depth: number
  text: string
}

export interface NoteData {
  notes: Record<string, NoteLine[]>
}
