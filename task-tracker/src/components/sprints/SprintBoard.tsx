import { useState } from 'react'
import toast from 'react-hot-toast'
import { Plus, Calendar, Target, Trash2, Play, CheckCircle, Clock } from 'lucide-react'
import { useSprints } from '@/hooks/useSprints'
import { useAuth } from '@/components/auth/AuthProvider'
import { getPermissions, SPRINT_STATUS_OPTIONS } from '@/types'
import type { Sprint, SprintStatus, Task } from '@/types'
import { format, differenceInDays } from 'date-fns'
import { cn } from '@/lib/utils'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'

interface SprintBoardProps {
  projectId: string
  tasks: Task[]
  onEditTask: (task: Task) => void
}

export function SprintBoard({ projectId, tasks, onEditTask }: SprintBoardProps) {
  const { profile } = useAuth()
  const perms = profile ? getPermissions(profile.role) : getPermissions('viewer')
  const { sprints, loading, createSprint, updateSprint, deleteSprint, assignTaskToSprint } = useSprints(projectId)
  const [showForm, setShowForm] = useState(false)
  const [editingSprint, setEditingSprint] = useState<Sprint | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [formName, setFormName] = useState('')
  const [formGoal, setFormGoal] = useState('')
  const [formStart, setFormStart] = useState('')
  const [formEnd, setFormEnd] = useState('')
  const [formStatus, setFormStatus] = useState<SprintStatus>('planning')

  const canManage = perms.canCreateTask

  const unassignedTasks = tasks.filter((t) => !t.sprint_id && !t.parent_task_id)

  function openNewSprint() {
    setEditingSprint(null)
    setFormName('')
    setFormGoal('')
    setFormStart('')
    setFormEnd('')
    setFormStatus('planning')
    setShowForm(true)
  }

  function openEditSprint(sprint: Sprint) {
    setEditingSprint(sprint)
    setFormName(sprint.name)
    setFormGoal(sprint.goal || '')
    setFormStart(sprint.start_date)
    setFormEnd(sprint.end_date)
    setFormStatus(sprint.status)
    setShowForm(true)
  }

  async function handleSave() {
    if (!formName.trim() || !formStart || !formEnd) {
      toast.error('Name, start date and end date are required')
      return
    }

    if (editingSprint) {
      const result = await updateSprint(editingSprint.id, {
        name: formName.trim(),
        goal: formGoal.trim() || null,
        start_date: formStart,
        end_date: formEnd,
        status: formStatus,
      })
      if (!result.error) {
        toast.success('Sprint updated')
        setShowForm(false)
      } else {
        toast.error(result.error)
      }
    } else {
      const result = await createSprint({
        project_id: projectId,
        name: formName.trim(),
        goal: formGoal.trim() || null,
        start_date: formStart,
        end_date: formEnd,
        status: formStatus,
      })
      if (!result.error) {
        toast.success('Sprint created')
        setShowForm(false)
      } else {
        toast.error(result.error)
      }
    }
  }

  async function handleStartSprint(sprint: Sprint) {
    // Deactivate current active sprint
    const currentActive = sprints.find((s) => s.status === 'active')
    if (currentActive && currentActive.id !== sprint.id) {
      await updateSprint(currentActive.id, { status: 'completed' })
    }
    await updateSprint(sprint.id, { status: 'active' })
    toast.success('Sprint started!')
  }

  async function handleCompleteSprint(sprint: Sprint) {
    await updateSprint(sprint.id, { status: 'completed' })
    toast.success('Sprint completed!')
  }

  async function handleAssignTask(taskId: string, sprintId: string | null) {
    const result = await assignTaskToSprint(taskId, sprintId)
    if (!result.error) {
      toast.success(sprintId ? 'Task added to sprint' : 'Task removed from sprint')
    }
  }

  async function handleDeleteSprint(id: string) {
    // Unassign all tasks from this sprint
    const sprintTasks = tasks.filter((t) => t.sprint_id === id)
    for (const task of sprintTasks) {
      await assignTaskToSprint(task.id, null)
    }
    const result = await deleteSprint(id)
    if (!result.error) {
      toast.success('Sprint deleted')
      setDeleteId(null)
    } else {
      toast.error(result.error)
    }
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
          <p className="text-sm text-gray-400">Loading sprints...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-auto p-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-900/30">
              <Target className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">Sprints</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">{sprints.length} sprints</p>
            </div>
          </div>
          {canManage && (
            <button
              onClick={openNewSprint}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
            >
              <Plus size={16} /> New Sprint
            </button>
          )}
        </div>

        {/* Sprint Form Modal */}
        {showForm && (
          <>
            <div className="fixed inset-0 z-50 bg-black/50" onClick={() => setShowForm(false)} />
            <div className="fixed inset-4 z-50 mx-auto max-w-lg overflow-auto rounded-2xl bg-white shadow-2xl dark:bg-gray-900 sm:inset-y-[15vh]">
              <div className="p-6">
                <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
                  {editingSprint ? 'Edit Sprint' : 'New Sprint'}
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Sprint Name</label>
                    <input
                      autoFocus
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      className="mt-1.5 block w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                      placeholder="Sprint 1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Goal</label>
                    <input
                      value={formGoal}
                      onChange={(e) => setFormGoal(e.target.value)}
                      className="mt-1.5 block w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                      placeholder="What should this sprint achieve?"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Start Date</label>
                      <input
                        type="date"
                        value={formStart}
                        onChange={(e) => setFormStart(e.target.value)}
                        className="mt-1.5 block w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">End Date</label>
                      <input
                        type="date"
                        value={formEnd}
                        onChange={(e) => setFormEnd(e.target.value)}
                        className="mt-1.5 block w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
                    <div className="mt-1.5 flex gap-2">
                      {SPRINT_STATUS_OPTIONS.map((s) => (
                        <button
                          key={s.value}
                          type="button"
                          onClick={() => setFormStatus(s.value)}
                          className={cn(
                            'rounded-lg border px-3 py-1.5 text-xs font-medium transition-all',
                            formStatus === s.value
                              ? 'border-indigo-300 bg-indigo-50 text-indigo-700 dark:border-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400'
                              : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400'
                          )}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="mt-6 flex justify-end gap-3">
                  <button
                    onClick={() => setShowForm(false)}
                    className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                  >
                    {editingSprint ? 'Update' : 'Create'}
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Sprint Cards */}
        <div className="space-y-4">
          {sprints.map((sprint) => {
            const sprintTasks = tasks.filter((t) => t.sprint_id === sprint.id)
            const doneTasks = sprintTasks.filter((t) => t.status === 'done')
            const progress = sprintTasks.length > 0 ? Math.round((doneTasks.length / sprintTasks.length) * 100) : 0
            const daysLeft = differenceInDays(new Date(sprint.end_date), new Date())
            const isActive = sprint.status === 'active'
            const isCompleted = sprint.status === 'completed'

            return (
              <div
                key={sprint.id}
                className={cn(
                  'rounded-2xl border bg-white p-5 shadow-sm transition-all dark:bg-gray-900',
                  isActive ? 'border-blue-300 ring-2 ring-blue-500/20 dark:border-blue-700' :
                  isCompleted ? 'border-green-200 dark:border-green-800' :
                  'border-gray-200 dark:border-gray-800'
                )}
              >
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{sprint.name}</h3>
                      <span className={cn(
                        'rounded-full px-2.5 py-0.5 text-xs font-medium',
                        SPRINT_STATUS_OPTIONS.find((s) => s.value === sprint.status)?.color
                      )}>
                        {SPRINT_STATUS_OPTIONS.find((s) => s.value === sprint.status)?.label}
                      </span>
                    </div>
                    {sprint.goal && (
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{sprint.goal}</p>
                    )}
                    <div className="mt-2 flex items-center gap-4 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <Calendar size={12} />
                        {format(new Date(sprint.start_date), 'MMM d')} - {format(new Date(sprint.end_date), 'MMM d, yyyy')}
                      </span>
                      {isActive && (
                        <span className={cn('flex items-center gap-1', daysLeft < 0 ? 'text-red-500' : daysLeft <= 3 ? 'text-orange-500' : 'text-blue-500')}>
                          <Clock size={12} />
                          {daysLeft < 0 ? `${Math.abs(daysLeft)} days overdue` : `${daysLeft} days left`}
                        </span>
                      )}
                    </div>
                  </div>
                  {canManage && (
                    <div className="flex gap-2">
                      {!isActive && !isCompleted && (
                        <button
                          onClick={() => handleStartSprint(sprint)}
                          className="flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
                        >
                          <Play size={12} /> Start
                        </button>
                      )}
                      {isActive && (
                        <button
                          onClick={() => handleCompleteSprint(sprint)}
                          className="flex items-center gap-1 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700"
                        >
                          <CheckCircle size={12} /> Complete
                        </button>
                      )}
                      <button
                        onClick={() => openEditSprint(sprint)}
                        className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400"
                      >
                        Edit
                      </button>
                      {perms.canDeleteTask && (
                        <button
                          onClick={() => setDeleteId(sprint.id)}
                          className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Progress Bar */}
                {sprintTasks.length > 0 && (
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                      <span>{doneTasks.length}/{sprintTasks.length} tasks done</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="mt-1.5 h-2 w-full rounded-full bg-gray-100 dark:bg-gray-800">
                      <div
                        className={cn('h-2 rounded-full transition-all', progress === 100 ? 'bg-green-500' : 'bg-indigo-500')}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Tasks in Sprint */}
                <div className="space-y-1">
                  {sprintTasks.map((task) => (
                    <div
                      key={task.id}
                      onClick={() => onEditTask(task)}
                      className="flex items-center gap-2 rounded-lg border border-gray-100 px-3 py-2 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/50 cursor-pointer"
                    >
                      <div className={cn(
                        'h-2 w-2 rounded-full',
                        task.status === 'done' ? 'bg-green-500' :
                        task.status === 'in_progress' ? 'bg-blue-500' :
                        task.status === 'hold' ? 'bg-orange-500' :
                        'bg-gray-300'
                      )} />
                      <span className={cn(
                        'flex-1 text-sm',
                        task.status === 'done' ? 'text-gray-400 line-through' : 'text-gray-700 dark:text-gray-300'
                      )}>
                        {task.title}
                      </span>
                      {canManage && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleAssignTask(task.id, null) }}
                          className="text-xs text-gray-400 hover:text-red-500"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                  {sprintTasks.length === 0 && (
                    <p className="py-2 text-center text-xs text-gray-400 dark:text-gray-500">No tasks in this sprint</p>
                  )}
                </div>
              </div>
            )
          })}

          {sprints.length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 py-12 dark:border-gray-800">
              <Target className="mb-3 h-10 w-10 text-gray-300 dark:text-gray-600" />
              <p className="text-sm text-gray-500 dark:text-gray-400">No sprints yet</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">Create your first sprint to get started</p>
            </div>
          )}
        </div>

        {/* Unassigned Tasks */}
        {unassignedTasks.length > 0 && canManage && (
          <div className="mt-6 rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-800/50">
            <h3 className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">
              Unassigned Tasks ({unassignedTasks.length})
            </h3>
            <div className="flex flex-wrap gap-2">
              {unassignedTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-800"
                >
                  <span className="text-gray-700 dark:text-gray-300">{task.title}</span>
                  <select
                    defaultValue=""
                    onChange={(e) => {
                      if (e.target.value) handleAssignTask(task.id, e.target.value)
                    }}
                    className="rounded border border-gray-300 bg-white px-1.5 py-0.5 text-xs dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                  >
                    <option value="">Assign to sprint</option>
                    {sprints.filter((s) => s.status !== 'completed').map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>
        )}

        <ConfirmDialog
          open={!!deleteId}
          title="Delete Sprint"
          message="Tasks will be unassigned. Continue?"
          confirmLabel="Delete"
          onConfirm={() => { if (deleteId) handleDeleteSprint(deleteId) }}
          onCancel={() => setDeleteId(null)}
        />
      </div>
    </div>
  )
}
