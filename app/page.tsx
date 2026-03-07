import HomeContent from '@/components/home/HomeContent'
import HomeLog from '@/components/home/HomeLog'

export default function HomePage() {
  return (
    <main className="max-w-main mx-auto px-8 py-8 space-y-10">

      <HomeContent />

      {/* ── 기록 로그 ── */}
      <section>
        <h2 className="text-sm font-bold text-primary uppercase tracking-widest mb-4">Weekly</h2>
        <HomeLog />
      </section>

    </main>
  )
}
