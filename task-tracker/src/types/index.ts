export type UserRole = 'super_admin' | 'admin' | 'user' | 'viewer'

export interface Profile {
  id: string
  name: string
  email: string
  role: UserRole
  avatar_url: string | null
}

export interface Project {
  id: string
  name: string
  short_name: string
  is_deleted: boolean
  is_public: boolean
  created_at: string
}

export interface Epic {
  id: string
  project_id: string
  name: string
  color: string
  created_at: string
}

export interface Subtask {
  id: string
  task_id: string
  title: string
  is_done: boolean
  sort_order: number
  created_at: string
}

export const EPIC_COLORS = [
  '#6366f1',
  '#8b5cf6',
  '#ec4899',
  '#ef4444',
  '#f97316',
  '#eab308',
  '#22c55e',
  '#14b8a6',
  '#06b6d4',
  '#3b82f6',
]

export interface Module {
  id: string
  project_id: string
  name: string
}

export type TaskStatus = 'todo' | 'in_progress' | 'hold' | 'qa_test' | 'done'
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical'
export type TaskType = 'feature' | 'bugfix' | 'refactor' | 'improvement' | 'task' | 'spike' | 'tech_debt'

export type SortField = 'ticket_number' | 'title' | 'status' | 'priority' | 'task_type' | 'start_date' | 'due_date' | 'created_at'
export type SortDirection = 'asc' | 'desc'

export interface Task {
  id: string
  project_id: string
  epic_id: string | null
  module_id: string | null
  assignee_id: string | null
  parent_task_id: string | null
  sprint_id: string | null
  title: string
  description: string | null
  status: TaskStatus
  priority: TaskPriority
  task_type: TaskType
  ticket_number: number
  est_hours: number | null
  est_days: number | null
  start_date: string | null
  due_date: string | null
  is_deleted: boolean
  created_at: string
  updated_at: string
}

export interface Comment {
  id: string
  task_id: string
  user_id: string
  body: string
  created_at: string
}

export interface Attachment {
  id: string
  task_id: string
  file_url: string
  file_name: string | null
  created_at: string
}

export type ActivityAction = 'created' | 'status_changed' | 'assigned' | 'edited' | 'deleted'

export interface ActivityLog {
  id: string
  task_id: string
  user_id: string
  action: ActivityAction
  detail: string | null
  created_at: string
}

export type SprintStatus = 'planning' | 'active' | 'completed'

export interface Sprint {
  id: string
  project_id: string
  name: string
  goal: string | null
  start_date: string
  end_date: string
  status: SprintStatus
  created_at: string
}

export interface Invitation {
  id: string
  email: string
  role: UserRole
  invited_by: string
  status: 'pending' | 'accepted' | 'expired'
  created_at: string
  expires_at: string
}

export type ViewType = 'table' | 'board' | 'timeline' | 'sprints'

export const STATUS_OPTIONS: { value: TaskStatus; label: string; color: string }[] = [
  { value: 'todo', label: 'To Do', color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
  { value: 'in_progress', label: 'Development', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  { value: 'hold', label: 'Hold', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
  { value: 'qa_test', label: 'QA Test', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
  { value: 'done', label: 'Done', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
]

export const PRIORITY_OPTIONS: { value: TaskPriority; label: string }[] = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Urgent' },
]

export const TASK_TYPE_OPTIONS: { value: TaskType; label: string; color: string }[] = [
  { value: 'feature', label: 'Feature', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
  { value: 'bugfix', label: 'Bug Fix', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  { value: 'improvement', label: 'Improvement', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  { value: 'refactor', label: 'Refactor', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
  { value: 'task', label: 'Task', color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
  { value: 'spike', label: 'Spike', color: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400' },
  { value: 'tech_debt', label: 'Tech Debt', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
]

export const ROLE_OPTIONS: { value: UserRole; label: string; description: string }[] = [
  { value: 'super_admin', label: 'Super Admin', description: 'Full access. Can create/delete projects, epics, tasks, and manage users.' },
  { value: 'admin', label: 'Admin', description: 'Can create projects/epics/tasks. Can edit and delete tasks. Cannot delete projects or epics.' },
  { value: 'user', label: 'User', description: 'Can create tasks and subtasks. Can edit subtasks. Cannot delete anything.' },
  { value: 'viewer', label: 'Viewer', description: 'Read-only access. Cannot create, edit, or delete anything.' },
]

export const SPRINT_STATUS_OPTIONS: { value: SprintStatus; label: string; color: string }[] = [
  { value: 'planning', label: 'Planning', color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
  { value: 'active', label: 'Active', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  { value: 'completed', label: 'Completed', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
]

export const ROLE_PERMISSIONS = {
  super_admin: {
    canCreateProject: true,
    canDeleteProject: true,
    canCreateEpic: true,
    canEditEpic: true,
    canDeleteEpic: true,
    canCreateTask: true,
    canEditTask: true,
    canDeleteTask: true,
    canCreateSubtask: true,
    canEditSubtask: true,
    canDeleteSubtask: true,
    canManageUsers: true,
  },
  admin: {
    canCreateProject: true,
    canDeleteProject: false,
    canCreateEpic: true,
    canEditEpic: true,
    canDeleteEpic: false,
    canCreateTask: true,
    canEditTask: true,
    canDeleteTask: true,
    canCreateSubtask: true,
    canEditSubtask: true,
    canDeleteSubtask: true,
    canManageUsers: true,
  },
  user: {
    canCreateProject: false,
    canDeleteProject: false,
    canCreateEpic: false,
    canEditEpic: false,
    canDeleteEpic: false,
    canCreateTask: true,
    canEditTask: true,
    canDeleteTask: false,
    canCreateSubtask: true,
    canEditSubtask: true,
    canDeleteSubtask: false,
    canManageUsers: false,
  },
  viewer: {
    canCreateProject: false,
    canDeleteProject: false,
    canCreateEpic: false,
    canEditEpic: false,
    canDeleteEpic: false,
    canCreateTask: false,
    canEditTask: false,
    canDeleteTask: false,
    canCreateSubtask: false,
    canEditSubtask: false,
    canDeleteSubtask: false,
    canManageUsers: false,
  },
} as const

export function getPermissions(role: UserRole) {
  return ROLE_PERMISSIONS[role] ?? ROLE_PERMISSIONS.viewer
}
