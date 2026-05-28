import type { Metadata } from 'next'
import ChangjoPanel from '@/components/projects/ChangjoPanel'

export const metadata: Metadata = { title: 'Projects' }

export default function ProjectsPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-primary mb-1">Projects</h1>
      <p className="text-sm text-text-light mb-8">자동화 도구 모음</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <ChangjoPanel />
      </div>
    </div>
  )
}
