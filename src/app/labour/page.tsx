'use client'

import { FormEvent, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/browser'

type Project = { id: string; name: string }
type Worker = { id: string; name: string; role: string | null; worker_type: string | null; daily_rate: number | null }
type Attendance = { id: string; worker_id: string; project_id: string; attendance_date: string; status: string; hours_worked: number | null; notes: string | null; workers: { name: string } | null; projects: { name: string } | null }

export default function LabourPage() {
  const router = useRouter()
  const [workers, setWorkers] = useState<Worker[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [attendance, setAttendance] = useState<Attendance[]>([])
  const [orgId, setOrgId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ worker_id: '', project_id: '', attendance_date: new Date().toISOString().slice(0, 10), status: 'present', hours_worked: '8', notes: '' })

  async function load() {
    const supabase = createClient()
    const { data: membership } = await supabase.from('organization_members').select('organization_id').eq('status', 'active').limit(1).maybeSingle()
    if (!membership) { router.replace('/onboarding'); return }
    setOrgId(membership.organization_id)
    const [{ data: workerData, error: workerError }, { data: projectData, error: projectError }, { data: attendanceData, error: attendanceError }] = await Promise.all([
      supabase.from('workers').select('id,name,role,worker_type,daily_rate').eq('organization_id', membership.organization_id).order('name'),
      supabase.from('projects').select('id,name').eq('organization_id', membership.organization_id).order('name'),
      supabase.from('attendance').select('id,worker_id,project_id,attendance_date,status,hours_worked,notes,workers(name),projects(name)').eq('organization_id', membership.organization_id).order('attendance_date', { ascending: false }).limit(50)
    ])
    if (workerError || projectError || attendanceError) setError((workerError || projectError || attendanceError)?.message || 'Unable to load labour data.')
    setWorkers(workerData ?? []); setProjects(projectData ?? []); setAttendance((attendanceData ?? []) as Attendance[]); setLoading(false)
  }

  useEffect(() => { createClient().auth.getUser().then(({ data }) => { if (!data.user) router.replace('/login'); else load() }) }, [router])

  async function saveAttendance(e: FormEvent) {
    e.preventDefault()
    if (!orgId || !form.worker_id || !form.project_id) { setError('Select a worker and project first.'); return }
    setSaving(true); setError('')
    const supabase = createClient()
    const { error: insertError } = await supabase.from('attendance').insert({ organization_id: orgId, worker_id: form.worker_id, project_id: form.project_id, attendance_date: form.attendance_date, status: form.status, hours_worked: form.hours_worked === '' ? null : Number(form.hours_worked), notes: form.notes.trim() || null })
    if (insertError) setError(insertError.message)
    else { setForm({ ...form, worker_id: '', project_id: '', notes: '' }); await load() }
    setSaving(false)
  }

  if (loading) return <main className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500">Loading labour...</main>
  return <main className="min-h-screen bg-slate-50 text-slate-900"><header className="border-b border-slate-200 bg-white"><div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4"><div><button onClick={() => router.push('/')} className="text-sm font-bold tracking-widest text-blue-600">BUILDOS</button><p className="text-xs text-slate-500">Labour & Team</p></div><button onClick={() => router.push('/daily-progress')} className="text-sm text-slate-600 hover:text-slate-900">Daily Progress</button></div></header><div className="mx-auto max-w-7xl px-6 py-8"><div className="mb-6"><p className="text-sm font-medium text-slate-500">People & attendance</p><h1 className="mt-1 text-3xl font-bold tracking-tight">Labour & Team</h1><p className="mt-2 text-sm text-slate-500">Record who worked, where they worked and the hours spent.</p></div>{error && <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}<div className="grid gap-6 lg:grid-cols-[380px_1fr]"><form onSubmit={saveAttendance} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-lg font-semibold">Record attendance</h2><div className="mt-4 space-y-3"><label className="block text-sm font-medium text-slate-700">Worker<select required value={form.worker_id} onChange={e => setForm({ ...form, worker_id: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900"><option value="">Select worker</option>{workers.map(w => <option key={w.id} value={w.id}>{w.name}{w.role ? ` — ${w.role}` : ''}</option>)}</select></label><label className="block text-sm font-medium text-slate-700">Project<select required value={form.project_id} onChange={e => setForm({ ...form, project_id: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900"><option value="">Select project</option>{projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label><div className="grid grid-cols-2 gap-3"><label className="block text-sm font-medium text-slate-700">Date<input required type="date" value={form.attendance_date} onChange={e => setForm({ ...form, attendance_date: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900" /></label><label className="block text-sm font-medium text-slate-700">Hours<input type="number" min="0" max="24" step="0.5" value={form.hours_worked} onChange={e => setForm({ ...form, hours_worked: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900" /></label></div><label className="block text-sm font-medium text-slate-700">Status<select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900"><option value="present">Present</option><option value="absent">Absent</option><option value="half_day">Half day</option><option value="leave">Leave</option></select></label><label className="block text-sm font-medium text-slate-700">Notes<textarea rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900" /></label><button disabled={saving} className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">{saving ? 'Saving...' : 'Save attendance'}</button></div></form><section className="space-y-3">{attendance.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">No attendance records yet.</div> : attendance.map(a => <article key={a.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-start justify-between gap-4"><div><h2 className="font-semibold">{a.workers?.name || 'Worker'}</h2><p className="mt-1 text-sm text-slate-500">{a.projects?.name || 'Project'} • {a.attendance_date}</p></div><span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">{a.status}</span></div><p className="mt-3 text-sm text-slate-600">{a.hours_worked ?? 0} hours{a.notes ? ` • ${a.notes}` : ''}</p></article>)}</section></div></div></main>
}
