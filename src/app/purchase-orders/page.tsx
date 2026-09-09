'use client'

import { FormEvent, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/browser'

type Project = { id: string; name: string }
type Vendor = { id: string; name: string; company_name: string | null }
type Material = { id: string; name: string; unit: string }
type Quote = { id: string; project_id: string | null; vendor_id: string; quotation_number: string | null; total_amount: number; status: string; vendors: { name: string; company_name: string | null } | null; projects: { name: string } | null }
type Item = { material_id: string; description: string; ordered_quantity: string; unit: string; unit_price: string }
type PurchaseOrder = { id: string; po_number: string; po_date: string; expected_date: string | null; total_amount: number; status: string; project_id: string | null; vendor_id: string; projects: { name: string } | null; vendors: { name: string; company_name: string | null } | null }

export default function PurchaseOrdersPage() {
  const router = useRouter()
  const [orgId, setOrgId] = useState<string | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [materials, setMaterials] = useState<Material[]>([])
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [orders, setOrders] = useState<PurchaseOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ project_id: '', vendor_id: '', po_number: '', po_date: new Date().toISOString().slice(0, 10), expected_date: '', tax_amount: '0' })
  const [items, setItems] = useState<Item[]>([{ material_id: '', description: '', ordered_quantity: '', unit: '', unit_price: '' }])

  async function load() {
    const s = createClient()
    const { data: m } = await s.from('organization_members').select('organization_id').eq('status', 'active').limit(1).maybeSingle()
    if (!m) { router.replace('/onboarding'); return }
    setOrgId(m.organization_id)
    const [{ data: p }, { data: v }, { data: ma }, { data: q }, { data: o }] = await Promise.all([
      s.from('projects').select('id,name').eq('organization_id', m.organization_id).order('name'),
      s.from('vendors').select('id,name,company_name').eq('organization_id', m.organization_id).order('name'),
      s.from('materials').select('id,name,unit').eq('organization_id', m.organization_id).order('name'),
      s.from('vendor_quotations').select('id,project_id,vendor_id,quotation_number,total_amount,status,vendors(name,company_name),projects(name)').eq('organization_id', m.organization_id).order('quotation_date', { ascending: false }).limit(50),
      s.from('purchase_orders').select('id,po_number,po_date,expected_date,total_amount,status,project_id,vendor_id,projects(name),vendors(name,company_name)').eq('organization_id', m.organization_id).order('po_date', { ascending: false }).limit(50),
    ])
    setProjects((p ?? []) as Project[]); setVendors((v ?? []) as Vendor[]); setMaterials((ma ?? []) as Material[]); setQuotes((q ?? []) as Quote[]); setOrders((o ?? []) as PurchaseOrder[]); setLoading(false)
  }

  useEffect(() => { void load() }, [router])

  function update(i: number, k: keyof Item, val: string) {
    setItems(a => a.map((x, n) => n === i ? { ...x, [k]: val, ...(k === 'material_id' ? { unit: materials.find(m => m.id === val)?.unit || '', description: materials.find(m => m.id === val)?.name || '' } : {}) } : x))
  }

  function applyQuote(id: string) {
    const q = quotes.find(x => x.id === id)
    if (!q) return
    setForm(f => ({ ...f, project_id: q.project_id || '', vendor_id: q.vendor_id }))
    setError('Quote selected. Add the PO lines below, then save.')
  }

  async function save(e: FormEvent) {
    e.preventDefault()
    if (!orgId || !form.vendor_id || items.some(i => !i.description || !i.ordered_quantity || !i.unit_price)) { setError('Vendor and every PO line are required.'); return }
    setSaving(true); setError('')
    const s = createClient(); const { data: u } = await s.auth.getUser()
    const subtotal = items.reduce((n, i) => n + Number(i.ordered_quantity) * Number(i.unit_price), 0); const tax = Number(form.tax_amount || 0); const total = subtotal + tax
    const { data: o, error: oe } = await s.from('purchase_orders').insert({ organization_id: orgId, project_id: form.project_id || null, vendor_id: form.vendor_id, po_number: form.po_number.trim() || `PO-${Date.now()}`, po_date: form.po_date, expected_date: form.expected_date || null, subtotal, tax_amount: tax, total_amount: total, status: 'draft', created_by: u.user?.id ?? null }).select('id').single()
    if (oe || !o) { setError(oe?.message || 'Could not create purchase order.'); setSaving(false); return }
    const { error: ie } = await s.from('purchase_order_items').insert(items.map(i => ({ purchase_order_id: o.id, material_id: i.material_id || null, description: i.description.trim(), ordered_quantity: Number(i.ordered_quantity), received_quantity: 0, unit: i.unit || null, unit_price: Number(i.unit_price), total_amount: Number(i.ordered_quantity) * Number(i.unit_price) })))
    if (ie) { setError(ie.message); await s.from('purchase_orders').delete().eq('id', o.id) }
    else { setForm({ ...form, project_id: '', vendor_id: '', po_number: '', expected_date: '' }); setItems([{ material_id: '', description: '', ordered_quantity: '', unit: '', unit_price: '' }]); await load() }
    setSaving(false)
  }

  if (loading) return <main className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500">Loading purchase orders...</main>

  return <main className="min-h-screen bg-slate-50 text-slate-900"><header className="border-b border-slate-200 bg-white"><div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4"><div><button onClick={() => router.push('/')} className="text-sm font-bold tracking-widest text-blue-600">BUILDOS</button><p className="text-xs text-slate-500">Purchase Orders</p></div><button onClick={() => router.push('/vendor-quotations')} className="text-sm text-slate-600">Vendor Quotations</button></div></header><div className="mx-auto max-w-7xl px-6 py-8"><div className="mb-6"><p className="text-sm font-medium text-slate-500">Procurement</p><h1 className="mt-1 text-3xl font-bold tracking-tight">Purchase Orders</h1><p className="mt-2 text-sm text-slate-500">Turn supplier pricing into trackable purchase orders and expected deliveries.</p></div>{error&&<div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}<div className="grid gap-6 lg:grid-cols-[450px_1fr]"><form onSubmit={save} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-lg font-semibold">Create purchase order</h2><div className="mt-4 space-y-3"><div className="rounded-lg bg-slate-50 p-3"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Optional quote shortcut</p><select onChange={e => applyQuote(e.target.value)} className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-2 py-2 text-sm text-slate-900"><option value="">Select a vendor quote</option>{quotes.map(q => <option key={q.id} value={q.id}>{q.vendors?.company_name || q.vendors?.name} • ₹{Number(q.total_amount).toLocaleString('en-IN')}</option>)}</select></div><div className="grid grid-cols-2 gap-3"><label className="text-sm font-medium text-slate-700">Project<select value={form.project_id} onChange={e => setForm({ ...form, project_id: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2 py-2 text-slate-900"><option value="">General</option>{projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label><label className="text-sm font-medium text-slate-700">Vendor<select required value={form.vendor_id} onChange={e => setForm({ ...form, vendor_id: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2 py-2 text-slate-900"><option value="">Select vendor</option>{vendors.map(v => <option key={v.id} value={v.id}>{v.company_name || v.name}</option>)}</select></label></div><div className="grid grid-cols-2 gap-3"><label className="text-sm font-medium text-slate-700">PO number<input value={form.po_number} onChange={e => setForm({ ...form, po_number: e.target.value })} placeholder="Auto if blank" className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-2 text-slate-900"/></label><label className="text-sm font-medium text-slate-700">PO date<input required type="date" value={form.po_date} onChange={e => setForm({ ...form, po_date: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-2 text-slate-900"/></label></div><label className="text-sm font-medium text-slate-700">Expected delivery<input type="date" value={form.expected_date} onChange={e => setForm({ ...form, expected_date: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-2 text-slate-900"/></label><div><div className="mb-2 flex justify-between"><span className="text-sm font-medium text-slate-700">PO lines</span><button type="button" onClick={() => setItems([...items, { material_id: '', description: '', ordered_quantity: '', unit: '', unit_price: '' }])} className="text-xs font-semibold text-blue-600">+ Add line</button></div>{items.map((i, n) => <div key={n} className="mb-2 grid grid-cols-2 gap-2"><select value={i.material_id} onChange={e => update(n, 'material_id', e.target.value)} className="rounded-lg border border-slate-300 bg-white px-2 py-2 text-sm text-slate-900"><option value="">Material</option>{materials.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select><input required placeholder="Description" value={i.description} onChange={e => update(n, 'description', e.target.value)} className="rounded-lg border border-slate-300 px-2 py-2 text-sm text-slate-900"/><input required type="number" min="0.001" step="0.001" placeholder="Qty" value={i.ordered_quantity} onChange={e => update(n, 'ordered_quantity', e.target.value)} className="rounded-lg border border-slate-300 px-2 py-2 text-sm text-slate-900"/><input required type="number" min="0" step="0.01" placeholder="Unit price" value={i.unit_price} onChange={e => update(n, 'unit_price', e.target.value)} className="rounded-lg border border-slate-300 px-2 py-2 text-sm text-slate-900"/></div>)}</div><label className="text-sm font-medium text-slate-700">Tax amount<input type="number" min="0" step="0.01" value={form.tax_amount} onChange={e => setForm({ ...form, tax_amount: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-2 text-slate-900"/></label><button disabled={saving} className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50">{saving ? 'Saving...' : 'Create purchase order'}</button></div></form><section className="space-y-3">{orders.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">No purchase orders yet.</div> : orders.map(o => <article key={o.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex justify-between gap-4"><div><h2 className="font-semibold">{o.po_number}</h2><p className="mt-1 text-sm text-slate-500">{o.vendors?.company_name || o.vendors?.name} • {o.projects?.name || 'General'} • {o.po_date}</p></div><div className="text-right"><p className="text-lg font-bold">₹{Number(o.total_amount).toLocaleString('en-IN')}</p><span className="text-xs font-semibold text-blue-700">{o.status}</span></div></div>{o.expected_date && <p className="mt-3 text-sm text-slate-500">Expected delivery: {o.expected_date}</p>}</article>)}</section></div></div></main>
}
