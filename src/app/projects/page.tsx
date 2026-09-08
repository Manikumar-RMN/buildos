'use client'

import { FormEvent, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/browser'

type Customer = { id: string; name: string; company_name: string | null }
type Project = { id: string; name: string; code: string | null; project_value: number; budget: number; status: string; start_date: string | null; end_date: string | null; customers: { name: string } | null }

export default function ProjectsPage() {
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [orgId, setOrgId] = useState<string | null>(null)
  const [branchId, setBranchId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ name: '', code: '', customer_id: '', project_value: '', budget: '', start_date: '', end_date: '' })

  async function load() {
    const supabase = createClient()
    const { data: membership } = await supabase.from('organization_members').select('organization_id').eq('status', 'active').limit(1).maybeSingle()
    if (!membership) { router.replace('/onboarding'); return }
    setOrgId(membership.organization_id)
    const { data: branch } = await supabase.from('branches').select('id').eq('organization_id', membership.organization_id).eq('status', 'active').limit(1).maybeSingle()
    setBranchId(branch?.id ?? null)
    const [{ data: projectData, error: projectError }, { data: customerData }] = await Promise.all([
      supabase.from('projects').select('id,name,code,project_value,budget,status,start_date,end_date,customers(name)').eq('organization_id', membership.organization_id).order('created_at', { ascending: false }),
      supabase.from('customers').select('id,name,company_name').eq('organization_id', membership.organization_id).order('name')
    ])
    if (projectError) setError(projectError.message)
    setProjects((projectData ?? []) as Project[])
    setCustomers(customerData ?? [])
    setLoading(false)
  }

  useEffect(() => { createClient().auth.getUser().then(({ data }) => { if (!data.user) router.replace('/login'); else load() }) }, [router])

  async function createProject(e: FormEvent) {
    e.preventDefault()
    if (!orgId || !branchId) { setError('An active branch is required before creating a project.'); return }
    setSaving(true); setError('')
    const supabase = createClient()
    const { error: insertError } = await supabase.from('projects').insert({
      organization_id: orgId, branch_id: branchId, customer_id: form.customer_id || null,
      name: form.name.trim(), code: form.code.trim() || null,
      project_value: Number(form.project_value || 0), budget: Number(form.budget || 0),
      start_date: form.start_date || null, end_date: form.end_date || null, status: 'active'
    })
    if (insertError) setError(insertError.message)
    else { setForm({ name: '', code: '', customer_id: '', project_value: '', budget: '', start_date: '', end_date: '' }); await load() }
    setSaving(false)
  }

  if (loading) return <main className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500">Loading projects...</main>

  return <main className="min-h-screen bg-slate-50 text-slate-900">
    <header className="border-b border-slate-200 bg-white"><div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4"><div><button onClick={() => router.push('/')} className="text-sm font-bold tracking-widest text-blue-600">BUILDOS</button><p className="text-xs text-slate-500">Projects</p></div><button onClick={() => router.push('/')} className="text-sm text-slate-600 hover:text-slate-900">Dashboard</button></div></header>
    <div className="mx-auto max-w-7xl px-6 py-8">
      <div className="mb-6"><p className="text-sm font-medium text-slate-500">Project management</p><h1 className="mt-1 text-3xl font-bold tracking-tight">Projects</h1><p className="mt-2 text-sm text-slate-500">Create and manage the projects that connect site work to commercial visibility.</p></div>
      {error && <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <form onSubmit={createProject} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold">New project</h2><div className="mt-4 space-y-3">
            {([['name','Project name','text'],['code','Project code','text'],['project_value','Project value','number'],['budget','Budget','number'],['start_date','Start date','date'],['end_date','End date','date']] as const).map(([key,label,type]) => <label key={key} className="block text-sm font-medium text-slate-700">{label}<input required={key === 'name'} type={type} value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none focus:border-blue-500" /></label>)}
            <label className="block text-sm font-medium text-slate-700">Customer<select value={form.customer_id} onChange={e => setForm({ ...form, customer_id: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900"><option value="">No customer</option>{customers.map(c => <option key={c.id} value={c.id}>{c.name}{c.company_name ? ` — ${c.company_name}` : ''}</option>)}</select></label>
            <button disabled={saving} className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">{saving ? 'Creating...' : 'Create project'}</button>
          </div>
        </form>
        <section className="space-y-3">{projects.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">No projects yet. Create your first project to start connecting site activity and costs.</div> : projects.map(p => <article key={p.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex flex-col justify-between gap-3 sm:flex-row"><div><div className="flex items-center gap-2"><h2 className="text-lg font-semibold">{p.name}</h2><span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">{p.status}</span></div><p className="mt-1 text-sm text-slate-500">{p.code || 'No project code'} {p.customers?.name ? `• ${p.customers.name}` : ''}</p></div><div className="text-left sm:text-right"><p className="text-xs text-slate-500">Value / Budget</p><p className="mt-1 font-semibold">₹{Number(p.project_value).toLocaleString('en-IN')} / ₹{Number(p.budget).toLocaleString('en-IN')}</p></div></div><div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-500"><span>{p.start_date || 'Start not set'}</span><span>→</span><span>{p.end_date || 'End not set'}</span></div></article>)}</section>
      </div>
    </div>
  </main>
}
