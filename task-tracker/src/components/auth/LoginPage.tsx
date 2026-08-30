import { useState, useEffect } from 'react'
import { useAuth } from './AuthProvider'
import { LogIn, Mail, Lock, LayoutGrid, ArrowLeft, BarChart3, CheckCircle, Users } from 'lucide-react'

type Mode = 'login' | 'signup' | 'reset' | 'invite'

export function LoginPage() {
  const { signIn, signUp, resetPassword, signInWithGoogle } = useAuth()
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [invitedEmail, setInvitedEmail] = useState('')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const inviteEmail = params.get('invite')
    if (inviteEmail) {
      setEmail(inviteEmail)
      setInvitedEmail(inviteEmail)
      setMode('invite')
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    if (mode === 'invite' || mode === 'signup') {
      if (password !== confirmPassword) {
        setError('Passwords do not match')
        setLoading(false)
        return
      }
      const result = await signUp(email, password)
      if (result.error) {
        // If email already exists, try signing in instead
        if (result.error.includes('already') || result.error.includes('registered') || result.error.includes('exists')) {
          const signInResult = await signIn(email, password)
          if (signInResult.error) {
            setError('Account exists with Google. Please use "Sign in with Google" instead.')
          }
        } else {
          setError(result.error)
        }
      } else {
        setSuccess('Account created! Signing you in...')
        // Auto sign-in after signup
        await signIn(email, password)
      }
    } else if (mode === 'login') {
      const result = await signIn(email, password)
      if (result.error) setError(result.error)
    } else if (mode === 'reset') {
      const result = await resetPassword(email)
      if (result.error) {
        setError(result.error)
      } else {
        setSuccess('Check your email for the password reset link!')
      }
    }

    setLoading(false)
  }

  async function handleGoogleSignIn() {
    setError('')
    const result = await signInWithGoogle()
    if (result.error) setError(result.error)
  }

  function switchMode(newMode: Mode) {
    setMode(newMode)
    setError('')
    setSuccess('')
  }

  return (
    <div className="flex min-h-screen">
      {/* Left side — Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyem0wLTR2Mkg4VjI4aDI4em0wLTR2Mkg0VjI0aDMyem0wLTR2Mkg4VjIwaDI4em0wLTR2Mkg0VjE2aDMyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />
        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
            <LayoutGrid className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold leading-tight">Gantt Chart<br />Task Tracker</h1>
          <p className="mt-4 text-lg text-indigo-100">Plan, track, and deliver projects with your team.</p>

          <div className="mt-12 space-y-4">
            {[
              { icon: BarChart3, text: 'Gantt timeline & sprint boards' },
              { icon: Users, text: 'Team collaboration & assignments' },
              { icon: CheckCircle, text: 'Real-time progress tracking' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/15">
                  <Icon size={16} className="text-white" />
                </div>
                <span className="text-sm text-indigo-100">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right side — Form */}
      <div className="flex w-full items-center justify-center bg-gray-50 px-4 dark:bg-gray-950 lg:w-1/2">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="mb-8 text-center lg:hidden">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 shadow-lg shadow-indigo-500/25">
              <LayoutGrid className="h-7 w-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Task Tracker</h1>
          </div>

          <div className="mb-8 hidden lg:block">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {mode === 'invite' && 'You\'re invited!'}
              {mode === 'login' && 'Welcome back'}
              {mode === 'signup' && 'Create account'}
              {mode === 'reset' && 'Reset password'}
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {mode === 'invite' && 'Create your account to join the team'}
              {mode === 'login' && 'Sign in to continue to your workspace'}
              {mode === 'signup' && 'Join your team on Task Tracker'}
              {mode === 'reset' && "We'll send you a reset link"}
            </p>
          </div>

          {invitedEmail && (
            <div className="mb-4 rounded-xl border border-indigo-200 bg-indigo-50 p-3 text-sm text-indigo-700 dark:border-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400">
              <strong>You've been invited!</strong> Create your account with <strong>{invitedEmail}</strong> to join the team.
            </div>
          )}

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xl shadow-gray-200/50 dark:border-gray-800 dark:bg-gray-900 dark:shadow-none">
            {(mode === 'reset' || mode === 'invite') && (
              <button
                onClick={() => switchMode('login')}
                className="mb-4 flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              >
                <ArrowLeft size={14} />
                {mode === 'invite' ? 'Already have an account? Sign in' : 'Back to login'}
              </button>
            )}

            {/* Google Sign-In — Primary for invite mode */}
            {mode === 'invite' && (
              <>
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  className="flex w-full items-center justify-center gap-3 rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-sm transition-all hover:bg-gray-50 active:scale-[0.98] dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  Sign in with Google
                </button>

                <div className="relative my-5">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200 dark:border-gray-700" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-white px-3 text-gray-400 dark:bg-gray-900 dark:text-gray-500">or set a password</span>
                  </div>
                </div>
              </>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                <div className="relative mt-1.5">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    readOnly={!!invitedEmail && mode === 'invite'}
                    className="block w-full rounded-xl border border-gray-300 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white disabled:cursor-not-allowed disabled:bg-gray-100 dark:disabled:bg-gray-700"
                    placeholder="you@company.com"
                  />
                </div>
              </div>

              {mode !== 'reset' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
                  <div className="relative mt-1.5">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full rounded-xl border border-gray-300 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              )}

              {(mode === 'invite' || mode === 'signup') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Confirm Password</label>
                  <div className="relative mt-1.5">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="block w-full rounded-xl border border-gray-300 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              )}

              {mode === 'login' && (
                <div className="flex justify-end">
                  <button type="button" onClick={() => switchMode('reset')} className="text-xs text-indigo-600 hover:text-indigo-700 dark:text-indigo-400">
                    Forgot password?
                  </button>
                </div>
              )}

              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
                  {error}
                </div>
              )}

              {success && (
                <div className="rounded-xl border border-green-200 bg-green-50 p-3 text-sm text-green-600 dark:border-green-800 dark:bg-green-900/20 dark:text-green-400">
                  {success}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-medium text-white shadow-lg shadow-indigo-500/25 transition-all hover:bg-indigo-700 hover:shadow-xl active:scale-[0.98] disabled:opacity-50"
              >
                {loading ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <>
                    <LogIn size={16} />
                    {mode === 'invite' && 'Create Account'}
                    {mode === 'login' && 'Sign in'}
                    {mode === 'signup' && 'Create account'}
                    {mode === 'reset' && 'Send reset link'}
                  </>
                )}
              </button>
            </form>

            {/* Regular login mode — show Google option */}
            {mode === 'login' && (
              <>
                <div className="relative my-5">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200 dark:border-gray-700" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-white px-3 text-gray-400 dark:bg-gray-900 dark:text-gray-500">or</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  className="flex w-full items-center justify-center gap-3 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-all hover:bg-gray-50 active:scale-[0.98] dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  Sign in with Google
                </button>
              </>
            )}

            {mode !== 'reset' && mode !== 'invite' && (
              <div className="mt-4 text-center">
                <button onClick={() => switchMode(mode === 'login' ? 'signup' : 'login')} className="text-xs text-indigo-600 hover:text-indigo-700 dark:text-indigo-400">
                  {mode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
                </button>
              </div>
            )}
          </div>

          <p className="mt-6 text-center text-[11px] text-gray-400 dark:text-gray-500">
            Internal team tool. Contact admin for access.
          </p>
        </div>
      </div>
    </div>
  )
}
