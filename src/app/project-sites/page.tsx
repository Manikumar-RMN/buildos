'use client'

import { FormEvent, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/browser'

type Project = { id: string; name: string; code: string | null }
type Site = { id: string; project_id: string; name: string; address: string | null; city: string | null; state: string | null; status: string; projects: { name: string; code: string | null } | null }

export default function ProjectSitesPage() {
  const router = useRouter()
  const [sites, setSites] = useState<Site[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [orgId, setOrgId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ project_id: '', name: '', address: '', city: '', state: '' })

  async function load() {
    const supabase = createClient()
    const { data: membership } = await supabase.from('organization_members').select('organization_id').eq('status', 'active').limit(1).maybeSingle()
    if (!membership) { router.replace('/onboarding'); return }
    setOrgId(membership.organization_id)
    const [{ data: projectData, error: projectError }, { data: siteData, error: siteError }] = await Promise.all([
      supabase.from('projects').select('id,name,code').eq('organization_id', membership.organization_id).order('name'),
      supabase.from('project_sites').select('id,project_id,name,address,city,state,status,projects(name,code)').eq('organization_id', membership.organization_id).order('created_at', { ascending: false })
    ])
    if (projectError) setError(projectError.message)
    if (siteError) setError(siteError.message)
    setProjects(projectData ?? [])
    setSites((siteData ?? []) as Site[])
    setLoading(false)
  }

  useEffect(() => { createClient().auth.getUser().then(({ data }) => { if (!data.user) router.replace('/login'); else load() }) }, [router])

  async function createSite(e: FormEvent) {
    e.preventDefault()
    if (!orgId) return
    if (!form.project_id) { setError('Select a project first.'); return }
    setSaving(true); setError('')
    const supabase = createClient()
    const { error: insertError } = await supabase.from('project_sites').insert({ organization_id: orgId, project_id: form.project_id, name: form.name.trim(), address: form.address.trim() || null, city: form.city.trim() || null, state: form.state.trim() || null, country: 'India', status: 'active' })
    if (insertError) setError(insertError.message)
    else { setForm({ project_id: '', name: '', address: '', city: '', state: '' }); await load() }
    setSaving(false)
  }

  if (loading) return <main className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500">Loading sites...</main>

  return <main className="min-h-screen bg-slate-50 text-slate-900">
    <header className="border-b border-slate-200 bg-white"><div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4"><div><button onClick={() => router.push('/')} className="text-sm font-bold tracking-widest text-blue-600">BUILDOS</button><p className="text-xs text-slate-500">Project Sites</p></div><button onClick={() => router.push('/projects')} className="text-sm text-slate-600 hover:text-slate-900">Projects</button></div></header>
    <div className="mx-auto max-w-7xl px-6 py-8">
      <div className="mb-6"><p className="text-sm font-medium text-slate-500">Site management</p><h1 className="mt-1 text-3xl font-bold tracking-tight">Project Sites</h1><p className="mt-2 text-sm text-slate-500">Connect physical work locations to projects and daily site activity.</p></div>
      {error && <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <form onSubmit={createSite} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-lg font-semibold">Add site</h2><div className="mt-4 space-y-3">
          <label className="block text-sm font-medium text-slate-700">Project<select required value={form.project_id} onChange={e => setForm({ ...form, project_id: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900"><option value="">Select project</option>{projects.map(p => <option key={p.id} value={p.id}>{p.name}{p.code ? ` — ${p.code}` : ''}</option>)}</select></label>
          {[['name','Site name'],['address','Address'],['city','City'],['state','State']].map(([key,label]) => <label key={key} className="block text-sm font-medium text-slate-700">{label}<input required={key === 'name'} value={form[key as keyof typeof form]} onChange={e => setForm({ ...form, [key]: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900" /></label>)}
          <button disabled={saving} className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">{saving ? 'Adding...' : 'Add site'}</button>
        </div></form>
        <section className="space-y-3">{sites.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">No project sites yet.</div> : sites.map(site => <article key={site.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-start justify-between gap-4"><div><h2 className="font-semibold">{site.name}</h2><p className="mt-1 text-sm text-slate-500">{site.projects?.name || 'Project'}{site.projects?.code ? ` • ${site.projects.code}` : ''}</p><p className="mt-2 text-sm text-slate-600">{[site.address, site.city, site.state].filter(Boolean).join(', ') || 'Location not provided'}</p></div><span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">{site.status}</span></div></article>)}</section>
      </div>
    </div>
  </main>
}
