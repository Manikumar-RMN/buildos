'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/browser'

type Lifecycle = {
  mode: 'setup' | 'live' | 'expired' | 'suspended'
  setup_expires_at: string
}

export default function Home() {
  const router = useRouter()
  const [lifecycle, setLifecycle] = useState<Lifecycle | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: userData } = await supabase.auth.getUser()

      if (!userData.user) {
        router.replace('/login')
        return
      }

      const { data } = await supabase
        .from('workspace_lifecycle')
        .select('mode, setup_expires_at')
        .limit(1)
        .maybeSingle()

      setLifecycle(data as Lifecycle | null)
      setLoading(false)
    }

    load()
  }, [router])

  if (loading) {
    return <main className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500">Loading BuildOS...</main>
  }

  if (!lifecycle) {
    return <main className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-600">Your workspace is not ready yet.</main>
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <div className="text-sm font-bold tracking-widest text-blue-600">BUILDOS</div>
            <div className="text-xs text-slate-500">Construction operating system</div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${lifecycle.mode === 'live' ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'}`}>
              {lifecycle.mode === 'live' ? 'LIVE' : 'SETUP'}
            </span>
            <button onClick={() => createClient().auth.signOut().then(() => router.replace('/login'))} className="text-sm font-medium text-slate-600 hover:text-slate-900">Sign out</button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-6 px-6 py-8 lg:grid-cols-[240px_1fr]">
        <aside className="rounded-2xl border border-slate-200 bg-white p-4">
          <nav className="space-y-1 text-sm">
            {['Dashboard','Projects','Daily Progress','Tasks','Labour','Materials','Procurement','Expenses','Quotations','Invoices','Reports','Documents'].map((item, index) => (
              <button key={item} className={`w-full rounded-lg px-3 py-2 text-left ${index === 0 ? 'bg-blue-50 font-semibold text-blue-700' : 'text-slate-600 hover:bg-slate-50'}`}>{item}</button>
            ))}
          </nav>
        </aside>

        <section>
          {lifecycle.mode === 'setup' && (
            <div className="mb-6 rounded-2xl border border-blue-200 bg-blue-50 p-6">
              <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <div>
                  <p className="text-sm font-semibold text-blue-700">Workspace setup</p>
                  <h1 className="mt-1 text-2xl font-bold text-slate-900">Your BuildOS workspace is ready to configure.</h1>
                  <p className="mt-2 max-w-2xl text-sm text-slate-600">Import your masters, explore the workflows, create test transactions, and go live when your team is ready.</p>
                </div>
                <button onClick={() => router.push('/setup')} className="shrink-0 rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700">Open setup</button>
              </div>
            </div>
          )}

          <div className="mb-6">
            <p className="text-sm font-medium text-slate-500">Overview</p>
            <h2 className="mt-1 text-3xl font-bold tracking-tight">Know what needs your attention.</h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              ['Active Projects','0','Projects currently running'],
              ['Tasks Due','0','Tasks needing attention'],
              ['Site Updates','0','Recent daily updates'],
              ['Project Profitability','—','Available after project data'],
            ].map(([title, value, hint]) => (
              <div key={title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm text-slate-500">{title}</p>
                <p className="mt-3 text-3xl font-bold">{value}</p>
                <p className="mt-2 text-xs text-slate-400">{hint}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}
