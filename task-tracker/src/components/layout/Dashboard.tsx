import { useMemo } from 'react'
import { FolderOpen, CheckCircle, Clock, AlertTriangle, TrendingUp, Plus } from 'lucide-react'
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
    const overdue = allTasks.filter((t) => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'done').length
    const myCompleted = myTasks.filter((t) => t.status === 'done').length

    return {
      total: allTasks.length,
      completed,
      inProgress,
      overdue,
      myTasks: myTasks.length,
      myCompleted,
      completionRate: allTasks.length > 0 ? Math.round((completed / allTasks.length) * 100) : 0,
    }
  }, [allTasks, profile?.id])

  const recentTasks = useMemo(() => {
    return [...allTasks]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5)
  }, [allTasks])

  const statCards = [
    { label: 'Total Tasks', value: stats.total, icon: FolderOpen, color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
    { label: 'In Progress', value: stats.inProgress, icon: Clock, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
    { label: 'Completed', value: stats.completed, icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-900/20' },
    { label: 'Overdue', value: stats.overdue, icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20' },
  ]

  return (
    <div className="h-full overflow-auto">
      <div className="mx-auto max-w-6xl px-6 py-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Welcome back, {profile?.name?.split(' ')[0] || 'there'} 👋
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Here's what's happening with your projects today.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {statCards.map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:shadow-md dark:border-gray-800 dark:bg-gray-900">
              <div className="flex items-center justify-between">
                <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl', stat.bg)}>
                  <stat.icon size={20} className={stat.color} />
                </div>
                <span className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</span>
              </div>
              <p className="mt-3 text-xs font-medium text-gray-500 dark:text-gray-400">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Progress Card */}
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="mb-4 flex items-center gap-2">
              <TrendingUp size={18} className="text-indigo-500" />
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Overall Progress</h3>
            </div>
            <div className="mb-2 flex items-end gap-2">
              <span className="text-3xl font-bold text-gray-900 dark:text-white">{stats.completionRate}%</span>
              <span className="mb-1 text-xs text-gray-400">completed</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all"
                style={{ width: `${stats.completionRate}%` }}
              />
            </div>
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500 dark:text-gray-400">My Tasks</span>
                <span className="font-medium text-gray-700 dark:text-gray-300">{stats.myCompleted}/{stats.myTasks}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500 dark:text-gray-400">Total Done</span>
                <span className="font-medium text-gray-700 dark:text-gray-300">{stats.completed}/{stats.total}</span>
              </div>
            </div>
          </div>

          {/* Projects Quick Access */}
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FolderOpen size={18} className="text-indigo-500" />
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Projects</h3>
              </div>
              <button
                onClick={onCreateProject}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-indigo-600 dark:hover:bg-gray-800"
              >
                <Plus size={16} />
              </button>
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
                    className="flex w-full items-center gap-3 rounded-xl p-2.5 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-900/20">
                      <FolderOpen size={14} className="text-indigo-500" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-700 dark:text-gray-300">{project.name}</p>
                      <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                        <div className="h-full rounded-full bg-indigo-500" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                    <span className="text-[10px] text-gray-400">{done}/{projectTasks.length}</span>
                  </button>
                )
              })}
              {projects.length === 0 && (
                <p className="py-4 text-center text-xs text-gray-400">No projects yet</p>
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="mb-4 flex items-center gap-2">
              <Clock size={18} className="text-indigo-500" />
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Recent Tasks</h3>
            </div>
            <div className="space-y-2">
              {recentTasks.map((task) => {
                const status = STATUS_OPTIONS.find((s) => s.value === task.status)
                return (
                  <div key={task.id} className="flex items-center gap-3 rounded-xl p-2.5 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <div className={cn(
                      'h-2 w-2 rounded-full',
                      task.status === 'done' ? 'bg-green-500' :
                      task.status === 'in_progress' ? 'bg-blue-500' :
                      task.status === 'hold' ? 'bg-orange-500' :
                      'bg-gray-300'
                    )} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium text-gray-700 dark:text-gray-300">{task.title}</p>
                    </div>
                    {status && (
                      <span className={cn('rounded-full px-1.5 py-0.5 text-[9px] font-medium', status.color)}>
                        {status.label}
                      </span>
                    )}
                  </div>
                )
              })}
              {recentTasks.length === 0 && (
                <p className="py-4 text-center text-xs text-gray-400">No tasks yet</p>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-6 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <h3 className="mb-4 text-sm font-semibold text-gray-900 dark:text-white">Quick Actions</h3>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={onCreateProject}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-all hover:bg-gray-50 hover:shadow-md active:scale-[0.98] dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <Plus size={16} />
              New Project
            </button>
            {projects.length > 0 && (
              <button
                onClick={() => onSelectProject(projects[0].id)}
                className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-indigo-700 hover:shadow-md active:scale-[0.98]"
              >
                <FolderOpen size={16} />
                Open {projects[0].name}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
