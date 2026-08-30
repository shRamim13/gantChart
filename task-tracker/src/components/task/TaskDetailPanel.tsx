import { useState, useRef } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import toast from 'react-hot-toast'
import { Trash2, Edit, Calendar, Clock, MessageSquare, Plus, Paperclip, Download, Send, Reply, X } from 'lucide-react'
import type { Task, Epic, Profile, Comment } from '@/types'
import { STATUS_OPTIONS, TASK_TYPE_OPTIONS, getPermissions } from '@/types'
import { PriorityIcon } from '@/components/ui/PriorityIcon'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Button } from '@/components/ui/Button'
import { SlideOver } from '@/components/ui/SlideOver'
import { MentionInput } from '@/components/ui/MentionInput'
import { useAttachments } from '@/hooks/useAttachments'
import { useComments } from '@/hooks/useComments'
import { sendMentionEmail } from '@/lib/email'
import { cn } from '@/lib/utils'
import { format, formatDistanceToNow } from 'date-fns'

interface TaskDetailPanelProps {
  task: Task | null
  open: boolean
  onClose: () => void
  onUpdate: (id: string, updates: Partial<Task>) => Promise<{ error?: string }>
  onDelete: (id: string) => Promise<{ error?: string }>
  onEdit: (task: Task) => void
  onAddSubtask: (parentId: string) => void
  projectPrefix: string
  epics?: Epic[]
  profiles?: Profile[]
  allTasks?: Task[]
}

