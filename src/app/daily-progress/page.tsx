'use client'

import { FormEvent, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/browser'

type Project = { id: string; name: string; code: string | null }
type Site = { id: string; project_id: string; name: string }
type Progress = { id: string; project_id: string; site_id: string | null; progress_date: string; progress_percent: number | null; notes: string | null; issues: string | null; weather: string | null; projects: { name: string } | null; project_sites: { name: string } | null }

export default function DailyProgressPage() {
  const router = useRouter()
  const [records, setRecords] = useState<Progress[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [sites, setSites] = useState<Site[]>([])
  const [orgId, setOrgId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ project_id: '', site_id: '', progress_date: new Date().toISOString().slice(0, 10), progress_percent: '', weather: '', notes: '', issues: '' })

  async function load() {
    const supabase = createClient()
    const { data: membership } = await supabase.from('organization_members').select('organization_id').eq('status', 'active').limit(1).maybeSingle()
    if (!membership) { router.replace('/onboarding'); return }
    setOrgId(membership.organization_id)
    const [{ data: projectData, error: projectError }, { data: siteData, error: siteError }, { data: progressData, error: progressError }] = await Promise.all([
      supabase.from('projects').select('id,name,code').eq('organization_id', membership.organization_id).order('name'),
      supabase.from('project_sites').select('id,project_id,name').eq('organization_id', membership.organization_id).eq('status', 'active').order('name'),
      supabase.from('daily_progress').select('id,project_id,site_id,progress_date,progress_percent,notes,issues,weather,projects(name),project_sites(name)').eq('organization_id', membership.organization_id).order('progress_date', { ascending: false }).limit(50)
    ])
    if (projectError || siteError || progressError) setError((projectError || siteError || progressError)?.message || 'Unable to load daily progress.')
    setProjects(projectData ?? [])
    setSites(siteData ?? [])
    setRecords((progressData ?? []) as Progress[])
    setLoading(false)
  }

  useEffect(() => { createClient().auth.getUser().then(({ data }) => { if (!data.user) router.replace('/login'); else load() }) }, [router])

  const projectSites = sites.filter(s => s.project_id === form.project_id)

  async function saveProgress(e: FormEvent) {
    e.preventDefault()
    if (!orgId || !form.project_id) { setError('Select a project first.'); return }
    setSaving(true); setError('')
    const supabase = createClient()
    const { data: userData } = await supabase.auth.getUser()
    const { error: insertError } = await supabase.from('daily_progress').insert({ organization_id: orgId, project_id: form.project_id, site_id: form.site_id || null, progress_date: form.progress_date, progress_percent: form.progress_percent === '' ? null : Number(form.progress_percent), weather: form.weather.trim() || null, notes: form.notes.trim() || null, issues: form.issues.trim() || null, created_by: userData.user?.id ?? null })
    if (insertError) setError(insertError.message)
    else { setForm({ project_id: '', site_id: '', progress_date: new Date().toISOString().slice(0, 10), progress_percent: '', weather: '', notes: '', issues: '' }); await load() }
    setSaving(false)
  }

  if (loading) return <main className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500">Loading daily progress...</main>

  return <main className="min-h-screen bg-slate-50 text-slate-900">
    <header className="border-b border-slate-200 bg-white"><div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4"><div><button onClick={() => router.push('/')} className="text-sm font-bold tracking-widest text-blue-600">BUILDOS</button><p className="text-xs text-slate-500">Daily Progress</p></div><div className="flex gap-4 text-sm"><button onClick={() => router.push('/tasks')} className="text-slate-600 hover:text-slate-900">Tasks</button><button onClick={() => router.push('/projects')} className="text-slate-600 hover:text-slate-900">Projects</button></div></div></header>
    <div className="mx-auto max-w-7xl px-6 py-8"><div className="mb-6"><p className="text-sm font-medium text-slate-500">Site activity</p><h1 className="mt-1 text-3xl font-bold tracking-tight">Daily Progress</h1><p className="mt-2 text-sm text-slate-500">Capture a quick daily site update and turn field activity into project visibility.</p></div>
      {error && <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      <div className="grid gap-6 lg:grid-cols-[380px_1fr]"><form onSubmit={saveProgress} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-lg font-semibold">Today’s update</h2><div className="mt-4 space-y-3">
        <label className="block text-sm font-medium text-slate-700">Project<select required value={form.project_id} onChange={e => setForm({ ...form, project_id: e.target.value, site_id: '' })} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900"><option value="">Select project</option>{projects.map(p => <option key={p.id} value={p.id}>{p.name}{p.code ? ` — ${p.code}` : ''}</option>)}</select></label>
        <label className="block text-sm font-medium text-slate-700">Site<select value={form.site_id} onChange={e => setForm({ ...form, site_id: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900"><option value="">No site</option>{projectSites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
        <div className="grid grid-cols-2 gap-3"><label className="block text-sm font-medium text-slate-700">Date<input required type="date" value={form.progress_date} onChange={e => setForm({ ...form, progress_date: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900" /></label><label className="block text-sm font-medium text-slate-700">Progress %<input min="0" max="100" type="number" value={form.progress_percent} onChange={e => setForm({ ...form, progress_percent: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900" /></label></div>
        <label className="block text-sm font-medium text-slate-700">Weather<input value={form.weather} onChange={e => setForm({ ...form, weather: e.target.value })} placeholder="e.g. Sunny" className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder:text-slate-400" /></label>
        <label className="block text-sm font-medium text-slate-700">Work completed<textarea rows={3} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="What was completed today?" className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder:text-slate-400" /></label>
        <label className="block text-sm font-medium text-slate-700">Issues / blockers<textarea rows={2} value={form.issues} onChange={e => setForm({ ...form, issues: e.target.value })} placeholder="Anything the owner or PM should know?" className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder:text-slate-400" /></label>
        <button disabled={saving} className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">{saving ? 'Saving...' : 'Save daily update'}</button></div></form>
        <section className="space-y-3">{records.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">No daily updates yet.</div> : records.map(r => <article key={r.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-start justify-between gap-4"><div><h2 className="font-semibold">{r.projects?.name || 'Project'}</h2><p className="mt-1 text-sm text-slate-500">{r.project_sites?.name || 'No site'} • {r.progress_date}</p></div>{r.progress_percent !== null && <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">{r.progress_percent}%</span>}</div>{r.notes && <p className="mt-3 text-sm text-slate-700">{r.notes}</p>}{r.issues && <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">Issue: {r.issues}</p>}{r.weather && <p className="mt-2 text-xs text-slate-500">Weather: {r.weather}</p>}</article>)}</section>
      </div>
    </div></main>
}
