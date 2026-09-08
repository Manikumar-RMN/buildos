'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

type Article = { category: string; title: string; summary: string; steps: string[]; href?: string }

const articles: Article[] = [
  { category: 'Getting started', title: 'How BuildOS setup works', summary: 'Understand the 7-day setup period before Go Live.', steps: ['Review your workspace configuration.', 'Import existing customers, vendors, workers and materials if needed.', 'Create a real project and connect its site.', 'Test daily progress, tasks, labour, materials and commercial workflows.', 'When your team is confident, return to Setup and choose Go Live.'], href: '/setup' },
  { category: 'Getting started', title: 'Import your master data', summary: 'Move existing master data into BuildOS using CSV templates.', steps: ['Open Master Data Import from Setup.', 'Choose Customers, Vendors, Workers or Materials.', 'Download the matching template.', 'Fill the required columns and save as CSV.', 'Upload the file and fix any validation errors.', 'Import only after every row is marked Ready.'], href: '/import' },
  { category: 'Getting started', title: 'Prepare for Go Live', summary: 'A simple checklist for testing BuildOS before production use.', steps: ['Make sure your project and site are ready.', 'Create sample setup transactions and test the workflows your team will use.', 'Train the people who will use BuildOS at the site and office.', 'Review the Setup Progress checklist.', 'Only the workspace Owner should complete Go Live.'], href: '/setup/progress' },
  { category: 'Site & projects', title: 'Daily progress', summary: 'Record what happened at the site without unnecessary data entry.', steps: ['Open Daily Progress for the project site.', 'Add the work completed and relevant notes.', 'Record labour or material activity when needed.', 'Attach photos when they help explain progress.', 'Save the update so the project record stays current.'], href: '/daily-progress' },
  { category: 'Site & projects', title: 'Tasks and project sites', summary: 'Keep site work connected to the right project.', steps: ['Create the project first.', 'Add or connect its project site.', 'Create tasks and assign them to the responsible team member.', 'Update task status as work progresses.'], href: '/tasks' },
  { category: 'Commercial', title: 'Expenses, procurement and invoices', summary: 'Keep operational activity connected to commercial visibility.', steps: ['Record project expenses as they occur.', 'Create procurement records when materials need to be purchased.', 'Record receipts against purchase orders where applicable.', 'Create invoices and record payments separately from BuildOS subscription billing.', 'Use Reports to review project and commercial information.'], href: '/reports' },
  { category: 'Troubleshooting', title: 'I cannot continue during setup', summary: 'What to do when your setup period has expired.', steps: ['Check the Setup page for the current workspace status.', 'If setup has expired, request an extension with the number of days you need.', 'Add a short reason so the implementation or platform team understands the request.', 'Wait for the request to be reviewed before continuing setup.'], href: '/setup' },
]

export default function HelpPage() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('All')
  const [selected, setSelected] = useState<Article | null>(null)

  const categories = ['All', ...Array.from(new Set(articles.map(article => article.category)))]
  const filtered = useMemo(() => articles.filter(article => {
    const matchesCategory = category === 'All' || article.category === category
    const text = `${article.title} ${article.summary} ${article.steps.join(' ')}`.toLowerCase()
    return matchesCategory && text.includes(query.toLowerCase().trim())
  }), [category, query])

  return <main className="min-h-screen bg-slate-50 text-slate-900">
    <header className="border-b border-slate-200 bg-white"><div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4"><div><div className="text-sm font-bold tracking-widest text-blue-600">BUILDOS</div><div className="text-xs text-slate-500">Help Center</div></div><button onClick={() => router.back()} className="text-sm font-medium text-slate-600 hover:text-slate-900">Back</button></div></header>
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="max-w-3xl"><p className="text-sm font-medium text-blue-600">BuildOS Help Center</p><h1 className="mt-1 text-3xl font-bold tracking-tight">Find the answer before you need support.</h1><p className="mt-2 text-slate-600">Learn how to configure, test and use BuildOS across the site and office.</p></div>
      <div className="mt-7 flex flex-col gap-3 md:flex-row"><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search help articles..." className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-blue-500"/><select value={category} onChange={e => setCategory(e.target.value)} className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 md:w-56">{categories.map(item => <option key={item}>{item}</option>)}</select></div>
      <div className="mt-8 grid gap-4 md:grid-cols-2">{filtered.map(article => <button key={article.title} onClick={() => setSelected(article)} className="rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-blue-200 hover:shadow"><p className="text-xs font-semibold uppercase tracking-wide text-blue-600">{article.category}</p><h2 className="mt-2 font-semibold">{article.title}</h2><p className="mt-1 text-sm text-slate-500">{article.summary}</p><span className="mt-4 inline-block text-sm font-semibold text-slate-700">Read article →</span></button>)}</div>
      {!filtered.length && <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">No help articles match your search. Try a different phrase.</div>}
      <div className="mt-10 rounded-2xl border border-blue-200 bg-blue-50 p-5"><h2 className="font-semibold">Need help with your workspace?</h2><p className="mt-1 text-sm text-slate-600">If an issue cannot be resolved from the Help Center, contact your BuildOS implementation or support team.</p></div>
    </div>
    {selected && <div className="fixed inset-0 z-50 bg-slate-900/40 p-4 md:p-10" onClick={() => setSelected(null)}><div className="mx-auto max-h-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl" onClick={e => e.stopPropagation()}><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-wide text-blue-600">{selected.category}</p><h2 className="mt-1 text-2xl font-bold">{selected.title}</h2></div><button onClick={() => setSelected(null)} className="rounded-lg px-3 py-1 text-slate-500 hover:bg-slate-100">Close</button></div><p className="mt-4 text-sm text-slate-600">{selected.summary}</p><ol className="mt-5 space-y-3">{selected.steps.map((step, index) => <li key={step} className="flex gap-3 text-sm"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-blue-700">{index + 1}</span><span>{step}</span></li>)}</ol>{selected.href && <button onClick={() => router.push(selected.href)} className="mt-6 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white">Open this area</button>}</div></div>}
  </main>
}
