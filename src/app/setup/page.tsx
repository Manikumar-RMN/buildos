'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/browser'

type Lifecycle = { mode: 'setup' | 'live' | 'expired' | 'suspended'; setup_started_at: string; setup_expires_at: string; go_live_at: string | null }
type ExtensionRequest = { id: string; requested_days: number; reason: string | null; status: string; created_at: string }
type Progress = { label: string; count: number; href: string; required: boolean }

export default function SetupPage() {
  const router = useRouter()
  const [lifecycle, setLifecycle] = useState<Lifecycle | null>(null)
  const [request, setRequest] = useState<ExtensionRequest | null>(null)
  const [progress, setProgress] = useState<Progress[]>([])
  const [loading, setLoading] = useState(true)
  const [goLiveLoading, setGoLiveLoading] = useState(false)
  const [requestLoading, setRequestLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [extensionDays, setExtensionDays] = useState('7')
  const [reason, setReason] = useState('')

  async function loadLifecycle() {
    const supabase = createClient()
    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) { router.replace('/login'); return }
    const { data: membership } = await supabase.from('organization_members').select('organization_id').eq('user_id', userData.user.id).eq('status', 'active').limit(1).maybeSingle()
    if (!membership) { router.replace('/onboarding'); return }
    const org = membership.organization_id
    const [{ data, error }, { count: customers }, { count: vendors }, { count: workers }, { count: materials }, { count: projects }, { count: sites }, { count: tasks }, { count: updates }] = await Promise.all([
      supabase.from('workspace_lifecycle').select('mode,setup_started_at,setup_expires_at,go_live_at').eq('organization_id', org).maybeSingle(),
      supabase.from('customers').select('id', { count: 'exact', head: true }).eq('organization_id', org),
      supabase.from('vendors').select('id', { count: 'exact', head: true }).eq('organization_id', org),
      supabase.from('workers').select('id', { count: 'exact', head: true }).eq('organization_id', org),
      supabase.from('materials').select('id', { count: 'exact', head: true }).eq('organization_id', org),
      supabase.from('projects').select('id', { count: 'exact', head: true }).eq('organization_id', org),
      supabase.from('project_sites').select('id', { count: 'exact', head: true }).eq('organization_id', org),
      supabase.from('tasks').select('id', { count: 'exact', head: true }).eq('organization_id', org),
      supabase.from('daily_progress').select('id', { count: 'exact', head: true }).eq('organization_id', org),
    ])
    if (error) setMessage(error.message); else setLifecycle(data as Lifecycle | null)
    setProgress([
      { label: 'Customers', count: customers ?? 0, href: '/customers', required: false },
      { label: 'Vendors', count: vendors ?? 0, href: '/vendors', required: false },
      { label: 'Workers', count: workers ?? 0, href: '/workers', required: false },
      { label: 'Materials', count: materials ?? 0, href: '/materials', required: false },
      { label: 'Projects', count: projects ?? 0, href: '/projects', required: true },
      { label: 'Project sites', count: sites ?? 0, href: '/project-sites', required: false },
      { label: 'Tasks', count: tasks ?? 0, href: '/tasks', required: false },
      { label: 'Daily progress', count: updates ?? 0, href: '/daily-progress', required: false },
    ])
    if (data?.mode === 'expired') {
      const { data: pending } = await supabase.from('setup_extension_requests').select('id,requested_days,reason,status,created_at').eq('organization_id', org).eq('status', 'pending').order('created_at', { ascending: false }).limit(1).maybeSingle()
      setRequest(pending as ExtensionRequest | null)
    } else setRequest(null)
    setLoading(false)
  }

  useEffect(() => { loadLifecycle() }, [router])

  async function requestExtension(e: React.FormEvent) {
    e.preventDefault(); setRequestLoading(true); setMessage('')
    const days = Number(extensionDays)
    if (!Number.isInteger(days) || days < 1 || days > 30) { setMessage('Choose an extension between 1 and 30 days.'); setRequestLoading(false); return }
    const supabase = createClient()
    const { error } = await supabase.rpc('request_setup_extension', { p_requested_days: days, p_reason: reason.trim() || null })
    if (error) setMessage(error.message); else { setMessage('Extension request submitted. BuildOS support can review it.'); setReason(''); await loadLifecycle() }
    setRequestLoading(false)
  }

  async function goLive() {
    const confirmed = window.confirm('Go live now? BuildOS will permanently delete setup/test transactions. Your master and configuration data will be kept. This cannot be undone.')
    if (!confirmed) return
    setGoLiveLoading(true); setMessage('')
    const supabase = createClient()
    const { error } = await supabase.rpc('go_live_workspace')
    if (error) setMessage(error.message); else { await loadLifecycle(); setMessage('Your workspace is now live. Setup/test transactions have been removed.') }
    setGoLiveLoading(false)
  }

  if (loading) return <main className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500">Loading setup...</main>
  if (!lifecycle) return <main className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-600">Workspace lifecycle is unavailable.</main>
  const isExpired = lifecycle.mode === 'expired'
  const completed = progress.filter(p => p.count > 0).length
  const percent = progress.length ? Math.round((completed / progress.length) * 100) : 0
  const expires = new Date(lifecycle.setup_expires_at).toLocaleString('en-IN')

  return <main className="min-h-screen bg-slate-50 text-slate-900">
    <header className="border-b border-slate-200 bg-white"><div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4"><div><div className="text-sm font-bold tracking-widest text-blue-600">BUILDOS</div><div className="text-xs text-slate-500">Workspace setup</div></div><button onClick={() => router.push('/')} className="text-sm font-medium text-slate-600 hover:text-slate-900">Back to dashboard</button></div></header>
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><span className={`rounded-full px-3 py-1 text-xs font-semibold ${isExpired ? 'bg-amber-50 text-amber-700' : lifecycle.mode === 'live' ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'}`}>{lifecycle.mode.toUpperCase()}</span><h1 className="mt-4 text-3xl font-bold tracking-tight">{isExpired ? 'Your setup period has ended.' : lifecycle.mode === 'live' ? 'Your workspace is live.' : 'Configure BuildOS before you go live.'}</h1><p className="mt-2 max-w-2xl text-slate-600">{isExpired ? 'Request more time if your team needs it. BuildOS will not make your workspace live automatically.' : lifecycle.mode === 'live' ? 'Your team can now use BuildOS for real operational work.' : 'Configure your masters, test the workflows and train your team before starting real work.'}</p></div>{lifecycle.mode !== 'live' && <button onClick={() => router.push('/setup/progress')} className="rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:border-blue-300">View setup progress</button>}</div>
      {lifecycle.mode !== 'live' && <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between text-sm"><span className="font-semibold">Setup readiness</span><span className="font-bold text-blue-600">{percent}%</span></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-blue-600" style={{ width: `${percent}%` }} /></div><div className="mt-3 flex flex-wrap gap-2">{progress.filter(p => p.count === 0).slice(0, 4).map(p => <button key={p.label} onClick={() => router.push(p.href)} className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600 hover:bg-slate-200">Add {p.label}</button>)}</div></div>}
      <div className="grid gap-6 md:grid-cols-3">{[['1','Configure','Import masters and set up your workspace.'],['2','Test','Run sample workflows and train your team.'],['3','Go Live','When ready, remove setup/test transactions and start real work.']].map(([n,t,d]) => <div key={n} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">{n}</div><h2 className="mt-5 font-semibold">{t}</h2><p className="mt-2 text-sm leading-6 text-slate-500">{d}</p></div>)}</div>
      {lifecycle.mode === 'setup' && <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><h2 className="text-lg font-semibold">Ready to start real work?</h2><p className="mt-1 text-sm text-slate-500">Setup period ends: {expires}</p><p className="mt-3 text-sm text-slate-600">Go Live permanently deletes only records identified as setup/test transactions. Master and configuration data stays in your workspace.</p><button onClick={goLive} disabled={goLiveLoading} className="mt-5 rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">{goLiveLoading ? 'Taking you live...' : 'Go Live'}</button></div>}
      {isExpired && <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-6"><h2 className="font-semibold text-amber-800">Need more setup time?</h2><p className="mt-1 text-sm text-amber-700">Request 1–30 additional days. BuildOS will not make your workspace live automatically.</p>{request ? <div className="mt-4 rounded-xl bg-white p-4 text-sm text-slate-700">Request pending: <strong>{request.requested_days} days</strong>{request.reason ? ` • ${request.reason}` : ''}</div> : <form onSubmit={requestExtension} className="mt-4 space-y-3"><div className="grid gap-3 sm:grid-cols-[160px_1fr]"><label className="text-sm font-medium text-slate-700">Days<select value={extensionDays} onChange={e => setExtensionDays(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900"><option value="3">3 days</option><option value="7">7 days</option><option value="14">14 days</option><option value="30">30 days</option></select></label><label className="text-sm font-medium text-slate-700">Reason<textarea value={reason} onChange={e => setReason(e.target.value)} rows={2} placeholder="Tell us what remains to be completed..." className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900" /></label></div><button disabled={requestLoading} className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">{requestLoading ? 'Submitting...' : 'Request extension'}</button></form>}</div>}
      {lifecycle.mode === 'live' && <div className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50 p-6"><h2 className="font-semibold text-emerald-800">Your workspace is live.</h2><p className="mt-1 text-sm text-emerald-700">Go Live completed {lifecycle.go_live_at ? new Date(lifecycle.go_live_at).toLocaleString('en-IN') : ''}.</p></div>}
      {message && <div className="mt-6 rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-700">{message}</div>}
    </div>
  </main>
}
