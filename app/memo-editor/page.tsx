'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

export default function MemoEditorPage() {
  const [text, setText] = useState('')
  const [loaded, setLoaded] = useState(false)
  const [saved, setSaved] = useState(true)
  const [error, setError] = useState(false)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const latestTextRef = useRef('')
  const pendingRef = useRef(false)

  useEffect(() => {
    document.title = '메모장'
    fetch('/api/memo')
      .then((res) => { if (!res.ok) throw new Error(); return res.json() })
      .then((d: { text?: string }) => {
        const t = d.text ?? ''
        setText(t)
        latestTextRef.current = t
        setLoaded(true)
      })
      .catch(() => setError(true))
  }, [])

  const doSave = useCallback(async (next: string) => {
    try {
      const res = await fetch('/api/memo', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: next }),
      })
      if (!res.ok) throw new Error()
      pendingRef.current = false
      setSaved(true)
      try { localStorage.setItem('memo-updated', String(Date.now())) } catch {}
    } catch {
      setSaved(false)
    }
  }, [])

  const scheduleSave = useCallback((next: string) => {
    pendingRef.current = true
    setSaved(false)
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => { doSave(next) }, 500)
  }, [doSave])

  function flushSaveSync() {
    if (!pendingRef.current) return
    if (saveTimer.current) {
      clearTimeout(saveTimer.current)
      saveTimer.current = null
    }
    const body = JSON.stringify({ text: latestTextRef.current })
    try {
      const blob = new Blob([body], { type: 'application/json' })
      const ok = navigator.sendBeacon('/api/memo?flush=1', blob)
      if (ok) {
        pendingRef.current = false
        try { localStorage.setItem('memo-updated', String(Date.now())) } catch {}
        return
      }
    } catch {}
    // fallback: synchronous-ish fetch with keepalive
    fetch('/api/memo', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true,
    }).then(() => {
      try { localStorage.setItem('memo-updated', String(Date.now())) } catch {}
    }).catch(() => {})
  }

  useEffect(() => {
    const onBeforeUnload = () => flushSaveSync()
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') flushSaveSync()
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    window.addEventListener('pagehide', onBeforeUnload)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload)
      window.removeEventListener('pagehide', onBeforeUnload)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  function onChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const v = e.target.value
    setText(v)
    latestTextRef.current = v
    scheduleSave(v)
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.metaKey || e.ctrlKey) && e.key === 's') {
      e.preventDefault()
      if (saveTimer.current) { clearTimeout(saveTimer.current); saveTimer.current = null }
      doSave(latestTextRef.current)
    }
  }

  return (
    <div className="h-screen flex flex-col bg-bg-light">
      <div className="flex items-center justify-between px-5 py-3 bg-white border-b border-border shrink-0">
        <h1 className="text-sm font-bold text-primary flex items-center gap-2">
          <span>📝</span>
          <span>메모장</span>
        </h1>
        <span className="text-xs text-text-light">
          {error ? '로드 실패' : !loaded ? '로딩...' : saved ? '저장됨' : '저장 중...'}
        </span>
      </div>

      {loaded ? (
        <textarea
          autoFocus
          value={text}
          onChange={onChange}
          onKeyDown={onKeyDown}
          placeholder="메모를 작성하세요..."
          spellCheck={false}
          className="flex-1 p-6 bg-white outline-none resize-none text-sm text-text-muted leading-relaxed"
        />
      ) : (
        <div className="flex-1 flex items-center justify-center">
          {!error && <div className="loading-spinner" />}
        </div>
      )}
    </div>
  )
}
