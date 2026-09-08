'use client'

import { FormEvent, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/browser'

type Project = { id: string; name: string }
type Material = { id: string; name: string; unit: string }
type Vendor = { id: string; name: string; company_name: string | null }
type Request = { id: string; project_id: string; request_date: string; status: string; notes: string | null; projects: { name: string } | null }

type RequestItem = { material_id: string; quantity: string; unit: string }

export default function ProcurementPage() {
  const router = useRouter()
  const [orgId, setOrgId] = useState<string | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [materials, setMaterials] = useState<Material[]>([])
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [requests, setRequests] = useState<Request[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [requestForm, setRequestForm] = useState({ project_id: '', request_date: new Date().toISOString().slice(0, 10), notes: '' })
  const [items, setItems] = useState<RequestItem[]>([{ material_id: '', quantity: '', unit: '' }])

  async function load() {
    const supabase = createClient()
    const { data: membership } = await supabase.from('organization_members').select('organization_id').eq('status', 'active').limit(1).maybeSingle()
    if (!membership) { router.replace('/onboarding'); return }
    setOrgId(membership.organization_id)
    const [{ data: projectData, error: projectError }, { data: materialData, error: materialError }, { data: vendorData, error: vendorError }, { data: requestData, error: requestError }] = await Promise.all([
      supabase.from('projects').select('id,name').eq('organization_id', membership.organization_id).order('name'),
      supabase.from('materials').select('id,name,unit').eq('organization_id', membership.organization_id).order('name'),
      supabase.from('vendors').select('id,name,company_name').eq('organization_id', membership.organization_id).order('name'),
      supabase.from('material_requests').select('id,project_id,request_date,status,notes,projects(name)').eq('organization_id', membership.organization_id).order('request_date', { ascending: false }).limit(50)
    ])
    if (projectError || materialError || vendorError || requestError) setError((projectError || materialError || vendorError || requestError)?.message || 'Unable to load procurement.')
    setProjects(projectData ?? []); setMaterials(materialData ?? []); setVendors(vendorData ?? []); setRequests((requestData ?? []) as Request[]); setLoading(false)
  }

  useEffect(() => { createClient().auth.getUser().then(({ data }) => { if (!data.user) router.replace('/login'); else load() }) }, [router])

  function updateItem(index: number, field: keyof RequestItem, value: string) {
    setItems(current => current.map((item, i) => i === index ? { ...item, [field]: value, ...(field === 'material_id' ? { unit: materials.find(m => m.id === value)?.unit || '' } : {}) } : item))
  }

  async function saveRequest(e: FormEvent) {
    e.preventDefault()
    if (!orgId || !requestForm.project_id || items.some(i => !i.material_id || !i.quantity)) { setError('Select a project and complete every material line.'); return }
    setSaving(true); setError('')
    const supabase = createClient(); const { data: user } = await supabase.auth.getUser()
    const { data: request, error: requestError } = await supabase.from('material_requests').insert({ organization_id: orgId, project_id: requestForm.project_id, requested_by: user.user?.id ?? null, request_date: requestForm.request_date, status: 'requested', notes: requestForm.notes.trim() || null }).select('id').single()
    if (requestError || !request) { setError(requestError?.message || 'Could not create request.'); setSaving(false); return }
    const { error: itemError } = await supabase.from('material_request_items').insert(items.map(i => ({ material_request_id: request.id, material_id: i.material_id, quantity: Number(i.quantity), unit: i.unit })))
    if (itemError) { setError(itemError.message); await supabase.from('material_requests').delete().eq('id', request.id) }
    else { setRequestForm({ ...requestForm, project_id: '', notes: '' }); setItems([{ material_id: '', quantity: '', unit: '' }]); await load() }
    setSaving(false)
  }

  if (loading) return <main className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500">Loading procurement...</main>
  return <main className="min-h-screen bg-slate-50 text-slate-900"><header className="border-b border-slate-200 bg-white"><div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4"><div><button onClick={() => router.push('/')} className="text-sm font-bold tracking-widest text-blue-600">BUILDOS</button><p className="text-xs text-slate-500">Procurement</p></div><button onClick={() => router.push('/material-usage')} className="text-sm text-slate-600 hover:text-slate-900">Material Usage</button></div></header><div className="mx-auto max-w-7xl px-6 py-8"><div className="mb-6"><p className="text-sm font-medium text-slate-500">Purchase workflow</p><h1 className="mt-1 text-3xl font-bold tracking-tight">Procurement</h1><p className="mt-2 text-sm text-slate-500">Start with a project material request. Vendor quotations, purchase orders and goods receipt follow this request.</p></div>{error && <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}<div className="grid gap-6 lg:grid-cols-[430px_1fr]"><form onSubmit={saveRequest} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-lg font-semibold">Create material request</h2><div className="mt-4 space-y-3"><label className="block text-sm font-medium text-slate-700">Project<select required value={requestForm.project_id} onChange={e => setRequestForm({ ...requestForm, project_id: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900"><option value="">Select project</option>{projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label><label className="block text-sm font-medium text-slate-700">Request date<input required type="date" value={requestForm.request_date} onChange={e => setRequestForm({ ...requestForm, request_date: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900" /></label><div><div className="mb-2 flex items-center justify-between"><span className="text-sm font-medium text-slate-700">Materials</span><button type="button" onClick={() => setItems([...items, { material_id: '', quantity: '', unit: '' }])} className="text-xs font-semibold text-blue-600">+ Add line</button></div><div className="space-y-2">{items.map((item, index) => <div key={index} className="grid grid-cols-[1fr_90px_50px] gap-2"><select required value={item.material_id} onChange={e => updateItem(index, 'material_id', e.target.value)} className="rounded-lg border border-slate-300 bg-white px-2 py-2 text-sm text-slate-900"><option value="">Material</option>{materials.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select><input required min="0.001" step="0.001" type="number" placeholder="Qty" value={item.quantity} onChange={e => updateItem(index, 'quantity', e.target.value)} className="rounded-lg border border-slate-300 bg-white px-2 py-2 text-sm text-slate-900 placeholder:text-slate-400" /><div className="flex items-center justify-center text-xs text-slate-500">{item.unit || '—'}</div></div>)}</div></div><label className="block text-sm font-medium text-slate-700">Notes<textarea rows={2} value={requestForm.notes} onChange={e => setRequestForm({ ...requestForm, notes: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900" /></label><button disabled={saving} className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">{saving ? 'Saving...' : 'Submit material request'}</button></div></form><section className="space-y-3">{requests.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">No material requests yet.</div> : requests.map(r => <article key={r.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-start justify-between"><div><h2 className="font-semibold">{r.projects?.name || 'Project'}</h2><p className="mt-1 text-sm text-slate-500">Requested {r.request_date}</p></div><span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">{r.status}</span></div>{r.notes && <p className="mt-3 text-sm text-slate-600">{r.notes}</p>}</article>)}</section></div></div></main>
}
