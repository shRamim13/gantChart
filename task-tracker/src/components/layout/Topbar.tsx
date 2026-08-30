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
    <header className="border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-[#16213e]">
      {/* Row 1: Project name + New Task */}
      <div className="flex items-center justify-between px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2 pl-12 lg:pl-0">
          <h1 className="text-base font-semibold text-gray-900 dark:text-white sm:text-lg truncate max-w-[200px] sm:max-w-none">{projectName}</h1>
        </div>
        {canCreateTask && (
          <button
            onClick={onNewTask}
            className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-indigo-700 active:scale-95"
          >
            <Plus size={14} />
            <span className="hidden sm:inline">New Task</span>
          </button>
        )}
      </div>

      {/* Row 2: View tabs + Sort + Search */}
      <div className="flex flex-wrap items-center gap-2 border-t border-gray-100 px-4 py-2 dark:border-gray-800 sm:px-6">
        {/* View tabs */}
        <div className="flex flex-1 rounded-lg border border-gray-200 bg-gray-50 p-0.5 dark:border-gray-700 dark:bg-gray-800/50">
          {views.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              onClick={() => onViewChange(value)}
              className={cn(
                'flex flex-1 items-center justify-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors',
                activeView === value
                  ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              )}
            >
              <Icon size={13} />
              <span className="hidden xs:inline">{label}</span>
            </button>
          ))}
        </div>

        {/* Sort + Search */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-lg border border-gray-200 bg-gray-50 px-2 py-1 dark:border-gray-700 dark:bg-gray-800/50">
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
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search..."
              className="w-32 rounded-lg border border-gray-200 bg-gray-50 py-1.5 pl-8 pr-2.5 text-xs text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800/50 dark:text-white dark:placeholder-gray-500 sm:w-48 sm:py-2 sm:text-sm sm:pl-9 sm:pr-3"
            />
          </div>
        </div>
      </div>
    </header>
  )
}
