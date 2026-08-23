import { useState } from 'react'
import toast from 'react-hot-toast'
import { Plus, X, Trash2 } from 'lucide-react'
import { useEpics } from '@/hooks/useEpics'
import { useAuth } from '@/components/auth/AuthProvider'
import { EPIC_COLORS } from '@/types'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { cn } from '@/lib/utils'

interface EpicPanelProps {
  projectId: string
  activeEpicId: string | null
  onSelectEpic: (id: string | null) => void
}

export function EpicPanel({ projectId, activeEpicId, onSelectEpic }: EpicPanelProps) {
  const { profile } = useAuth()
  const { epics, createEpic, deleteEpic } = useEpics(projectId)
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState(EPIC_COLORS[0])
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const canManage = profile?.role === 'admin' || profile?.role === 'editor'

  function handleCreate() {
    if (!newName.trim()) return
    const promise = createEpic(newName.trim(), newColor).then((r) => {
      if (r.error) throw new Error(r.error)
      setNewName('')
      setNewColor(EPIC_COLORS[0])
      setShowCreate(false)
      return r
    })
    toast.promise(promise, { loading: 'Creating epic...', success: 'Epic created!', error: 'Failed to create epic' })
  }

  function handleDelete() {
    if (!deleteId) return
    const promise = deleteEpic(deleteId).then((r) => {
      if (r.error) throw new Error(r.error)
      if (activeEpicId === deleteId) onSelectEpic(null)
      return r
    })
    toast.promise(promise, { loading: 'Deleting epic...', success: 'Epic deleted', error: 'Failed to delete epic' })
    setDeleteId(null)
  }

  return (
    <>
      <div className="px-2 py-2">
        <div className="mb-2 flex items-center justify-between px-2">
          <p className="text-[11px] font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">Epics</p>
          {canManage && (
            <button onClick={() => setShowCreate(true)} className="rounded p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800">
              <Plus size={14} />
            </button>
          )}
        </div>

        {showCreate && (
          <div className="mb-2 rounded-xl border border-gray-200 bg-white p-3 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">New Epic</span>
              <button onClick={() => { setShowCreate(false); setNewName('') }} className="text-gray-400 hover:text-gray-600">
                <X size={12} />
              </button>
            </div>
            <input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              className="mb-2 w-full rounded-lg border border-gray-300 bg-gray-50 px-2.5 py-1.5 text-xs dark:border-gray-600 dark:bg-gray-900 dark:text-white"
              placeholder="Epic name"
            />
            <div className="mb-2 flex flex-wrap gap-1.5">
              {EPIC_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => setNewColor(color)}
                  className={cn('h-5 w-5 rounded-full transition-transform', newColor === color && 'scale-125 ring-2 ring-offset-1 ring-gray-400')}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <button
              onClick={handleCreate}
              disabled={!newName.trim()}
              className="w-full rounded-lg bg-indigo-600 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              Create
            </button>
          </div>
        )}

        <div className="space-y-0.5">
          <button
            onClick={() => onSelectEpic(null)}
            className={cn(
              'flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs transition-colors',
              activeEpicId === null
                ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400'
                : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
            )}
          >
            <div className="h-3 w-3 rounded-sm bg-gray-300 dark:bg-gray-600" />
            <span className="flex-1 text-left">All Tasks</span>
          </button>

          {epics.map((epic) => (
            <div key={epic.id} className="group relative">
              <button
                onClick={() => onSelectEpic(epic.id)}
                className={cn(
                  'flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs transition-colors',
                  activeEpicId === epic.id
                    ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400'
                    : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
                )}
              >
                <div className="h-3 w-3 rounded-sm" style={{ backgroundColor: epic.color }} />
                <span className="flex-1 text-left truncate">{epic.name}</span>
              </button>
              {canManage && (
                <button
                  onClick={(e) => { e.stopPropagation(); setDeleteId(epic.id) }}
                  className="absolute right-1 top-1/2 -translate-y-1/2 rounded p-1 text-gray-400 opacity-0 transition-opacity hover:bg-red-50 hover:text-red-500 group-hover:opacity-100 dark:hover:bg-red-900/20"
                >
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <ConfirmDialog
        open={!!deleteId}
        title="Delete Epic"
        message="Tasks in this epic will not be deleted. Continue?"
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </>
  )
}
