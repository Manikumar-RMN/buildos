'use client'

import { FormEvent, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/browser'

type Customer = { id: string; name: string; company_name: string | null; phone: string | null; email: string | null; status: string }

export default function CustomersPage() {
  const router = useRouter()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [name, setName] = useState('')
  const [company, setCompany] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')

  async function load() {
    const supabase = createClient()
    const { data: auth } = await supabase.auth.getUser()
    if (!auth.user) { router.replace('/login'); return }
    const { data, error } = await supabase.from('customers').select('id,name,company_name,phone,email,status').order('created_at', { ascending: false })
    if (error) setMessage(error.message)
    else setCustomers((data ?? []) as Customer[])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function addCustomer(e: FormEvent) {
    e.preventDefault(); setMessage('')
    if (!name.trim()) { setMessage('Customer name is required.'); return }
    setSaving(true)
    const supabase = createClient()
    const { data: membership } = await supabase.from('organization_members').select('organization_id').eq('user_id', (await supabase.auth.getUser()).data.user?.id ?? '').eq('status', 'active').limit(1).maybeSingle()
    if (!membership) { setMessage('Your workspace membership could not be found.'); setSaving(false); return }
    const { error } = await supabase.from('customers').insert({ organization_id: membership.organization_id, name: name.trim(), company_name: company.trim() || null, phone: phone.trim() || null, email: email.trim() || null, status: 'active' })
    if (error) setMessage(error.message)
    else { setName(''); setCompany(''); setPhone(''); setEmail(''); await load() }
    setSaving(false)
  }

  return <main className="min-h-screen bg-slate-50 text-slate-900">
    <header className="border-b border-slate-200 bg-white"><div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6"><div><button onClick={() => router.push('/')} className="text-sm font-bold tracking-widest text-blue-600">BUILDOS</button><div className="text-xs text-slate-500">Customers</div></div><button onClick={() => router.push('/')} className="text-sm text-slate-600">Dashboard</button></div></header>
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <div className="mb-6"><h1 className="text-3xl font-bold">Customers</h1><p className="mt-1 text-sm text-slate-500">Manage the customers connected to your projects.</p></div>
      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <form onSubmit={addCustomer} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-semibold">Add customer</h2>
          <div className="mt-4 space-y-3">{[['Name',name,setName,'text'],['Company',company,setCompany,'text'],['Phone',phone,setPhone,'tel'],['Email',email,setEmail,'email']].map(([label,value,setter,type]) => <label key={label as string} className="block text-sm font-medium text-slate-700">{label as string}<input type={type as string} value={value as string} onChange={e => (setter as (v:string)=>void)(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900 outline-none focus:border-blue-600" /></label>)}</div>
          {message && <p className="mt-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-700">{message}</p>}
          <button disabled={saving} className="mt-4 w-full rounded-lg bg-blue-600 px-4 py-2.5 font-semibold text-white disabled:opacity-50">{saving ? 'Saving...' : 'Add customer'}</button>
        </form>
        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-200 px-5 py-4 font-semibold">Customer list</div>{loading ? <p className="p-5 text-sm text-slate-500">Loading customers...</p> : customers.length === 0 ? <div className="p-8 text-center"><p className="font-medium">No customers yet</p><p className="mt-1 text-sm text-slate-500">Add your first customer to start connecting projects and commercial records.</p></div> : <div className="divide-y divide-slate-100">{customers.map(c => <div key={c.id} className="flex flex-col justify-between gap-2 px-5 py-4 sm:flex-row sm:items-center"><div><p className="font-medium">{c.name}</p><p className="text-sm text-slate-500">{c.company_name || 'Individual'}{c.phone ? ` · ${c.phone}` : ''}{c.email ? ` · ${c.email}` : ''}</p></div><span className="w-fit rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">{c.status}</span></div>)}</div>}</section>
      </div>
    </div>
  </main>
}
