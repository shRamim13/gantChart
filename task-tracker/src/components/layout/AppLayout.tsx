import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { useAuth } from '@/components/auth/AuthProvider'
import { useProjects } from '@/hooks/useProjects'
import { supabase } from '@/lib/supabase'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { Dashboard } from './Dashboard'
import { AdminPanel } from '@/components/admin/AdminPanel'
import { getPermissions } from '@/types'
import type { Task, ViewType, SortField, SortDirection } from '@/types'

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
  const [activeTab, setActiveTab] = useState<'projects' | 'admin'>(() => {
    const saved = localStorage.getItem('activeTab')
    if (saved === 'admin') {
      localStorage.setItem('activeTab', 'projects')
    }
    return 'projects'
  })
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('darkMode') === 'true' ||
        (!localStorage.getItem('darkMode') && window.matchMedia('(prefers-color-scheme: dark)').matches)
    }
    return false
  })
  const [allTasks, setAllTasks] = useState<Task[]>([])

  // Fetch all tasks for dashboard
  useEffect(() => {
    if (activeTab === 'admin') return
    async function fetchAllTasks() {
      const { data } = await supabase.from('tasks').select('*').eq('is_deleted', false)
      if (data) setAllTasks(data as Task[])
    }
    fetchAllTasks()
  }, [activeTab])

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
                <Dashboard
                  allTasks={allTasks}
                  onSelectProject={handleSelectProject}
                  onCreateProject={() => {
                    const name = prompt('Project name:')
                    if (name?.trim()) {
                      const shortName = prompt('Short name (e.g. GANT):')
                      if (shortName?.trim()) {
                        handleCreateProject(name.trim(), shortName.trim().toUpperCase())
                      }
                    }
                  }}
                />
              )}
            </main>
          </>
        )}
      </div>
    </div>
  )
}
