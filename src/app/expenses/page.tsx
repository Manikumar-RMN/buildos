'use client'

import { FormEvent, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/browser'

type Project = { id: string; name: string }
type Category = { id: string; name: string }
type Expense = { id: string; project_id: string | null; category_id: string | null; expense_date: string; description: string; amount: number; payment_method: string | null; status: string; projects: { name: string } | null; expense_categories: { name: string } | null }

export default function ExpensesPage() {
  const router = useRouter()
  const [projects, setProjects] = useState<Project[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [orgId, setOrgId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ project_id: '', category_id: '', expense_date: new Date().toISOString().slice(0, 10), description: '', amount: '', payment_method: 'cash', status: 'pending' })

  async function load() {
    const supabase = createClient()
    const { data: membership } = await supabase.from('organization_members').select('organization_id').eq('status', 'active').limit(1).maybeSingle()
    if (!membership) { router.replace('/onboarding'); return }
    setOrgId(membership.organization_id)
    const [{ data: projectData, error: projectError }, { data: categoryData, error: categoryError }, { data: expenseData, error: expenseError }] = await Promise.all([
      supabase.from('projects').select('id,name').eq('organization_id', membership.organization_id).order('name'),
      supabase.from('expense_categories').select('id,name').eq('organization_id', membership.organization_id).eq('status', 'active').order('name'),
      supabase.from('expenses').select('id,project_id,category_id,expense_date,description,amount,payment_method,status,projects(name),expense_categories(name)').eq('organization_id', membership.organization_id).order('expense_date', { ascending: false }).limit(50)
    ])
    if (projectError || categoryError || expenseError) setError((projectError || categoryError || expenseError)?.message || 'Unable to load expenses.')
    setProjects(projectData ?? []); setCategories(categoryData ?? []); setExpenses((expenseData ?? []) as Expense[]); setLoading(false)
  }

  useEffect(() => { createClient().auth.getUser().then(({ data }) => { if (!data.user) router.replace('/login'); else load() }) }, [router])

  async function saveExpense(e: FormEvent) {
    e.preventDefault()
    if (!orgId || !form.description.trim() || !form.amount) { setError('Description and amount are required.'); return }
    setSaving(true); setError('')
    const supabase = createClient()
    const { data: userData } = await supabase.auth.getUser()
    const { error: insertError } = await supabase.from('expenses').insert({ organization_id: orgId, project_id: form.project_id || null, category_id: form.category_id || null, expense_date: form.expense_date, description: form.description.trim(), amount: Number(form.amount), payment_method: form.payment_method, status: form.status, created_by: userData.user?.id ?? null })
    if (insertError) setError(insertError.message)
    else { setForm({ ...form, project_id: '', category_id: '', description: '', amount: '' }); await load() }
    setSaving(false)
  }

  const total = expenses.reduce((sum, item) => sum + Number(item.amount), 0)
  if (loading) return <main className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500">Loading expenses...</main>
  return <main className="min-h-screen bg-slate-50 text-slate-900"><header className="border-b border-slate-200 bg-white"><div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4"><div><button onClick={() => router.push('/')} className="text-sm font-bold tracking-widest text-blue-600">BUILDOS</button><p className="text-xs text-slate-500">Expenses</p></div><button onClick={() => router.push('/material-usage')} className="text-sm text-slate-600 hover:text-slate-900">Material Usage</button></div></header><div className="mx-auto max-w-7xl px-6 py-8"><div className="mb-6 flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-medium text-slate-500">Project spending</p><h1 className="mt-1 text-3xl font-bold tracking-tight">Expenses</h1><p className="mt-2 text-sm text-slate-500">Capture project and business expenses in one place.</p></div><div className="rounded-xl border border-slate-200 bg-white px-5 py-3 shadow-sm"><p className="text-xs text-slate-500">Recent records total</p><p className="text-xl font-bold">₹{total.toLocaleString('en-IN')}</p></div></div>{error && <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}<div className="grid gap-6 lg:grid-cols-[380px_1fr]"><form onSubmit={saveExpense} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-lg font-semibold">Add expense</h2><div className="mt-4 space-y-3"><label className="block text-sm font-medium text-slate-700">Project<select value={form.project_id} onChange={e => setForm({ ...form, project_id: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900"><option value="">General / no project</option>{projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label><label className="block text-sm font-medium text-slate-700">Category<select value={form.category_id} onChange={e => setForm({ ...form, category_id: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900"><option value="">Select category</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label><label className="block text-sm font-medium text-slate-700">Description<input required value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="e.g. Site transport" className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder:text-slate-400" /></label><div className="grid grid-cols-2 gap-3"><label className="block text-sm font-medium text-slate-700">Amount<input required min="0.01" step="0.01" type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900" /></label><label className="block text-sm font-medium text-slate-700">Date<input required type="date" value={form.expense_date} onChange={e => setForm({ ...form, expense_date: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900" /></label></div><div className="grid grid-cols-2 gap-3"><label className="block text-sm font-medium text-slate-700">Payment<select value={form.payment_method} onChange={e => setForm({ ...form, payment_method: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900"><option>cash</option><option>bank_transfer</option><option>card</option><option>upi</option><option>other</option></select></label><label className="block text-sm font-medium text-slate-700">Status<select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900"><option>pending</option><option>approved</option><option>paid</option><option>rejected</option></select></label></div><button disabled={saving} className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">{saving ? 'Saving...' : 'Save expense'}</button></div></form><section className="space-y-3">{expenses.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">No expenses recorded yet.</div> : expenses.map(x => <article key={x.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-start justify-between gap-4"><div><h2 className="font-semibold">{x.description}</h2><p className="mt-1 text-sm text-slate-500">{x.projects?.name || 'General'}{x.expense_categories?.name ? ` • ${x.expense_categories.name}` : ''} • {x.expense_date}</p></div><p className="text-lg font-bold">₹{Number(x.amount).toLocaleString('en-IN')}</p></div><div className="mt-3 flex gap-2 text-xs"><span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-600">{x.payment_method || '—'}</span><span className="rounded-full bg-blue-50 px-2.5 py-1 font-semibold text-blue-700">{x.status}</span></div></article>)}</section></div></div></main>
}
