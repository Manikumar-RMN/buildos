'use client'

import { FormEvent, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/browser'

type Project = { id: string; name: string; code: string | null }
type Site = { id: string; project_id: string; name: string }
type Task = { id: string; project_id: string; site_id: string | null; title: string; description: string | null; priority: string; due_date: string | null; status: string; projects: { name: string } | null; project_sites: { name: string } | null }

export default function TasksPage() {
  const router = useRouter()
  const [tasks, setTasks] = useState<Task[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [sites, setSites] = useState<Site[]>([])
  const [orgId, setOrgId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ project_id: '', site_id: '', title: '', description: '', priority: 'medium', due_date: '' })

  async function load() {
    const supabase = createClient()
    const { data: membership } = await supabase.from('organization_members').select('organization_id').eq('status', 'active').limit(1).maybeSingle()
    if (!membership) { router.replace('/onboarding'); return }
    setOrgId(membership.organization_id)
    const [{ data: projectData, error: projectError }, { data: siteData, error: siteError }, { data: taskData, error: taskError }] = await Promise.all([
      supabase.from('projects').select('id,name,code').eq('organization_id', membership.organization_id).order('name'),
      supabase.from('project_sites').select('id,project_id,name').eq('organization_id', membership.organization_id).eq('status', 'active').order('name'),
      supabase.from('tasks').select('id,project_id,site_id,title,description,priority,due_date,status,projects(name),project_sites(name)').eq('organization_id', membership.organization_id).order('created_at', { ascending: false })
    ])
    if (projectError || siteError || taskError) setError((projectError || siteError || taskError)?.message || 'Unable to load tasks.')
    setProjects(projectData ?? [])
    setSites(siteData ?? [])
    setTasks((taskData ?? []) as Task[])
    setLoading(false)
  }

  useEffect(() => { createClient().auth.getUser().then(({ data }) => { if (!data.user) router.replace('/login'); else load() }) }, [router])

  const projectSites = sites.filter(s => s.project_id === form.project_id)

  async function createTask(e: FormEvent) {
    e.preventDefault()
    if (!orgId || !form.project_id) { setError('Select a project first.'); return }
    setSaving(true); setError('')
    const supabase = createClient()
    const { data: userData } = await supabase.auth.getUser()
    const { error: insertError } = await supabase.from('tasks').insert({ organization_id: orgId, project_id: form.project_id, site_id: form.site_id || null, title: form.title.trim(), description: form.description.trim() || null, priority: form.priority, due_date: form.due_date || null, status: 'open', created_by: userData.user?.id ?? null })
    if (insertError) setError(insertError.message)
    else { setForm({ project_id: '', site_id: '', title: '', description: '', priority: 'medium', due_date: '' }); await load() }
    setSaving(false)
  }

  if (loading) return <main className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500">Loading tasks...</main>

  return <main className="min-h-screen bg-slate-50 text-slate-900">
    <header className="border-b border-slate-200 bg-white"><div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4"><div><button onClick={() => router.push('/')} className="text-sm font-bold tracking-widest text-blue-600">BUILDOS</button><p className="text-xs text-slate-500">Tasks</p></div><div className="flex gap-4 text-sm"><button onClick={() => router.push('/projects')} className="text-slate-600 hover:text-slate-900">Projects</button><button onClick={() => router.push('/project-sites')} className="text-slate-600 hover:text-slate-900">Sites</button></div></div></header>
    <div className="mx-auto max-w-7xl px-6 py-8"><div className="mb-6"><p className="text-sm font-medium text-slate-500">Work management</p><h1 className="mt-1 text-3xl font-bold tracking-tight">Tasks</h1><p className="mt-2 text-sm text-slate-500">Track the work that needs to happen across projects and sites.</p></div>
      {error && <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      <div className="grid gap-6 lg:grid-cols-[360px_1fr]"><form onSubmit={createTask} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-lg font-semibold">New task</h2><div className="mt-4 space-y-3">
        <label className="block text-sm font-medium text-slate-700">Project<select required value={form.project_id} onChange={e => setForm({ ...form, project_id: e.target.value, site_id: '' })} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900"><option value="">Select project</option>{projects.map(p => <option key={p.id} value={p.id}>{p.name}{p.code ? ` — ${p.code}` : ''}</option>)}</select></label>
        <label className="block text-sm font-medium text-slate-700">Site<select value={form.site_id} onChange={e => setForm({ ...form, site_id: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900"><option value="">No site</option>{projectSites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
        <label className="block text-sm font-medium text-slate-700">Task title<input required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900" /></label>
        <label className="block text-sm font-medium text-slate-700">Description<textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900" /></label>
        <div className="grid grid-cols-2 gap-3"><label className="block text-sm font-medium text-slate-700">Priority<select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900"><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="urgent">Urgent</option></select></label><label className="block text-sm font-medium text-slate-700">Due date<input type="date" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900" /></label></div>
        <button disabled={saving} className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">{saving ? 'Creating...' : 'Create task'}</button></div></form>
        <section className="space-y-3">{tasks.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">No tasks yet.</div> : tasks.map(t => <article key={t.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-start justify-between gap-4"><div><h2 className="font-semibold">{t.title}</h2><p className="mt-1 text-sm text-slate-500">{t.projects?.name || 'Project'}{t.project_sites?.name ? ` • ${t.project_sites.name}` : ''}</p>{t.description && <p className="mt-2 text-sm text-slate-600">{t.description}</p>}</div><div className="flex gap-2"><span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">{t.priority}</span><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">{t.status}</span></div></div><div className="mt-3 text-xs text-slate-500">Due: {t.due_date || 'No due date'}</div></article>)}</section>
      </div>
    </div></main>
}
