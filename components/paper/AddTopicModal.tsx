'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import type { Topic } from '@/data/paperStore'

interface Props {
  onAdd: (topic: Omit<Topic, 'id' | 'color'>) => void
  onClose: () => void
}

const INPUT = 'w-full px-3 py-2 text-sm border border-border rounded-lg bg-bg-light focus:outline-none focus:border-accent-industry transition-colors'

export default function AddTopicModal({ onAdd, onClose }: Props) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    onAdd({ name: name.trim(), description: description.trim() })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-float w-full max-w-md">

        <div className="flex items-center justify-between p-6 pb-4 border-b border-border">
          <h2 className="text-base font-bold text-primary">Topic 추가</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-bg-light">
            <X className="w-5 h-5 text-text-light" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <FormField label="Name *">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예: 객체 탐지"
              className={INPUT}
              autoFocus
              required
            />
          </FormField>

          <FormField label="Description">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="토픽에 대한 간략한 설명..."
              rows={3}
              className={INPUT + ' resize-none'}
            />
          </FormField>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-text-light hover:text-primary transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-accent-research rounded-lg disabled:opacity-40 hover:opacity-90 transition-opacity"
            >
              Add
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-text-light uppercase tracking-wider mb-1.5">
        {label}
      </label>
      {children}
    </div>
  )
}
