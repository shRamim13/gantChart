import { useMemo } from 'react'
import { FolderOpen, CheckCircle, Clock, AlertTriangle, TrendingUp, Plus, ArrowRight, Sparkles } from 'lucide-react'
import { useAuth } from '@/components/auth/AuthProvider'
import { useProjects } from '@/hooks/useProjects'
import type { Task } from '@/types'
import { STATUS_OPTIONS } from '@/types'
import { cn } from '@/lib/utils'

interface DashboardProps {
  allTasks: Task[]
  onSelectProject: (id: string) => void
  onCreateProject: () => void
}

export function Dashboard({ allTasks, onSelectProject, onCreateProject }: DashboardProps) {
  const { profile } = useAuth()
  const { projects } = useProjects(profile?.role)

  const stats = useMemo(() => {
    const myTasks = allTasks.filter((t) => t.assignee_id === profile?.id)
    const completed = allTasks.filter((t) => t.status === 'done').length
    const inProgress = allTasks.filter((t) => t.status === 'in_progress').length
    const todo = allTasks.filter((t) => t.status === 'todo').length
    const overdue = allTasks.filter((t) => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'done').length
    const myCompleted = myTasks.filter((t) => t.status === 'done').length

    return {
      total: allTasks.length,
      completed,
      inProgress,
      todo,
      overdue,
      myTasks: myTasks.length,
      myCompleted,
      completionRate: allTasks.length > 0 ? Math.round((completed / allTasks.length) * 100) : 0,
    }
  }, [allTasks, profile?.id])

  const recentTasks = useMemo(() => {
    return [...allTasks]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 6)
  }, [allTasks])

  return (
    <div className="h-full overflow-auto bg-gradient-to-br from-gray-50 via-indigo-50/30 to-purple-50/20 dark:from-gray-950 dark:via-indigo-950/10 dark:to-purple-950/10">
      <div className="mx-auto max-w-6xl px-6 py-8">
        {/* Welcome Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles size={20} className="text-purple-500" />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Welcome back, {profile?.name?.split(' ')[0] || 'there'}
              </h1>
            </div>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Here's what's happening with your projects today.
            </p>
          </div>
          <button
            onClick={onCreateProject}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-indigo-500/25 transition-all hover:from-indigo-600 hover:to-purple-700 hover:shadow-xl active:scale-[0.98]"
          >
            <Plus size={16} />
            New Project
          </button>
        </div>

        {/* Stats Grid */}
        <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-white to-indigo-50/50 p-5 shadow-sm transition-all hover:shadow-md dark:border-indigo-900/30 dark:from-gray-900 dark:to-indigo-950/20">
            <div className="flex items-center justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-900/30">
                <FolderOpen size={20} className="text-indigo-500" />
              </div>
              <span className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</span>
            </div>
            <p className="mt-3 text-xs font-medium text-gray-500 dark:text-gray-400">Total Tasks</p>
          </div>

          <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-white to-blue-50/50 p-5 shadow-sm transition-all hover:shadow-md dark:border-blue-900/30 dark:from-gray-900 dark:to-blue-950/20">
            <div className="flex items-center justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/30">
                <Clock size={20} className="text-blue-500" />
              </div>
              <span className="text-2xl font-bold text-gray-900 dark:text-white">{stats.inProgress}</span>
            </div>
            <p className="mt-3 text-xs font-medium text-gray-500 dark:text-gray-400">In Progress</p>
          </div>

          <div className="rounded-2xl border border-green-100 bg-gradient-to-br from-white to-green-50/50 p-5 shadow-sm transition-all hover:shadow-md dark:border-green-900/30 dark:from-gray-900 dark:to-green-950/20">
            <div className="flex items-center justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-100 dark:bg-green-900/30">
                <CheckCircle size={20} className="text-green-500" />
              </div>
              <span className="text-2xl font-bold text-gray-900 dark:text-white">{stats.completed}</span>
            </div>
            <p className="mt-3 text-xs font-medium text-gray-500 dark:text-gray-400">Completed</p>
          </div>

          <div className="rounded-2xl border border-red-100 bg-gradient-to-br from-white to-red-50/50 p-5 shadow-sm transition-all hover:shadow-md dark:border-red-900/30 dark:from-gray-900 dark:to-red-950/20">
            <div className="flex items-center justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-100 dark:bg-red-900/30">
                <AlertTriangle size={20} className="text-red-500" />
              </div>
              <span className="text-2xl font-bold text-gray-900 dark:text-white">{stats.overdue}</span>
            </div>
            <p className="mt-3 text-xs font-medium text-gray-500 dark:text-gray-400">Overdue</p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Progress Card */}
          <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-white to-indigo-50/50 p-6 shadow-sm dark:border-indigo-900/30 dark:from-gray-900 dark:to-indigo-950/20">
            <div className="mb-4 flex items-center gap-2">
              <TrendingUp size={18} className="text-indigo-500" />
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Overall Progress</h3>
            </div>
            <div className="mb-2 flex items-end gap-2">
              <span className="text-4xl font-bold text-indigo-600 dark:text-indigo-400">{stats.completionRate}%</span>
              <span className="mb-1 text-xs text-gray-400">completed</span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-indigo-100 dark:bg-indigo-900/30">
              <div
                className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
                style={{ width: `${stats.completionRate}%` }}
              />
            </div>
            <div className="mt-5 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500 dark:text-gray-400">My Tasks</span>
                <span className="font-medium text-gray-700 dark:text-gray-300">{stats.myCompleted}/{stats.myTasks}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500 dark:text-gray-400">Total Done</span>
                <span className="font-medium text-gray-700 dark:text-gray-300">{stats.completed}/{stats.total}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500 dark:text-gray-400">To Do</span>
                <span className="font-medium text-gray-700 dark:text-gray-300">{stats.todo}</span>
              </div>
            </div>
          </div>

          {/* Projects Quick Access */}
          <div className="rounded-2xl border border-purple-100 bg-gradient-to-br from-white to-purple-50/50 p-6 shadow-sm dark:border-purple-900/30 dark:from-gray-900 dark:to-purple-950/20">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FolderOpen size={18} className="text-purple-500" />
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Projects</h3>
              </div>
              <span className="text-xs text-gray-400">{projects.length} total</span>
            </div>
            <div className="space-y-2">
              {projects.slice(0, 5).map((project) => {
                const projectTasks = allTasks.filter((t) => t.project_id === project.id)
                const done = projectTasks.filter((t) => t.status === 'done').length
                const pct = projectTasks.length > 0 ? Math.round((done / projectTasks.length) * 100) : 0
                return (
                  <button
                    key={project.id}
                    onClick={() => onSelectProject(project.id)}
                    className="flex w-full items-center gap-3 rounded-xl p-3 text-left transition-all hover:bg-purple-50/50 hover:shadow-sm dark:hover:bg-purple-900/10"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/30">
                      <FolderOpen size={16} className="text-purple-500" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-700 dark:text-gray-300">{project.name}</p>
                      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-purple-100 dark:bg-purple-900/30">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-purple-400 to-indigo-500 transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-medium text-purple-600 dark:text-purple-400">{pct}%</span>
                      <p className="text-[10px] text-gray-400">{done}/{projectTasks.length}</p>
                    </div>
                  </button>
                )
              })}
              {projects.length === 0 && (
                <div className="py-6 text-center">
                  <FolderOpen size={24} className="mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                  <p className="text-xs text-gray-400">No projects yet</p>
                </div>
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-white to-indigo-50/50 p-6 shadow-sm dark:border-indigo-900/30 dark:from-gray-900 dark:to-indigo-950/20">
            <div className="mb-4 flex items-center gap-2">
              <Clock size={18} className="text-indigo-500" />
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Recent Tasks</h3>
            </div>
            <div className="space-y-2">
              {recentTasks.map((task) => {
                const status = STATUS_OPTIONS.find((s) => s.value === task.status)
                return (
                  <div key={task.id} className="flex items-center gap-3 rounded-xl p-2.5 transition-colors hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10">
                    <div className={cn(
                      'h-2.5 w-2.5 rounded-full',
                      task.status === 'done' ? 'bg-green-500' :
                      task.status === 'in_progress' ? 'bg-blue-500' :
                      task.status === 'hold' ? 'bg-orange-500' :
                      'bg-gray-300'
                    )} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium text-gray-700 dark:text-gray-300">{task.title}</p>
                    </div>
                    {status && (
                      <span className={cn('rounded-full px-2 py-0.5 text-[10px] font-medium', status.color)}>
                        {status.label}
                      </span>
                    )}
                  </div>
                )
              })}
              {recentTasks.length === 0 && (
                <div className="py-6 text-center">
                  <Clock size={24} className="mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                  <p className="text-xs text-gray-400">No tasks yet</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        {projects.length > 0 && (
          <div className="mt-6 rounded-2xl border border-gray-100 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-gray-800 dark:bg-gray-900/80">
            <h3 className="mb-4 text-sm font-semibold text-gray-900 dark:text-white">Quick Actions</h3>
            <div className="flex flex-wrap gap-3">
              {projects.slice(0, 3).map((project) => (
                <button
                  key={project.id}
                  onClick={() => onSelectProject(project.id)}
                  className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-all hover:bg-gray-50 hover:shadow-md active:scale-[0.98] dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  <FolderOpen size={16} className="text-purple-500" />
                  {project.name}
                  <ArrowRight size={14} className="text-gray-400" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
