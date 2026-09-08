'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/browser'

type Lifecycle = { mode: 'setup' | 'live' | 'expired' | 'suspended'; setup_started_at: string; setup_expires_at: string; go_live_at: string | null }

export default function SetupPage() {
  const router = useRouter()
  const [lifecycle, setLifecycle] = useState<Lifecycle | null>(null)
  const [loading, setLoading] = useState(true)
  const [goLiveLoading, setGoLiveLoading] = useState(false)
  const [message, setMessage] = useState('')

  async function loadLifecycle() {
    const supabase = createClient()
    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) { router.replace('/login'); return }
    const { data: membership } = await supabase.from('organization_members').select('organization_id').eq('user_id', userData.user.id).eq('status', 'active').limit(1).maybeSingle()
    if (!membership) { router.replace('/onboarding'); return }
    const { data, error } = await supabase.from('workspace_lifecycle').select('mode,setup_started_at,setup_expires_at,go_live_at').eq('organization_id', membership.organization_id).maybeSingle()
    if (error) setMessage(error.message); else setLifecycle(data as Lifecycle | null)
    setLoading(false)
  }

  useEffect(() => { loadLifecycle() }, [router])

  async function goLive() {
    const confirmed = window.confirm('Go live now? BuildOS will permanently delete setup/test transactions. Your master and configuration data will be kept. This cannot be undone.')
    if (!confirmed) return
    setGoLiveLoading(true); setMessage('')
    const supabase = createClient()
    const { error } = await supabase.rpc('go_live_workspace')
    if (error) setMessage(error.message)
    else { await loadLifecycle(); setMessage('Your workspace is now live. Setup/test transactions have been removed.') }
    setGoLiveLoading(false)
  }

  if (loading) return <main className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500">Loading setup...</main>
  if (!lifecycle) return <main className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-600">Workspace lifecycle is unavailable.</main>
  const expires = new Date(lifecycle.setup_expires_at).toLocaleString('en-IN')
  const isExpired = lifecycle.mode === 'expired'

  return <main className="min-h-screen bg-slate-50 text-slate-900">
    <header className="border-b border-slate-200 bg-white"><div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4"><div><div className="text-sm font-bold tracking-widest text-blue-600">BUILDOS</div><div className="text-xs text-slate-500">Workspace setup</div></div><button onClick={() => router.push('/')} className="text-sm font-medium text-slate-600 hover:text-slate-900">Back to dashboard</button></div></header>
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="mb-8"><span className={`rounded-full px-3 py-1 text-xs font-semibold ${isExpired ? 'bg-amber-50 text-amber-700' : lifecycle.mode === 'live' ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'}`}>{lifecycle.mode.toUpperCase()}</span><h1 className="mt-4 text-3xl font-bold tracking-tight">{isExpired ? 'Your setup period has ended.' : 'Configure BuildOS before you go live.'}</h1><p className="mt-2 max-w-2xl text-slate-600">{isExpired ? 'Your workspace has not been made live automatically. Contact BuildOS support if you need more setup time.' : 'Use this period to import your masters, explore workflows, create test transactions, and train your team.'}</p></div>
      <div className="grid gap-6 md:grid-cols-3">{[['1','Import your masters','Add customers, vendors, workers, materials and other setup data.'],['2','Test your workflows','Create sample transactions and make sure your team knows the process.'],['3','Go live','When you are ready, BuildOS removes setup/test transactions and keeps your configuration.']].map(([number,title,description]) => <div key={number} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">{number}</div><h2 className="mt-5 font-semibold">{title}</h2><p className="mt-2 text-sm leading-6 text-slate-500">{description}</p></div>)}</div>
      {lifecycle.mode === 'setup' && <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><div className="flex flex-col justify-between gap-6 md:flex-row md:items-center"><div><h2 className="text-lg font-semibold">Ready to start real work?</h2><p className="mt-1 text-sm text-slate-500">Setup period ends: {expires}</p><p className="mt-3 max-w-xl text-sm text-slate-600">Go Live permanently deletes only records identified as setup/test transactions. Master and configuration data stays in your workspace.</p></div><button onClick={goLive} disabled={goLiveLoading} className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">{goLiveLoading ? 'Taking you live...' : 'Go Live'}</button></div></div>}
      {isExpired && <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-6"><h2 className="font-semibold text-amber-800">Setup access is paused</h2><p className="mt-1 text-sm text-amber-700">No automatic Go Live has occurred. Your existing configuration remains available while you arrange an extension.</p></div>}
      {lifecycle.mode === 'live' && <div className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50 p-6"><h2 className="font-semibold text-emerald-800">Your workspace is live.</h2><p className="mt-1 text-sm text-emerald-700">Go Live completed {lifecycle.go_live_at ? new Date(lifecycle.go_live_at).toLocaleString('en-IN') : ''}.</p></div>}
      {message && <div className="mt-6 rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-700">{message}</div>}
    </div>
  </main>
}
