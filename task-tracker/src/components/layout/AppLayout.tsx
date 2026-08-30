import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { LayoutGrid } from 'lucide-react'
import { useAuth } from '@/components/auth/AuthProvider'
import { useProjects } from '@/hooks/useProjects'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { AdminPanel } from '@/components/admin/AdminPanel'
import { getPermissions } from '@/types'
import type { ViewType, SortField, SortDirection } from '@/types'

interface AppLayoutProps {
  children: (props: {
    projectId: string
    epicId: string | null
    searchQuery: string
    activeView: ViewType
    sortField: SortField
    sortDirection: SortDirection
    onNewTask: () => void
  }) => React.ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  const { profile } = useAuth()
  const { projects, createProject, deleteProject } = useProjects(profile?.role)
  const canCreateTask = profile ? getPermissions(profile.role).canCreateTask : false
  const [activeProjectId, setActiveProjectId] = useState<string | null>(() => localStorage.getItem('activeProjectId') || (projects[0]?.id ?? null))
  const [activeEpicId, setActiveEpicId] = useState<string | null>(null)
  const [activeView, setActiveView] = useState<ViewType>(() => (localStorage.getItem('activeView') as ViewType) || 'table')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortField, setSortField] = useState<SortField>(() => (localStorage.getItem('sortField') as SortField) || 'created_at')
  const [sortDirection, setSortDirection] = useState<SortDirection>(() => (localStorage.getItem('sortDirection') as SortDirection) || 'desc')
  const [activeTab, setActiveTab] = useState<'projects' | 'admin'>(() => (localStorage.getItem('activeTab') as 'projects' | 'admin') || 'projects')
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('darkMode') === 'true' ||
        (!localStorage.getItem('darkMode') && window.matchMedia('(prefers-color-scheme: dark)').matches)
    }
    return false
  })

  const toggleDark = () => {
    setDarkMode((prev) => {
      const next = !prev
      localStorage.setItem('darkMode', String(next))
      document.documentElement.classList.toggle('dark', next)
      return next
    })
  }

  useEffect(() => { if (activeProjectId) localStorage.setItem('activeProjectId', activeProjectId) }, [activeProjectId])
  useEffect(() => { localStorage.setItem('activeView', activeView) }, [activeView])
  useEffect(() => { localStorage.setItem('sortField', sortField) }, [sortField])
  useEffect(() => { localStorage.setItem('sortDirection', sortDirection) }, [sortDirection])
  useEffect(() => { localStorage.setItem('activeTab', activeTab) }, [activeTab])

  if (typeof document !== 'undefined') {
    document.documentElement.classList.toggle('dark', darkMode)
  }

  const activeProject = projects.find((p) => p.id === activeProjectId)

  function handleSelectProject(id: string) {
    setActiveProjectId(id)
    setActiveEpicId(null)
  }

  function handleCreateProject(name: string, shortName: string) {
    const promise = createProject(name, shortName).then((result) => {
      if (result.data) {
        setActiveProjectId(result.data.id)
      }
      return result
    })
    toast.promise(promise, {
      loading: 'Creating project...',
      success: 'Project created!',
      error: 'Failed to create project',
    })
  }

  function handleDeleteProject(id: string) {
    const promise = deleteProject(id).then((result) => {
      if (activeProjectId === id) {
        const remaining = projects.filter((p) => p.id !== id)
        setActiveProjectId(remaining[0]?.id ?? null)
        setActiveEpicId(null)
      }
      return result
    })
    toast.promise(promise, {
      loading: 'Deleting project...',
      success: 'Project deleted',
      error: 'Failed to delete project',
    })
  }

  function handleSortChange(field: SortField, direction: SortDirection) {
    setSortField(field)
    setSortDirection(direction)
  }

  function handleNewTask() {
    window.dispatchEvent(new CustomEvent('open-new-task'))
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        projects={projects}
        activeProjectId={activeProjectId}
        activeEpicId={activeEpicId}
        activeTab={activeTab}
        onSelectProject={handleSelectProject}
        onSelectEpic={setActiveEpicId}
        onSelectTab={setActiveTab}
        onCreateProject={handleCreateProject}
        onDeleteProject={handleDeleteProject}
        darkMode={darkMode}
        onToggleDark={toggleDark}
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        {activeTab === 'admin' ? (
          <AdminPanel />
        ) : (
          <>
            {activeProjectId && activeProject && (
              <Topbar
                projectName={activeProject.name}
                activeView={activeView}
                onViewChange={setActiveView}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                sortField={sortField}
                sortDirection={sortDirection}
                onSortChange={handleSortChange}
                onNewTask={handleNewTask}
                canCreateTask={canCreateTask}
              />
            )}
            <main className="flex-1 overflow-auto">
              {activeProjectId ? (
                children({ projectId: activeProjectId, epicId: activeEpicId, searchQuery, activeView, sortField, sortDirection, onNewTask: handleNewTask })
              ) : (
                <div className="flex h-full items-center justify-center bg-gray-50 dark:bg-gray-950">
                  <div className="text-center px-8">
                    <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20">
                      <LayoutGrid className="h-10 w-10 text-indigo-500" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Welcome to Gantt Chart</h2>
                    <p className="mt-2 max-w-sm text-sm text-gray-500 dark:text-gray-400">
                      Create your first project to start tracking tasks, managing sprints, and collaborating with your team.
                    </p>
                    <button
                      onClick={() => {}}
                      className="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-indigo-500/25 transition-all hover:bg-indigo-700 hover:shadow-xl active:scale-[0.98]"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                      Create Project
                    </button>
                    <p className="mt-3 text-xs text-gray-400 dark:text-gray-500">Click + next to Projects in the sidebar</p>
                  </div>
                </div>
              )}
            </main>
          </>
        )}
      </div>
    </div>
  )
}
