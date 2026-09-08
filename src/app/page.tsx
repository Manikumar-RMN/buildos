'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/browser'

type Lifecycle = { mode: 'setup' | 'live' | 'expired' | 'suspended'; setup_expires_at: string }
type Metric = { title: string; value: string; hint: string }

export default function Home() {
  const router = useRouter()
  const [lifecycle, setLifecycle] = useState<Lifecycle | null>(null)
  const [metrics, setMetrics] = useState<Metric[]>([])
  const [attention, setAttention] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) { router.replace('/login'); return }
      const { data: member } = await supabase.from('organization_members').select('organization_id').eq('user_id', userData.user.id).eq('status', 'active').limit(1).maybeSingle()
      if (!member) { router.replace('/onboarding'); return }
      const orgId = member.organization_id
      const { data: lc } = await supabase.from('workspace_lifecycle').select('mode, setup_expires_at').eq('organization_id', orgId).maybeSingle()
      const [{ count: projects }, { count: tasks }, { count: updates }, { data: invoices }, { data: expenses }] = await Promise.all([
        supabase.from('projects').select('id', { count: 'exact', head: true }).eq('organization_id', orgId).eq('status', 'active'),
        supabase.from('tasks').select('id', { count: 'exact', head: true }).eq('organization_id', orgId).neq('status', 'completed').lte('due_date', new Date().toISOString().slice(0, 10)),
        supabase.from('daily_progress').select('id', { count: 'exact', head: true }).eq('organization_id', orgId).gte('progress_date', new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10)),
        supabase.from('invoices').select('total_amount,status').eq('organization_id', orgId),
        supabase.from('expenses').select('amount').eq('organization_id', orgId),
      ])
      const billed = (invoices ?? []).reduce((n: number, i: any) => n + Number(i.total_amount || 0), 0)
      const outstanding = (invoices ?? []).filter((i: any) => i.status !== 'paid').reduce((n: number, i: any) => n + Number(i.total_amount || 0), 0)
      const cost = (expenses ?? []).reduce((n: number, e: any) => n + Number(e.amount || 0), 0)
      setLifecycle(lc as Lifecycle | null)
      setMetrics([
        { title: 'Active Projects', value: String(projects ?? 0), hint: 'Projects currently running' },
        { title: 'Tasks Due', value: String(tasks ?? 0), hint: 'Due today or overdue' },
        { title: 'Site Updates', value: String(updates ?? 0), hint: 'Updates in the last 7 days' },
        { title: 'Net Position', value: `₹${(billed - cost).toLocaleString('en-IN')}`, hint: `₹${outstanding.toLocaleString('en-IN')} invoice value outstanding` },
      ])
      const alerts: string[] = []
      if ((tasks ?? 0) > 0) alerts.push(`${tasks} task${tasks === 1 ? '' : 's'} need attention`)
      if (outstanding > 0) alerts.push(`₹${outstanding.toLocaleString('en-IN')} in invoices remain unpaid`)
      if ((updates ?? 0) === 0 && (projects ?? 0) > 0) alerts.push('No site updates recorded in the last 7 days')
      setAttention(alerts)
      setLoading(false)
    }
    load()
  }, [router])

  if (loading) return <main className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500">Loading BuildOS...</main>
  if (!lifecycle) return <main className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-600">Your workspace is not ready yet.</main>

  const nav: Record<string, string> = { Projects: '/projects', 'Daily Progress': '/daily-progress', Tasks: '/tasks', Labour: '/labour', Materials: '/materials', Procurement: '/procurement', Expenses: '/expenses', Quotations: '/vendor-quotations', Invoices: '/invoices', Reports: '/reports', Documents: '/documents', Customers: '/customers', Vendors: '/vendors' }
  return <main className="min-h-screen bg-slate-50 text-slate-900">
    <header className="border-b border-slate-200 bg-white"><div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4"><div><div className="text-sm font-bold tracking-widest text-blue-600">BUILDOS</div><div className="text-xs text-slate-500">Construction operating system</div></div><div className="flex items-center gap-3"><span className={`rounded-full px-3 py-1 text-xs font-semibold ${lifecycle.mode === 'live' ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'}`}>{lifecycle.mode === 'live' ? 'LIVE' : lifecycle.mode.toUpperCase()}</span><button onClick={() => createClient().auth.signOut().then(() => router.replace('/login'))} className="text-sm font-medium text-slate-600 hover:text-slate-900">Sign out</button></div></div></header>
    <div className="mx-auto grid max-w-7xl gap-6 px-6 py-8 lg:grid-cols-[240px_1fr]"><aside className="rounded-2xl border border-slate-200 bg-white p-4"><nav className="space-y-1 text-sm">{['Dashboard','Projects','Daily Progress','Tasks','Labour','Materials','Procurement','Expenses','Quotations','Invoices','Reports','Documents','Customers','Vendors'].map(item => item === 'Dashboard' ? <button key={item} className="w-full rounded-lg bg-blue-50 px-3 py-2 text-left font-semibold text-blue-700">{item}</button> : <button key={item} onClick={() => nav[item] && router.push(nav[item])} className="w-full rounded-lg px-3 py-2 text-left text-slate-600 hover:bg-slate-50">{item}</button>)}</nav></aside>
      <section>{lifecycle.mode === 'setup' && <div className="mb-6 rounded-2xl border border-blue-200 bg-blue-50 p-6"><div className="flex flex-col justify-between gap-4 md:flex-row md:items-center"><div><p className="text-sm font-semibold text-blue-700">Workspace setup</p><h1 className="mt-1 text-2xl font-bold">Your BuildOS workspace is ready to configure.</h1><p className="mt-2 max-w-2xl text-sm text-slate-600">Import your masters, explore workflows, create test transactions, and go live when your team is ready.</p></div><button onClick={() => router.push('/setup')} className="shrink-0 rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white">Open setup</button></div></div>}
        <div className="mb-6"><p className="text-sm font-medium text-slate-500">Overview</p><h2 className="mt-1 text-3xl font-bold tracking-tight">Know what needs your attention.</h2></div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{metrics.map(m => <div key={m.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">{m.title}</p><p className="mt-3 text-3xl font-bold">{m.value}</p><p className="mt-2 text-xs text-slate-400">{m.hint}</p></div>)}</div>
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h3 className="font-semibold">Needs attention</h3>{attention.length === 0 ? <p className="mt-3 text-sm text-slate-500">Nothing urgent is currently flagged.</p> : <ul className="mt-3 space-y-2">{attention.map(a => <li key={a} className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">{a}</li>)}</ul>}</div>
      </section></div></main>
}
