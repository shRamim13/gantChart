import { cn } from '@/lib/utils'

interface AvatarProps {
  name: string
  src?: string | null
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeClasses = {
  sm: 'h-6 w-6 text-[10px]',
  md: 'h-8 w-8 text-xs',
  lg: 'h-10 w-10 text-sm',
}

const colors = [
  'bg-indigo-600',
  'bg-emerald-600',
  'bg-amber-600',
  'bg-rose-600',
  'bg-cyan-600',
  'bg-violet-600',
  'bg-teal-600',
  'bg-pink-600',
]

function getColor(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function Avatar({ name, src, size = 'md', className }: AvatarProps) {
  return (
    <div
      className={cn(
        'relative inline-flex items-center justify-center rounded-full font-medium text-white',
        sizeClasses[size],
        getColor(name),
        className
      )}
      title={name}
    >
      {src ? (
        <img src={src} alt={name} className="h-full w-full rounded-full object-cover" />
      ) : (
        getInitials(name)
      )}
    </div>
  )
}
