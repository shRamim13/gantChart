import { useState, useRef, useEffect } from 'react'
import { Users, X, Check, ChevronDown } from 'lucide-react'
import type { Profile } from '@/types'
import { cn } from '@/lib/utils'

interface UserFilterProps {
  profiles: Profile[]
  selectedUserIds: string[]
  onChange: (ids: string[]) => void
}

export function UserFilter({ profiles, selectedUserIds, onChange }: UserFilterProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const activeProfiles = profiles.filter((p) => p.is_active !== false)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const allSelected = selectedUserIds.length === activeProfiles.length
  const noneSelected = selectedUserIds.length === 0

  function toggleUser(id: string) {
    if (selectedUserIds.includes(id)) {
      onChange(selectedUserIds.filter((u) => u !== id))
    } else {
      onChange([...selectedUserIds, id])
    }
  }

  function selectAll() {
    onChange(activeProfiles.map((p) => p.id))
  }

  function clearAll() {
    onChange([])
  }

  const selectedCount = selectedUserIds.length
  const label = noneSelected
    ? 'All Users'
    : selectedCount === 1
    ? profiles.find((p) => p.id === selectedUserIds[0])?.name ?? '1 user'
    : `${selectedCount} users`

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          'flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-all',
          selectedCount > 0
            ? 'border-indigo-300 bg-indigo-50 text-indigo-700 dark:border-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400'
            : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400'
        )}
      >
        <Users size={13} />
        {label}
        {selectedCount > 0 && (
          <button
            onClick={(e) => { e.stopPropagation(); clearAll() }}
            className="ml-0.5 rounded-full p-0.5 hover:bg-indigo-100 dark:hover:bg-indigo-800"
          >
            <X size={10} />
          </button>
        )}
        <ChevronDown size={12} className={cn('transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute left-0 z-50 mt-1 w-64 rounded-xl border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-900">
          <div className="border-b border-gray-100 px-3 py-2 dark:border-gray-800">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Filter by user</span>
              <div className="flex gap-1">
                <button
                  onClick={selectAll}
                  className={cn('rounded px-1.5 py-0.5 text-[10px] font-medium transition-all', allSelected ? 'text-indigo-400' : 'text-gray-400 hover:text-indigo-600')}
                >
                  All
                </button>
                <button
                  onClick={clearAll}
                  className={cn('rounded px-1.5 py-0.5 text-[10px] font-medium transition-all', noneSelected ? 'text-gray-400' : 'text-gray-400 hover:text-red-600')}
                >
                  Clear
                </button>
              </div>
            </div>
          </div>

          <div className="max-h-60 overflow-y-auto">
            {activeProfiles.map((user) => {
              const isSelected = selectedUserIds.includes(user.id)
              return (
                <button
                  key={user.id}
                  onClick={() => toggleUser(user.id)}
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <div
                    className={cn(
                      'flex h-4 w-4 items-center justify-center rounded border transition-all',
                      isSelected
                        ? 'border-indigo-500 bg-indigo-500'
                        : 'border-gray-300 dark:border-gray-600'
                    )}
                  >
                    {isSelected && <Check size={10} className="text-white" />}
                  </div>
                  {user.avatar_url ? (
                    <img src={user.avatar_url} alt="" className="h-5 w-5 rounded-full" />
                  ) : (
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-[8px] font-medium text-white">
                      {user.name?.charAt(0)?.toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-xs font-medium text-gray-700 dark:text-gray-300">{user.name}</p>
                    <p className="truncate text-[10px] text-gray-400">{user.email}</p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
