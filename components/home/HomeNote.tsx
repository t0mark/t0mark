'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { ChevronRight, ChevronDown } from 'lucide-react'
import type { CalendarData } from '@/types/calendar'
import type { NoteData, NoteLine } from '@/types/notes'

const MAX_DEPTH = 6

function deadlineRank(deadline?: string): number {
  if (deadline === 'ASAP') return 0
  if (deadline && deadline !== 'TYT') return 1
  if (deadline === 'TYT') return 2
  return 3
}

// 어떤 legacy 스키마든 NoteLine[] 로 흡수
function migrateValue(val: unknown): NoteLine[] {
  if (Array.isArray(val)) {
    if (val.length === 0) return []
    return val.map((entry): NoteLine => {
      if (typeof entry === 'string') {
        const tabs = /^\t*/.exec(entry)?.[0].length ?? 0
        return { depth: tabs, text: entry.slice(tabs) }
      }
      if (entry && typeof entry === 'object') {
        const obj = entry as Record<string, unknown>
        if (typeof obj.text === 'string') {
          const depth = typeof obj.depth === 'number' ? obj.depth : 0
          return { depth, text: obj.text }
        }
        if (typeof obj.content === 'string') {
          return { depth: 0, text: obj.content }
        }
        if (Array.isArray(obj.content)) {
          const text = obj.content
            .map((c) => (c && typeof c === 'object' && typeof (c as Record<string, unknown>).text === 'string'
              ? (c as { text: string }).text
              : ''))
            .join('')
          return { depth: 0, text }
        }
      }
      return { depth: 0, text: '' }
    })
  }
  if (typeof val === 'string') {
    if (val === '') return []
    return val.split('\n').map((line) => {
      const tabs = /^\t*/.exec(line)?.[0].length ?? 0
      return { depth: tabs, text: line.slice(tabs).replace(/^[•◦▪]\s?/, '') }
    })
  }
  return []
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function linesToHtml(lines: NoteLine[]): string {
  const safe = lines.length > 0 ? lines : [{ depth: 0, text: '' }]
  return safe
    .map((l) =>
      `<div data-depth="${l.depth}" style="--depth:${l.depth}">${l.text ? escapeHtml(l.text) : '<br>'}</div>`
    )
    .join('')
}

function readLinesFromEditor(el: HTMLDivElement): NoteLine[] {
  const result: NoteLine[] = []
  Array.from(el.children).forEach((child) => {
    if (child.nodeName !== 'DIV') return
    const div = child as HTMLElement
    const depth = parseInt(div.dataset.depth ?? '0', 10) || 0
    const text = div.textContent ?? ''
    result.push({ depth, text })
  })
  return result
}

function normalizeStructure(el: HTMLDivElement) {
  // 최상위 자식 중 <div> 가 아닌 것들 (텍스트 노드, <br>) 을 <div> 로 감싼다.
  // 커서를 잃지 않도록 Selection 저장/복원.
  const selection = window.getSelection()
  let anchorNode: Node | null = null
  let anchorOffset = 0
  let focusNode: Node | null = null
  let focusOffset = 0
  if (selection && selection.rangeCount > 0) {
    anchorNode = selection.anchorNode
    anchorOffset = selection.anchorOffset
    focusNode = selection.focusNode
    focusOffset = selection.focusOffset
  }

  const children = Array.from(el.childNodes)
  let changed = false
  let buffer: Node[] = []

  const flushBuffer = (before: Node | null) => {
    if (buffer.length === 0) return
    const div = document.createElement('div')
    for (const n of buffer) div.appendChild(n)
    el.insertBefore(div, before)
    buffer = []
    changed = true
  }

  for (const node of children) {
    if (node.nodeType === Node.ELEMENT_NODE && (node as Element).tagName === 'DIV') {
      flushBuffer(node)
    } else {
      buffer.push(node)
    }
  }
  flushBuffer(null)

  if (changed && selection && anchorNode) {
    try {
      const range = document.createRange()
      range.setStart(anchorNode, Math.min(anchorOffset, anchorNode.textContent?.length ?? 0))
      range.setEnd(focusNode ?? anchorNode, Math.min(focusOffset, (focusNode ?? anchorNode).textContent?.length ?? 0))
      selection.removeAllRanges()
      selection.addRange(range)
    } catch { /* ignore */ }
  }
}

// 새로 생긴 div (Enter 로 만들어진 것 등) 는 이전 형제 div 의 depth 를 상속
function propagateDepths(el: HTMLDivElement) {
  let prevDepth = 0
  Array.from(el.children).forEach((child) => {
    if (child.nodeName !== 'DIV') return
    const div = child as HTMLElement
    let depth: number
    if (div.dataset.depth != null && div.dataset.depth !== '') {
      depth = parseInt(div.dataset.depth, 10) || 0
    } else {
      depth = prevDepth
      div.dataset.depth = String(depth)
    }
    div.style.setProperty('--depth', String(depth))
    prevDepth = depth
  })
}

function getCurrentTopDiv(editor: HTMLDivElement): HTMLElement | null {
  const sel = window.getSelection()
  if (!sel || sel.rangeCount === 0) return null
  let node: Node | null = sel.anchorNode
  while (node && node.parentNode !== editor) {
    node = node.parentNode
  }
  if (node && node.nodeType === Node.ELEMENT_NODE && (node as Element).tagName === 'DIV') {
    return node as HTMLElement
  }
  return null
}

interface NoteEditorProps {
  itemKey: string
  initialLines: NoteLine[]
  onChange: (key: string, lines: NoteLine[]) => void
}

function NoteEditor({ itemKey, initialLines, onChange }: NoteEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = editorRef.current
    if (!el) return
    el.innerHTML = linesToHtml(initialLines)
    propagateDepths(el)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function commit() {
    if (!editorRef.current) return
    const lines = readLinesFromEditor(editorRef.current)
    onChange(itemKey, lines)
  }

  function handleInput() {
    if (!editorRef.current) return
    normalizeStructure(editorRef.current)
    propagateDepths(editorRef.current)
    commit()
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'Tab') {
      e.preventDefault()
      const editor = editorRef.current
      if (!editor) return
      const div = getCurrentTopDiv(editor)
      if (!div) return
      const current = parseInt(div.dataset.depth ?? '0', 10) || 0
      const next = e.shiftKey ? Math.max(0, current - 1) : Math.min(MAX_DEPTH, current + 1)
      if (next === current) return
      div.dataset.depth = String(next)
      div.style.setProperty('--depth', String(next))
      commit()
    }
  }

  function handlePaste(e: React.ClipboardEvent<HTMLDivElement>) {
    e.preventDefault()
    const text = e.clipboardData.getData('text/plain')
    document.execCommand('insertText', false, text)
  }

  return (
    <div
      ref={editorRef}
      contentEditable
      suppressContentEditableWarning
      onInput={handleInput}
      onKeyDown={handleKeyDown}
      onPaste={handlePaste}
      className="note-editor text-sm text-text-muted leading-relaxed"
      spellCheck={false}
    />
  )
}

