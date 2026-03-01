import type { CalendarData } from '@/types/calendar'

interface TodoListProps {
  todos: CalendarData['todos']
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
            {data.items.map((item) => (
              <li key={item} className="flex items-start gap-2 text-xs text-text-muted">
                <span className="w-3.5 h-3.5 border border-border-dark rounded shrink-0 mt-0.5" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}
