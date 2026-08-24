import { useState } from 'react'
import toast from 'react-hot-toast'
import { Trash2, Edit, Calendar, Clock, MessageSquare, Plus } from 'lucide-react'
import type { Task, Epic } from '@/types'
import { STATUS_OPTIONS, TASK_TYPE_OPTIONS } from '@/types'
import { useAuth } from '@/components/auth/AuthProvider'
import { PriorityIcon } from '@/components/ui/PriorityIcon'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Button } from '@/components/ui/Button'
import { SlideOver } from '@/components/ui/SlideOver'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'

interface TaskDetailPanelProps {
  task: Task | null
  open: boolean
  onClose: () => void
  onUpdate: (id: string, updates: Partial<Task>) => Promise<{ error?: string }>
  onDelete: (id: string) => Promise<{ error?: string }>
  onEdit: (task: Task) => void
  onAddSubtask: (parentId: string) => void
  projectPrefix: string
  epics?: Epic[]
  allTasks?: Task[]
}

export function TaskDetailPanel({ task, open, onClose, onUpdate, onDelete, onEdit, onAddSubtask, projectPrefix, epics = [], allTasks = [] }: TaskDetailPanelProps) {
  const { profile } = useAuth()
  const [confirmDelete, setConfirmDelete] = useState(false)

  const canEdit = profile?.role === 'admin' || profile?.role === 'editor'
  const canDelete = profile?.role === 'admin' || profile?.role === 'editor'

  if (!task) return null

  const ticketId = `${projectPrefix}-${task.ticket_number}`
  const taskType = TASK_TYPE_OPTIONS.find((t) => t.value === task.task_type)
  const epic = epics.find((e) => e.id === task.epic_id)
  const childTasks = allTasks.filter((t) => t.parent_task_id === task.id)

  async function handleDelete() {
    const result = await onDelete(task!.id)
    if (!result.error) {
      toast.success('Task deleted')
      onClose()
    } else {
      toast.error('Failed to delete task')
    }
  }

  async function handleStatusChange(status: Task['status']) {
    const result = await onUpdate(task!.id, { status })
    if (!result.error) {
      toast.success('Status updated')
    }
  }

  const progress = childTasks.length > 0
    ? Math.round((childTasks.filter((t) => t.status === 'done').length / childTasks.length) * 100)
    : 0

  return (
    <SlideOver open={open} onClose={onClose} title={ticketId}>
      <div className="space-y-6">
        <div>
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                {taskType && (
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${taskType.color}`}>
                    {taskType.label}
                  </span>
                )}
                {epic && (
                  <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: epic.color }} />
                    {epic.name}
                  </span>
                )}
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{task.title}</h3>
            </div>
            <div className="flex gap-1">
              {canEdit && (
                <button
                  onClick={() => onEdit(task)}
                  className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800"
                >
                  <Edit size={16} />
                </button>
              )}
              {canDelete && !confirmDelete && (
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
                >
                  <Trash2 size={16} />
                </button>
              )}
              {canDelete && confirmDelete && (
                <div className="flex gap-1">
                  <Button variant="danger" size="sm" onClick={handleDelete}>Delete</Button>
                  <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(false)}>Cancel</Button>
                </div>
              )}
            </div>
          </div>
          {task.description && (
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{task.description}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Status</label>
            <StatusBadge status={task.status} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Priority</label>
            <PriorityIcon priority={task.priority} showLabel />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="flex items-center gap-1 text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
              <Calendar size={12} /> Start Date
            </label>
            <p className="text-sm text-gray-900 dark:text-white">
              {task.start_date ? format(new Date(task.start_date), 'MMM d, yyyy') : '—'}
            </p>
          </div>
          <div>
            <label className="flex items-center gap-1 text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
              <Calendar size={12} /> Due Date
            </label>
            <p className="text-sm text-gray-900 dark:text-white">
              {task.due_date ? format(new Date(task.due_date), 'MMM d, yyyy') : '—'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="flex items-center gap-1 text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
              <Clock size={12} /> Est. Hours
            </label>
            <p className="text-sm text-gray-900 dark:text-white">{task.est_hours ?? '—'}</p>
          </div>
          <div>
            <label className="flex items-center gap-1 text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
              <Clock size={12} /> Est. Days
            </label>
            <p className="text-sm text-gray-900 dark:text-white">{task.est_days ?? '—'}</p>
          </div>
        </div>

        {/* Child Tasks / Subtasks */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
              Subtasks {childTasks.length > 0 && <span className="text-gray-400">({childTasks.filter((t) => t.status === 'done').length}/{childTasks.length})</span>}
            </label>
            {canEdit && (
              <button
                onClick={() => onAddSubtask(task.id)}
                className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
              >
                <Plus size={12} /> Add
              </button>
            )}
          </div>

          {childTasks.length > 0 && (
            <div className="mb-3">
              <div className="h-1.5 w-full rounded-full bg-gray-100 dark:bg-gray-800">
                <div
                  className={cn('h-1.5 rounded-full transition-all', progress === 100 ? 'bg-green-500' : 'bg-indigo-500')}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            {childTasks.map((child) => {
              const childType = TASK_TYPE_OPTIONS.find((t) => t.value === child.task_type)
              return (
                <div
                  key={child.id}
                  className="group flex items-center gap-2 rounded-lg border border-gray-100 px-3 py-2 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/50"
                >
                  <div className={cn(
                    'h-2 w-2 rounded-full',
                    child.status === 'done' ? 'bg-green-500' :
                    child.status === 'in_progress' ? 'bg-blue-500' :
                    child.status === 'hold' ? 'bg-orange-500' :
                    'bg-gray-300'
                  )} />
                  <button
                    onClick={() => onEdit(child)}
                    className={cn(
                      'flex-1 text-left text-sm',
                      child.status === 'done' ? 'text-gray-400 line-through' : 'text-gray-700 dark:text-gray-300'
                    )}
                  >
                    {child.title}
                  </button>
                  {childType && (
                    <span className={`text-[9px] px-1.5 py-0.5 rounded ${childType.color}`}>
                      {childType.label}
                    </span>
                  )}
                  <PriorityIcon priority={child.priority} />
                  <StatusBadge status={child.status} />
                  {canDelete && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        if (window.confirm('Delete this subtask?')) {
                          onDelete(child.id)
                        }
                      }}
                      className="rounded p-1 text-gray-400 opacity-0 transition-opacity hover:bg-red-50 hover:text-red-500 group-hover:opacity-100 dark:hover:bg-red-900/20"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              )
            })}

            {childTasks.length === 0 && (
              <p className="text-xs text-gray-400 dark:text-gray-500 italic py-2">No subtasks yet</p>
            )}
          </div>
        </div>

        {canEdit && (
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Quick Status</label>
            <div className="flex flex-wrap gap-2">
              {STATUS_OPTIONS.map((s) => (
                <button
                  key={s.value}
                  onClick={() => handleStatusChange(s.value)}
                  className={`rounded-xl border px-3 py-1.5 text-xs font-medium transition-all ${
                    task.status === s.value
                      ? 'border-indigo-300 bg-indigo-50 text-indigo-700 dark:border-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400'
                      : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <div>
          <label className="flex items-center gap-1 text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
            <MessageSquare size={12} /> Activity
          </label>
          <p className="text-sm text-gray-400 dark:text-gray-500 italic">Activity log coming soon</p>
        </div>
      </div>
    </SlideOver>
  )
}
