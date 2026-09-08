'use client'

import { FormEvent, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/browser'

type Project = { id: string; name: string }
type Material = { id: string; name: string; code: string | null; unit: string; reorder_level: number | null }
type Transaction = { id: string; project_id: string; material_id: string; transaction_type: string; quantity: number; transaction_date: string; notes: string | null; projects: { name: string } | null; materials: { name: string; unit: string } | null }

export default function MaterialUsagePage() {
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [materials, setMaterials] = useState<Material[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [orgId, setOrgId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ project_id: '', material_id: '', transaction_type: 'issue', quantity: '', transaction_date: new Date().toISOString().slice(0, 10), notes: '' })

  async function load() {
    const supabase = createClient()
    const { data: membership } = await supabase.from('organization_members').select('organization_id').eq('status', 'active').limit(1).maybeSingle()
    if (!membership) { router.replace('/onboarding'); return }
    setOrgId(membership.organization_id)
    const [{ data: projectData, error: projectError }, { data: materialData, error: materialError }, { data: transactionData, error: transactionError }] = await Promise.all([
      supabase.from('projects').select('id,name').eq('organization_id', membership.organization_id).order('name'),
      supabase.from('materials').select('id,name,code,unit,reorder_level').eq('organization_id', membership.organization_id).order('name'),
      supabase.from('material_transactions').select('id,project_id,material_id,transaction_type,quantity,transaction_date,notes,projects(name),materials(name,unit)').eq('organization_id', membership.organization_id).order('transaction_date', { ascending: false }).limit(50)
    ])
    if (projectError || materialError || transactionError) setError((projectError || materialError || transactionError)?.message || 'Unable to load material usage.')
    setProjects(projectData ?? []); setMaterials(materialData ?? []); setTransactions((transactionData ?? []) as Transaction[]); setLoading(false)
  }

  useEffect(() => { createClient().auth.getUser().then(({ data }) => { if (!data.user) router.replace('/login'); else load() }) }, [router])

  async function saveUsage(e: FormEvent) {
    e.preventDefault()
    if (!orgId || !form.project_id || !form.material_id || !form.quantity) { setError('Select a project, material and quantity.'); return }
    setSaving(true); setError('')
    const supabase = createClient()
    const { error: insertError } = await supabase.from('material_transactions').insert({ organization_id: orgId, project_id: form.project_id, material_id: form.material_id, transaction_type: form.transaction_type, quantity: Number(form.quantity), transaction_date: form.transaction_date, notes: form.notes.trim() || null })
    if (insertError) setError(insertError.message)
    else { setForm({ ...form, project_id: '', material_id: '', quantity: '', notes: '' }); await load() }
    setSaving(false)
  }

  if (loading) return <main className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500">Loading materials...</main>
  return <main className="min-h-screen bg-slate-50 text-slate-900"><header className="border-b border-slate-200 bg-white"><div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4"><div><button onClick={() => router.push('/')} className="text-sm font-bold tracking-widest text-blue-600">BUILDOS</button><p className="text-xs text-slate-500">Material Usage</p></div><button onClick={() => router.push('/materials')} className="text-sm text-slate-600 hover:text-slate-900">Materials master</button></div></header><div className="mx-auto max-w-7xl px-6 py-8"><div className="mb-6"><p className="text-sm font-medium text-slate-500">Project costs</p><h1 className="mt-1 text-3xl font-bold tracking-tight">Material Usage</h1><p className="mt-2 text-sm text-slate-500">Record material issued to or returned from projects.</p></div>{error && <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}<div className="grid gap-6 lg:grid-cols-[380px_1fr]"><form onSubmit={saveUsage} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-lg font-semibold">Record material movement</h2><div className="mt-4 space-y-3"><label className="block text-sm font-medium text-slate-700">Project<select required value={form.project_id} onChange={e => setForm({ ...form, project_id: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900"><option value="">Select project</option>{projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label><label className="block text-sm font-medium text-slate-700">Material<select required value={form.material_id} onChange={e => setForm({ ...form, material_id: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900"><option value="">Select material</option>{materials.map(m => <option key={m.id} value={m.id}>{m.name}{m.code ? ` — ${m.code}` : ''} ({m.unit})</option>)}</select></label><div className="grid grid-cols-2 gap-3"><label className="block text-sm font-medium text-slate-700">Movement<select value={form.transaction_type} onChange={e => setForm({ ...form, transaction_type: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900"><option value="issue">Issue</option><option value="return">Return</option><option value="adjustment">Adjustment</option><option value="receipt">Receipt</option></select></label><label className="block text-sm font-medium text-slate-700">Quantity<input required min="0.001" step="0.001" type="number" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900" /></label></div><label className="block text-sm font-medium text-slate-700">Date<input required type="date" value={form.transaction_date} onChange={e => setForm({ ...form, transaction_date: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900" /></label><label className="block text-sm font-medium text-slate-700">Notes<textarea rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900" /></label><button disabled={saving} className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">{saving ? 'Saving...' : 'Save movement'}</button></div></form><section className="space-y-3">{transactions.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">No material movements yet.</div> : transactions.map(t => <article key={t.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-start justify-between gap-4"><div><h2 className="font-semibold">{t.materials?.name || 'Material'}</h2><p className="mt-1 text-sm text-slate-500">{t.projects?.name || 'Project'} • {t.transaction_date}</p></div><span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">{t.transaction_type}</span></div><p className="mt-3 text-sm text-slate-700">{t.quantity} {t.materials?.unit || 'unit'}{t.notes ? ` • ${t.notes}` : ''}</p></article>)}</section></div></div></main>
}
