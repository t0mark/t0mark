import type { CalendarData } from '@/types/calendar'

interface TaskListProps {
  tasks: CalendarData['tasks']
}

export default function TaskList({ tasks }: TaskListProps) {
  return (
    <div className="space-y-3">
      {Object.entries(tasks).map(([category, data]) => (
        <div key={category}>
          <h3 className="text-xs font-semibold text-primary flex items-center gap-1.5 mb-1.5">
            <span>{data.icon}</span>{category}
          </h3>
          <ul className="space-y-1">
            {data.items.map((item) => (
              <li key={item} className="flex items-center gap-2 text-xs text-text-muted">
                <span className="w-1.5 h-1.5 rounded-full bg-border-dark shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}