interface HomeNoteProps {
  data: CalendarData | null
}

export default function HomeNote({ data }: HomeNoteProps) {
  const [notes, setNotes] = useState<Record<string, NoteLine[]>>({})
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(false)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const expandInitialized = useRef(false)

  useEffect(() => {
    fetch('/api/notes')
      .then((res) => { if (!res.ok) throw new Error(); return res.json() })
      .then((d: { notes?: Record<string, unknown> }) => {
        const migrated: Record<string, NoteLine[]> = {}
        for (const [k, v] of Object.entries(d.notes ?? {})) {
          migrated[k] = migrateValue(v)
        }
        setNotes(migrated)
        setLoaded(true)
      })
      .catch(() => setError(true))
  }, [])

  useEffect(() => {
    if (!data || expandInitialized.current) return
    expandInitialized.current = true
    const initial = new Set<string>()
    Object.entries(data.todos).forEach(([category, catData]) => {
      catData.items.forEach((item) => {
        if (item.text && item.text.trim() && item.deadline && item.deadline !== 'TYT') {
          initial.add(`${category}::${item.text}`)
        }
      })
    })
    setExpanded(initial)
  }, [data])

  const scheduleSave = useCallback((updated: Record<string, NoteLine[]>) => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      const payload: NoteData = { notes: updated }
      fetch('/api/notes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
    }, 500)
  }, [])

  const handleEditorChange = useCallback((key: string, lines: NoteLine[]) => {
    setNotes((prev) => {
      const updated = { ...prev, [key]: lines }
      scheduleSave(updated)
      return updated
    })
  }, [scheduleSave])

  function toggle(key: string) {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  if (error) return <p className="text-xs text-red-400">데이터 로드 실패</p>
  if (!data || !loaded) return <div className="loading-spinner scale-75" />

  const flat = Object.entries(data.todos).flatMap(([category, catData]) =>
    catData.items
      .filter((item) => item.text && item.text.trim())
      .map((item) => ({
        key: `${category}::${item.text}`,
        icon: catData.icon,
        text: item.text,
        deadline: item.deadline,
      }))
  )

  flat.sort((a, b) => {
    const ra = deadlineRank(a.deadline)
    const rb = deadlineRank(b.deadline)
    if (ra !== rb) return ra - rb
    if (ra === 1) return a.deadline!.localeCompare(b.deadline!)
    return a.text.localeCompare(b.text, 'ko')
  })

  const items = flat.map((item, idx) => {
    const rank = deadlineRank(item.deadline)
    const prevRank = idx > 0 ? deadlineRank(flat[idx - 1].deadline) : -1
    const showDivider = rank >= 2 && prevRank < 2
    return { ...item, showDivider }
  })

  if (items.length === 0) {
    return <p className="text-xs text-text-light italic">TODO 항목이 없습니다</p>
  }

  return (
    <div className="space-y-2">
      {items.map(({ key, icon, text, showDivider }) => {
        const isOpen = expanded.has(key)
        return (
          <div key={key}>
            {showDivider && (
              <div className="flex items-center gap-2 pt-2 pb-1">
                <div className="flex-1 border-t border-dashed border-border" />
                <span className="text-[10px] font-semibold text-text-light uppercase tracking-widest">TYT</span>
                <div className="flex-1 border-t border-dashed border-border" />
              </div>
            )}
            <div className="bg-white rounded-xl shadow-card border border-border overflow-hidden">
              <button
                onClick={() => toggle(key)}
                className="w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-bg-light transition-colors"
              >
                {isOpen
                  ? <ChevronDown className="w-3.5 h-3.5 shrink-0 text-text-muted" />
                  : <ChevronRight className="w-3.5 h-3.5 shrink-0 text-text-muted" />}
                <span className="text-sm font-bold text-primary flex items-center gap-1.5">
                  <span>{icon}</span>
                  <span>{text}</span>
                </span>
              </button>
              {isOpen && (
                <div className="px-4 pb-4 pt-2 border-t border-border">
                  <NoteEditor
                    itemKey={key}
                    initialLines={notes[key] ?? []}
                    onChange={handleEditorChange}
                  />
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
