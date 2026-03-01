import WeeklyPlanner from '@/components/home/WeeklyPlanner'
import HomeTodo from '@/components/home/HomeTodo'
import HomeLog from '@/components/home/HomeLog'

export default function HomePage() {
  return (
    <main className="max-w-main mx-auto px-8 py-8 space-y-10">

      {/* ── 주간 Planner ── */}
      <section>
        <WeeklyPlanner />
      </section>

      {/* ── TODO ── */}
      <section>
        <h2 className="text-sm font-bold text-primary uppercase tracking-widest mb-4">TO DO</h2>
        <HomeTodo />
      </section>

      {/* ── 기록 로그 ── */}
      <section>
        <h2 className="text-sm font-bold text-primary uppercase tracking-widest mb-4">LOG</h2>
        <HomeLog />
      </section>

    </main>
  )
}
