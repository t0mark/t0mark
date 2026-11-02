import HomeClaudeUsage from '@/components/home/HomeClaudeUsage'
import HomeContent from '@/components/home/HomeContent'
import HomeDDay from '@/components/home/HomeDDay'

export default function HomePage() {
  return (
    <main className="max-w-main mx-auto px-8 xl:pr-80 py-8">
      <HomeContent />
      <aside className="mt-10 space-y-4 xl:mt-0 xl:fixed xl:right-6 xl:top-24 xl:w-64 xl:max-h-[calc(100vh-7rem)] xl:overflow-y-auto">
        <HomeDDay />
        <HomeClaudeUsage />
      </aside>
    </main>
  )
}
