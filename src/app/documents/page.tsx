'use client'

import { FormEvent, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/browser'

type Project = { id: string; name: string }
type Doc = { id: string; name: string; file_url: string | null; document_type: string | null; project_id: string | null; created_at: string; projects: { name: string } | null }

const BUCKET = 'buildos-files'
const MAX_FILE_SIZE = 10 * 1024 * 1024

export default function DocumentsPage() {
  const router = useRouter()
  const [orgId, setOrgId] = useState<string | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [docs, setDocs] = useState<Doc[]>([])
  const [file, setFile] = useState<File | null>(null)
  const [form, setForm] = useState({ name: '', project_id: '', document_type: 'General', notes: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function load() {
    const s = createClient()
    const { data: u } = await s.auth.getUser()
    if (!u.user) { router.replace('/login'); return }
    const { data: m } = await s.from('organization_members').select('organization_id').eq('user_id', u.user.id).eq('status', 'active').limit(1).maybeSingle()
    if (!m) { router.replace('/onboarding'); return }
    setOrgId(m.organization_id)
    const [{ data: p }, { data: d }] = await Promise.all([
      s.from('projects').select('id,name').eq('organization_id', m.organization_id).order('name'),
      s.from('documents').select('id,name,file_url,document_type,project_id,created_at,projects(name)').eq('organization_id', m.organization_id).order('created_at', { ascending: false }).limit(100),
    ])
    setProjects(p ?? [])
    setDocs((d ?? []) as Doc[])
    setLoading(false)
  }

  useEffect(() => { load() }, [router])

  async function save(e: FormEvent) {
    e.preventDefault()
    if (!orgId || !form.name.trim()) { setError('Document name is required.'); return }
    if (!file) { setError('Choose a file to upload.'); return }
    if (file.size > MAX_FILE_SIZE) { setError('File must be 10 MB or smaller.'); return }
    setSaving(true); setError('')
    const s = createClient()
    const { data: u } = await s.auth.getUser()
    if (!u.user) { router.replace('/login'); return }

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const filePath = `${orgId}/${u.user.id}/${crypto.randomUUID()}-${safeName}`
    const { error: uploadError } = await s.storage.from(BUCKET).upload(filePath, file, { contentType: file.type, upsert: false })
    if (uploadError) { setError(uploadError.message); setSaving(false); return }

    const { data: signed } = await s.storage.from(BUCKET).createSignedUrl(filePath, 60 * 60)
    const { error: insertError } = await s.from('documents').insert({
      organization_id: orgId,
      project_id: form.project_id || null,
      name: form.name.trim(),
      document_type: form.document_type,
      file_url: signed?.signedUrl ?? null,
      notes: form.notes.trim() || null,
      uploaded_by: u.user.id,
    })

    if (insertError) {
      await s.storage.from(BUCKET).remove([filePath])
      setError(insertError.message)
    } else {
      setForm({ name: '', project_id: '', document_type: 'General', notes: '' })
      setFile(null)
      const input = document.getElementById('document-file') as HTMLInputElement | null
      if (input) input.value = ''
      await load()
    }
    setSaving(false)
  }

  async function openDocument(doc: Doc) {
    if (!doc.file_url) return
    window.open(doc.file_url, '_blank', 'noopener,noreferrer')
  }

  if (loading) return <main className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500">Loading documents...</main>

  return <main className="min-h-screen bg-slate-50 text-slate-900">
    <header className="border-b border-slate-200 bg-white"><div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4"><div><button onClick={() => router.push('/')} className="text-sm font-bold tracking-widest text-blue-600">BUILDOS</button><p className="text-xs text-slate-500">Documents</p></div><button onClick={() => router.push('/projects')} className="text-sm text-slate-600">Projects</button></div></header>
    <div className="mx-auto max-w-7xl px-6 py-8">
      <div className="mb-6"><p className="text-sm font-medium text-slate-500">Project workspace</p><h1 className="mt-1 text-3xl font-bold tracking-tight">Documents</h1><p className="mt-2 text-sm text-slate-500">Upload and keep project and business documents connected to the right workspace.</p></div>
      {error && <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      <div className="grid gap-6 lg:grid-cols-[430px_1fr]">
        <form onSubmit={save} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold">Upload document</h2>
          <p className="mt-1 text-xs text-slate-500">Private organization storage • Maximum 10 MB</p>
          <div className="mt-4 space-y-3">
            <label className="text-sm font-medium text-slate-700">Document name<input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Contract, drawing, approval..." className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900" /></label>
            <label className="text-sm font-medium text-slate-700">Project<select value={form.project_id} onChange={e => setForm({ ...form, project_id: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900"><option value="">Organization / General</option>{projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
            <label className="text-sm font-medium text-slate-700">Document type<select value={form.document_type} onChange={e => setForm({ ...form, document_type: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900"><option>General</option><option>Contract</option><option>Drawing</option><option>Approval</option><option>Invoice</option><option>Quotation</option><option>Site Photo</option><option>Other</option></select></label>
            <label className="block text-sm font-medium text-slate-700">File<input id="document-file" required type="file" accept="image/jpeg,image/png,image/webp,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={e => setFile(e.target.files?.[0] ?? null)} className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-sm" /></label>
            {file && <p className="text-xs text-slate-500">Selected: {file.name} • {(file.size / 1024 / 1024).toFixed(2)} MB</p>}
            <label className="text-sm font-medium text-slate-700">Notes<textarea rows={3} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900" /></label>
            <button disabled={saving} className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">{saving ? 'Uploading...' : 'Upload document'}</button>
          </div>
        </form>
        <section className="space-y-3">{docs.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">No documents yet.</div> : docs.map(d => <article key={d.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-start justify-between gap-4"><div><h2 className="font-semibold">{d.name}</h2><p className="mt-1 text-sm text-slate-500">{d.projects?.name || 'Organization / General'} • {d.document_type || 'General'}</p></div><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">Document</span></div>{d.file_url && <button type="button" onClick={() => openDocument(d)} className="mt-3 text-sm font-semibold text-blue-600">Open document</button>}<p className="mt-2 text-xs text-slate-400">Added {new Date(d.created_at).toLocaleDateString('en-IN')}</p></article>)}</section>
      </div>
    </div>
  </main>
}
