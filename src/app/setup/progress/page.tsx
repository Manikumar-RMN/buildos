'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/browser'

type Check = { label: string; detail: string; count: number; href: string; required: boolean; optional?: boolean }

export default function SetupProgressPage() {
  const router = useRouter()
  const [checks, setChecks] = useState<Check[]>([])
  const [mode, setMode] = useState('')
  const [expires, setExpires] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const s = createClient()
      const { data: u } = await s.auth.getUser()
      if (!u.user) { router.replace('/login'); return }
      const { data: m } = await s.from('organization_members').select('organization_id').eq('user_id', u.user.id).eq('status', 'active').limit(1).maybeSingle()
      if (!m) { router.replace('/onboarding'); return }
      const org = m.organization_id
      const [{ data: lc }, { count: customers }, { count: vendors }, { count: workers }, { count: materials }, { count: projects }, { count: sites }, { count: tasks }, { count: updates }, { count: documents }] = await Promise.all([
        s.from('workspace_lifecycle').select('mode,setup_expires_at').eq('organization_id', org).maybeSingle(),
        s.from('customers').select('id', { count: 'exact', head: true }).eq('organization_id', org),
        s.from('vendors').select('id', { count: 'exact', head: true }).eq('organization_id', org),
        s.from('workers').select('id', { count: 'exact', head: true }).eq('organization_id', org),
        s.from('materials').select('id', { count: 'exact', head: true }).eq('organization_id', org),
        s.from('projects').select('id', { count: 'exact', head: true }).eq('organization_id', org),
        s.from('project_sites').select('id', { count: 'exact', head: true }).eq('organization_id', org),
        s.from('tasks').select('id', { count: 'exact', head: true }).eq('organization_id', org),
        s.from('daily_progress').select('id', { count: 'exact', head: true }).eq('organization_id', org),
        s.from('documents').select('id', { count: 'exact', head: true }).eq('organization_id', org),
      ])
      setMode(lc?.mode || '')
      setExpires(lc?.setup_expires_at || null)
      setChecks([
        { label: 'Configure workspace', detail: 'Review your workspace and organization setup.', count: 1, href: '/setup', required: false },
        { label: 'Import masters', detail: 'Import customers, vendors, workers and materials from templates. Optional if starting from scratch.', count: (customers ?? 0) + (vendors ?? 0) + (workers ?? 0) + (materials ?? 0), href: '/import', required: false, optional: true },
        { label: 'Projects', detail: 'Create at least one real project.', count: projects ?? 0, href: '/projects', required: true },
        { label: 'Project sites', detail: 'Connect sites to projects.', count: sites ?? 0, href: '/project-sites', required: false },
        { label: 'Tasks', detail: 'Test assigning and tracking work.', count: tasks ?? 0, href: '/tasks', required: false },
        { label: 'Daily progress', detail: 'Test a site update workflow.', count: updates ?? 0, href: '/daily-progress', required: false },
        { label: 'Documents', detail: 'Upload important project documents.', count: documents ?? 0, href: '/documents', required: false },
      ])
      setLoading(false)
    }
    load()
  }, [router])

  if (loading) return <main className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500">Loading setup progress...</main>
  const completed = checks.filter(c => c.count > 0).length
  const percent = checks.length ? Math.round((completed / checks.length) * 100) : 0

  return <main className="min-h-screen bg-slate-50 text-slate-900">
    <header className="border-b border-slate-200 bg-white"><div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4"><div><div className="text-sm font-bold tracking-widest text-blue-600">BUILDOS</div><div className="text-xs text-slate-500">Setup progress</div></div><button onClick={() => router.push('/setup')} className="text-sm text-slate-600">Back to setup</button></div></header>
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><p className="text-sm font-medium text-slate-500">Workspace readiness</p><h1 className="mt-1 text-3xl font-bold tracking-tight">Prepare your team for Go Live.</h1><p className="mt-2 max-w-2xl text-sm text-slate-500">Follow the recommended journey: configure → import masters → create a project → test workflows → Go Live. This checklist is guidance, not a blocker.</p></div><div className="text-left md:text-right"><p className="text-3xl font-bold">{percent}%</p><p className="text-xs text-slate-500">{completed} of {checks.length} steps started</p></div></div>
      <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex justify-between text-sm"><span className="font-medium">Setup progress</span><span className="text-slate-500">{mode.toUpperCase()}</span></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-blue-600" style={{ width: `${percent}%` }} /></div>{expires && mode === 'setup' && <p className="mt-3 text-xs text-slate-500">Setup period ends {new Date(expires).toLocaleString('en-IN')}.</p>}</div>
      <div className="space-y-3">{checks.map(c => <button key={c.label} onClick={() => router.push(c.href)} className="w-full rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-blue-200 hover:shadow"><div className="flex items-center gap-4"><div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${c.count > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{c.count > 0 ? '✓' : '•'}</div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h2 className="font-semibold">{c.label}</h2>{c.required && <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700">RECOMMENDED</span>}{c.optional && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">OPTIONAL</span>}</div><p className="mt-1 text-sm text-slate-500">{c.detail}</p></div><span className="text-sm font-semibold text-slate-700">{c.label === 'Import masters' ? `${customers ?? 0 + vendors ?? 0}` : c.count}</span><span className="text-slate-300">→</span></div></button>)}</div>
      <div className="mt-8 rounded-2xl border border-blue-200 bg-blue-50 p-5 text-sm text-slate-700"><strong>Ready when your team is ready.</strong> Import existing masters if you have them, create your project, test the key workflows and train your team. When you are confident, return to Setup and choose Go Live.</div>
    </div>
  </main>
}
