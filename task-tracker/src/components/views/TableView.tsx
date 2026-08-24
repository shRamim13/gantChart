import { useState } from 'react'
import { Pencil, Trash2, ChevronLeft, ChevronRight } from 'lucide-react'
import type { Task, TaskStatus, TaskType, SortField, SortDirection, Epic, Sprint, Profile } from '@/types'
import { TASK_TYPE_OPTIONS, STATUS_OPTIONS } from '@/types'
import { PriorityIcon } from '@/components/ui/PriorityIcon'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { cn } from '@/lib/utils'

const PAGE_SIZE = 15

interface TableViewProps {
  tasks: Task[]
  sortField: SortField
  sortDirection: SortDirection
  projectPrefix: string
  epics: Epic[]
  sprints: Sprint[]
  profiles: Profile[]
  allTasks: Task[]
  onEditTask: (task: Task) => void
  onDeleteTask: (taskId: string) => void
  onStatusChange: (taskId: string, status: TaskStatus) => void
  onSelectTask: (task: Task) => void
}

function SubtaskProgress({ childTasks }: { childTasks: Task[] }) {
  if (childTasks.length === 0) return <span className="text-xs text-gray-400">—</span>
  const done = childTasks.filter((t) => t.status === 'done').length
  const total = childTasks.length
  const pct = Math.round((done / total) * 100)
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 rounded-full bg-gray-100 dark:bg-gray-800">
        <div className={cn('h-1.5 rounded-full transition-all', pct === 100 ? 'bg-green-500' : 'bg-indigo-500')} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[10px] text-gray-500 dark:text-gray-400">{done}/{total}</span>
    </div>
  )
}

