'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/browser'

type ImportType = 'customers' | 'vendors' | 'workers' | 'materials'
type Row = Record<string, string>

const definitions: Record<ImportType, { title: string; description: string; columns: string[]; sample: string }> = {
  customers: { title: 'Customers', description: 'Import customer masters before creating projects and quotations.', columns: ['name', 'phone', 'email'], sample: 'ABC Builders,9876543210,accounts@example.com' },
  vendors: { title: 'Vendors', description: 'Import suppliers and service vendors used for procurement.', columns: ['name', 'phone', 'email'], sample: 'Sample Supplier,9876543210,sales@example.com' },
  workers: { title: 'Workers', description: 'Import workers who can be assigned to site teams and labour records.', columns: ['name', 'phone', 'role'], sample: 'Ravi Kumar,9876543210,Mason' },
  materials: { title: 'Materials', description: 'Import the materials used across your projects.', columns: ['name', 'unit', 'category'], sample: 'Cement,bag,Construction' },
}

function parseCsv(text: string): Row[] {
  const rows: string[][] = []
  let row: string[] = []
  let value = ''
  let quoted = false

  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    const next = text[i + 1]
    if (char === '"') {
      if (quoted && next === '"') { value += '"'; i++ }
      else quoted = !quoted
    } else if (char === ',' && !quoted) {
      row.push(value.trim()); value = ''
    } else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && next === '\n') i++
      row.push(value.trim()); value = ''
      if (row.some(cell => cell !== '')) rows.push(row)
      row = []
    } else value += char
  }
  if (value || row.length) {
    row.push(value.trim())
    if (row.some(cell => cell !== '')) rows.push(row)
  }
  if (rows.length < 2) return []

  const headers = rows[0].map(h => h.trim().toLowerCase())
  if (headers.some(Boolean) === false || new Set(headers).size !== headers.length) return []
  return rows.slice(1).map(values => Object.fromEntries(headers.map((header, index) => [header, (values[index] ?? '').trim()])))
}

function validateRow(row: Row, columns: string[]) {
  const missing = columns.filter(column => !row[column])
  const errors = [...missing.map(column => `${column} is required`)]
  if (row.email && !/^\S+@\S+\.\S+$/.test(row.email)) errors.push('email is not valid')
  return { missing, errors, valid: errors.length === 0 }
}

