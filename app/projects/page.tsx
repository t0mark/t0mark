import type { Metadata } from 'next'
import ChangjoPanel from '@/components/projects/ChangjoPanel'
import MemoPanel from '@/components/projects/MemoPanel'
import SeminarPanel from '@/components/projects/SeminarPanel'

export const metadata: Metadata = { title: 'Projects' }

export default function ProjectsPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-primary mb-8">Projects</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <ChangjoPanel />
        <MemoPanel />
        <SeminarPanel />
      </div>
    </div>
  )
}
