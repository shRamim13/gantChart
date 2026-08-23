import { Flame, ArrowUp, Minus, ArrowDown } from 'lucide-react'
import type { TaskPriority } from '@/types'

interface PriorityIconProps {
  priority: TaskPriority
  showLabel?: boolean
}

export function PriorityIcon({ priority, showLabel }: PriorityIconProps) {
  const iconProps = { size: 14 }

  switch (priority) {
    case 'critical':
      return (
        <span className="inline-flex items-center gap-1 text-rose-500">
          <Flame {...iconProps} />
          {showLabel && <span className="text-xs font-medium">Urgent</span>}
        </span>
      )
    case 'high':
      return (
        <span className="inline-flex items-center gap-1 text-orange-500">
          <ArrowUp {...iconProps} />
          {showLabel && <span className="text-xs font-medium">High</span>}
        </span>
      )
    case 'medium':
      return (
        <span className="inline-flex items-center gap-1 text-blue-500">
          <Minus {...iconProps} />
          {showLabel && <span className="text-xs font-medium">Medium</span>}
        </span>
      )
    case 'low':
      return (
        <span className="inline-flex items-center gap-1 text-emerald-500">
          <ArrowDown {...iconProps} />
          {showLabel && <span className="text-xs font-medium">Low</span>}
        </span>
      )
    default:
      return <span className="text-xs text-gray-400">{priority}</span>
  }
}
