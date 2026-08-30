import { useMemo } from 'react'
import { FolderOpen, CheckCircle, Clock, AlertTriangle, Plus, ArrowRight, BarChart3 } from 'lucide-react'
import { useAuth } from '@/components/auth/AuthProvider'
import { useProjects } from '@/hooks/useProjects'
import type { Task } from '@/types'
import { STATUS_OPTIONS, PRIORITY_OPTIONS, getPermissions } from '@/types'
import { cn } from '@/lib/utils'

interface DashboardProps {
  allTasks: Task[]
  onSelectProject: (id: string) => void
  onCreateProject: () => void
}

export function Dashboard({ allTasks, onSelectProject, onCreateProject }: DashboardProps) {
  const { profile } = useAuth()
  const { projects } = useProjects(profile?.role)
  const perms = profile ? getPermissions(profile.role) : getPermissions('viewer')
  const canCreateProject = perms.canCreateProject

  const stats = useMemo(() => {
    const completed = allTasks.filter((t) => t.status === 'done').length
    const inProgress = allTasks.filter((t) => t.status === 'in_progress').length
    const todo = allTasks.filter((t) => t.status === 'todo').length
    const hold = allTasks.filter((t) => t.status === 'hold').length
    const overdue = allTasks.filter((t) => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'done').length

    return {
      total: allTasks.length,
      completed,
      inProgress,
      todo,
      hold,
      overdue,
      completionRate: allTasks.length > 0 ? Math.round((completed / allTasks.length) * 100) : 0,
    }
  }, [allTasks, profile?.id])

  const priorityStats = useMemo(() => {
    return PRIORITY_OPTIONS.map((p) => ({
      ...p,
      count: allTasks.filter((t) => t.priority === p.value).length,
    }))
  }, [allTasks])

  const projectStats = useMemo(() => {
    return projects.map((p) => {
      const tasks = allTasks.filter((t) => t.project_id === p.id)
      return {
        name: p.short_name || p.name.slice(0, 6),
        total: tasks.length,
        done: tasks.filter((t) => t.status === 'done').length,
      }
    }).filter((p) => p.total > 0).slice(0, 6)
  }, [allTasks, projects])

  const maxProjectTasks = Math.max(...projectStats.map((p) => p.total), 1)

  const recentTasks = useMemo(() => {
    return [...allTasks]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5)
  }, [allTasks])

  const donutTotal = stats.total || 1
  const donutDone = (stats.completed / donutTotal) * 100
  const donutProgress = (stats.inProgress / donutTotal) * 100
  const donutTodo = (stats.todo / donutTotal) * 100
  const donutHold = (stats.hold / donutTotal) * 100

  return (
    <div className="h-full overflow-auto bg-gray-50 dark:bg-gray-950">
      <div className="mx-auto max-w-6xl px-6 py-8">
        {/* Welcome Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Welcome back, {profile?.name?.split(' ')[0] || 'there'}
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Here's what's happening with your projects today.
            </p>
          </div>
          {canCreateProject && (
            <button
              onClick={onCreateProject}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-indigo-700 active:scale-[0.98]"
            >
              <Plus size={16} />
              New Project
            </button>
          )}
        </div>

        {/* Stats Grid */}
        <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-900/20">
                <FolderOpen size={18} className="text-indigo-600 dark:text-indigo-400" />
              </div>
              <span className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</span>
            </div>
            <p className="mt-3 text-xs font-medium text-gray-500 dark:text-gray-400">Total Tasks</p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/20">
                <Clock size={18} className="text-blue-600 dark:text-blue-400" />
              </div>
              <span className="text-2xl font-bold text-gray-900 dark:text-white">{stats.inProgress}</span>
            </div>
            <p className="mt-3 text-xs font-medium text-gray-500 dark:text-gray-400">In Progress</p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
                <CheckCircle size={18} className="text-emerald-600 dark:text-emerald-400" />
              </div>
              <span className="text-2xl font-bold text-gray-900 dark:text-white">{stats.completed}</span>
            </div>
            <p className="mt-3 text-xs font-medium text-gray-500 dark:text-gray-400">Completed</p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50 dark:bg-red-900/20">
                <AlertTriangle size={18} className="text-red-600 dark:text-red-400" />
              </div>
              <span className="text-2xl font-bold text-gray-900 dark:text-white">{stats.overdue}</span>
            </div>
            <p className="mt-3 text-xs font-medium text-gray-500 dark:text-gray-400">Overdue</p>
          </div>
        </div>

        {/* Charts Row */}
        <div className="mb-8 grid gap-6 lg:grid-cols-3">
          {/* Donut Chart */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="mb-4 flex items-center gap-2">
              <BarChart3 size={16} className="text-gray-400" />
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Status Distribution</h3>
            </div>
            <div className="flex items-center justify-center">
              <div className="relative h-40 w-40">
                <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
                  <circle cx="18" cy="18" r="15.915" fill="none" stroke="#6366f1" strokeWidth="3"
                    strokeDasharray={`${donutDone} ${100 - donutDone}`} strokeDashoffset="0" strokeLinecap="round" />
                  <circle cx="18" cy="18" r="15.915" fill="none" stroke="#3b82f6" strokeWidth="3"
                    strokeDasharray={`${donutProgress} ${100 - donutProgress}`} strokeDashoffset={`${-donutDone}`} strokeLinecap="round" />
                  <circle cx="18" cy="18" r="15.915" fill="none" stroke="#cbd5e1" strokeWidth="3"
                    strokeDasharray={`${donutTodo} ${100 - donutTodo}`} strokeDashoffset={`${-(donutDone + donutProgress)}`} strokeLinecap="round" />
                  <circle cx="18" cy="18" r="15.915" fill="none" stroke="#f59e0b" strokeWidth="3"
                    strokeDasharray={`${donutHold} ${100 - donutHold}`} strokeDashoffset={`${-(donutDone + donutProgress + donutTodo)}`} strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</span>
                  <span className="text-[10px] text-gray-400">tasks</span>
                </div>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <div className="flex items-center gap-2"><div className="h-2.5 w-2.5 rounded-full bg-indigo-500" /><span className="text-[11px] text-gray-500">Done ({stats.completed})</span></div>
              <div className="flex items-center gap-2"><div className="h-2.5 w-2.5 rounded-full bg-blue-500" /><span className="text-[11px] text-gray-500">Active ({stats.inProgress})</span></div>
              <div className="flex items-center gap-2"><div className="h-2.5 w-2.5 rounded-full bg-slate-300" /><span className="text-[11px] text-gray-500">To Do ({stats.todo})</span></div>
              <div className="flex items-center gap-2"><div className="h-2.5 w-2.5 rounded-full bg-amber-500" /><span className="text-[11px] text-gray-500">Hold ({stats.hold})</span></div>
            </div>
          </div>

          {/* Tasks per Project */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="mb-4 flex items-center gap-2">
              <BarChart3 size={16} className="text-gray-400" />
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Tasks per Project</h3>
            </div>
            <div className="space-y-3">
              {projectStats.map((project, idx) => {
                const colors = ['bg-indigo-500', 'bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 'bg-cyan-500']
                return (
                  <div key={project.name}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="font-medium text-gray-700 dark:text-gray-300">{project.name}</span>
                      <span className="text-gray-400">{project.done}/{project.total}</span>
                    </div>
                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                      <div
                        className={cn("h-full rounded-full transition-all duration-500", colors[idx % colors.length])}
                        style={{ width: `${(project.total / maxProjectTasks) * 100}%` }}
                      />
                    </div>
                  </div>
                )
              })}
              {projectStats.length === 0 && (
                <div className="py-6 text-center">
                  <BarChart3 size={24} className="mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                  <p className="text-xs text-gray-400">No project data yet</p>
                </div>
              )}
            </div>
          </div>

          {/* Priority Histogram */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 size={16} className="text-gray-400" />
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Priority Breakdown</h3>
              </div>
              <span className="text-xs text-gray-400">{allTasks.length} total</span>
            </div>
            <div className="flex items-end justify-center gap-5 px-2" style={{ height: '180px' }}>
              {priorityStats.map((p) => {
                const maxPriority = Math.max(...priorityStats.map((x) => x.count), 1)
                const barHeightPx = Math.max((p.count / maxPriority) * 130, 8)
                const barColor = p.value === 'critical' ? 'bg-red-500' :
                                 p.value === 'high' ? 'bg-orange-500' :
                                 p.value === 'medium' ? 'bg-amber-400' :
                                 'bg-emerald-500'
                return (
                  <div key={p.value} className="flex flex-1 flex-col items-center">
                    <span className="mb-1.5 text-sm font-bold text-gray-700 dark:text-gray-200">{p.count}</span>
                    <div className={cn("w-full max-w-[48px] rounded-lg transition-all duration-500", barColor)}
                      style={{ height: `${barHeightPx}px` }}
                    />
                    <span className="mt-2 text-[11px] font-medium text-gray-500 dark:text-gray-400 capitalize">{p.label}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Projects + Recent Tasks */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Projects */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FolderOpen size={16} className="text-gray-400" />
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
                    className="flex w-full items-center gap-3 rounded-lg p-3 text-left transition-all hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-900/20">
                      <FolderOpen size={16} className="text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-700 dark:text-gray-300">{project.name}</p>
                      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                        <div className="h-full rounded-full bg-indigo-500 transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400">{pct}%</span>
                      <p className="text-[10px] text-gray-400">{done}/{projectTasks.length}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Recent Tasks */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="mb-4 flex items-center gap-2">
              <Clock size={16} className="text-gray-400" />
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Recent Tasks</h3>
            </div>
            <div className="space-y-2">
              {recentTasks.map((task) => {
                const status = STATUS_OPTIONS.find((s) => s.value === task.status)
                return (
                  <div key={task.id} className="flex items-center gap-3 rounded-lg p-2.5 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <div className={cn(
                      'h-2 w-2 rounded-full flex-shrink-0',
                      task.status === 'done' ? 'bg-emerald-500' :
                      task.status === 'in_progress' ? 'bg-blue-500' :
                      task.status === 'hold' ? 'bg-amber-500' : 'bg-gray-300 dark:bg-gray-600'
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
          <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <h3 className="mb-4 text-sm font-semibold text-gray-900 dark:text-white">Quick Actions</h3>
            <div className="flex flex-wrap gap-3">
              {projects.slice(0, 4).map((project) => (
                <button
                  key={project.id}
                  onClick={() => onSelectProject(project.id)}
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-all hover:bg-gray-50 hover:shadow active:scale-[0.98] dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  <FolderOpen size={15} className="text-gray-400" />
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
