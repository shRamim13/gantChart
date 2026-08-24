import { useState } from 'react'
import { FolderOpen, LayoutGrid, Sun, Moon, LogOut, Plus, Trash2, X, Shield } from 'lucide-react'
import { useAuth } from '@/components/auth/AuthProvider'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { EpicPanel } from '@/components/epics/EpicPanel'
import { cn } from '@/lib/utils'
import { getPermissions, ROLE_OPTIONS } from '@/types'
import type { Project } from '@/types'

interface SidebarProps {
  projects: Project[]
  activeProjectId: string | null
  activeEpicId: string | null
  activeTab: 'projects' | 'admin'
  onSelectProject: (id: string) => void
  onSelectEpic: (id: string | null) => void
  onSelectTab: (tab: 'projects' | 'admin') => void
  onCreateProject: (name: string, shortName: string) => void
  onDeleteProject: (id: string) => void
  darkMode: boolean
  onToggleDark: () => void
}

export function Sidebar({ projects, activeProjectId, activeEpicId, activeTab, onSelectProject, onSelectEpic, onSelectTab, onCreateProject, onDeleteProject, darkMode, onToggleDark }: SidebarProps) {
  const { profile, signOut } = useAuth()
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [newShortName, setNewShortName] = useState('')
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const perms = profile ? getPermissions(profile.role) : getPermissions('viewer')
  const canManageProjects = perms.canCreateProject
  const canManageUsers = perms.canManageUsers

  function handleCreate() {
    if (newName.trim() && newShortName.trim()) {
      onCreateProject(newName.trim(), newShortName.trim().toUpperCase())
      setNewName('')
      setNewShortName('')
      setShowCreate(false)
    }
  }

  function handleDelete(e: React.MouseEvent, id: string) {
    e.stopPropagation()
    setDeleteId(id)
  }

  return (
    <aside className="flex h-screen w-60 flex-col border-r border-gray-200 bg-[#fafafa] dark:border-gray-800 dark:bg-[#1a1a2e]">
      <div className="flex items-center gap-2 border-b border-gray-200 px-4 py-4 dark:border-gray-800">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600">
          <LayoutGrid className="h-4 w-4 text-white" />
        </div>
        <span className="text-sm font-semibold text-gray-900 dark:text-white">Task Tracker</span>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="px-2 py-3">
          <div className="mb-2 flex items-center justify-between px-2">
            <p className="text-[11px] font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">
              Projects
            </p>
            {canManageProjects && (
              <button
                onClick={() => setShowCreate(true)}
                className="rounded p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800"
              >
                <Plus size={14} />
              </button>
            )}
          </div>

          {showCreate && (
            <div className="mb-3 rounded-xl border border-gray-200 bg-white p-3 shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">New Project</span>
                <button onClick={() => { setShowCreate(false); setNewName(''); setNewShortName('') }} className="text-gray-400 hover:text-gray-600">
                  <X size={12} />
                </button>
              </div>
              <input
                autoFocus
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="mb-2 w-full rounded-lg border border-gray-300 bg-gray-50 px-2.5 py-1.5 text-xs dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                placeholder="Project name"
              />
              <input
                value={newShortName}
                onChange={(e) => setNewShortName(e.target.value.replace(/[^a-zA-Z0-9]/g, '').slice(0, 6))}
                onKeyDown={(e) => { if (e.key === 'Enter') handleCreate() }}
                className="mb-2 w-full rounded-lg border border-gray-300 bg-gray-50 px-2.5 py-1.5 text-xs uppercase dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                placeholder="Short name (e.g. Gant)"
                maxLength={6}
              />
              <p className="mb-2 text-[10px] text-gray-400">Tickets: {newShortName ? newShortName.toUpperCase() : '???'}-1, {newShortName ? newShortName.toUpperCase() : '???'}-2...</p>
              <button
                onClick={handleCreate}
                disabled={!newName.trim() || !newShortName.trim()}
                className="w-full rounded-lg bg-indigo-600 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                Create
              </button>
            </div>
          )}

          <div className="space-y-0.5">
            {projects.map((project) => (
              <div
                key={project.id}
                className="group relative"
                onMouseEnter={() => setHoveredId(project.id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                <button
                  onClick={() => onSelectProject(project.id)}
                  className={cn(
                    'flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors',
                    activeProjectId === project.id
                      ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400'
                      : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
                  )}
                >
                  <FolderOpen size={16} />
                  <span className="flex-1 truncate text-left">{project.name}</span>
                  {project.short_name && (
                    <span className="rounded bg-gray-100 px-1 py-0.5 text-[10px] font-mono text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                      {project.short_name}
                    </span>
                  )}
                </button>
                {hoveredId === project.id && canManageProjects && (
                  <button
                    onClick={(e) => handleDelete(e, project.id)}
                    className="absolute right-1 top-1/2 -translate-y-1/2 rounded p-1 text-gray-400 opacity-0 transition-opacity hover:bg-red-50 hover:text-red-500 group-hover:opacity-100 dark:hover:bg-red-900/20"
                    title="Delete project"
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
            ))}
            {projects.length === 0 && !showCreate && (
              <p className="px-2 py-4 text-center text-xs text-gray-400 dark:text-gray-500">
                No projects yet
              </p>
            )}
          </div>
        </div>

        {activeProjectId && activeTab === 'projects' && (
          <EpicPanel
            projectId={activeProjectId}
            activeEpicId={activeEpicId}
            onSelectEpic={onSelectEpic}
          />
        )}

        {canManageUsers && (
          <div className="px-2 py-2">
            <button
              onClick={() => onSelectTab(activeTab === 'admin' ? 'projects' : 'admin')}
              className={cn(
                'flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors',
                activeTab === 'admin'
                  ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400'
                  : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
              )}
            >
              <Shield size={16} />
              <span>Admin</span>
            </button>
          </div>
        )}
      </div>

      <div className="border-t border-gray-200 p-3 dark:border-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-medium text-white">
              {profile?.name?.charAt(0)?.toUpperCase() ?? 'U'}
            </div>
            <div>
              <span className="text-xs text-gray-600 dark:text-gray-400">{profile?.name ?? 'User'}</span>
              <span className="ml-1 rounded bg-gray-100 px-1 py-0.5 text-[9px] text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                {ROLE_OPTIONS.find(r => r.value === profile?.role)?.label ?? profile?.role}
              </span>
            </div>
          </div>
          <div className="flex gap-1">
            <button
              onClick={onToggleDark}
              className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800"
            >
              {darkMode ? <Sun size={14} /> : <Moon size={14} />}
            </button>
            <button
              onClick={signOut}
              className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={!!deleteId}
        title="Delete Project"
        message="Are you sure you want to delete this project and all its tasks? This action cannot be undone."
        confirmLabel="Delete Project"
        onConfirm={() => {
          if (deleteId) onDeleteProject(deleteId)
          setDeleteId(null)
        }}
        onCancel={() => setDeleteId(null)}
      />
    </aside>
  )
}
