'use client'

import { FormEvent, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/browser'

type Project = { id: string; name: string; code: string | null }
type Site = { id: string; project_id: string; name: string }
type Photo = { id: string; daily_progress_id: string; storage_path: string; caption: string | null; created_at: string; signedUrl?: string }
type Progress = { id: string; project_id: string; site_id: string | null; progress_date: string; progress_percent: number | null; notes: string | null; issues: string | null; weather: string | null; projects: { name: string } | null; project_sites: { name: string } | null; daily_progress_photos?: Photo[] }

const BUCKET = 'buildos-files'
const MAX_PHOTO_SIZE = 10 * 1024 * 1024

export default function DailyProgressPage() {
  const router = useRouter()
  const [records, setRecords] = useState<Progress[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [sites, setSites] = useState<Site[]>([])
  const [orgId, setOrgId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [showDetails, setShowDetails] = useState(false)
  const [photos, setPhotos] = useState<File[]>([])
  const [form, setForm] = useState({ project_id: '', site_id: '', progress_date: new Date().toISOString().slice(0, 10), progress_percent: '', weather: '', notes: '', issues: '' })

  async function load() {
    const supabase = createClient()
    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) { router.replace('/login'); return }
    const { data: membership } = await supabase.from('organization_members').select('organization_id').eq('user_id', userData.user.id).eq('status', 'active').limit(1).maybeSingle()
    if (!membership) { router.replace('/onboarding'); return }
    setOrgId(membership.organization_id)
    const [{ data: projectData, error: projectError }, { data: siteData, error: siteError }, { data: progressData, error: progressError }] = await Promise.all([
      supabase.from('projects').select('id,name,code').eq('organization_id', membership.organization_id).order('name'),
      supabase.from('project_sites').select('id,project_id,name').eq('organization_id', membership.organization_id).eq('status', 'active').order('name'),
      supabase.from('daily_progress').select('id,project_id,site_id,progress_date,progress_percent,notes,issues,weather,projects(name),project_sites(name),daily_progress_photos(id,daily_progress_id,storage_path,caption,created_at)').eq('organization_id', membership.organization_id).order('progress_date', { ascending: false }).limit(50)
    ])
    if (projectError || siteError || progressError) setError((projectError || siteError || progressError)?.message || 'Unable to load daily progress.')
    const progressWithUrls = await Promise.all((progressData ?? []).map(async (record: Progress) => {
      const recordPhotos = record.daily_progress_photos ?? []
      const signedPhotos = await Promise.all(recordPhotos.map(async photo => {
        const { data } = await supabase.storage.from(BUCKET).createSignedUrl(photo.storage_path, 60 * 60)
        return { ...photo, signedUrl: data?.signedUrl }
      }))
      return { ...record, daily_progress_photos: signedPhotos }
    }))
    setProjects(projectData ?? [])
    setSites(siteData ?? [])
    setRecords(progressWithUrls)
    setLoading(false)
  }

  useEffect(() => { load() }, [router])

  const projectSites = sites.filter(s => s.project_id === form.project_id)

  async function saveProgress(e: FormEvent) {
    e.preventDefault()
    if (!orgId || !form.project_id) { setError('Select a project first.'); return }
    if (!form.notes.trim()) { setError('Add a short note about work completed today.'); return }
    if (photos.some(photo => photo.size > MAX_PHOTO_SIZE)) { setError('Each photo must be 10 MB or smaller.'); return }
    setSaving(true); setError('')
    const supabase = createClient()
    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) { router.replace('/login'); return }

    const { data: progress, error: insertError } = await supabase.from('daily_progress').insert({ organization_id: orgId, project_id: form.project_id, site_id: form.site_id || null, progress_date: form.progress_date, progress_percent: form.progress_percent === '' ? null : Number(form.progress_percent), weather: form.weather.trim() || null, notes: form.notes.trim() || null, issues: form.issues.trim() || null, created_by: userData.user.id }).select('id').single()
    if (insertError || !progress) { setError(insertError?.message || 'Unable to save daily update.'); setSaving(false); return }

    const uploadedPaths: string[] = []
    for (const photo of photos) {
      const safeName = photo.name.replace(/[^a-zA-Z0-9._-]/g, '_')
      const path = `${orgId}/${userData.user.id}/daily-progress/${progress.id}/${crypto.randomUUID()}-${safeName}`
      const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, photo, { contentType: photo.type, upsert: false })
      if (uploadError) {
        await supabase.storage.from(BUCKET).remove(uploadedPaths)
        await supabase.from('daily_progress').delete().eq('id', progress.id)
        setError(uploadError.message)
        setSaving(false)
        return
      }
      uploadedPaths.push(path)
      const { error: photoError } = await supabase.from('daily_progress_photos').insert({ daily_progress_id: progress.id, storage_path: path, caption: null })
      if (photoError) {
        await supabase.storage.from(BUCKET).remove(uploadedPaths)
        await supabase.from('daily_progress').delete().eq('id', progress.id)
        setError(photoError.message)
        setSaving(false)
        return
      }
    }

    setForm({ project_id: '', site_id: '', progress_date: new Date().toISOString().slice(0, 10), progress_percent: '', weather: '', notes: '', issues: '' })
    setPhotos([])
    setShowDetails(false)
    const input = document.getElementById('progress-photos') as HTMLInputElement | null
    if (input) input.value = ''
    await load()
    setSaving(false)
  }

  if (loading) return <main className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500">Loading daily progress...</main>

  return <main className="min-h-screen bg-slate-50 text-slate-900 pb-24 lg:pb-0">
    <header className="border-b border-slate-200 bg-white"><div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 sm:py-4"><div><button onClick={() => router.push('/')} className="text-sm font-bold tracking-widest text-blue-600">BUILDOS</button><p className="text-xs text-slate-500">Daily Progress</p></div><div className="flex gap-3 text-sm"><button onClick={() => router.push('/tasks')} className="text-slate-600 hover:text-slate-900">Tasks</button><button onClick={() => router.push('/projects')} className="text-slate-600 hover:text-slate-900">Projects</button></div></div></header>
    <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-8"><div className="mb-5 sm:mb-6"><p className="text-sm font-medium text-slate-500">Site activity</p><h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Daily Progress</h1><p className="mt-2 text-sm text-slate-500">A quick site update. Add only what matters today.</p></div>
      {error && <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      <div className="grid gap-6 lg:grid-cols-[380px_1fr]"><form id="daily-progress-form" onSubmit={saveProgress} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"><div className="flex items-center justify-between"><div><h2 className="text-lg font-semibold">Today’s update</h2><p className="mt-1 text-xs text-slate-500">Usually takes 1–2 minutes.</p></div><span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">{form.progress_date}</span></div><div className="mt-4 space-y-3">
        <label className="block text-sm font-medium text-slate-700">Project<select required value={form.project_id} onChange={e => setForm({ ...form, project_id: e.target.value, site_id: '' })} className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-slate-900"><option value="">Select project</option>{projects.map(p => <option key={p.id} value={p.id}>{p.name}{p.code ? ` — ${p.code}` : ''}</option>)}</select></label>
        <label className="block text-sm font-medium text-slate-700">Site <span className="font-normal text-slate-400">(optional)</span><select value={form.site_id} onChange={e => setForm({ ...form, site_id: e.target.value })} className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-slate-900"><option value="">No site selected</option>{projectSites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
        <label className="block text-sm font-medium text-slate-700">What was completed today?<textarea required rows={4} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Example: Brickwork completed for first-floor rooms 1–4." className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-3 text-slate-900 placeholder:text-slate-400" /></label>
        <label className="block text-sm font-medium text-slate-700">Site photos <span className="font-normal text-slate-400">(optional)</span><input id="progress-photos" type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={e => setPhotos(Array.from(e.target.files ?? []))} className="mt-1 block w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm text-slate-900 file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm" /></label>
        {photos.length > 0 && <p className="text-xs text-slate-500">{photos.length} photo{photos.length === 1 ? '' : 's'} selected • Maximum 10 MB each</p>}
        <button type="button" onClick={() => setShowDetails(!showDetails)} className="flex w-full items-center justify-between rounded-xl border border-slate-200 px-3 py-3 text-left text-sm font-medium text-slate-700 hover:bg-slate-50"><span>{showDetails ? 'Hide optional details' : 'Add optional details'}</span><span>{showDetails ? '−' : '+'}</span></button>
        {showDetails && <div className="space-y-3 rounded-xl bg-slate-50 p-3"><div className="grid grid-cols-2 gap-3"><label className="block text-sm font-medium text-slate-700">Progress %<input min="0" max="100" type="number" value={form.progress_percent} onChange={e => setForm({ ...form, progress_percent: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-slate-900" /></label><label className="block text-sm font-medium text-slate-700">Weather<input value={form.weather} onChange={e => setForm({ ...form, weather: e.target.value })} placeholder="Sunny" className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-slate-900 placeholder:text-slate-400" /></label></div><label className="block text-sm font-medium text-slate-700">Issues / blockers<textarea rows={3} value={form.issues} onChange={e => setForm({ ...form, issues: e.target.value })} placeholder="Anything the owner or PM should know?" className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-3 text-slate-900 placeholder:text-slate-400" /></label></div>}
        <button disabled={saving} className="hidden w-full rounded-xl bg-blue-600 px-4 py-3.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 lg:block">{saving ? 'Saving update...' : 'Save daily update'}</button></div></form>
        <section className="space-y-3"><div className="flex items-center justify-between"><h2 className="text-lg font-semibold">Recent updates</h2><span className="text-xs text-slate-500">Latest 50</span></div>{records.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">No daily updates yet.</div> : records.map(r => <article key={r.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"><div className="flex items-start justify-between gap-4"><div><h2 className="font-semibold">{r.projects?.name || 'Project'}</h2><p className="mt-1 text-sm text-slate-500">{r.project_sites?.name || 'No site'} • {r.progress_date}</p></div>{r.progress_percent !== null && <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">{r.progress_percent}%</span>}</div>{r.notes && <p className="mt-3 text-sm leading-6 text-slate-700">{r.notes}</p>}{r.issues && <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">Issue: {r.issues}</p>}{r.weather && <p className="mt-2 text-xs text-slate-500">Weather: {r.weather}</p>}{r.daily_progress_photos && r.daily_progress_photos.length > 0 && <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">{r.daily_progress_photos.map(photo => photo.signedUrl ? <a key={photo.id} href={photo.signedUrl} target="_blank" rel="noreferrer" className="group overflow-hidden rounded-lg border border-slate-200 bg-slate-100"><img src={photo.signedUrl} alt="Site progress" className="h-28 w-full object-cover transition group-hover:scale-105" /></a> : null)}</div>}</article>)}</section>
      </div>
    </div>
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 p-3 backdrop-blur lg:hidden"><button type="submit" form="daily-progress-form" disabled={saving} className="w-full rounded-xl bg-blue-600 px-4 py-3.5 text-sm font-semibold text-white shadow-sm disabled:opacity-50">{saving ? 'Saving update...' : 'Save daily update'}</button></div>
  </main>
}
