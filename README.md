# BuildOS

BuildOS is a construction operations platform for small and growing construction businesses.

## Product direction

BuildOS connects projects, site activity, tasks, labour, materials, procurement, expenses, quotations, invoices, payments and reporting so owners can understand what is happening and what needs attention.

The product is being built as a real SaaS product, not a static demo.

## Current architecture

- Next.js + TypeScript + App Router
- Supabase PostgreSQL
- Supabase Auth
- Supabase Storage
- GitHub as source control
- Cloud-first development with GitHub Codespaces

## Customer lifecycle

`Demo → Purchase → Signup → Onboarding → Setup → Test → Go Live → Live`

A new workspace starts in Setup mode with a default seven-day setup period. Customers configure the workspace, import master data, test workflows and train their team. They decide when to go live.

At Go Live:

- Setup/test transactional data is permanently deleted.
- Master and configuration data is retained.
- The operation is performed by a protected database function.
- Go Live events are recorded for auditability.

BuildOS does not archive setup/test transactions.

## Development

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

The application requires these environment variables locally:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

Never put a Supabase secret/service-role key in a `NEXT_PUBLIC_*` variable or browser code.

## Product principles

1. Simple before powerful.
2. Mobile-first for site users.
3. One source of truth per project.
4. Important actions should be traceable.
5. AI assists decisions; it does not invent facts.
6. Build for small contractors first.
7. Keep powerful backend capabilities behind simple user experiences.
