# BuildOS Go Live Verification Test Plan

## Purpose
Verify that a customer workspace can move from Setup to Live without losing configuration/master data and without retaining setup/test transactions.

## Preconditions
- Use a dedicated test organization.
- Confirm the workspace is in `setup` mode.
- Confirm the workspace has at least one active branch.
- Do not use a real customer workspace for this test.

## Test data
Create representative setup data across:
- Customer
- Vendor
- Worker
- Material
- Project
- Project site
- Task
- Daily progress + photo
- Expense
- Material request
- Material transaction
- Vendor quotation
- Purchase order
- Goods receipt
- Quotation
- Invoice
- Payment
- Document

The transaction records should be created while the workspace is in Setup so the database marks them as `is_setup_data = true`.

## Verification sequence
1. Open Setup Progress and confirm the workspace is in Setup mode.
2. Create/import master and configuration data.
3. Create representative setup/test transactions.
4. Confirm setup transactions are marked `is_setup_data = true`.
5. Start Go Live as the Owner/Admin.
6. Confirm the RPC completes successfully and lifecycle mode becomes `live`.
7. Confirm organization, branch, customer, vendor, worker, material, project and project-site records remain.
8. Confirm setup transactions listed above are removed.
9. Confirm child line items/photos linked to deleted setup transactions are removed by their foreign-key cascades.
10. Confirm no unrelated records from another organization are affected.
11. Confirm a second Go Live attempt is rejected because the workspace is already Live.
12. Confirm the lifecycle event log contains `go_live_requested` and `go_live_completed` with deletion counts.

## Expiry verification
1. Use a dedicated test organization.
2. Set its setup expiry to a past timestamp in a controlled test database.
3. Attempt Go Live.
4. Confirm the workspace becomes `expired` and Go Live is rejected.
5. Request a setup extension.
6. Approve the extension as an authorized reviewer.
7. Confirm the workspace returns to `setup` with a new expiry.
8. Confirm Go Live can then proceed.

## Failure safety
- Force a controlled failure before lifecycle activation.
- Confirm the transaction rolls back rather than leaving a partially Live workspace.
- Confirm `go_live_failed` is recorded when the failure is raised after the lifecycle event has started.

## Storage follow-up
Database deletion of setup documents/progress photos does not by itself remove Supabase Storage objects. Storage cleanup must be implemented and tested separately before Go Live cleanup is considered production-complete.

## Acceptance criteria
Go Live is production-ready only when the complete sequence passes in a dedicated test environment and storage cleanup has also been verified.
