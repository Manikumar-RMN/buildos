'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/browser'

type Row = { id: string; organization_id: string; requested_by: string; requested_days: number; reason: string | null; status: string; created_at: string; organizations: { name: string; client_code: string | null } | null }

export default function SetupRequestsAdminPage() {
  const router = useRouter()
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)
  const [message, setMessage] = useState('')

  async function load() {
    const s = createClient()
    const { data: user } = await s.auth.getUser()
    if (!user.user) { router.replace('/login'); return }
    const { data: me } = await s.from('users').select('platform_role').eq('id', user.user.id).maybeSingle()
    if (me?.platform_role !== 'platform_admin') { router.replace('/'); return }
    const { data, error } = await s.from('setup_extension_requests').select('id,organization_id,requested_by,requested_days,reason,status,created_at,organizations(name,client_code)').order('created_at', { ascending: false })
    if (error) setMessage(error.message)
    setRows((data ?? []) as Row[])
    setLoading(false)
  }

  useEffect(() => { load() }, [router])

  async function review(id: string, decision: 'approved' | 'rejected') {
    const note = window.prompt(decision === 'approved' ? 'Optional approval note:' : 'Reason for rejection:')
    if (decision === 'rejected' && note === null) return
    setBusy(id); setMessage('')
    const s = createClient()
    const { error } = await s.rpc('platform_review_setup_extension', { p_request_id: id, p_decision: decision, p_review_notes: note || null })
    if (error) setMessage(error.message)
    else setMessage(`Request ${decision}.`)
    await load()
    setBusy(null)
  }

  if (loading) return <main className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500">Loading admin workspace...</main>

  return <main className="min-h-screen bg-slate-50 text-slate-900">
    <header className="border-b border-slate-200 bg-white"><div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4"><div><div className="text-sm font-bold tracking-widest text-blue-600">BUILDOS</div><div className="text-xs text-slate-500">Platform administration</div></div><button onClick={() => router.push('/')} className="text-sm text-slate-600">Dashboard</button></div></header>
    <div className="mx-auto max-w-6xl px-6 py-8">
      <div className="mb-6"><p className="text-sm font-medium text-slate-500">Implementation & Support</p><h1 className="mt-1 text-3xl font-bold tracking-tight">Setup extension requests</h1><p className="mt-2 text-sm text-slate-500">Review customers who need additional time before Go Live.</p></div>
      {message && <div className="mb-6 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">{message}</div>}
      {rows.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">No extension requests yet.</div> : <div className="space-y-3">{rows.map(r => <article key={r.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"><div><h2 className="font-semibold">{r.organizations?.name || 'Unknown organization'}</h2><p className="mt-1 text-xs text-slate-500">Client code: {r.organizations?.client_code || '—'} • Requested {r.requested_days} days • {new Date(r.created_at).toLocaleString('en-IN')}</p>{r.reason && <p className="mt-3 text-sm text-slate-600">{r.reason}</p>}</div><div className="flex items-center gap-3"><span className={`rounded-full px-3 py-1 text-xs font-semibold ${r.status === 'pending' ? 'bg-amber-50 text-amber-700' : r.status === 'approved' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{r.status.toUpperCase()}</span>{r.status === 'pending' && <><button disabled={busy === r.id} onClick={() => review(r.id, 'approved')} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Approve</button><button disabled={busy === r.id} onClick={() => review(r.id, 'rejected')} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 disabled:opacity-50">Reject</button></>}</div></div></article>)}</div>}
    </div>
  </main>
}
