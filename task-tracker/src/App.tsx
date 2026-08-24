import { useState, useEffect, useMemo } from 'react'
import { Toaster } from 'react-hot-toast'
import toast from 'react-hot-toast'
import { AuthProvider, useAuth } from '@/components/auth/AuthProvider'
import { LoginPage } from '@/components/auth/LoginPage'
import { AppLayout } from '@/components/layout/AppLayout'
import { useTasks } from '@/hooks/useTasks'
import { useProjects } from '@/hooks/useProjects'
import { useEpics } from '@/hooks/useEpics'
import { useSprints } from '@/hooks/useSprints'
import { TableView } from '@/components/views/TableView'
import { BoardView } from '@/components/views/BoardView'
import { TimelineView } from '@/components/views/TimelineView'
import { SprintBoard } from '@/components/sprints/SprintBoard'
import { TaskForm } from '@/components/task/TaskForm'
import { TaskDetailPanel } from '@/components/task/TaskDetailPanel'
import type { Task, ViewType, SortField, SortDirection } from '@/types'

function MainContent() {
  const { user, profile, loading, signOut } = useAuth()

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
          <p className="text-sm text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) return <LoginPage />

  // User logged in but not approved by admin yet
  if (profile && profile.is_active === false) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 via-orange-50/30 to-gray-50 dark:from-gray-950 dark:via-orange-950/10 dark:to-gray-950">
        <div className="w-full max-w-sm px-4 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-100 dark:bg-orange-900/30">
            <svg className="h-8 w-8 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Waiting for Approval</h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Your account (<span className="font-medium text-gray-700 dark:text-gray-300">{profile.email}</span>) is pending admin approval.
          </p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Please contact your team admin to get access.
          </p>
          <button
            onClick={signOut}
            className="mt-6 rounded-xl bg-gray-200 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Sign Out
          </button>
        </div>
      </div>
    )
  }

  return <AuthenticatedApp />
}

function AuthenticatedApp() {
  return (
    <AppLayout>
      {(layoutProps) => (
        <ProjectContentView
          projectId={layoutProps.projectId}
          epicId={layoutProps.epicId}
          searchQuery={layoutProps.searchQuery}
          activeView={layoutProps.activeView}
          sortField={layoutProps.sortField}
          sortDirection={layoutProps.sortDirection}
        />
      )}
    </AppLayout>
  )
}

interface ProjectContentViewProps {
  projectId: string
  epicId: string | null
  searchQuery: string
  activeView: ViewType
  sortField: SortField
  sortDirection: SortDirection
}

function ProjectContentView({ projectId, epicId, searchQuery, activeView, sortField, sortDirection }: ProjectContentViewProps) {
  const { profile } = useAuth()
  const { tasks, loading, createTask, updateTask, deleteTask, nextTicketNumber } = useTasks(projectId, profile?.role)
  const { projects } = useProjects(profile?.role)
  const { epics } = useEpics(projectId, profile?.role)
  const { sprints } = useSprints(projectId)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [showDetail, setShowDetail] = useState(false)
  const [newSubtaskParentId, setNewSubtaskParentId] = useState<string | null>(null)

  const activeProject = projects.find((p) => p.id === projectId)
  const projectPrefix = activeProject?.short_name || 'TASK'

  // Filter tasks by epic if one is selected
  const filteredTasks = useMemo(() => {
    if (!epicId) return tasks
    return tasks.filter((t) => t.epic_id === epicId)
  }, [tasks, epicId])

  // Listen for new task event from topbar
  useEffect(() => {
    const handler = () => {
      setEditingTask(null)
      setNewSubtaskParentId(null)
      setShowForm(true)
    }
    window.addEventListener('open-new-task', handler)
    return () => window.removeEventListener('open-new-task', handler)
  }, [])

  function handleOpenNewTask() {
    setEditingTask(null)
    setShowForm(true)
  }

  function handleSelectTask(task: Task) {
    setSelectedTask(task)
    setShowDetail(true)
  }

  function handleEditTask(task: Task) {
    setEditingTask(task)
    setShowDetail(false)
    setShowForm(true)
  }

  function handleCloseForm() {
    setShowForm(false)
    setEditingTask(null)
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
          <p className="text-sm text-gray-400">Loading tasks...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full">
      {tasks.length === 0 ? (
        <div className="flex h-full flex-col items-center justify-center gap-6 px-4">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-900/20">
            <svg className="h-10 w-10 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">No tasks yet</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Create your first task to get started</p>
          </div>
          <button
            onClick={handleOpenNewTask}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-indigo-700 hover:shadow-md active:scale-95"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create First Task
          </button>
        </div>
      ) : (
        <>
          {activeView === 'table' && (
            <TableView
              tasks={filteredTasks}
              allTasks={filteredTasks}
              sortField={sortField}
              sortDirection={sortDirection}
              projectPrefix={projectPrefix}
              epics={epics}
              sprints={sprints}
              onEditTask={handleEditTask}
              onDeleteTask={async (id) => {
                const result = await deleteTask(id)
                if (!result.error) {
                  toast.success('Task deleted')
                } else {
                  toast.error('Failed to delete task')
                }
              }}
              onStatusChange={(id, status) => updateTask(id, { status })}
              onSelectTask={handleSelectTask}
            />
          )}
          {activeView === 'board' && (
            <BoardView
              tasks={filteredTasks}
              onUpdateTask={updateTask}
              onSelectTask={handleSelectTask}
              onNewTask={handleOpenNewTask}
              searchQuery={searchQuery}
              projectPrefix={projectPrefix}
            />
          )}
          {activeView === 'timeline' && (
            <TimelineView
              tasks={filteredTasks}
              onSelectTask={handleSelectTask}
              onNewTask={handleOpenNewTask}
              searchQuery={searchQuery}
              projectPrefix={projectPrefix}
            />
          )}
          {activeView === 'sprints' && (
            <SprintBoard
              projectId={projectId}
              tasks={tasks}
              onEditTask={handleEditTask}
            />
          )}
        </>
      )}

      <TaskForm
        key={editingTask ? editingTask.id : `new-${Date.now()}`}
        open={showForm}
        onClose={handleCloseForm}
        onSave={async (data) => {
          if (editingTask) {
            return updateTask(editingTask.id, data)
          }
          return createTask(data)
        }}
        project_id={projectId}
        initialData={editingTask}
        nextTicketNumber={nextTicketNumber}
        projectPrefix={projectPrefix}
        epics={epics}
        defaultEpicId={epicId}
        parentTaskId={newSubtaskParentId}
      />

      <TaskDetailPanel
        task={selectedTask}
        open={showDetail}
        onClose={() => setShowDetail(false)}
        onUpdate={updateTask}
        onDelete={deleteTask}
        onEdit={handleEditTask}
        onAddSubtask={(parentId) => {
          setEditingTask(null)
          setNewSubtaskParentId(parentId)
          setShowDetail(false)
          setShowForm(true)
        }}
        projectPrefix={projectPrefix}
        epics={epics}
        allTasks={filteredTasks}
      />
    </div>
  )
}

export default function App() {
  return (
    <>
      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 3000,
          style: {
            borderRadius: '12px',
            padding: '12px 16px',
            fontSize: '14px',
          },
          success: {
            iconTheme: { primary: '#10b981', secondary: '#fff' },
          },
          error: {
            iconTheme: { primary: '#ef4444', secondary: '#fff' },
          },
        }}
      />
      <AuthProvider>
        <MainContent />
      </AuthProvider>
    </>
  )
}
