import { useState } from 'react'
import toast from 'react-hot-toast'
import { Shield, Users, Mail, Send, Copy, Trash2 } from 'lucide-react'
import { useAdminProfiles } from '@/hooks/useAdminProfiles'
import { useInvitations } from '@/hooks/useInvitations'
import { useAuth } from '@/components/auth/AuthProvider'
import type { UserRole } from '@/types'
import { ROLE_OPTIONS } from '@/types'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { cn } from '@/lib/utils'

const ROLE_COLORS: Record<UserRole, string> = {
  super_admin: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  admin: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  user: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  viewer: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
}

export function AdminPanel() {
  const { profiles, loading: profilesLoading, updateRole, toggleActive } = useAdminProfiles()
  const { invitations, loading: invitesLoading, inviteUser, revokeInvitation, deleteUser } = useInvitations()
  const { profile: currentUser } = useAuth()
  const [tab, setTab] = useState<'users' | 'invitations'>('users')
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<UserRole>('user')
  const [revokeId, setRevokeId] = useState<string | null>(null)
  const [toggleUserId, setToggleUserId] = useState<string | null>(null)
  const [toggleUserName, setToggleUserName] = useState('')
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null)
  const [deleteUserName, setDeleteUserName] = useState('')

  const loading = profilesLoading || invitesLoading

  async function handleRoleChange(userId: string, newRole: UserRole) {
    const result = await updateRole(userId, newRole)
    if (!result.error) {
      toast.success('Role updated')
    } else {
      toast.error(result.error)
    }
  }

  async function handleToggleActive() {
    if (!toggleUserId) return
    const user = profiles.find((p) => p.id === toggleUserId)
    if (!user) return
    const newActive = !user.is_active
    const result = await toggleActive(toggleUserId, newActive)
    if (!result.error) {
      toast.success(newActive ? `${user.name} activated` : `${user.name} deactivated`)
      setToggleUserId(null)
    } else {
      toast.error(result.error)
    }
  }

  async function handleInvite() {
    if (!inviteEmail.trim()) {
      toast.error('Email is required')
      return
    }

    const existing = profiles.find((p) => p.email === inviteEmail.trim())
    if (existing) {
      toast.error('User already exists')
      return
    }

    const result = await inviteUser(inviteEmail.trim(), inviteRole)
    if (!result.error) {
      if ('emailFailed' in result && result.emailFailed) {
        toast.success(`Invitation saved. Email could not be sent — user can sign up with Google or contact admin.`)
      } else {
        toast.success(`Invitation email sent to ${inviteEmail}`)
      }
      setInviteEmail('')
      setInviteRole('user')
    } else {
      toast.error(result.error)
    }
  }

  async function handleRevoke() {
    if (!revokeId) return
    const result = await revokeInvitation(revokeId)
    if (!result.error) {
      toast.success('Invitation revoked')
      setRevokeId(null)
    } else {
      toast.error(result.error)
    }
  }

  async function handleDeleteUser() {
    if (!deleteUserId) return
    if (deleteUserId === currentUser?.id) {
      toast.error("You can't delete yourself")
      return
    }
    const result = await deleteUser(deleteUserId)
    if (!result.error) {
      toast.success(`${deleteUserName} deleted`)
      setDeleteUserId(null)
      setDeleteUserName('')
    } else {
      toast.error(result.error)
    }
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
          <p className="text-sm text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-auto p-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-900/30">
            <Shield className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Admin Panel</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Manage users and invitations</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-1 rounded-xl border border-gray-200 bg-gray-50 p-1 dark:border-gray-800 dark:bg-gray-800/50">
          <button
            onClick={() => setTab('users')}
            className={cn(
              'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all',
              tab === 'users' ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-900 dark:text-white' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
            )}
          >
            <Users size={16} /> Users ({profiles.length}{profiles.filter((p) => p.is_active === false).length > 0 ? `, ${profiles.filter((p) => p.is_active === false).length} pending` : ''})
          </button>
          <button
            onClick={() => setTab('invitations')}
            className={cn(
              'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all',
              tab === 'invitations' ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-900 dark:text-white' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
            )}
          >
            <Mail size={16} /> Invitations ({invitations.filter((i) => i.status === 'pending').length})
          </button>
        </div>

        {/* Users Tab */}
        {tab === 'users' && (
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 dark:border-gray-800 dark:bg-gray-800/50">
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">User</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Role</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {profiles.map((user) => {
                  const isInactive = user.is_active === false
                  return (
                  <tr key={user.id} className={cn('hover:bg-gray-50 dark:hover:bg-gray-800/50', isInactive && 'opacity-50')}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {user.avatar_url ? (
                          <img src={user.avatar_url} alt="" className="h-8 w-8 rounded-full" />
                        ) : (
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-xs font-medium text-white">
                            {user.name?.charAt(0)?.toUpperCase() ?? 'U'}
                          </div>
                        )}
                        <div>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {user.name}
                            {user.id === currentUser?.id && (
                              <span className="ml-1.5 text-xs text-gray-400">(you)</span>
                            )}
                          </span>
                          {isInactive && (
                            <span className="ml-2 inline-flex items-center rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-medium text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
                              Pending Approval
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">{user.email}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${ROLE_COLORS[user.role]}`}>
                        {ROLE_OPTIONS.find(r => r.value === user.role)?.label ?? user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                            <select
                              defaultValue={user.role}
                              onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)}
                              className="rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-xs font-medium text-gray-700 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                            >
                              {ROLE_OPTIONS.map((r) => (
                                <option key={r.value} value={r.value}>{r.label}</option>
                              ))}
                            </select>
                            <button
                              onClick={() => { setToggleUserId(user.id); setToggleUserName(user.name) }}
                              className={cn(
                                'rounded-lg px-2 py-1.5 text-xs font-medium',
                                isInactive
                                  ? 'text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/20'
                                  : 'text-orange-600 hover:bg-orange-50 dark:text-orange-400 dark:hover:bg-orange-900/20'
                              )}
                              title={isInactive ? 'Activate user' : 'Deactivate user'}
                            >
                              {isInactive ? 'Activate' : 'Deactivate'}
                            </button>
                            {user.id !== currentUser?.id && (
                              <button
                                onClick={() => { setDeleteUserId(user.id); setDeleteUserName(user.name) }}
                                className="rounded-lg px-2 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                                title="Delete user"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                      </div>
                    </td>
                  </tr>
                  )
                })}
                {profiles.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center">
                      <Users className="mx-auto mb-2 h-8 w-8 text-gray-300 dark:text-gray-600" />
                      <p className="text-sm text-gray-500 dark:text-gray-400">No users found</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Invitations Tab */}
        {tab === 'invitations' && (
          <>
            {/* Invite Form */}
            <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <h3 className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">Invite New User</h3>
              <div className="flex gap-3">
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="user@email.com"
                  className="flex-1 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  onKeyDown={(e) => { if (e.key === 'Enter') handleInvite() }}
                />
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as UserRole)}
                  className="rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                >
                  {ROLE_OPTIONS.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
                <button
                  onClick={handleInvite}
                  className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
                >
                  <Send size={14} /> Invite
                </button>
              </div>
              <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
                User will be assigned this role when they sign up via Google or email.
              </p>
            </div>

            {/* Invitations List */}
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50 dark:border-gray-800 dark:bg-gray-800/50">
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Email</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Role</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Expires</th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {invitations.map((inv) => (
                    <tr key={inv.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">{inv.email}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${ROLE_COLORS[inv.role]}`}>
                          {ROLE_OPTIONS.find(r => r.value === inv.role)?.label ?? inv.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn(
                          'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                          inv.status === 'pending' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                          inv.status === 'accepted' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                          'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                        )}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400">
                        {new Date(inv.expires_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        {inv.status === 'pending' && (
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(window.location.origin)
                              toast.success('Link copied! Share it with ' + inv.email)
                            }}
                            className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-900/20"
                          >
                            <Copy size={12} /> Resend
                          </button>
                        )}
                        {inv.status === 'accepted' && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                            Received
                          </span>
                        )}
                        {inv.status === 'expired' && (
                          <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                            Expired
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {invitations.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center">
                        <Mail className="mx-auto mb-2 h-8 w-8 text-gray-300 dark:text-gray-600" />
                        <p className="text-sm text-gray-500 dark:text-gray-400">No invitations yet</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Role Permissions */}
        <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-800/50">
          <h3 className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Role Permissions</h3>
          <div className="space-y-1 text-xs text-gray-500 dark:text-gray-400">
            {ROLE_OPTIONS.map((r) => (
              <p key={r.value}>
                <span className={`mr-1.5 font-medium ${ROLE_COLORS[r.value].split(' ').filter(c => c.includes('text')).join(' ')}`}>{r.label}</span>
                — {r.description}
              </p>
            ))}
          </div>
        </div>

        <ConfirmDialog
          open={!!revokeId}
          title="Revoke Invitation"
          message="This invitation will no longer be valid."
          confirmLabel="Revoke"
          onConfirm={handleRevoke}
          onCancel={() => setRevokeId(null)}
        />

        <ConfirmDialog
          open={!!toggleUserId}
          title={profiles.find((p) => p.id === toggleUserId)?.is_active === false ? `Activate ${toggleUserName}?` : `Deactivate ${toggleUserName}?`}
          message={profiles.find((p) => p.id === toggleUserId)?.is_active === false ? 'User will be able to login again.' : 'User will be blocked from logging in. They can be reactivated later.'}
          confirmLabel={profiles.find((p) => p.id === toggleUserId)?.is_active === false ? 'Activate' : 'Deactivate'}
          onConfirm={handleToggleActive}
          onCancel={() => { setToggleUserId(null); setToggleUserName('') }}
        />

        <ConfirmDialog
          open={!!deleteUserId}
          title={`Delete ${deleteUserName}?`}
          message="This will permanently delete this user and all their data. This action cannot be undone."
          confirmLabel="Delete User"
          onConfirm={handleDeleteUser}
          onCancel={() => { setDeleteUserId(null); setDeleteUserName('') }}
        />
      </div>
    </div>
  )
}
