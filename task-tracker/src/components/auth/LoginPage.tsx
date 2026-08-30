import { useState, useEffect } from 'react'
import { useAuth } from './AuthProvider'
import { LogIn, Mail, Lock, LayoutGrid, ArrowLeft, BarChart3, CheckCircle, Users, Eye, EyeOff, Zap } from 'lucide-react'

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
  const [showPassword, setShowPassword] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
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
    <div className="relative flex min-h-screen overflow-hidden bg-[#0a0a1a]">
      {/* Animated background */}
      <div className="absolute inset-0">
        {/* Gradient orbs */}
        <div className="absolute -left-32 -top-32 h-[500px] w-[500px] rounded-full bg-purple-600/20 blur-[120px] animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute -right-32 top-1/3 h-[400px] w-[400px] rounded-full bg-indigo-600/20 blur-[120px] animate-pulse" style={{ animationDuration: '6s', animationDelay: '1s' }} />
        <div className="absolute -bottom-32 left-1/3 h-[350px] w-[350px] rounded-full bg-violet-600/15 blur-[120px] animate-pulse" style={{ animationDuration: '5s', animationDelay: '2s' }} />

        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }}
        />

        {/* Floating particles */}
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-purple-400/20 animate-pulse"
            style={{
              width: `${Math.random() * 4 + 1}px`,
              height: `${Math.random() * 4 + 1}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDuration: `${Math.random() * 3 + 2}s`,
              animationDelay: `${Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      {/* Left panel — Branding (desktop) */}
      <div className="hidden relative z-10 lg:flex lg:w-[45%] flex-col justify-center px-16">
        <div className={`transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          {/* Logo */}
          <div className="mb-10 flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 shadow-lg shadow-purple-500/30">
              <LayoutGrid className="h-7 w-7 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">TaskFlow</h2>
              <p className="text-xs text-purple-300/60">Project Management</p>
            </div>
          </div>

          {/* Heading */}
          <h1 className="text-5xl font-bold leading-tight text-white">
            <span className="bg-gradient-to-r from-purple-400 via-indigo-400 to-violet-400 bg-clip-text text-transparent">
              Manage projects
            </span>
            <br />
            <span className="text-white/90">like never before</span>
          </h1>
          <p className="mt-5 max-w-md text-base text-gray-400 leading-relaxed">
            Plan sprints, track progress, and deliver with your team — all in one beautiful workspace.
          </p>

          {/* Feature pills */}
          <div className="mt-12 space-y-4">
            {[
              { icon: BarChart3, text: 'Gantt timelines & sprint boards', color: 'from-purple-500 to-purple-600' },
              { icon: Users, text: 'Real-time team collaboration', color: 'from-indigo-500 to-indigo-600' },
              { icon: CheckCircle, text: 'Track every task to completion', color: 'from-violet-500 to-violet-600' },
              { icon: Zap, text: 'Lightning fast performance', color: 'from-fuchsia-500 to-fuchsia-600' },
            ].map(({ icon: Icon, text, color }, idx) => (
              <div
                key={text}
                className={`flex items-center gap-4 transition-all duration-700 ${mounted ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'}`}
                style={{ transitionDelay: `${400 + idx * 100}ms` }}
              >
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${color} shadow-lg`}>
                  <Icon size={18} className="text-white" />
                </div>
                <span className="text-sm text-gray-300">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — Form */}
      <div className="relative z-10 flex w-full items-center justify-center px-4 lg:w-[55%]">
        <div className={`w-full max-w-md transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ transitionDelay: '200ms' }}>
          {/* Mobile logo */}
          <div className="mb-8 text-center lg:hidden">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 shadow-lg shadow-purple-500/30">
              <LayoutGrid className="h-7 w-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">TaskFlow</h1>
            <p className="text-xs text-purple-300/60">Project Management</p>
          </div>

          {/* Title */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white">
              {mode === 'invite' && "You're invited!"}
              {mode === 'login' && 'Welcome back'}
              {mode === 'signup' && 'Create your account'}
              {mode === 'reset' && 'Reset password'}
            </h2>
            <p className="mt-2 text-sm text-gray-400">
              {mode === 'invite' && 'Create your account to join the team'}
              {mode === 'login' && 'Sign in to continue to your workspace'}
              {mode === 'signup' && 'Join your team on TaskFlow'}
              {mode === 'reset' && "We'll send you a reset link"}
            </p>
          </div>

          {/* Invite banner */}
          {invitedEmail && (
            <div className="mb-5 rounded-2xl border border-purple-500/20 bg-purple-500/10 p-4 text-sm text-purple-300 backdrop-blur-sm">
              <strong className="text-purple-200">You've been invited!</strong> Create your account with <strong className="text-purple-200">{invitedEmail}</strong>
            </div>
          )}

          {/* Glass card */}
          <div className="rounded-3xl border border-white/[0.06] bg-white/[0.03] p-8 shadow-2xl shadow-black/20 backdrop-blur-xl">
            {/* Back button */}
            {(mode === 'reset' || mode === 'invite') && (
              <button
                onClick={() => switchMode('login')}
                className="mb-5 flex items-center gap-1.5 text-sm text-gray-400 transition-colors hover:text-purple-400"
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
                  className="flex w-full items-center justify-center gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.04] px-4 py-3.5 text-sm font-medium text-white transition-all hover:bg-white/[0.08] hover:border-white/[0.12] active:scale-[0.98]"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  Sign in with Google
                </button>

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/[0.06]" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-[#0a0a1a] px-4 text-gray-500">or set a password</span>
                  </div>
                </div>
              </>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-400 uppercase tracking-wider">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    readOnly={!!invitedEmail && mode === 'invite'}
                    className="block w-full rounded-xl border border-white/[0.06] bg-white/[0.04] py-3 pl-11 pr-4 text-sm text-white placeholder-gray-500 transition-all focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="you@company.com"
                  />
                </div>
              </div>

              {/* Password */}
              {mode !== 'reset' && (
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-400 uppercase tracking-wider">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full rounded-xl border border-white/[0.06] bg-white/[0.04] py-3 pl-11 pr-11 text-sm text-white placeholder-gray-500 transition-all focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:bg-white/[0.06]"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 transition-colors hover:text-purple-400"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              )}

              {/* Confirm Password */}
              {(mode === 'invite' || mode === 'signup') && (
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-gray-400 uppercase tracking-wider">Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="block w-full rounded-xl border border-white/[0.06] bg-white/[0.04] py-3 pl-11 pr-4 text-sm text-white placeholder-gray-500 transition-all focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:bg-white/[0.06]"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              )}

              {/* Forgot password */}
              {mode === 'login' && (
                <div className="flex justify-end">
                  <button type="button" onClick={() => switchMode('reset')} className="text-xs text-purple-400 hover:text-purple-300 transition-colors">
                    Forgot password?
                  </button>
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3.5 text-sm text-red-400 backdrop-blur-sm">
                  {error}
                </div>
              )}

              {/* Success */}
              {success && (
                <div className="rounded-xl border border-green-500/20 bg-green-500/10 p-3.5 text-sm text-green-400 backdrop-blur-sm">
                  {success}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="relative flex w-full items-center justify-center gap-2.5 overflow-hidden rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-purple-500/25 transition-all hover:from-purple-500 hover:to-indigo-500 hover:shadow-xl hover:shadow-purple-500/30 active:scale-[0.98] disabled:opacity-50"
              >
                {/* Shine effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full hover:translate-x-full transition-transform duration-700" />
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

            {/* Google for login mode */}
            {mode === 'login' && (
              <>
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/[0.06]" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-[#0a0a1a] px-4 text-gray-500">or continue with</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  className="flex w-full items-center justify-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.03] px-4 py-3 text-sm font-medium text-gray-300 transition-all hover:bg-white/[0.06] hover:border-white/[0.1] active:scale-[0.98]"
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

            {/* Switch mode */}
            {mode !== 'reset' && mode !== 'invite' && (
              <div className="mt-6 text-center">
                <button onClick={() => switchMode(mode === 'login' ? 'signup' : 'login')} className="text-xs text-gray-500 transition-colors hover:text-purple-400">
                  {mode === 'login' ? (
                    <>Don't have an account? <span className="font-medium text-purple-400">Sign up</span></>
                  ) : (
                    <>Already have an account? <span className="font-medium text-purple-400">Sign in</span></>
                  )}
                </button>
              </div>
            )}
          </div>

          <p className="mt-6 text-center text-[11px] text-gray-600">
            Internal team tool. Contact admin for access.
          </p>
        </div>
      </div>
    </div>
  )
}
