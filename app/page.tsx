import HomeClaudeUsage from '@/components/home/HomeClaudeUsage'
import HomeContent from '@/components/home/HomeContent'
import HomeDDay from '@/components/home/HomeDDay'

export default function HomePage() {
  return (
    <main className="max-w-main mx-auto px-8 xl:pr-80 py-8">
      <HomeContent />
      <aside className="hidden xl:block fixed right-6 top-24 w-64 max-h-[calc(100vh-7rem)] overflow-y-auto space-y-4">
        <HomeDDay />
        <HomeClaudeUsage />
      </aside>
    </main>
  )
}