export default function ImportPage() {
  const router = useRouter()
  const [type, setType] = useState<ImportType>('customers')
  const [rows, setRows] = useState<Row[]>([])
  const [fileName, setFileName] = useState('')
  const [error, setError] = useState('')
  const [result, setResult] = useState<{ imported?: number } | null>(null)
  const [step, setStep] = useState<'upload' | 'preview'>('upload')
  const [importing, setImporting] = useState(false)

  const definition = definitions[type]
  const validation = useMemo(() => rows.map((row, index) => ({ index: index + 2, ...validateRow(row, definition.columns) })), [rows, definition])
  const validRows = validation.filter(row => row.valid).length
  const invalidRows = validation.length - validRows

  function changeType(value: ImportType) {
    setType(value); setRows([]); setFileName(''); setError(''); setResult(null); setStep('upload')
  }

  function handleFile(file: File | undefined) {
    if (!file) return
    setError(''); setResult(null); setFileName(file.name)
    if (!file.name.toLowerCase().endsWith('.csv')) { setError('Please upload a CSV file.'); return }
    const reader = new FileReader()
    reader.onload = () => {
      const parsed = parseCsv(String(reader.result ?? ''))
      if (!parsed.length) { setError('Could not read the CSV. Check that it has a unique header row and at least one data row.'); setRows([]); return }
      setRows(parsed); setStep('preview')
    }
    reader.onerror = () => setError('Could not read this file. Please try again.')
    reader.readAsText(file)
  }

  function downloadTemplate() {
    const csv = `${definition.columns.join(',')}\n${definition.sample}\n`
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    const link = document.createElement('a'); link.href = url; link.download = `buildos-${type}-template.csv`; link.click(); URL.revokeObjectURL(url)
  }

  async function runImport() {
    if (!rows.length || invalidRows > 0 || importing) return
    setImporting(true); setError(''); setResult(null)
    const supabase = createClient()
    const functionName = `import_${type}` as 'import_customers' | 'import_vendors' | 'import_workers' | 'import_materials'
    const { data, error: rpcError } = await supabase.rpc(functionName, { p_rows: rows })
    if (rpcError) setError(rpcError.message)
    else { setResult({ imported: data?.imported ?? 0 }); setRows([]); setStep('upload'); setFileName('') }
    setImporting(false)
  }

  return <main className="min-h-screen bg-slate-50 text-slate-900">
    <header className="border-b border-slate-200 bg-white"><div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4"><div><div className="text-sm font-bold tracking-widest text-blue-600">BUILDOS</div><div className="text-xs text-slate-500">Master data import</div></div><button onClick={() => router.push('/setup')} className="text-sm font-medium text-slate-600 hover:text-slate-900">Back to setup</button></div></header>
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-8"><h1 className="text-3xl font-bold tracking-tight">Import your masters</h1><p className="mt-2 max-w-2xl text-slate-600">Upload a CSV, validate it, preview the result, then import.</p></div>
      <div className="mb-6 flex items-center gap-2 text-sm"><span className={`rounded-full px-3 py-1 font-semibold ${step === 'upload' ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-700'}`}>1 Upload</span><span className="text-slate-300">→</span><span className={`rounded-full px-3 py-1 font-semibold ${step === 'preview' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}>2 Validate & Preview</span><span className="text-slate-300">→</span><span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-500">3 Import</span></div>
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid gap-5 md:grid-cols-[220px_1fr]">
          <div><label className="text-sm font-semibold text-slate-700">Master type<select value={type} onChange={e => changeType(e.target.value as ImportType)} className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900"><option value="customers">Customers</option><option value="vendors">Vendors</option><option value="workers">Workers</option><option value="materials">Materials</option></select></label></div>
          <div><h2 className="font-semibold">{definition.title}</h2><p className="mt-1 text-sm text-slate-500">{definition.description}</p><div className="mt-4 flex flex-wrap gap-2">{definition.columns.map(column => <span key={column} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">{column}</span>)}</div></div>
        </div>
        <div className="mt-7 flex flex-col gap-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-semibold">{fileName || 'Choose a CSV file'}</p><p className="mt-1 text-sm text-slate-500">Required columns: {definition.columns.join(', ')}</p></div><div className="flex gap-2"><button onClick={downloadTemplate} className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700">Download template</button><label className="cursor-pointer rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">Choose CSV<input type="file" accept=".csv,text/csv" className="hidden" onChange={e => handleFile(e.target.files?.[0])} /></label></div></div>
        {error && <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
        {result && <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">Successfully imported {result.imported} {definition.title.toLowerCase()}.</div>}
        {step === 'preview' && <div className="mt-7"><div className="flex flex-wrap gap-3 text-sm"><span className="rounded-lg bg-emerald-50 px-3 py-2 font-semibold text-emerald-700">{validRows} valid</span><span className={`rounded-lg px-3 py-2 font-semibold ${invalidRows ? 'bg-red-50 text-red-700' : 'bg-slate-100 text-slate-600'}`}>{invalidRows} with errors</span><span className="rounded-lg bg-slate-100 px-3 py-2 font-semibold text-slate-600">{rows.length} total</span></div><div className="mt-4 overflow-x-auto rounded-xl border border-slate-200"><table className="min-w-full text-left text-sm"><thead className="bg-slate-50"><tr><th className="px-4 py-3 font-semibold text-slate-600">Row</th>{definition.columns.map(column => <th key={column} className="px-4 py-3 font-semibold text-slate-600">{column}</th>)}<th className="px-4 py-3 font-semibold text-slate-600">Validation</th></tr></thead><tbody>{rows.slice(0, 50).map((row, i) => { const r = validation[i]; return <tr key={i} className="border-t border-slate-100"><td className="px-4 py-3 text-slate-400">{r.index}</td>{definition.columns.map(column => <td key={column} className="px-4 py-3">{row[column] || '—'}</td>)}<td className="px-4 py-3">{r.valid ? <span className="text-emerald-700">Ready</span> : <span className="text-red-700">{r.errors.join('; ')}</span>}</td></tr> })}</tbody></table></div>{rows.length > 50 && <p className="mt-2 text-xs text-slate-500">Showing first 50 rows in the preview. Validation covers all uploaded rows.</p>}<div className="mt-5 flex justify-end"><button disabled={!rows.length || invalidRows > 0 || importing} onClick={runImport} className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40">{importing ? 'Importing...' : `Import ${validRows} ${definition.title.toLowerCase()}`}</button></div></div>}
      </div>
      <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-800"><strong>Safety:</strong> every import is validated in the browser and again on the server. Duplicate and business rules are enforced by the database function before records are created.</div>
    </div>
  </main>
}
