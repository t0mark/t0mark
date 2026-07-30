import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Calendar' }

export default function CalendarPage() {
  return (
    <main className="max-w-main mx-auto p-5">
      <div className="flex flex-col gap-3">
        <a
          href="https://calendar.google.com/"
          target="_blank"
          rel="noreferrer"
          className="text-sm font-semibold text-primary hover:text-primary-light transition-colors flex items-center gap-1.5 w-fit"
        >
          📅 Google Calendar
        </a>
        <div className="bg-white rounded-xl shadow-card overflow-hidden h-[calc(100vh-160px)] min-h-[780px]">
          <iframe
            src="https://calendar.google.com/calendar/embed?height=600&wkst=1&ctz=Asia%2FSeoul&showPrint=0&src=YTk2NTM2MDA5QGdtYWlsLmNvbQ&src=a28uc291dGhfa29yZWEjaG9saWRheUBncm91cC52LmNhbGVuZGFyLmdvb2dsZS5jb20&src=a00046485cbcde79f20c130f2518b9ae90d8090ff3f758b7ccdd5806c7f75d68%40group.calendar.google.com&color=%237986cb&color=%230b8043"
            width="100%"
            height="100%"
            frameBorder={0}
            scrolling="no"
            title="Google Calendar"
          />
        </div>
      </div>
    </main>
  )
}
