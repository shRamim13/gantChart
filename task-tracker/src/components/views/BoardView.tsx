import { useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import {
  DndContext,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Clock, Calendar, X } from 'lucide-react'
import type { Task, TaskStatus, TaskType, Profile } from '@/types'
import { STATUS_OPTIONS, TASK_TYPE_OPTIONS } from '@/types'
import { PriorityIcon } from '@/components/ui/PriorityIcon'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'

interface BoardViewProps {
  tasks: Task[]
  profiles: Profile[]
  onUpdateTask: (id: string, updates: Partial<Task>) => Promise<{ error?: string }>
  onSelectTask: (task: Task) => void
  onNewTask: () => void
  searchQuery: string
  projectPrefix: string
}

function TaskTypeTag({ type }: { type: TaskType }) {
  const option = TASK_TYPE_OPTIONS.find((t) => t.value === type)
  if (!option) return null
  return (
    <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[9px] font-medium ${option.color}`}>
      {option.label}
    </span>
  )
}

function TaskCard({ task, onSelect, projectPrefix, profiles }: { task: Task; onSelect: () => void; projectPrefix: string; profiles: Profile[] }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { type: 'task', task },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={onSelect}
      className={cn(
        'group cursor-pointer rounded-xl border border-gray-200 bg-white p-3.5 shadow-sm transition-all hover:shadow-md dark:border-gray-700 dark:bg-gray-800',
        isDragging && 'opacity-50 shadow-lg ring-2 ring-indigo-500'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <div className="mb-1.5 flex items-center gap-1.5">
            <span className="font-mono text-[10px] text-gray-400 dark:text-gray-500">
              {projectPrefix}-{task.ticket_number}
            </span>
            <TaskTypeTag type={task.task_type} />
          </div>
          <p className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2">{task.title}</p>
        </div>
        <button
          {...attributes}
          {...listeners}
          onClick={(e) => e.stopPropagation()}
          className="mt-0.5 cursor-grab text-gray-300 opacity-0 transition-opacity hover:text-gray-500 group-hover:opacity-100"
        >
          <GripVertical size={14} />
        </button>
      </div>

      {task.description && (
        <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400 line-clamp-1">{task.description}</p>
      )}

      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <PriorityIcon priority={task.priority} />
          {task.est_hours && (
            <span className="flex items-center gap-0.5 text-[11px] text-gray-400 dark:text-gray-500">
              <Clock size={10} /> {task.est_hours}h
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {task.due_date && (
            <span className="text-[11px] text-gray-400 dark:text-gray-500">
              {new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          )}
          {task.assignee_id && (() => {
            const assignee = profiles.find((p) => p.id === task.assignee_id)
            return assignee ? (
              assignee.avatar_url ? (
                <img src={assignee.avatar_url} alt={assignee.name} className="h-5 w-5 rounded-full" />
              ) : (
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-[8px] font-medium text-white" title={assignee.name}>
                  {assignee.name?.charAt(0)?.toUpperCase()}
                </div>
              )
            ) : null
          })()}
        </div>
      </div>
    </div>
  )
}

function TaskDetailModal({ task, onClose, onUpdate, onEdit, projectPrefix }: {
  task: Task
  onClose: () => void
  onUpdate: (id: string, updates: Partial<Task>) => Promise<{ error?: string }>
  onEdit: (task: Task) => void
  projectPrefix: string
}) {
  const [confirmDelete, setConfirmDelete] = useState(false)

  const taskType = TASK_TYPE_OPTIONS.find((t) => t.value === task.task_type)

  async function handleStatusChange(status: TaskStatus) {
    const result = await onUpdate(task.id, { status })
    if (!result.error) toast.success('Status updated')
  }

  async function handleDelete() {
    toast.success('Task deleted')
    onClose()
  }

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/50" onClick={onClose} />
      <div className="fixed inset-4 z-50 mx-auto max-w-lg overflow-auto rounded-2xl bg-white shadow-2xl dark:bg-gray-900 sm:inset-y-[10vh]">
        <div className="sticky top-0 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4 dark:border-gray-800 dark:bg-gray-900">
          <div>
            <span className="font-mono text-xs text-gray-400">{projectPrefix}-{task.ticket_number}</span>
            {taskType && (
              <span className={`ml-2 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${taskType.color}`}>
                {taskType.label}
              </span>
            )}
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
            <X size={18} />
          </button>
        </div>

        <div className="p-6">
          <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">{task.title}</h2>

          {task.description && (
            <p className="mb-6 text-sm text-gray-600 dark:text-gray-400">{task.description}</p>
          )}

          <div className="mb-6 grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">Status</label>
              <StatusBadge status={task.status} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">Priority</label>
              <PriorityIcon priority={task.priority} showLabel />
            </div>
            <div>
              <label className="mb-1 flex items-center gap-1 text-xs font-medium text-gray-500 dark:text-gray-400">
                <Calendar size={12} /> Start
              </label>
              <p className="text-sm text-gray-900 dark:text-white">
                {task.start_date ? format(new Date(task.start_date), 'MMM d, yyyy') : '—'}
              </p>
            </div>
            <div>
              <label className="mb-1 flex items-center gap-1 text-xs font-medium text-gray-500 dark:text-gray-400">
                <Calendar size={12} /> Due
              </label>
              <p className="text-sm text-gray-900 dark:text-white">
                {task.due_date ? format(new Date(task.due_date), 'MMM d, yyyy') : '—'}
              </p>
            </div>
            <div>
              <label className="mb-1 flex items-center gap-1 text-xs font-medium text-gray-500 dark:text-gray-400">
                <Clock size={12} /> Est. Hours
              </label>
              <p className="text-sm text-gray-900 dark:text-white">{task.est_hours ?? '—'}</p>
            </div>
            <div>
              <label className="mb-1 flex items-center gap-1 text-xs font-medium text-gray-500 dark:text-gray-400">
                <Clock size={12} /> Est. Days
              </label>
              <p className="text-sm text-gray-900 dark:text-white">{task.est_days ?? '—'}</p>
            </div>
          </div>

          <div className="mb-6">
            <label className="mb-2 block text-xs font-medium text-gray-500 dark:text-gray-400">Change Status</label>
            <div className="flex flex-wrap gap-2">
              {STATUS_OPTIONS.map((s) => (
                <button
                  key={s.value}
                  onClick={() => handleStatusChange(s.value)}
                  className={cn(
                    'rounded-xl border px-3 py-1.5 text-xs font-medium transition-all',
                    task.status === s.value
                      ? 'border-indigo-300 bg-indigo-50 text-indigo-700 dark:border-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400'
                      : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400'
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 border-t border-gray-200 pt-4 dark:border-gray-800">
            <Button variant="secondary" onClick={() => onEdit(task)}>
              Edit Task
            </Button>
            {!confirmDelete ? (
              <Button variant="danger" onClick={() => setConfirmDelete(true)}>
                Delete
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="danger" onClick={handleDelete}>Confirm Delete</Button>
                <Button variant="ghost" onClick={() => setConfirmDelete(false)}>Cancel</Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

function KanbanColumn({
  status,
  tasks,
  onTaskSelect,
  projectPrefix,
  profiles,
}: {
  status: TaskStatus
  tasks: Task[]
  onTaskSelect: (task: Task) => void
  projectPrefix: string
  profiles: Profile[]
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status })

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex min-w-0 flex-1 flex-col rounded-xl transition-colors',
        isOver ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''
      )}
    >
      <div className="mb-3 flex items-center gap-2">
        <StatusBadge status={status} />
        <span className="text-xs text-gray-400 dark:text-gray-500">{tasks.length}</span>
      </div>
      <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <div className="flex-1 space-y-2 min-h-[60px]">
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} onSelect={() => onTaskSelect(task)} projectPrefix={projectPrefix} profiles={profiles} />
          ))}
        </div>
      </SortableContext>
    </div>
  )
}

export function BoardView({ tasks, profiles, onUpdateTask, onSelectTask, searchQuery, projectPrefix }: BoardViewProps) {
  const [detailTask, setDetailTask] = useState<Task | null>(null)

  const filteredTasks = useMemo(() => {
    // Filter out subtasks - only show root tasks on board
    const rootTasks = tasks.filter((t) => !t.parent_task_id)
    if (!searchQuery) return rootTasks
    const q = searchQuery.toLowerCase()
    return rootTasks.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.status.toLowerCase().includes(q) ||
        t.priority.toLowerCase().includes(q) ||
        t.task_type.toLowerCase().includes(q) ||
        `${projectPrefix}-${t.ticket_number}`.toLowerCase().includes(q)
    )
  }, [tasks, searchQuery, projectPrefix])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  const tasksByStatus = useMemo(() => {
    const grouped: Record<TaskStatus, Task[]> = {
      todo: [],
      in_progress: [],
      hold: [],
      qa_test: [],
      done: [],
    }
    filteredTasks.forEach((task) => {
      grouped[task.status].push(task)
    })
    return grouped
  }, [filteredTasks])

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over) return

    const activeTask = filteredTasks.find((t) => t.id === active.id)
    if (!activeTask) return

    let newStatus: TaskStatus | null = null

    if (STATUS_OPTIONS.some((s) => s.value === over.id)) {
      newStatus = over.id as TaskStatus
    } else {
      const overTask = filteredTasks.find((t) => t.id === over.id)
      if (overTask && overTask.status !== activeTask.status) {
        newStatus = overTask.status
      }
    }

    if (newStatus && newStatus !== activeTask.status) {
      onUpdateTask(activeTask.id, { status: newStatus }).then(() => {
        toast.success(`Moved to ${STATUS_OPTIONS.find(s => s.value === newStatus)?.label}`)
      })
    }
  }

  function handleTaskClick(task: Task) {
    setDetailTask(task)
  }

  return (
    <>
      <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
        <div className="flex gap-4 p-6">
          {STATUS_OPTIONS.map((option) => (
            <KanbanColumn
              key={option.value}
              status={option.value}
              tasks={tasksByStatus[option.value]}
              onTaskSelect={handleTaskClick}
              projectPrefix={projectPrefix}
              profiles={profiles}
            />
          ))}
        </div>
      </DndContext>

      {detailTask && (
        <TaskDetailModal
          task={detailTask}
          onClose={() => setDetailTask(null)}
          onUpdate={onUpdateTask}
          onEdit={(t) => { setDetailTask(null); onSelectTask(t) }}
          projectPrefix={projectPrefix}
        />
      )}
    </>
  )
}
