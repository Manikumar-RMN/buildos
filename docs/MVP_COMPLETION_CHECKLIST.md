# BuildOS MVP Completion Checklist

This is the engineering control list for the first real BuildOS MVP. A feature is not considered complete merely because a screen exists; it must have data, authorization, validation, error handling, responsive UX, documentation, and test coverage before release.

## 1. Foundation

- [x] Next.js + TypeScript App Router
- [x] Supabase PostgreSQL
- [x] Supabase Auth foundation
- [x] Supabase Storage foundation
- [x] Organization/branch tenancy foundation
- [x] Role/permission tables
- [x] RLS enabled across public tables
- [x] Branch/project access helpers
- [x] Setup/Live workspace lifecycle
- [x] Seven-day setup expiry enforcement
- [x] Setup transaction markers
- [x] Protected Go Live operation
- [x] Go Live audit events
- [x] Child-record RLS hardening
- [ ] Storage-object cleanup policy
- [ ] Export/backup/recovery runbook
- [ ] Final automated security tests

## 2. Authentication & onboarding

- [x] Signup
- [x] Login
- [x] Password validation
- [x] Authenticated onboarding
- [x] Organization creation
- [x] Branch creation
- [ ] Email verification UX refinement
- [ ] Password reset
- [ ] Session expiry/error handling
- [ ] Invitation flow

## 3. Setup & configuration

- [x] Setup workspace lifecycle
- [x] Setup expiry backend enforcement
- [x] Go Live backend cleanup
- [x] Go Live confirmation UX
- [ ] Setup checklist
- [ ] Master import templates
- [ ] Upload → validate → preview → import flow
- [ ] Import error report
- [ ] Sample/demo workspace
- [ ] Go Live readiness checks
- [ ] Expired workspace UI
- [ ] Extension request flow

## 4. Construction MVP

- [ ] Dashboard with live data
- [ ] Customers
- [ ] Projects
- [ ] Project sites
- [ ] Project members
- [ ] Tasks
- [ ] Task dependencies
- [ ] Daily progress
- [ ] Daily progress photos
- [ ] Labour/workers
- [ ] Attendance
- [ ] Labour allocations
- [ ] Materials
- [ ] Project materials
- [ ] Material transactions
- [ ] Material requests
- [ ] Vendors
- [ ] Vendor quotations
- [ ] Purchase orders
- [ ] Goods receipts
- [ ] Expense categories
- [ ] Expenses
- [ ] Customer quotations
- [ ] Quotation revisions
- [ ] Invoices
- [ ] Invoice items
- [ ] Payments
- [ ] Documents
- [ ] Notifications
- [ ] Core reports

## 5. UX requirements

- [ ] Desktop application shell
- [ ] Mobile navigation
- [ ] Mobile-first daily progress workflow
- [ ] Owner/CEO attention view
- [ ] Project overview
- [ ] Consistent empty states
- [ ] Consistent loading states
- [ ] Consistent error states
- [ ] No-internet messaging
- [ ] Confirmation for destructive actions
- [ ] Permission-aware navigation
- [ ] Help/in-product guidance

## 6. Production readiness

- [ ] Automated unit/integration tests
- [ ] RLS tenant-isolation tests
- [ ] Go Live cleanup integration test
- [ ] Authentication tests
- [ ] Import validation tests
- [ ] Mobile responsive test pass
- [ ] Accessibility pass
- [ ] Performance pass
- [ ] CI build/lint/typecheck
- [ ] Production environment configuration
- [ ] Deployment
- [ ] Monitoring/error reporting
- [ ] Release checklist

## Release gate

BuildOS MVP is ready for customer testing only when every item required for the agreed MVP has moved from `[ ]` to `[x]`, and the final end-to-end test passes:

`Signup → Onboarding → Setup → Configure → Import → Test → Go Live → cleanup → Live`
