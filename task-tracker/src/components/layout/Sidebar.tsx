import { useState } from 'react'
import { FolderOpen, LayoutGrid, Sun, Moon, LogOut, Plus, Trash2, X, Shield, ChevronRight, ChevronDown } from 'lucide-react'
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
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [projectsExpanded, setProjectsExpanded] = useState(true)

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

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
      {/* Logo */}
      <div className="flex items-center gap-3 border-b border-gray-100 px-5 py-4 dark:border-gray-800">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/25">
          <LayoutGrid className="h-4.5 w-4.5 text-white" />
        </div>
        <div>
          <span className="text-sm font-bold text-gray-900 dark:text-white">Gantt Chart</span>
          <p className="text-[10px] text-gray-400 dark:text-gray-500">Task Tracker</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Projects Section */}
        <div className="px-3 pt-4">
          <button
            onClick={() => setProjectsExpanded(!projectsExpanded)}
            className="flex w-full items-center justify-between px-2 py-1"
          >
            <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
              Projects
            </span>
            <div className="flex items-center gap-1">
              {canManageProjects && (
                <button
                  onClick={(e) => { e.stopPropagation(); setShowCreate(true) }}
                  className="rounded-md p-0.5 text-gray-400 hover:bg-gray-100 hover:text-indigo-600 dark:hover:bg-gray-800"
                >
                  <Plus size={13} />
                </button>
              )}
              {projectsExpanded ? <ChevronDown size={12} className="text-gray-400" /> : <ChevronRight size={12} className="text-gray-400" />}
            </div>
          </button>

          {projectsExpanded && (
            <>
              {showCreate && (
                <div className="mb-2 rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800/50">
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
                    className="mb-2 w-full rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                    placeholder="Project name"
                  />
                  <input
                    value={newShortName}
                    onChange={(e) => setNewShortName(e.target.value.replace(/[^a-zA-Z0-9]/g, '').slice(0, 6))}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleCreate() }}
                    className="mb-2 w-full rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs uppercase dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                    placeholder="Short name (e.g. GANT)"
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

              <div className="mt-1 space-y-0.5">
                {projects.map((project) => (
                  <div key={project.id} className="group relative">
                    <button
                      onClick={() => onSelectProject(project.id)}
                      className={cn(
                        'flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm transition-all',
                        activeProjectId === project.id
                          ? 'bg-indigo-50 text-indigo-700 font-medium dark:bg-indigo-900/20 dark:text-indigo-400'
                          : 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800/50'
                      )}
                    >
                      <FolderOpen size={15} className={activeProjectId === project.id ? 'text-indigo-500' : 'text-gray-400'} />
                      <span className="flex-1 truncate text-left">{project.name}</span>
                      {project.short_name && (
                        <span className="rounded-md bg-gray-100 px-1.5 py-0.5 text-[10px] font-mono text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                          {project.short_name}
                        </span>
                      )}
                    </button>
                    {activeProjectId === project.id && canManageProjects && (
                      <button
                        onClick={(e) => { e.stopPropagation(); setDeleteId(project.id) }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-gray-400 opacity-0 transition-opacity hover:bg-red-50 hover:text-red-500 group-hover:opacity-100 dark:hover:bg-red-900/20"
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
            </>
          )}
        </div>

        {/* Epics */}
        {activeProjectId && activeTab === 'projects' && projectsExpanded && (
          <EpicPanel
            projectId={activeProjectId}
            activeEpicId={activeEpicId}
            onSelectEpic={onSelectEpic}
          />
        )}

        {/* Admin */}
        {canManageUsers && (
          <div className="px-3 py-2">
            <button
              onClick={() => onSelectTab(activeTab === 'admin' ? 'projects' : 'admin')}
              className={cn(
                'flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm transition-all',
                activeTab === 'admin'
                  ? 'bg-indigo-50 text-indigo-700 font-medium dark:bg-indigo-900/20 dark:text-indigo-400'
                  : 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800/50'
              )}
            >
              <Shield size={15} className={activeTab === 'admin' ? 'text-indigo-500' : 'text-gray-400'} />
              <span>Admin Panel</span>
            </button>
          </div>
        )}
      </div>

      {/* User section */}
      <div className="border-t border-gray-100 p-3 dark:border-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="h-8 w-8 rounded-full ring-2 ring-white dark:ring-gray-900" />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-[11px] font-bold text-white ring-2 ring-white dark:ring-gray-900">
                {profile?.name?.charAt(0)?.toUpperCase() ?? 'U'}
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate text-xs font-medium text-gray-700 dark:text-gray-300">{profile?.name ?? 'User'}</p>
              <p className="text-[10px] text-gray-400 dark:text-gray-500">{ROLE_OPTIONS.find(r => r.value === profile?.role)?.label ?? profile?.role}</p>
            </div>
          </div>
          <div className="flex gap-0.5">
            <button onClick={onToggleDark} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800" title="Toggle theme">
              {darkMode ? <Sun size={14} /> : <Moon size={14} />}
            </button>
            <button onClick={signOut} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-red-500 dark:hover:bg-gray-800" title="Sign out">
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
        onConfirm={() => { if (deleteId) onDeleteProject(deleteId); setDeleteId(null) }}
        onCancel={() => setDeleteId(null)}
      />
    </aside>
  )
}
