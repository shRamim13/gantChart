import { useState, useEffect, useRef } from 'react'
import { Paperclip, Trash2 } from 'lucide-react'
import type { Task, TaskStatus, TaskPriority, TaskType, Epic, Profile } from '@/types'
import { STATUS_OPTIONS, PRIORITY_OPTIONS, TASK_TYPE_OPTIONS } from '@/types'
import { Button } from '@/components/ui/Button'
import { SlideOver } from '@/components/ui/SlideOver'

interface TaskFormProps {
  open: boolean
  onClose: () => void
  onSave: (data: Omit<Task, 'id' | 'created_at' | 'updated_at' | 'is_deleted' | 'ticket_number'>) => Promise<{ data?: { id: string }; error?: string }>
  project_id: string
  initialData?: Task | null
  nextTicketNumber?: number
  projectPrefix?: string
  epics?: Epic[]
  profiles?: Profile[]
  defaultEpicId?: string | null
  parentTaskId?: string | null
  onUploadAttachment?: (taskId: string, file: File) => Promise<{ error?: string }>
}

export function TaskForm({ open, onClose, onSave, project_id, initialData, nextTicketNumber = 1, projectPrefix = 'TASK', epics = [], profiles = [], defaultEpicId = null, parentTaskId = null, onUploadAttachment }: TaskFormProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<TaskStatus>('todo')
  const [priority, setPriority] = useState<TaskPriority>('medium')
  const [taskType, setTaskType] = useState<TaskType>('feature')
  const [epicId, setEpicId] = useState<string | null>(null)
  const [assigneeId, setAssigneeId] = useState<string | null>(null)
  const [estHours, setEstHours] = useState('')
  const [estDays, setEstDays] = useState('')
  const [startDate, setStartDate] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title)
      setDescription(initialData.description ?? '')
      setStatus(initialData.status)
      setPriority(initialData.priority)
      setTaskType(initialData.task_type ?? 'feature')
      setEpicId(initialData.epic_id ?? null)
      setAssigneeId(initialData.assignee_id ?? null)
      setEstHours(initialData.est_hours?.toString() ?? '')
      setEstDays(initialData.est_days?.toString() ?? '')
      setStartDate(initialData.start_date ?? '')
      setDueDate(initialData.due_date ?? '')
    } else {
      setTitle('')
      setDescription('')
      setStatus('todo')
      setPriority('medium')
      setTaskType('feature')
      setEpicId(defaultEpicId)
      setAssigneeId(null)
      setEstHours('')
      setEstDays('')
      setStartDate('')
      setDueDate('')
      setPendingFiles([])
    }
  }, [initialData, open, defaultEpicId])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const result = await onSave({
        project_id,
        title,
        description: description || null,
        status,
        priority,
        task_type: taskType,
        est_hours: estHours ? Number(estHours) : null,
        est_days: estDays ? Number(estDays) : null,
        start_date: startDate || null,
        due_date: dueDate || null,
        epic_id: epicId,
        module_id: initialData?.module_id ?? null,
        assignee_id: assigneeId,
        parent_task_id: initialData?.parent_task_id ?? parentTaskId,
        sprint_id: initialData?.sprint_id ?? null,
      })

      if (result?.error) {
        setError(result.error)
      } else {
        if (result?.data?.id && pendingFiles.length > 0 && onUploadAttachment) {
          for (const file of pendingFiles) {
            await onUploadAttachment(result.data.id, file)
          }
        }
        setPendingFiles([])
        onClose()
        return
      }
    } catch {
      setError('Something went wrong')
    }
    setLoading(false)
  }

  const ticketId = initialData ? `${projectPrefix}-${initialData.ticket_number}` : `${projectPrefix}-${nextTicketNumber}`
  const isSubtask = !initialData && parentTaskId

  return (
    <SlideOver open={open} onClose={onClose} title={initialData ? `Edit ${ticketId}` : isSubtask ? `New Subtask (${ticketId})` : `New Task (${ticketId})`}>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Title *</label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1.5 block w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            placeholder="What needs to be done?"
            autoFocus
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="mt-1.5 block w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            placeholder="Add more details..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Epic</label>
          <select
            value={epicId ?? ''}
            onChange={(e) => setEpicId(e.target.value || null)}
            className="mt-1.5 block w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          >
            <option value="">No Epic</option>
            {epics.map((epic) => (
              <option key={epic.id} value={epic.id}>{epic.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Assignee</label>
          <select
            value={assigneeId ?? ''}
            onChange={(e) => setAssigneeId(e.target.value || null)}
            className="mt-1.5 block w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          >
            <option value="">Unassigned</option>
            {profiles.filter((p) => p.is_active !== false).map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Type</label>
          <div className="mt-1.5 flex flex-wrap gap-2">
            {TASK_TYPE_OPTIONS.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setTaskType(t.value)}
                className={`rounded-xl border px-3 py-1.5 text-xs font-medium transition-all ${
                  taskType === t.value
                    ? `${t.color} border-current ring-2 ring-current/20`
                    : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as TaskStatus)}
              className="mt-1.5 block w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as TaskPriority)}
              className="mt-1.5 block w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            >
              {PRIORITY_OPTIONS.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Est. Hours</label>
            <input
              type="number"
              value={estHours}
              onChange={(e) => setEstHours(e.target.value)}
              className="mt-1.5 block w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              min="0"
              placeholder="0"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Est. Days</label>
            <input
              type="number"
              value={estDays}
              onChange={(e) => setEstDays(e.target.value)}
              className="mt-1.5 block w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              min="0"
              placeholder="0"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="mt-1.5 block w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Due Date</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="mt-1.5 block w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>
        </div>

        {onUploadAttachment && (
          <div>
            <label className="flex items-center gap-1 text-sm font-medium text-gray-700 dark:text-gray-300">
              <Paperclip size={14} /> Attachments
            </label>
            <input ref={fileInputRef} type="file" multiple className="hidden" onChange={(e) => {
              const files = Array.from(e.target.files || [])
              setPendingFiles((prev) => [...prev, ...files])
              if (fileInputRef.current) fileInputRef.current.value = ''
            }} />
            <div className="mt-1.5 space-y-1.5">
              {pendingFiles.map((file, idx) => (
                <div key={idx} className="flex items-center gap-2 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 dark:border-gray-800 dark:bg-gray-800/50">
                  <span className="text-sm">📎</span>
                  <span className="flex-1 truncate text-xs text-gray-700 dark:text-gray-300">{file.name}</span>
                  <button type="button" onClick={() => setPendingFiles((prev) => prev.filter((_, i) => i !== idx))} className="rounded p-0.5 text-gray-400 hover:text-red-500">
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
              <button type="button" onClick={() => fileInputRef.current?.click()} className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700 dark:text-indigo-400">
                <Paperclip size={12} /> Add file
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-3 border-t border-gray-200 pt-4 dark:border-gray-800">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Saving...' : initialData ? 'Update Task' : 'Create Task'}
          </Button>
        </div>
      </form>
    </SlideOver>
  )
}
