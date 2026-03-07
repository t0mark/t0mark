import type { CalendarData } from '@/types/calendar'

interface TodoListProps {
  todos: CalendarData['todos']
}

function DeadlineBadge({ deadline }: { deadline: string }) {
  if (deadline === 'ASAP') return (
    <span className="shrink-0 text-[9px] font-semibold px-1 py-0.5 rounded bg-red-100 text-red-600">ASAP</span>
  )
  if (deadline === 'TYT') return (
    <span className="shrink-0 text-[9px] font-semibold px-1 py-0.5 rounded bg-gray-100 text-gray-500">TYT</span>
  )
  const d = new Date(deadline)
  return (
    <span className="shrink-0 text-[9px] font-semibold px-1 py-0.5 rounded bg-blue-50 text-blue-500">
      {d.getMonth() + 1}/{d.getDate()}
    </span>
  )
}

export default function TodoList({ todos }: TodoListProps) {
  return (
    <div className="space-y-4">
      {Object.entries(todos).map(([category, data]) => (
        <div key={category}>
          <h3 className="text-xs font-semibold text-primary flex items-center gap-1.5 mb-2">
            <span>{data.icon}</span>{category}
          </h3>
          <ul className="space-y-1.5">
            {data.items.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-text-muted">
                <span className="w-3.5 h-3.5 border border-border-dark rounded shrink-0 mt-0.5" />
                <span className="flex-1">{item.text}</span>
                {item.deadline && <DeadlineBadge deadline={item.deadline} />}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}
