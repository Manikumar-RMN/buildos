# BuildOS Workspace Lifecycle Architecture

## Status

Design baseline for implementation. The database lifecycle foundation has been created in Supabase. Go Live data cleanup is intentionally **not** implemented yet.

## 1. Workspace states

A customer workspace has one lifecycle state:

```text
SETUP → LIVE
  │
  ├──→ EXPIRED
  │
  └──→ SUSPENDED
```

### SETUP

Customer can configure the workspace and test BuildOS workflows.

Default setup window: 7 days from setup start.

### LIVE

Customer is operating BuildOS with production business data.

### EXPIRED

The setup period has ended without Go Live. The workspace does not automatically become Live.

The UI should provide a clear extension/support path. Exact restrictions are a product decision to implement after the lifecycle foundation.

### SUSPENDED

Administrative state for cases such as subscription, compliance, or operational suspension. This is distinct from setup expiry.

## 2. Database foundation

`workspace_lifecycle` is the single source of truth for the organization lifecycle state.

Key fields:

- `organization_id` — one lifecycle record per organization.
- `mode` — setup, live, expired, or suspended.
- `setup_started_at` — start of the setup period.
- `setup_expires_at` — current setup expiry timestamp.
- `go_live_at` — timestamp when the workspace became Live.
- `go_live_by` — authenticated user who completed Go Live.
- `updated_at` — lifecycle record update timestamp.

`workspace_lifecycle_events` provides the lifecycle audit trail.

Recorded event types include:

- setup_started
- setup_extended
- setup_expired
- go_live_requested
- go_live_completed
- go_live_failed
- suspended
- reactivated

## 3. Why lifecycle is separate from business tables

Do not add a generic `setup_mode` column to every BuildOS table merely to represent the workspace state.

The lifecycle state belongs to the organization/workspace. Business records need a separate strategy for identifying test versus production data when that becomes necessary.

This separation keeps lifecycle management centralized and prevents business tables from becoming tightly coupled to the onboarding state machine.

## 4. Test data strategy — not yet implemented

The critical unresolved implementation decision is how BuildOS identifies transactional records created during customer testing.

The preferred design direction is explicit provenance, rather than assuming that everything created before Go Live is disposable.

Before implementing Go Live cleanup, evaluate these approaches:

1. **Record-level provenance** — mark supported transactional records as setup/test data at creation time.
2. **Setup session/batch provenance** — associate records with a setup session or test batch.
3. **Explicit production declaration** — allow the customer to identify real production projects/data before Go Live.

The final approach must protect configuration and master data and must not accidentally delete real customer data.

## 5. Go Live transaction boundary

Go Live should be a controlled server-side operation.

Conceptually:

```text
Customer clicks Go Live
        ↓
Validate workspace
        ↓
Show Go Live summary
        ↓
Customer confirms
        ↓
Create go-live request/event
        ↓
Perform controlled data transition
        ↓
Preserve configuration/master data
        ↓
Archive/remove eligible test transactions
        ↓
Set lifecycle = LIVE
        ↓
Record completion in audit log
```

If any critical step fails, the operation must not report success.

The final implementation should use a database transaction or an equivalent idempotent server-side workflow so that a partial transition cannot silently leave the workspace in an ambiguous state.

## 6. Safety requirements

Go Live must:

- Never blindly delete all pre-Go-Live records.
- Preserve organization and branch configuration.
- Preserve supported master data.
- Protect linked financial records.
- Be auditable.
- Be repeat-safe/idempotent.
- Require explicit customer confirmation.
- Provide a clear summary before execution.
- Have a recovery/retention strategy for removed test data where practical.
- Never depend on the browser alone for authorization or data cleanup.

## 7. Current RLS/security observation

The current Supabase schema already uses organization, branch, and project access controls. The lifecycle tables also have RLS.

Before production use, the full RLS matrix must be audited across all parent and child tables. In particular, child transactional tables must inherit the correct organization/project access through their parent records rather than relying on broad organization membership alone.

This audit is a prerequisite for calling the security model production-ready.

## 8. Relationship to onboarding

The current Signup + Onboarding flow remains unchanged by this architecture.

After onboarding creates the organization, the database initializes its workspace lifecycle as `setup` with a default seven-day expiry.

The customer then proceeds into Setup Mode.

## 9. Future extension handling

An extension should update `setup_expires_at` and create a `setup_extended` lifecycle event containing appropriate metadata.

Extensions should be controlled by authorized users/support workflows and should remain auditable.

## 10. Implementation order

The recommended implementation sequence is:

1. Lifecycle foundation — **completed**.
2. Audit the existing RLS model — next.
3. Define test-data provenance for supported transactional tables.
4. Define setup expiry behavior in the application.
5. Build Setup Mode UI.
6. Build Go Live preflight/summary screen.
7. Implement server-side Go Live operation.
8. Add recovery/retention handling.
9. Add automated tests for cross-tenant isolation and Go Live safety.
10. Run customer UAT before production use.

Do not skip from step 1 directly to deleting test data.
