import { STATUS_OPTIONS } from '@/types'
import { cn } from '@/lib/utils'

interface StatusBadgeProps {
  status: string
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const option = STATUS_OPTIONS.find((s) => s.value === status) ?? {
    label: status,
    color: 'bg-gray-100 text-gray-700',
  }

  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', option.color, className)}>
      {option.label}
    </span>
  )
}
