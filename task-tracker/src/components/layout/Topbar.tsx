import { Search, Table, Columns, GanttChart, ArrowUpDown, Plus, Target } from 'lucide-react'
import type { ViewType, SortField, SortDirection } from '@/types'
import { cn } from '@/lib/utils'

interface TopbarProps {
  projectName: string
  activeView: ViewType
  onViewChange: (view: ViewType) => void
  searchQuery: string
  onSearchChange: (query: string) => void
  sortField: SortField
  sortDirection: SortDirection
  onSortChange: (field: SortField, direction: SortDirection) => void
  onNewTask: () => void
  canCreateTask: boolean
}

const views: { value: ViewType; label: string; icon: typeof Table }[] = [
  { value: 'table', label: 'Table', icon: Table },
  { value: 'board', label: 'Board', icon: Columns },
  { value: 'timeline', label: 'Timeline', icon: GanttChart },
  { value: 'sprints', label: 'Sprints', icon: Target },
]

const sortOptions: { value: SortField; label: string }[] = [
  { value: 'created_at', label: 'Newest First' },
  { value: 'ticket_number', label: 'Ticket #' },
  { value: 'priority', label: 'Priority' },
  { value: 'task_type', label: 'Type' },
  { value: 'status', label: 'Status' },
  { value: 'start_date', label: 'Start Date' },
  { value: 'due_date', label: 'Due Date' },
  { value: 'title', label: 'Title' },
]

export function Topbar({ projectName, activeView, onViewChange, searchQuery, onSearchChange, sortField, sortDirection, onSortChange, onNewTask, canCreateTask }: TopbarProps) {
  function handleSortChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const field = e.target.value as SortField
    const newDirection: SortDirection = sortField === field
      ? (sortDirection === 'asc' ? 'desc' : 'asc')
      : (['start_date', 'due_date', 'created_at', 'ticket_number'].includes(field) ? 'desc' : 'asc')
    onSortChange(field, newDirection)
  }

  return (
    <header className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-3 dark:border-gray-800 dark:bg-[#16213e]">
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-semibold text-gray-900 dark:text-white">{projectName}</h1>
        <div className="flex rounded-lg border border-gray-200 bg-gray-50 p-0.5 dark:border-gray-700 dark:bg-gray-800/50">
          {views.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              onClick={() => onViewChange(value)}
              className={cn(
                'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                activeView === value
                  ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              )}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {canCreateTask && (
          <button
            onClick={onNewTask}
            className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-indigo-700 hover:shadow-md active:scale-95"
          >
            <Plus size={14} />
            New Task
          </button>
        )}

        <div className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 px-2 py-1 dark:border-gray-700 dark:bg-gray-800/50">
          <ArrowUpDown size={12} className="text-gray-400" />
          <select
            value={sortField}
            onChange={handleSortChange}
            className="bg-transparent text-xs text-gray-600 focus:outline-none dark:text-gray-400"
          >
            {sortOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <button
            onClick={() => onSortChange(sortField, sortDirection === 'asc' ? 'desc' : 'asc')}
            className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            {sortDirection === 'asc' ? '↑' : '↓'}
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search tasks..."
            className="w-56 rounded-lg border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800/50 dark:text-white dark:placeholder-gray-500"
          />
        </div>
      </div>
    </header>
  )
}
