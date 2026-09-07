'use client'

import { FormEvent, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/browser'

export default function SignupPage() {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSignup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage('')

    if (password !== confirmPassword) {
      setMessage('Passwords do not match.')
      return
    }

    if (password.length < 8) {
      setMessage('Password must be at least 8 characters.')
      return
    }

    setLoading(true)

    const supabase = createClient()

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    })

    if (error) {
      setMessage(error.message)
      setLoading(false)
      return
    }

    if (!data.session) {
      setMessage(
        'Account created. Please check your email to verify your account, then sign in.'
      )
      setLoading(false)
      return
    }

    router.push('/onboarding')
    router.refresh()
  }

  const inputClassName =
    'w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100'

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
          <div className="mb-8">
            <div className="text-sm font-semibold text-blue-600 mb-2">
              BUILDOS
            </div>
            <h1 className="text-3xl font-bold text-slate-900">
              Create your account
            </h1>
            <p className="mt-2 text-slate-500">
              Start setting up your construction workspace.
            </p>
          </div>

          <form onSubmit={handleSignup} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Full name
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                className={inputClassName}
                placeholder="Your full name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Work email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className={inputClassName}
                placeholder="you@company.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Password
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className={inputClassName}
                placeholder="At least 8 characters"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Confirm password
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className={inputClassName}
                placeholder="Repeat your password"
              />
            </div>

            {message && (
              <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 text-sm text-slate-700">
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-500">
            Already have an account?{' '}
            <button
              type="button"
              onClick={() => router.push('/login')}
              className="font-semibold text-blue-600 hover:text-blue-700"
            >
              Sign in
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}
