'use client'

import { useState, useEffect, useCallback } from 'react'

export default function MemoPanel() {
  const [text, setText] = useState('')
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(false)

  const refetch = useCallback(() => {
    fetch('/api/memo')
      .then((res) => { if (!res.ok) throw new Error(); return res.json() })
      .then((d: { text?: string }) => {
        setText(d.text ?? '')
        setLoaded(true)
      })
      .catch(() => setError(true))
  }, [])

  useEffect(() => { refetch() }, [refetch])

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'memo-updated') refetch()
    }
    const onFocus = () => refetch()
    window.addEventListener('storage', onStorage)
    window.addEventListener('focus', onFocus)
    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener('focus', onFocus)
    }
  }, [refetch])

  function openEditor() {
    const w = 640
    const h = 720
    const left = Math.max(0, window.screenX + (window.outerWidth - w) / 2)
    const top = Math.max(0, window.screenY + (window.outerHeight - h) / 2)
    window.open(
      '/memo-editor',
      'memoEditor',
      `popup=yes,width=${w},height=${h},left=${left},top=${top}`
    )
  }

  return (
    <div className="bg-white rounded-xl border border-border shadow-card p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-xl">
          📝
        </div>
        <div className="min-w-0">
          <h3 className="font-bold text-primary text-base">메모장</h3>
          <p className="text-xs text-text-light">클릭하여 편집</p>
        </div>
        <button
          onClick={openEditor}
          className="ml-auto text-xs font-medium text-primary hover:opacity-70 shrink-0"
        >
          편집
        </button>
      </div>

      <div
        onClick={openEditor}
        className="min-h-[240px] max-h-[500px] overflow-y-auto cursor-pointer rounded-lg hover:bg-bg-light transition-colors p-2 -m-2"
      >
        {error ? (
          <p className="text-xs text-red-400">로드 실패</p>
        ) : !loaded ? (
          <div className="loading-spinner scale-75" />
        ) : text.trim() === '' ? (
          <p className="text-sm text-text-light italic">여기에 메모를 작성하세요...</p>
        ) : (
          <pre className="text-sm text-text-muted whitespace-pre-wrap font-sans leading-relaxed">
            {text}
          </pre>
        )}
      </div>
    </div>
  )
}
