'use client'

import { FormEvent, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/browser'

export default function OnboardingPage() {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [organizationName, setOrganizationName] = useState('')
  const [branchName, setBranchName] = useState('')
  const [branchCode, setBranchCode] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [checkingSession, setCheckingSession] = useState(true)

  useEffect(() => {
    const checkSession = async () => {
      const supabase = createClient()
      const { data } = await supabase.auth.getUser()

      if (!data.user) {
        router.replace('/login')
        return
      }

      setFullName(data.user.user_metadata?.full_name ?? '')
      setCheckingSession(false)
    }

    checkSession()
  }, [router])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage('')
    setLoading(true)

    const supabase = createClient()
    const { data, error } = await supabase.rpc('create_organization_with_owner', {
      p_name: organizationName,
      p_client_code: null,
      p_branch_name: branchName,
      p_branch_code: branchCode,
      p_full_name: fullName,
    })

    if (error) {
      setMessage(error.message)
      setLoading(false)
      return
    }

    if (!data) {
      setMessage('We could not complete your workspace setup.')
      setLoading(false)
      return
    }

    router.replace('/')
    router.refresh()
  }

  if (checkingSession) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <p className="text-sm text-slate-500">Checking your account...</p>
      </main>
    )
  }

  const inputClassName =
    'w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100'

  return (
    <main className="min-h-screen bg-slate-50 py-10 px-6">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 text-center">
          <div className="text-sm font-semibold tracking-wide text-blue-600">
            BUILDOS
          </div>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">
            Set up your workspace
          </h1>
          <p className="mt-2 text-slate-500">
            Tell us about your construction business to get started.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-slate-200 bg-white p-8 shadow-xl"
        >
          <section>
            <h2 className="text-lg font-semibold text-slate-900">Your details</h2>
            <p className="mt-1 text-sm text-slate-500">This account will become the workspace owner.</p>

            <div className="mt-5">
              <label className="mb-2 block text-sm font-medium text-slate-700">
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
          </section>

          <section className="mt-8 border-t border-slate-100 pt-8">
            <h2 className="text-lg font-semibold text-slate-900">Company</h2>
            <p className="mt-1 text-sm text-slate-500">Create the organization that will own your BuildOS workspace.</p>

            <div className="mt-5">
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Organization name
              </label>
              <input
                type="text"
                required
                value={organizationName}
                onChange={(event) => setOrganizationName(event.target.value)}
                className={inputClassName}
                placeholder="Your construction company"
              />
              <p className="mt-2 text-xs text-slate-400">
                BuildOS will automatically generate a unique Client Code for this organization.
              </p>
            </div>
          </section>

          <section className="mt-8 border-t border-slate-100 pt-8">
            <h2 className="text-lg font-semibold text-slate-900">First branch</h2>
            <p className="mt-1 text-sm text-slate-500">You can add more branches later.</p>

            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Branch name
                </label>
                <input
                  type="text"
                  required
                  value={branchName}
                  onChange={(event) => setBranchName(event.target.value)}
                  className={inputClassName}
                  placeholder="Chennai"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Branch code
                </label>
                <input
                  type="text"
                  required
                  maxLength={20}
                  value={branchCode}
                  onChange={(event) => setBranchCode(event.target.value.toUpperCase())}
                  className={`${inputClassName} uppercase`}
                  placeholder="CHE001"
                />
              </div>
            </div>
          </section>

          {message && (
            <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-8 w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Creating workspace...' : 'Create my workspace'}
          </button>
        </form>
      </div>
    </main>
  )
}
