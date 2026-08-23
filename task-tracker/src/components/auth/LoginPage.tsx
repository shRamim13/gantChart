import { useState } from 'react'
import { useAuth } from './AuthProvider'
import { LogIn, Mail, Lock, LayoutGrid, ArrowLeft } from 'lucide-react'

type Mode = 'login' | 'signup' | 'reset'

export function LoginPage() {
  const { signIn, signUp, resetPassword } = useAuth()
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    if (mode === 'login') {
      const result = await signIn(email, password)
      if (result.error) setError(result.error)
    } else if (mode === 'signup') {
      const result = await signUp(email, password)
      if (result.error) {
        setError(result.error)
      } else {
        setSuccess('Check your email for the confirmation link!')
      }
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

  function switchMode(newMode: Mode) {
    setMode(newMode)
    setError('')
    setSuccess('')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 via-indigo-50/30 to-gray-50 dark:from-gray-950 dark:via-indigo-950/10 dark:to-gray-950">
      <div className="w-full max-w-sm px-4">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 shadow-lg shadow-indigo-500/25">
            <LayoutGrid className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Task Tracker</h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {mode === 'login' && 'Sign in to your workspace'}
            {mode === 'signup' && 'Create your account'}
            {mode === 'reset' && 'Reset your password'}
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xl shadow-gray-200/50 dark:border-gray-800 dark:bg-gray-900 dark:shadow-none">
          {mode === 'reset' && (
            <button
              onClick={() => switchMode('login')}
              className="mb-4 flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            >
              <ArrowLeft size={14} />
              Back to login
            </button>
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
                  className="block w-full rounded-xl border border-gray-300 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
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

            {mode === 'login' && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => switchMode('reset')}
                  className="text-xs text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
                >
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
                  {mode === 'login' && 'Sign in'}
                  {mode === 'signup' && 'Create account'}
                  {mode === 'reset' && 'Send reset link'}
                </>
              )}
            </button>
          </form>

          {mode !== 'reset' && (
            <div className="mt-4 text-center">
              <button
                onClick={() => switchMode(mode === 'login' ? 'signup' : 'login')}
                className="text-xs text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
              >
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
  )
}