export function TableView({ tasks, sortField, sortDirection, projectPrefix, epics, sprints, profiles, onEditTask, onDeleteTask, onStatusChange, onSelectTask }: TableViewProps) {
  const [editingCell, setEditingCell] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [page, setPage] = useState(0)

  // Filter out child tasks (only show root tasks)
  const rootTasks = tasks.filter((t) => !t.parent_task_id)

  const sorted = [...rootTasks].sort((a, b) => {
    const aVal = a[sortField] ?? ''
    const bVal = b[sortField] ?? ''
    const cmp = String(aVal).localeCompare(String(bVal))
    return sortDirection === 'asc' ? cmp : -cmp
  })

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE)
  const paged = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  function TypeBadge({ type }: { type: TaskType }) {
    const config = TASK_TYPE_OPTIONS.find((t: { value: TaskType }) => t.value === type)
    if (!config) return <span className="text-xs">{type}</span>
    return (
      <span className={cn('inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium', config.color)}>
        {config.label}
      </span>
    )
  }

  function StatusBadge({ status }: { status: TaskStatus }) {
    const config = STATUS_OPTIONS.find((s: { value: TaskStatus }) => s.value === status)
    return (
      <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', config?.color)}>
        {config?.label || status}
      </span>
    )
  }

  function SortIndicator({ field }: { field: SortField }) {
    if (sortField !== field) return null
    return sortDirection === 'asc' ? (
      <svg className="inline h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
    ) : (
      <svg className="inline h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
    )
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="px-3 py-3 font-medium text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-1">Ticket <SortIndicator field="ticket_number" /></div>
              </th>
              <th className="px-3 py-3 font-medium text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-1">Title <SortIndicator field="title" /></div>
              </th>
              <th className="px-3 py-3 font-medium text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-1">Type <SortIndicator field="task_type" /></div>
              </th>
              <th className="px-3 py-3 font-medium text-gray-500 dark:text-gray-400">Epic</th>
              <th className="px-3 py-3 font-medium text-gray-500 dark:text-gray-400">Sprint</th>
              <th className="px-3 py-3 font-medium text-gray-500 dark:text-gray-400">Assignee</th>
              <th className="px-3 py-3 font-medium text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-1">Status <SortIndicator field="status" /></div>
              </th>
              <th className="px-3 py-3 font-medium text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-1">Priority <SortIndicator field="priority" /></div>
              </th>
              <th className="px-3 py-3 font-medium text-gray-500 dark:text-gray-400">Subtasks</th>
              <th className="px-3 py-3 font-medium text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-1">Start <SortIndicator field="start_date" /></div>
              </th>
              <th className="px-3 py-3 font-medium text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-1">Due <SortIndicator field="due_date" /></div>
              </th>
              <th className="px-3 py-3 font-medium text-gray-500 dark:text-gray-400 w-20">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paged.length === 0 ? (
              <tr>
                <td colSpan={12} className="px-3 py-12 text-center text-gray-400 dark:text-gray-500">
                  No tasks yet. Create your first task!
                </td>
              </tr>
            ) : (
              paged.map((task) => {
                const epic = epics.find((e) => e.id === task.epic_id)
                const childTasks = tasks.filter((t) => t.parent_task_id === task.id)
                const childCount = childTasks.length
                return (
                  <tr
                    key={task.id}
                    onClick={() => onSelectTask(task)}
                    className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
                  >
                    <td className="px-3 py-2.5 font-mono text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                      {projectPrefix}-{task.ticket_number}
                    </td>
                    <td className="px-3 py-2.5 font-medium text-gray-900 dark:text-white max-w-xs truncate">
                      {task.title}
                      {childCount > 0 && (
                        <span className="ml-2 text-[10px] text-gray-400">({childCount} subtasks)</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5">
                      <TypeBadge type={task.task_type || 'task'} />
                    </td>
                    <td className="px-3 py-2.5">
                      {epic ? (
                        <span className="inline-flex items-center gap-1 text-xs">
                          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: epic.color }} />
                          <span className="text-gray-600 dark:text-gray-400 truncate max-w-[100px]">{epic.name}</span>
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5">
                      {task.sprint_id ? (
                        <span className="inline-flex items-center rounded-md bg-indigo-50 px-2 py-0.5 text-[10px] font-medium text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400">
                          {sprints.find((s) => s.id === task.sprint_id)?.name || 'Sprint'}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5">
                      {task.assignee_id ? (
                        <div className="flex items-center gap-1.5">
                          {profiles.find((p) => p.id === task.assignee_id)?.avatar_url ? (
                            <img src={profiles.find((p) => p.id === task.assignee_id)!.avatar_url!} alt="" className="h-5 w-5 rounded-full" />
                          ) : (
                            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-[8px] font-medium text-white">
                              {profiles.find((p) => p.id === task.assignee_id)?.name?.charAt(0)?.toUpperCase() ?? '?'}
                            </div>
                          )}
                          <span className="text-xs text-gray-600 dark:text-gray-400 truncate max-w-[80px]">
                            {profiles.find((p) => p.id === task.assignee_id)?.name || 'Unknown'}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                      {editingCell === `${task.id}-status` ? (
                        <select
                          autoFocus
                          defaultValue={task.status}
                          onChange={(e) => {
                            onStatusChange(task.id, e.target.value as TaskStatus)
                            setEditingCell(null)
                          }}
                          onBlur={() => setEditingCell(null)}
                          className="rounded-lg border border-gray-300 bg-white px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                        >
                          {STATUS_OPTIONS.map((s: { value: TaskStatus; label: string }) => (
                            <option key={s.value} value={s.value}>{s.label}</option>
                          ))}
                        </select>
                      ) : (
                        <button onClick={() => setEditingCell(`${task.id}-status`)}>
                          <StatusBadge status={task.status} />
                        </button>
                      )}
                    </td>
                    <td className="px-3 py-2.5">
                      <PriorityIcon priority={task.priority} />
                    </td>
                    <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                      <SubtaskProgress childTasks={childTasks} />
                    </td>
                    <td className="px-3 py-2.5 text-gray-500 dark:text-gray-500 text-xs">
                      {task.start_date || '—'}
                    </td>
                    <td className="px-3 py-2.5 text-gray-500 dark:text-gray-500 text-xs">
                      {task.due_date || '—'}
                    </td>
                    <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => onEditTask(task)}
                          className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-indigo-600 dark:hover:bg-gray-700 dark:hover:text-indigo-400"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => setDeleteId(task.id)}
                          className="rounded-md p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, sorted.length)} of {sorted.length}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 disabled:opacity-30 dark:hover:bg-gray-800"
            >
              <ChevronLeft size={16} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => setPage(i)}
                className={cn(
                  'h-7 w-7 rounded-lg text-xs font-medium',
                  page === i
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
                )}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 disabled:opacity-30 dark:hover:bg-gray-800"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteId}
        title="Delete Task"
        message="Are you sure you want to delete this task? This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={() => {
          if (deleteId) onDeleteTask(deleteId)
          setDeleteId(null)
        }}
        onCancel={() => setDeleteId(null)}
      />
    </>
  )
}
