# BuildOS Product Direction

## Purpose

This document records the current product decisions for BuildOS. It is a product and architecture baseline for future implementation work. Existing application behavior should not be changed solely because of this document; changes should be implemented deliberately and tested.

## Product promise

BuildOS makes construction businesses easier to run by connecting site activity, operations, and financial visibility in one simple system.

### Two core user promises

- **Site team:** Update work quickly.
- **Business owner/CEO:** Know what is happening and what needs attention.

## Customer journey

BuildOS is primarily sales-led:

1. Marketing website
2. Request demo
3. BuildOS team demonstrates the product
4. Customer decides to purchase
5. Customer signs up / account is activated
6. Customer completes onboarding
7. Workspace enters Setup Mode
8. Customer configures, imports, explores and tests
9. Customer goes live when ready
10. Workspace becomes Live Mode
11. Customer receives ongoing help/support

The existing Signup and Onboarding flow remains in place.

## Setup & Configuration Mode

After onboarding, the customer can configure and test the workspace before production use.

The experience should feel like setting up the customer's business, not completing a large software implementation project.

Configuration should be progressively introduced as needed rather than forcing the customer through unnecessary configuration screens.

### Default setup period

- Default Setup Mode period: **7 days** from signup/setup activation.
- The customer should be able to request an extension when more time is required.
- Expiry must not automatically make the workspace Live.
- Expiry should limit or stop setup/test activity according to the final product rules and provide a clear path to request an extension or assistance.

## Testing

Customers should be able to use the actual BuildOS workflows during Setup Mode.

Important workflows include:

- Projects
- Daily Progress
- Tasks
- Labour
- Materials
- Procurement
- Expenses
- Quotations
- Invoices
- Payments
- Reports

BuildOS may provide sample/demo data so a customer can understand the workflow before entering real business information.

## Go Live

Go Live is a controlled business operation, not a simple delete action.

When the customer is ready:

1. Customer selects **Go Live**.
2. BuildOS displays a clear confirmation and summary.
3. BuildOS validates the workspace.
4. Configuration/master data is preserved.
5. Test activity is identified and handled safely.
6. The workspace changes from Setup Mode to Live Mode.
7. The Go Live action is recorded in the audit trail.

### Data safety principles

- Never blindly delete all data created during Setup Mode.
- Configuration and master data must be preserved.
- Test/transactional data must be distinguishable from production data.
- Where practical, test data should be archived before permanent deletion so accidental cleanup can be recovered during a defined retention period.
- The customer should not be asked to manually identify and delete individual test transactions.
- Real production data must never be removed accidentally because of the Go Live process.

The exact database transition and cleanup mechanism must be designed and reviewed before implementing the Go Live feature.

## Data import

BuildOS should reduce manual master-data entry through import templates.

Import should support relevant master data such as:

- Materials
- Vendors
- Customers
- Labour/workers
- Projects where appropriate
- Other supported master data

The preferred import workflow is:

1. Download BuildOS template.
2. Customer fills the template.
3. Upload file.
4. BuildOS validates the file.
5. Show valid and invalid records.
6. Provide actionable error information.
7. Customer fixes errors if required.
8. Customer confirms import.
9. BuildOS imports the valid data.

## Mobile

BuildOS will support both web/desktop and mobile experiences using the same core product data and business rules.

### Desktop/web focus

- Business owners/CEOs
- Management
- Project managers
- Accounts/commercial users
- Administration
- Configuration and deeper management workflows

### Mobile focus

- Site engineers
- Site supervisors
- Project managers
- Field teams

Mobile should prioritize fast site actions such as:

- Daily Progress
- Photos
- Tasks
- Labour
- Materials
- Expenses
- Issues
- Notifications

### Connectivity

BuildOS requires an internet connection. Offline working is not part of the current product scope.

When connectivity is unavailable, the application should show a clear message such as:

> No internet connection. BuildOS requires an internet connection to continue. Please reconnect and try again.

No offline database, offline queue, or synchronization engine should be built unless the product scope is explicitly changed in the future.

## Help & customer enablement

BuildOS should provide three levels of assistance:

1. **In-product guidance** — contextual explanations and links to relevant help.
2. **BuildOS Help Center** — complete step-by-step user and configuration documentation.
3. **Human support** — implementation/support team for issues that require assistance.

### Help Center structure

- Getting Started
- How to Use BuildOS
- Configuration Guide
- Troubleshooting
- FAQs
- Go Live Guide

Articles should generally explain what the feature does, when to use it, step-by-step instructions, examples, and common problems.

## Customer and organization model

BuildOS is multi-tenant.

One customer organization may contain multiple branches, users and projects.

Conceptually:

```text
BuildOS
  ├── Organization A
  │    ├── Branch 1
  │    ├── Branch 2
  │    └── Branch 3
  ├── Organization B
  └── Organization C
```

Customer access should be controlled using authenticated user identity, organization membership, roles/permissions, and applicable branch/project access. Client codes are identifiers and must not be treated as the security boundary.

BuildOS internal staff roles should remain separate from customer organization roles.

## Customer CEO value

The CEO/business-owner experience should answer:

- What is happening across my projects?
- Which projects need attention?
- Where is money being spent?
- What is delayed or at risk?
- What payments are outstanding?
- How are projects performing financially?

The product should not merely display data; it should make important business attention and decisions easier to see.

## Site adoption principle

The site workflow must minimize data-entry burden and should not feel like administrative work.

A normal daily update should aim to be very fast and should avoid unnecessary mandatory fields. The product should guide the user through the minimum information needed for the workflow.

## Scope discipline

BuildOS will continue to prioritize important MVP/product features that directly support:

- Site execution
- Project management
- Materials and procurement
- Commercial/financial operations
- Business-owner visibility
- Customer usability and support

Advanced future capabilities such as advanced AI, computer vision, drone integration, full ERP/accounting replacement, advanced BIM/digital twins, and marketplace capabilities remain outside the current MVP scope unless explicitly brought forward by validated customer needs.

## Operational requirements to preserve as the product matures

- Tenant data isolation
- Role/permission enforcement
- Branch/project access control
- Auditability of important business actions
- Secure document/photo storage
- Database and file backups
- Recovery procedures
- Data export capability
- Customer support workflow
- BuildOS subscription billing kept separate from a customer's construction invoices/payments
- Quality assurance and customer UAT before production releases where appropriate

## Product decision summary

The intended experience is:

**See it → understand it → purchase → sign up → onboard → configure → test → go live → use BuildOS.**

BuildOS should be powerful enough for serious construction operations while remaining simple enough that customers and site teams do not feel they are taking on another administrative burden.
