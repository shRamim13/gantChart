import { useState } from 'react'
import toast from 'react-hot-toast'
import { useAuth } from '@/components/auth/AuthProvider'
import { useProjects } from '@/hooks/useProjects'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { AdminPanel } from '@/components/admin/AdminPanel'
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
  const canCreateTask = profile?.role === 'admin' || profile?.role === 'editor'
  const [activeProjectId, setActiveProjectId] = useState<string | null>(projects[0]?.id ?? null)
  const [activeEpicId, setActiveEpicId] = useState<string | null>(null)
  const [activeView, setActiveView] = useState<ViewType>('table')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortField, setSortField] = useState<SortField>('created_at')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [activeTab, setActiveTab] = useState<'projects' | 'admin'>('projects')
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
                <div className="flex h-full items-center justify-center">
                  <div className="text-center">
                    <p className="text-gray-500 dark:text-gray-400">Click + next to Projects to create one</p>
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
