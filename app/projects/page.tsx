import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Projects' }

export default function ProjectsPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-primary mb-4">Projects</h1>
        <p className="text-gray-500 text-lg">Coming Soon</p>
      </div>
    </div>
  )
}