export function TaskDetailPanel({ task, open, onClose, onUpdate, onDelete, onEdit, onAddSubtask, projectPrefix, epics = [], profiles = [], allTasks = [] }: TaskDetailPanelProps) {
  const { profile } = useAuth()
  const perms = profile ? getPermissions(profile.role) : getPermissions('viewer')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { attachments, loading: attachmentsLoading, uploadAttachment, deleteAttachment, getSignedUrl } = useAttachments(task?.id ?? null)
  const { comments, loading: commentsLoading, addComment, deleteComment } = useComments(task?.id ?? null)
  const [newComment, setNewComment] = useState('')
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')

  const canEdit = perms.canEditTask
  const canDelete = perms.canDeleteTask

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !profile) return
    if (file.size > 50 * 1024 * 1024) {
      toast.error('File too large (max 50MB)')
      return
    }
    toast.loading('Uploading...', { id: 'upload' })
    const result = await uploadAttachment(file, profile.id)
    toast.dismiss('upload')
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('File uploaded')
    }
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handleDownload(attachment: { file_name: string; storage_path: string; id: string }) {
    const url = await getSignedUrl(attachment as never)
    if (url) window.open(url, '_blank')
    else toast.error('Failed to get download link')
  }

  function formatFileSize(bytes: number) {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / 1048576).toFixed(1) + ' MB'
  }

  function getFileIcon(type: string) {
    if (type.startsWith('image/')) return '🖼️'
    if (type.includes('pdf')) return '📄'
    if (type.includes('word') || type.includes('document')) return '📝'
    if (type.includes('sheet') || type.includes('excel')) return '📊'
    if (type.includes('zip') || type.includes('rar')) return '📦'
    if (type.startsWith('video/')) return '🎬'
    if (type.startsWith('audio/')) return '🎵'
    return '📎'
  }

  async function handleAddComment(parentId?: string | null) {
    const text = parentId ? replyText : newComment
    if (!text.trim() || !profile) return
    const result = await addComment(text, profile.id, parentId)
    if (result.error) {
      toast.error(result.error)
    } else {
      // Detect @mentions and send emails
      const mentionRegex = /@(\S+)/g
      let match
      while ((match = mentionRegex.exec(text)) !== null) {
        const mentionName = match[1]
        const mentioned = profiles.find(
          (p) => p.name.toLowerCase() === mentionName.toLowerCase() ||
                 p.email.toLowerCase() === mentionName.toLowerCase()
        )
        if (mentioned && mentioned.id !== profile.id && mentioned.email) {
          sendMentionEmail(
            mentioned.email,
            mentioned.name,
            profile.name,
            text,
            task!.title
          )
        }
      }

      if (parentId) {
        setReplyText('')
        setReplyingTo(null)
      } else {
        setNewComment('')
      }
    }
  }

  if (!task) return null

  const ticketId = `${projectPrefix}-${task.ticket_number}`
  const taskType = TASK_TYPE_OPTIONS.find((t) => t.value === task.task_type)
  const epic = epics.find((e) => e.id === task.epic_id)
  const childTasks = allTasks.filter((t) => t.parent_task_id === task.id)

  async function handleDelete() {
    const result = await onDelete(task!.id)
    if (!result.error) {
      toast.success('Task deleted')
      onClose()
    } else {
      toast.error('Failed to delete task')
    }
  }

  async function handleStatusChange(status: Task['status']) {
    const result = await onUpdate(task!.id, { status })
    if (!result.error) {
      toast.success('Status updated')
    }
  }

  const progress = childTasks.length > 0
    ? Math.round((childTasks.filter((t) => t.status === 'done').length / childTasks.length) * 100)
    : 0

  return (
    <SlideOver open={open} onClose={onClose} title={ticketId}>
      <div className="space-y-6">
        <div>
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                {taskType && (
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${taskType.color}`}>
                    {taskType.label}
                  </span>
                )}
                {epic && (
                  <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: epic.color }} />
                    {epic.name}
                  </span>
                )}
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{task.title}</h3>
            </div>
            <div className="flex gap-1">
              {canEdit && (
                <button
                  onClick={() => onEdit(task)}
                  className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800"
                >
                  <Edit size={16} />
                </button>
              )}
              {canDelete && !confirmDelete && (
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
                >
                  <Trash2 size={16} />
                </button>
              )}
              {canDelete && confirmDelete && (
                <div className="flex gap-1">
                  <Button variant="danger" size="sm" onClick={handleDelete}>Delete</Button>
                  <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(false)}>Cancel</Button>
                </div>
              )}
            </div>
          </div>
          {task.description && (
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{task.description}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Status</label>
            <StatusBadge status={task.status} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Priority</label>
            <PriorityIcon priority={task.priority} showLabel />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="flex items-center gap-1 text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
              <Calendar size={12} /> Start Date
            </label>
            <p className="text-sm text-gray-900 dark:text-white">
              {task.start_date ? format(new Date(task.start_date), 'MMM d, yyyy') : '—'}
            </p>
          </div>
          <div>
            <label className="flex items-center gap-1 text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
              <Calendar size={12} /> Due Date
            </label>
            <p className="text-sm text-gray-900 dark:text-white">
              {task.due_date ? format(new Date(task.due_date), 'MMM d, yyyy') : '—'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="flex items-center gap-1 text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
              <Clock size={12} /> Est. Hours
            </label>
            <p className="text-sm text-gray-900 dark:text-white">{task.est_hours ?? '—'}</p>
          </div>
          <div>
            <label className="flex items-center gap-1 text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
              <Clock size={12} /> Est. Days
            </label>
            <p className="text-sm text-gray-900 dark:text-white">{task.est_days ?? '—'}</p>
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">Assignee</label>
          {task.assignee_id ? (() => {
            const assignee = profiles.find((p) => p.id === task.assignee_id)
            return assignee ? (
              <div className="flex items-center gap-2">
                {assignee.avatar_url ? (
                  <img src={assignee.avatar_url} alt="" className="h-6 w-6 rounded-full" />
                ) : (
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-medium text-white">
                    {assignee.name?.charAt(0)?.toUpperCase()}
                  </div>
                )}
                <span className="text-sm text-gray-900 dark:text-white">{assignee.name}</span>
              </div>
            ) : <p className="text-sm text-gray-400">Unknown</p>
          })() : <p className="text-sm text-gray-400">—</p>}
        </div>

        {/* Child Tasks / Subtasks */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
              Subtasks {childTasks.length > 0 && <span className="text-gray-400">({childTasks.filter((t) => t.status === 'done').length}/{childTasks.length})</span>}
            </label>
            {canEdit && (
              <button
                onClick={() => onAddSubtask(task.id)}
                className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
              >
                <Plus size={12} /> Add
              </button>
            )}
          </div>

          {childTasks.length > 0 && (
            <div className="mb-3">
              <div className="h-1.5 w-full rounded-full bg-gray-100 dark:bg-gray-800">
                <div
                  className={cn('h-1.5 rounded-full transition-all', progress === 100 ? 'bg-green-500' : 'bg-indigo-500')}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            {childTasks.map((child) => {
              const childType = TASK_TYPE_OPTIONS.find((t) => t.value === child.task_type)
              return (
                <div
                  key={child.id}
                  className="group flex items-center gap-2 rounded-lg border border-gray-100 px-3 py-2 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/50"
                >
                  <div className={cn(
                    'h-2 w-2 rounded-full',
                    child.status === 'done' ? 'bg-green-500' :
                    child.status === 'in_progress' ? 'bg-blue-500' :
                    child.status === 'hold' ? 'bg-orange-500' :
                    'bg-gray-300'
                  )} />
                  <button
                    onClick={() => onEdit(child)}
                    className={cn(
                      'flex-1 text-left text-sm',
                      child.status === 'done' ? 'text-gray-400 line-through' : 'text-gray-700 dark:text-gray-300'
                    )}
                  >
                    {child.title}
                  </button>
                  {childType && (
                    <span className={`text-[9px] px-1.5 py-0.5 rounded ${childType.color}`}>
                      {childType.label}
                    </span>
                  )}
                  <PriorityIcon priority={child.priority} />
                  <StatusBadge status={child.status} />
                  {canEdit && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onEdit(child) }}
                      className="rounded p-1 text-gray-400 opacity-0 transition-opacity hover:bg-blue-50 hover:text-blue-500 group-hover:opacity-100 dark:hover:bg-blue-900/20"
                      title="Edit subtask"
                    >
                      <Edit size={12} />
                    </button>
                  )}
                  {perms.canDeleteSubtask && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        if (window.confirm('Delete this subtask?')) {
                          onDelete(child.id)
                        }
                      }}
                      className="rounded p-1 text-gray-400 opacity-0 transition-opacity hover:bg-red-50 hover:text-red-500 group-hover:opacity-100 dark:hover:bg-red-900/20"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              )
            })}

            {childTasks.length === 0 && (
              <p className="text-xs text-gray-400 dark:text-gray-500 italic py-2">No subtasks yet</p>
            )}
          </div>
        </div>

        {canEdit && (
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Quick Status</label>
            <div className="flex flex-wrap gap-2">
              {STATUS_OPTIONS.map((s) => (
                <button
                  key={s.value}
                  onClick={() => handleStatusChange(s.value)}
                  className={`rounded-xl border px-3 py-1.5 text-xs font-medium transition-all ${
                    task.status === s.value
                      ? 'border-indigo-300 bg-indigo-50 text-indigo-700 dark:border-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400'
                      : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Attachments */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="flex items-center gap-1 text-xs font-medium text-gray-500 dark:text-gray-400">
              <Paperclip size={12} /> Attachments {attachments.length > 0 && <span className="text-gray-400">({attachments.length})</span>}
            </label>
            {canEdit && (
              <>
                <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileUpload} />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
                >
                  <Plus size={12} /> Upload
                </button>
              </>
            )}
          </div>

          {attachmentsLoading ? (
            <p className="text-xs text-gray-400 italic py-2">Loading...</p>
          ) : attachments.length > 0 ? (
            <div className="space-y-1.5">
              {attachments.map((att) => (
                <div
                  key={att.id}
                  className="group flex items-center gap-2 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 dark:border-gray-800 dark:bg-gray-800/50"
                >
                  <span className="text-base">{getFileIcon(att.file_type)}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-gray-700 dark:text-gray-300">{att.file_name}</p>
                    <p className="text-[10px] text-gray-400">{formatFileSize(att.file_size)}</p>
                  </div>
                  <button
                    onClick={() => handleDownload(att)}
                    className="rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-indigo-600 dark:hover:bg-gray-700"
                    title="Download"
                  >
                    <Download size={12} />
                  </button>
                  {canEdit && (
                    <button
                      onClick={async () => {
                        if (window.confirm(`Delete "${att.file_name}"?`)) {
                          const result = await deleteAttachment(att)
                          if (result.error) toast.error(result.error)
                          else toast.success('Deleted')
                        }
                      }}
                      className="rounded p-1 text-gray-400 opacity-0 transition-opacity hover:bg-red-50 hover:text-red-500 group-hover:opacity-100 dark:hover:bg-red-900/20"
                      title="Delete"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-400 dark:text-gray-500 italic py-2">No attachments</p>
          )}
        </div>

        {/* Comments */}
        <div>
          <label className="flex items-center gap-1 text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
            <MessageSquare size={12} /> Comments {comments.length > 0 && <span className="text-gray-400">({comments.length})</span>}
          </label>

          {commentsLoading ? (
            <p className="text-xs text-gray-400 italic py-2">Loading...</p>
          ) : comments.length > 0 ? (
            <div className="space-y-3 mb-3">
              {(() => {
                const topLevel = comments.filter((c) => !c.parent_comment_id)
                const repliesMap = new Map<string, Comment[]>()
                comments.forEach((c) => {
                  if (c.parent_comment_id) {
                    const existing = repliesMap.get(c.parent_comment_id) || []
                    existing.push(c)
                    repliesMap.set(c.parent_comment_id, existing)
                  }
                })

                function renderComment(comment: Comment, isReply = false) {
                  const commenter = profiles.find((p) => p.id === comment.user_id)
                  const isOwn = comment.user_id === profile?.id
                  const replies = repliesMap.get(comment.id) || []
                  return (
                    <div key={comment.id} className={cn('group', isReply && 'ml-8 mt-2')}>
                      <div className="flex items-start gap-2">
                        {commenter?.avatar_url ? (
                          <img src={commenter.avatar_url} alt="" className="h-6 w-6 rounded-full mt-0.5" />
                        ) : (
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-[8px] font-medium text-white mt-0.5">
                            {commenter?.name?.charAt(0)?.toUpperCase() ?? '?'}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{commenter?.name || 'Unknown'}</span>
                            <span className="text-[10px] text-gray-400">{formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}</span>
                            {canEdit && !isReply && (
                              <button
                                onClick={() => { setReplyingTo(replyingTo === comment.id ? null : comment.id); setReplyText('') }}
                                className="rounded p-0.5 text-gray-400 opacity-0 transition-opacity hover:text-indigo-500 group-hover:opacity-100"
                                title="Reply"
                              >
                                <Reply size={10} />
                              </button>
                            )}
                            {isOwn && (
                              <button
                                onClick={async () => {
                                  const result = await deleteComment(comment.id)
                                  if (result.error) toast.error(result.error)
                                }}
                                className="rounded p-0.5 text-gray-400 opacity-0 transition-opacity hover:text-red-500 group-hover:opacity-100"
                              >
                                <Trash2 size={10} />
                              </button>
                            )}
                          </div>
                          <p className="text-xs text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{comment.body}</p>
                        </div>
                      </div>

                      {/* Reply input for this comment */}
                      {replyingTo === comment.id && (
                        <div className="ml-8 mt-2 flex items-start gap-2">
                          <MentionInput
                            value={replyText}
                            onChange={setReplyText}
                            onSubmit={() => handleAddComment(comment.id)}
                            profiles={profiles.filter((p) => p.id !== profile?.id)}
                            placeholder={`Reply to ${commenter?.name || 'Unknown'}... (Ctrl+Enter to send)`}
                            rows={2}
                          />
                          <div className="flex flex-col gap-1">
                            <button
                              onClick={() => handleAddComment(comment.id)}
                              disabled={!replyText.trim()}
                              className="rounded-lg bg-indigo-600 p-1.5 text-white transition-all hover:bg-indigo-700 disabled:opacity-30"
                            >
                              <Send size={10} />
                            </button>
                            <button
                              onClick={() => { setReplyingTo(null); setReplyText('') }}
                              className="rounded-lg bg-gray-200 p-1.5 text-gray-500 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
                            >
                              <X size={10} />
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Nested replies */}
                      {replies.length > 0 && (
                        <div className="mt-2 border-l-2 border-indigo-100 dark:border-indigo-900/30">
                          {replies.map((reply) => renderComment(reply, true))}
                        </div>
                      )}
                    </div>
                  )
                }

                return topLevel.map((comment) => renderComment(comment))
              })()}
            </div>
          ) : (
            <p className="text-xs text-gray-400 dark:text-gray-500 italic py-2 mb-3">No comments yet</p>
          )}

          {/* Comment input */}
          {canEdit && (
            <div className="flex items-start gap-2">
              <MentionInput
                value={newComment}
                onChange={setNewComment}
                onSubmit={() => handleAddComment()}
                profiles={profiles.filter((p) => p.id !== profile?.id)}
                placeholder="Add a comment... Type @ to mention (Ctrl+Enter to send)"
                rows={2}
              />
              <button
                onClick={() => handleAddComment()}
                disabled={!newComment.trim()}
                className="rounded-lg bg-indigo-600 p-2 text-white transition-all hover:bg-indigo-700 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Send size={12} />
              </button>
            </div>
          )}
        </div>
      </div>
    </SlideOver>
  )
}
