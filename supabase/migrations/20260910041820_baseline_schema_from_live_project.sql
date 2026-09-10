-- BuildOS baseline schema, reconstructed from the live Supabase project
-- on 2026-09-10 to restore version control over the database.
-- Safe to run on a fresh Supabase project; uses IF NOT EXISTS / OR REPLACE.

-- 1) TABLES + FOREIGN KEYS + RLS ENABLE
-- ============================================================
-- BuildOS baseline schema (reconstructed from live Supabase project)
-- Generated as part of restoring version control over the database.
-- ============================================================

CREATE TABLE IF NOT EXISTS public."organizations" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "name" text NOT NULL,
  "industry" text DEFAULT 'Construction'::text NOT NULL,
  "timezone" text DEFAULT 'Asia/Kolkata'::text NOT NULL,
  "currency" text DEFAULT 'INR'::text NOT NULL,
  "status" text DEFAULT 'active'::text NOT NULL CHECK (status = ANY (ARRAY['active'::text, 'inactive'::text])),
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL,
  "client_code" text
  , PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public."branches" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "organization_id" uuid NOT NULL,
  "name" text NOT NULL,
  "code" text NOT NULL,
  "address" text,
  "city" text,
  "state" text,
  "country" text DEFAULT 'India'::text NOT NULL,
  "status" text DEFAULT 'active'::text NOT NULL CHECK (status = ANY (ARRAY['active'::text, 'inactive'::text])),
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
  , PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public."users" (
  "id" uuid NOT NULL,
  "full_name" text,
  "phone" text,
  "avatar_url" text,
  "status" text DEFAULT 'active'::text NOT NULL CHECK (status = ANY (ARRAY['active'::text, 'inactive'::text, 'invited'::text])),
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL,
  "platform_role" text DEFAULT 'customer'::text NOT NULL CHECK (platform_role = ANY (ARRAY['customer'::text, 'platform_admin'::text]))
  , PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public."roles" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "organization_id" uuid NOT NULL,
  "name" text NOT NULL,
  "description" text,
  "is_system" boolean DEFAULT false NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
  , PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public."permissions" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "code" text NOT NULL,
  "name" text NOT NULL,
  "description" text,
  "created_at" timestamptz DEFAULT now() NOT NULL
  , PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public."role_permissions" (
  "role_id" uuid NOT NULL,
  "permission_id" uuid NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL
  , PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS public."organization_members" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "organization_id" uuid NOT NULL,
  "user_id" uuid NOT NULL,
  "role_id" uuid NOT NULL,
  "status" text DEFAULT 'active'::text NOT NULL CHECK (status = ANY (ARRAY['active'::text, 'inactive'::text, 'invited'::text])),
  "joined_at" timestamptz,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
  , PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public."member_branch_access" (
  "member_id" uuid NOT NULL,
  "branch_id" uuid NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL
  , PRIMARY KEY (member_id, branch_id)
);

CREATE TABLE IF NOT EXISTS public."projects" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "organization_id" uuid NOT NULL,
  "branch_id" uuid NOT NULL,
  "customer_id" uuid,
  "name" text NOT NULL,
  "code" text,
  "description" text,
  "project_value" numeric DEFAULT 0 NOT NULL CHECK (project_value >= 0::numeric),
  "budget" numeric DEFAULT 0 NOT NULL CHECK (budget >= 0::numeric),
  "start_date" date,
  "end_date" date,
  "status" text DEFAULT 'planning'::text NOT NULL CHECK (status = ANY (ARRAY['planning'::text, 'active'::text, 'on_hold'::text, 'completed'::text, 'cancelled'::text, 'archived'::text])),
  "created_by" uuid,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
  , PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public."project_members" (
  "project_id" uuid NOT NULL,
  "user_id" uuid NOT NULL,
  "role_id" uuid,
  "created_at" timestamptz DEFAULT now() NOT NULL
  , PRIMARY KEY (project_id, user_id)
);

CREATE TABLE IF NOT EXISTS public."customers" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "organization_id" uuid NOT NULL,
  "branch_id" uuid,
  "name" text NOT NULL,
  "company_name" text,
  "email" text,
  "phone" text,
  "address" text,
  "city" text,
  "state" text,
  "country" text DEFAULT 'India'::text NOT NULL,
  "tax_id" text,
  "status" text DEFAULT 'active'::text NOT NULL CHECK (status = ANY (ARRAY['active'::text, 'inactive'::text])),
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
  , PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public."project_sites" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "organization_id" uuid NOT NULL,
  "project_id" uuid NOT NULL,
  "name" text NOT NULL,
  "address" text,
  "city" text,
  "state" text,
  "country" text DEFAULT 'India'::text NOT NULL,
  "latitude" numeric,
  "longitude" numeric,
  "status" text DEFAULT 'active'::text NOT NULL CHECK (status = ANY (ARRAY['active'::text, 'inactive'::text])),
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
  , PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public."tasks" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "organization_id" uuid NOT NULL,
  "project_id" uuid NOT NULL,
  "site_id" uuid,
  "title" text NOT NULL,
  "description" text,
  "assigned_to" uuid,
  "priority" text DEFAULT 'medium'::text NOT NULL CHECK (priority = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text, 'urgent'::text])),
  "due_date" date,
  "status" text DEFAULT 'open'::text NOT NULL CHECK (status = ANY (ARRAY['open'::text, 'in_progress'::text, 'blocked'::text, 'completed'::text, 'cancelled'::text])),
  "completed_at" timestamptz,
  "created_by" uuid,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL,
  "is_setup_data" boolean DEFAULT false NOT NULL
  , PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public."task_dependencies" (
  "task_id" uuid NOT NULL,
  "depends_on_task_id" uuid NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL
  , PRIMARY KEY (task_id, depends_on_task_id)
);

CREATE TABLE IF NOT EXISTS public."daily_progress" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "organization_id" uuid NOT NULL,
  "project_id" uuid NOT NULL,
  "site_id" uuid,
  "progress_date" date NOT NULL,
  "progress_percent" numeric CHECK (progress_percent >= 0::numeric AND progress_percent <= 100::numeric),
  "notes" text,
  "issues" text,
  "weather" text,
  "created_by" uuid,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL,
  "is_setup_data" boolean DEFAULT false NOT NULL
  , PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public."daily_progress_items" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "daily_progress_id" uuid NOT NULL,
  "description" text NOT NULL,
  "quantity" numeric,
  "unit" text,
  "created_at" timestamptz DEFAULT now() NOT NULL
  , PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public."daily_progress_photos" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "daily_progress_id" uuid NOT NULL,
  "storage_path" text NOT NULL,
  "caption" text,
  "created_at" timestamptz DEFAULT now() NOT NULL
  , PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public."workers" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "organization_id" uuid NOT NULL,
  "branch_id" uuid,
  "name" text NOT NULL,
  "phone" text,
  "role" text,
  "worker_type" text DEFAULT 'daily_wage'::text NOT NULL CHECK (worker_type = ANY (ARRAY['daily_wage'::text, 'contract'::text, 'staff'::text, 'subcontractor'::text])),
  "daily_rate" numeric DEFAULT 0 NOT NULL CHECK (daily_rate >= 0::numeric),
  "status" text DEFAULT 'active'::text NOT NULL CHECK (status = ANY (ARRAY['active'::text, 'inactive'::text])),
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
  , PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public."attendance" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "organization_id" uuid NOT NULL,
  "project_id" uuid NOT NULL,
  "worker_id" uuid NOT NULL,
  "attendance_date" date NOT NULL,
  "status" text NOT NULL CHECK (status = ANY (ARRAY['present'::text, 'absent'::text, 'half_day'::text, 'leave'::text])),
  "hours" numeric,
  "notes" text,
  "created_by" uuid,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "is_setup_data" boolean DEFAULT false NOT NULL
  , PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public."labour_allocations" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "organization_id" uuid NOT NULL,
  "project_id" uuid NOT NULL,
  "worker_id" uuid NOT NULL,
  "allocation_date" date NOT NULL,
  "hours" numeric,
  "cost" numeric DEFAULT 0 NOT NULL CHECK (cost >= 0::numeric),
  "notes" text,
  "created_by" uuid,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "is_setup_data" boolean DEFAULT false NOT NULL
  , PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public."materials" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "organization_id" uuid NOT NULL,
  "name" text NOT NULL,
  "code" text,
  "category" text,
  "unit" text NOT NULL,
  "reorder_level" numeric DEFAULT 0 NOT NULL CHECK (reorder_level >= 0::numeric),
  "status" text DEFAULT 'active'::text NOT NULL CHECK (status = ANY (ARRAY['active'::text, 'inactive'::text])),
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
  , PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public."project_materials" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "organization_id" uuid NOT NULL,
  "project_id" uuid NOT NULL,
  "material_id" uuid NOT NULL,
  "opening_quantity" numeric DEFAULT 0 NOT NULL CHECK (opening_quantity >= 0::numeric),
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
  , PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public."material_transactions" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "organization_id" uuid NOT NULL,
  "project_id" uuid NOT NULL,
  "material_id" uuid NOT NULL,
  "transaction_type" text NOT NULL CHECK (transaction_type = ANY (ARRAY['opening'::text, 'receipt'::text, 'usage'::text, 'wastage'::text, 'adjustment'::text, 'return'::text])),
  "quantity" numeric NOT NULL CHECK (quantity > 0::numeric),
  "unit" text NOT NULL,
  "reference_type" text,
  "reference_id" uuid,
  "transaction_date" date DEFAULT CURRENT_DATE NOT NULL,
  "notes" text,
  "created_by" uuid,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "is_setup_data" boolean DEFAULT false NOT NULL
  , PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public."vendors" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "organization_id" uuid NOT NULL,
  "branch_id" uuid,
  "name" text NOT NULL,
  "company_name" text,
  "email" text,
  "phone" text,
  "address" text,
  "city" text,
  "state" text,
  "country" text DEFAULT 'India'::text NOT NULL,
  "tax_id" text,
  "status" text DEFAULT 'active'::text NOT NULL CHECK (status = ANY (ARRAY['active'::text, 'inactive'::text])),
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
  , PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public."material_requests" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "organization_id" uuid NOT NULL,
  "project_id" uuid NOT NULL,
  "requested_by" uuid,
  "request_date" date DEFAULT CURRENT_DATE NOT NULL,
  "status" text DEFAULT 'requested'::text NOT NULL CHECK (status = ANY (ARRAY['requested'::text, 'approved'::text, 'ordered'::text, 'partially_received'::text, 'received'::text, 'cancelled'::text])),
  "notes" text,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL,
  "is_setup_data" boolean DEFAULT false NOT NULL
  , PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public."material_request_items" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "material_request_id" uuid NOT NULL,
  "material_id" uuid NOT NULL,
  "quantity" numeric NOT NULL CHECK (quantity > 0::numeric),
  "unit" text NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL
  , PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public."vendor_quotations" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "organization_id" uuid NOT NULL,
  "project_id" uuid,
  "vendor_id" uuid NOT NULL,
  "quotation_number" text,
  "quotation_date" date DEFAULT CURRENT_DATE NOT NULL,
  "valid_until" date,
  "total_amount" numeric DEFAULT 0 NOT NULL CHECK (total_amount >= 0::numeric),
  "status" text DEFAULT 'draft'::text NOT NULL CHECK (status = ANY (ARRAY['draft'::text, 'received'::text, 'selected'::text, 'rejected'::text, 'expired'::text])),
  "created_by" uuid,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL,
  "is_setup_data" boolean DEFAULT false NOT NULL
  , PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public."vendor_quotation_items" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "vendor_quotation_id" uuid NOT NULL,
  "material_id" uuid,
  "description" text NOT NULL,
  "quantity" numeric DEFAULT 1 NOT NULL CHECK (quantity > 0::numeric),
  "unit" text,
  "unit_price" numeric DEFAULT 0 NOT NULL CHECK (unit_price >= 0::numeric),
  "tax_amount" numeric DEFAULT 0 NOT NULL CHECK (tax_amount >= 0::numeric),
  "total_amount" numeric DEFAULT 0 NOT NULL CHECK (total_amount >= 0::numeric),
  "created_at" timestamptz DEFAULT now() NOT NULL
  , PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public."purchase_orders" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "organization_id" uuid NOT NULL,
  "branch_id" uuid,
  "project_id" uuid,
  "vendor_id" uuid NOT NULL,
  "po_number" text NOT NULL,
  "po_date" date DEFAULT CURRENT_DATE NOT NULL,
  "expected_date" date,
  "subtotal" numeric DEFAULT 0 NOT NULL CHECK (subtotal >= 0::numeric),
  "tax_amount" numeric DEFAULT 0 NOT NULL CHECK (tax_amount >= 0::numeric),
  "total_amount" numeric DEFAULT 0 NOT NULL CHECK (total_amount >= 0::numeric),
  "status" text DEFAULT 'draft'::text NOT NULL CHECK (status = ANY (ARRAY['draft'::text, 'submitted'::text, 'approved'::text, 'partially_received'::text, 'received'::text, 'cancelled'::text])),
  "created_by" uuid,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL,
  "is_setup_data" boolean DEFAULT false NOT NULL
  , PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public."purchase_order_items" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "purchase_order_id" uuid NOT NULL,
  "material_id" uuid,
  "description" text NOT NULL,
  "ordered_quantity" numeric NOT NULL CHECK (ordered_quantity > 0::numeric),
  "received_quantity" numeric DEFAULT 0 NOT NULL,
  "unit" text,
  "unit_price" numeric DEFAULT 0 NOT NULL CHECK (unit_price >= 0::numeric),
  "total_amount" numeric DEFAULT 0 NOT NULL CHECK (total_amount >= 0::numeric),
  "created_at" timestamptz DEFAULT now() NOT NULL
  , PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public."goods_receipts" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "organization_id" uuid NOT NULL,
  "purchase_order_id" uuid NOT NULL,
  "receipt_number" text NOT NULL,
  "receipt_date" date DEFAULT CURRENT_DATE NOT NULL,
  "notes" text,
  "received_by" uuid,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "is_setup_data" boolean DEFAULT false NOT NULL
  , PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public."goods_receipt_items" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "goods_receipt_id" uuid NOT NULL,
  "purchase_order_item_id" uuid NOT NULL,
  "quantity" numeric NOT NULL CHECK (quantity > 0::numeric),
  "unit" text NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL
  , PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public."expense_categories" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "organization_id" uuid NOT NULL,
  "name" text NOT NULL,
  "status" text DEFAULT 'active'::text NOT NULL CHECK (status = ANY (ARRAY['active'::text, 'inactive'::text])),
  "created_at" timestamptz DEFAULT now() NOT NULL
  , PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public."expenses" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "organization_id" uuid NOT NULL,
  "branch_id" uuid,
  "project_id" uuid,
  "category_id" uuid,
  "expense_date" date DEFAULT CURRENT_DATE NOT NULL,
  "description" text NOT NULL,
  "amount" numeric NOT NULL CHECK (amount > 0::numeric),
  "payment_method" text,
  "status" text DEFAULT 'recorded'::text NOT NULL CHECK (status = ANY (ARRAY['recorded'::text, 'submitted'::text, 'approved'::text, 'rejected'::text])),
  "created_by" uuid,
  "approved_by" uuid,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL,
  "is_setup_data" boolean DEFAULT false NOT NULL
  , PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public."quotations" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "organization_id" uuid NOT NULL,
  "branch_id" uuid,
  "customer_id" uuid NOT NULL,
  "project_id" uuid,
  "quotation_number" text NOT NULL,
  "quotation_date" date DEFAULT CURRENT_DATE NOT NULL,
  "valid_until" date,
  "subtotal" numeric DEFAULT 0 NOT NULL CHECK (subtotal >= 0::numeric),
  "discount_amount" numeric DEFAULT 0 NOT NULL CHECK (discount_amount >= 0::numeric),
  "tax_amount" numeric DEFAULT 0 NOT NULL CHECK (tax_amount >= 0::numeric),
  "total_amount" numeric DEFAULT 0 NOT NULL CHECK (total_amount >= 0::numeric),
  "status" text DEFAULT 'draft'::text NOT NULL CHECK (status = ANY (ARRAY['draft'::text, 'sent'::text, 'approved'::text, 'rejected'::text, 'expired'::text, 'converted'::text])),
  "created_by" uuid,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL,
  "is_setup_data" boolean DEFAULT false NOT NULL
  , PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public."quotation_items" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "quotation_id" uuid NOT NULL,
  "description" text NOT NULL,
  "quantity" numeric DEFAULT 1 NOT NULL CHECK (quantity > 0::numeric),
  "unit" text,
  "unit_price" numeric DEFAULT 0 NOT NULL CHECK (unit_price >= 0::numeric),
  "discount_amount" numeric DEFAULT 0 NOT NULL CHECK (discount_amount >= 0::numeric),
  "tax_amount" numeric DEFAULT 0 NOT NULL CHECK (tax_amount >= 0::numeric),
  "total_amount" numeric DEFAULT 0 NOT NULL CHECK (total_amount >= 0::numeric),
  "created_at" timestamptz DEFAULT now() NOT NULL
  , PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public."quotation_revisions" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "quotation_id" uuid NOT NULL,
  "revision_number" integer NOT NULL CHECK (revision_number > 0),
  "snapshot" jsonb NOT NULL,
  "created_by" uuid,
  "created_at" timestamptz DEFAULT now() NOT NULL
  , PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public."invoices" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "organization_id" uuid NOT NULL,
  "branch_id" uuid,
  "project_id" uuid,
  "customer_id" uuid NOT NULL,
  "quotation_id" uuid,
  "invoice_number" text NOT NULL,
  "invoice_date" date DEFAULT CURRENT_DATE NOT NULL,
  "due_date" date,
  "subtotal" numeric DEFAULT 0 NOT NULL CHECK (subtotal >= 0::numeric),
  "discount_amount" numeric DEFAULT 0 NOT NULL CHECK (discount_amount >= 0::numeric),
  "tax_amount" numeric DEFAULT 0 NOT NULL CHECK (tax_amount >= 0::numeric),
  "total_amount" numeric DEFAULT 0 NOT NULL CHECK (total_amount >= 0::numeric),
  "status" text DEFAULT 'draft'::text NOT NULL CHECK (status = ANY (ARRAY['draft'::text, 'sent'::text, 'partially_paid'::text, 'paid'::text, 'overdue'::text, 'cancelled'::text])),
  "created_by" uuid,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL,
  "is_setup_data" boolean DEFAULT false NOT NULL
  , PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public."invoice_items" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "invoice_id" uuid NOT NULL,
  "description" text NOT NULL,
  "quantity" numeric DEFAULT 1 NOT NULL CHECK (quantity > 0::numeric),
  "unit" text,
  "unit_price" numeric DEFAULT 0 NOT NULL CHECK (unit_price >= 0::numeric),
  "tax_amount" numeric DEFAULT 0 NOT NULL CHECK (tax_amount >= 0::numeric),
  "total_amount" numeric DEFAULT 0 NOT NULL CHECK (total_amount >= 0::numeric),
  "created_at" timestamptz DEFAULT now() NOT NULL
  , PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public."payments" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "organization_id" uuid NOT NULL,
  "invoice_id" uuid NOT NULL,
  "payment_date" date DEFAULT CURRENT_DATE NOT NULL,
  "amount" numeric NOT NULL CHECK (amount > 0::numeric),
  "payment_method" text,
  "reference_number" text,
  "notes" text,
  "recorded_by" uuid,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "is_setup_data" boolean DEFAULT false NOT NULL
  , PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public."documents" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "organization_id" uuid NOT NULL,
  "branch_id" uuid,
  "project_id" uuid,
  "name" text NOT NULL,
  "document_type" text,
  "storage_path" text NOT NULL,
  "mime_type" text,
  "file_size" bigint,
  "uploaded_by" uuid,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "is_setup_data" boolean DEFAULT false NOT NULL
  , PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public."notifications" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "organization_id" uuid NOT NULL,
  "user_id" uuid NOT NULL,
  "type" text NOT NULL,
  "title" text NOT NULL,
  "message" text NOT NULL,
  "entity_type" text,
  "entity_id" uuid,
  "read_at" timestamptz,
  "created_at" timestamptz DEFAULT now() NOT NULL
  , PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public."notification_events" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "organization_id" uuid NOT NULL,
  "event_type" text NOT NULL,
  "entity_type" text,
  "entity_id" uuid,
  "payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "processed_at" timestamptz,
  "created_at" timestamptz DEFAULT now() NOT NULL
  , PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public."audit_logs" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "organization_id" uuid NOT NULL,
  "user_id" uuid,
  "action" text NOT NULL,
  "entity_type" text NOT NULL,
  "entity_id" uuid,
  "old_values" jsonb,
  "new_values" jsonb,
  "created_at" timestamptz DEFAULT now() NOT NULL
  , PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public."workspace_lifecycle" (
  "organization_id" uuid NOT NULL,
  "mode" text DEFAULT 'setup'::text NOT NULL CHECK (mode = ANY (ARRAY['setup'::text, 'live'::text, 'expired'::text, 'suspended'::text])),
  "setup_started_at" timestamptz DEFAULT now() NOT NULL,
  "setup_expires_at" timestamptz DEFAULT (now() + '7 days'::interval) NOT NULL,
  "go_live_at" timestamptz,
  "go_live_by" uuid,
  "updated_at" timestamptz DEFAULT now() NOT NULL
  , PRIMARY KEY (organization_id)
);

CREATE TABLE IF NOT EXISTS public."workspace_lifecycle_events" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "organization_id" uuid NOT NULL,
  "event_type" text NOT NULL CHECK (event_type = ANY (ARRAY['setup_started'::text, 'setup_extended'::text, 'setup_expired'::text, 'go_live_requested'::text, 'go_live_completed'::text, 'go_live_failed'::text, 'suspended'::text, 'reactivated'::text])),
  "performed_by" uuid,
  "previous_mode" text,
  "new_mode" text,
  "metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL
  , PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public."setup_extension_requests" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "organization_id" uuid NOT NULL,
  "requested_by" uuid NOT NULL,
  "requested_days" integer NOT NULL CHECK (requested_days >= 1 AND requested_days <= 30),
  "reason" text,
  "status" text DEFAULT 'pending'::text NOT NULL CHECK (status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text, 'cancelled'::text])),
  "reviewed_by" uuid,
  "reviewed_at" timestamptz,
  "review_notes" text,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
  , PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public."storage_cleanup_queue" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "organization_id" uuid NOT NULL,
  "storage_path" text NOT NULL,
  "source_type" text NOT NULL CHECK (source_type = ANY (ARRAY['daily_progress_photo'::text, 'document'::text])),
  "source_id" uuid NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "processed_at" timestamptz,
  "status" text DEFAULT 'pending'::text NOT NULL CHECK (status = ANY (ARRAY['pending'::text, 'processed'::text, 'failed'::text])),
  "error_message" text
  , PRIMARY KEY (id)
);

-- ============================================================
-- Foreign key constraints
-- ============================================================
ALTER TABLE public."branches" ADD CONSTRAINT "branches_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id);
ALTER TABLE public."users" ADD CONSTRAINT "users_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id);
ALTER TABLE public."roles" ADD CONSTRAINT "roles_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id);
ALTER TABLE public."role_permissions" ADD CONSTRAINT "role_permissions_role_id_fkey" FOREIGN KEY (role_id) REFERENCES public.roles(id);
ALTER TABLE public."role_permissions" ADD CONSTRAINT "role_permissions_permission_id_fkey" FOREIGN KEY (permission_id) REFERENCES public.permissions(id);
ALTER TABLE public."organization_members" ADD CONSTRAINT "organization_members_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id);
ALTER TABLE public."organization_members" ADD CONSTRAINT "organization_members_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.users(id);
ALTER TABLE public."organization_members" ADD CONSTRAINT "organization_members_role_id_fkey" FOREIGN KEY (role_id) REFERENCES public.roles(id);
ALTER TABLE public."member_branch_access" ADD CONSTRAINT "member_branch_access_branch_id_fkey" FOREIGN KEY (branch_id) REFERENCES public.branches(id);
ALTER TABLE public."member_branch_access" ADD CONSTRAINT "member_branch_access_member_id_fkey" FOREIGN KEY (member_id) REFERENCES public.organization_members(id);
ALTER TABLE public."projects" ADD CONSTRAINT "projects_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id);
ALTER TABLE public."projects" ADD CONSTRAINT "projects_branch_id_fkey" FOREIGN KEY (branch_id) REFERENCES public.branches(id);
ALTER TABLE public."projects" ADD CONSTRAINT "projects_created_by_fkey" FOREIGN KEY (created_by) REFERENCES public.users(id);
ALTER TABLE public."projects" ADD CONSTRAINT "projects_customer_id_fkey" FOREIGN KEY (customer_id) REFERENCES public.customers(id);
ALTER TABLE public."project_members" ADD CONSTRAINT "project_members_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.users(id);
ALTER TABLE public."project_members" ADD CONSTRAINT "project_members_project_id_fkey" FOREIGN KEY (project_id) REFERENCES public.projects(id);
ALTER TABLE public."project_members" ADD CONSTRAINT "project_members_role_id_fkey" FOREIGN KEY (role_id) REFERENCES public.roles(id);
ALTER TABLE public."customers" ADD CONSTRAINT "customers_branch_id_fkey" FOREIGN KEY (branch_id) REFERENCES public.branches(id);
ALTER TABLE public."customers" ADD CONSTRAINT "customers_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id);
ALTER TABLE public."project_sites" ADD CONSTRAINT "project_sites_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id);
ALTER TABLE public."project_sites" ADD CONSTRAINT "project_sites_project_id_fkey" FOREIGN KEY (project_id) REFERENCES public.projects(id);
ALTER TABLE public."tasks" ADD CONSTRAINT "tasks_site_id_fkey" FOREIGN KEY (site_id) REFERENCES public.project_sites(id);
ALTER TABLE public."tasks" ADD CONSTRAINT "tasks_created_by_fkey" FOREIGN KEY (created_by) REFERENCES public.users(id);
ALTER TABLE public."tasks" ADD CONSTRAINT "tasks_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id);
ALTER TABLE public."tasks" ADD CONSTRAINT "tasks_project_id_fkey" FOREIGN KEY (project_id) REFERENCES public.projects(id);
ALTER TABLE public."tasks" ADD CONSTRAINT "tasks_assigned_to_fkey" FOREIGN KEY (assigned_to) REFERENCES public.users(id);
ALTER TABLE public."task_dependencies" ADD CONSTRAINT "task_dependencies_task_id_fkey" FOREIGN KEY (task_id) REFERENCES public.tasks(id);
ALTER TABLE public."task_dependencies" ADD CONSTRAINT "task_dependencies_depends_on_task_id_fkey" FOREIGN KEY (depends_on_task_id) REFERENCES public.tasks(id);
ALTER TABLE public."daily_progress" ADD CONSTRAINT "daily_progress_project_id_fkey" FOREIGN KEY (project_id) REFERENCES public.projects(id);
ALTER TABLE public."daily_progress" ADD CONSTRAINT "daily_progress_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id);
ALTER TABLE public."daily_progress" ADD CONSTRAINT "daily_progress_site_id_fkey" FOREIGN KEY (site_id) REFERENCES public.project_sites(id);
ALTER TABLE public."daily_progress" ADD CONSTRAINT "daily_progress_created_by_fkey" FOREIGN KEY (created_by) REFERENCES public.users(id);
ALTER TABLE public."daily_progress_items" ADD CONSTRAINT "daily_progress_items_daily_progress_id_fkey" FOREIGN KEY (daily_progress_id) REFERENCES public.daily_progress(id);
ALTER TABLE public."daily_progress_photos" ADD CONSTRAINT "daily_progress_photos_daily_progress_id_fkey" FOREIGN KEY (daily_progress_id) REFERENCES public.daily_progress(id);
ALTER TABLE public."workers" ADD CONSTRAINT "workers_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id);
ALTER TABLE public."workers" ADD CONSTRAINT "workers_branch_id_fkey" FOREIGN KEY (branch_id) REFERENCES public.branches(id);
ALTER TABLE public."attendance" ADD CONSTRAINT "attendance_project_id_fkey" FOREIGN KEY (project_id) REFERENCES public.projects(id);
ALTER TABLE public."attendance" ADD CONSTRAINT "attendance_created_by_fkey" FOREIGN KEY (created_by) REFERENCES public.users(id);
ALTER TABLE public."attendance" ADD CONSTRAINT "attendance_worker_id_fkey" FOREIGN KEY (worker_id) REFERENCES public.workers(id);
ALTER TABLE public."attendance" ADD CONSTRAINT "attendance_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id);
ALTER TABLE public."labour_allocations" ADD CONSTRAINT "labour_allocations_created_by_fkey" FOREIGN KEY (created_by) REFERENCES public.users(id);
ALTER TABLE public."labour_allocations" ADD CONSTRAINT "labour_allocations_worker_id_fkey" FOREIGN KEY (worker_id) REFERENCES public.workers(id);
ALTER TABLE public."labour_allocations" ADD CONSTRAINT "labour_allocations_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id);
ALTER TABLE public."labour_allocations" ADD CONSTRAINT "labour_allocations_project_id_fkey" FOREIGN KEY (project_id) REFERENCES public.projects(id);
ALTER TABLE public."materials" ADD CONSTRAINT "materials_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id);
ALTER TABLE public."project_materials" ADD CONSTRAINT "project_materials_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id);
ALTER TABLE public."project_materials" ADD CONSTRAINT "project_materials_project_id_fkey" FOREIGN KEY (project_id) REFERENCES public.projects(id);
ALTER TABLE public."project_materials" ADD CONSTRAINT "project_materials_material_id_fkey" FOREIGN KEY (material_id) REFERENCES public.materials(id);
ALTER TABLE public."material_transactions" ADD CONSTRAINT "material_transactions_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id);
ALTER TABLE public."material_transactions" ADD CONSTRAINT "material_transactions_project_id_fkey" FOREIGN KEY (project_id) REFERENCES public.projects(id);
ALTER TABLE public."material_transactions" ADD CONSTRAINT "material_transactions_material_id_fkey" FOREIGN KEY (material_id) REFERENCES public.materials(id);
ALTER TABLE public."material_transactions" ADD CONSTRAINT "material_transactions_created_by_fkey" FOREIGN KEY (created_by) REFERENCES public.users(id);
ALTER TABLE public."vendors" ADD CONSTRAINT "vendors_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id);
ALTER TABLE public."vendors" ADD CONSTRAINT "vendors_branch_id_fkey" FOREIGN KEY (branch_id) REFERENCES public.branches(id);
ALTER TABLE public."material_requests" ADD CONSTRAINT "material_requests_project_id_fkey" FOREIGN KEY (project_id) REFERENCES public.projects(id);
ALTER TABLE public."material_requests" ADD CONSTRAINT "material_requests_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id);
ALTER TABLE public."material_requests" ADD CONSTRAINT "material_requests_requested_by_fkey" FOREIGN KEY (requested_by) REFERENCES public.users(id);
ALTER TABLE public."material_request_items" ADD CONSTRAINT "material_request_items_material_id_fkey" FOREIGN KEY (material_id) REFERENCES public.materials(id);
ALTER TABLE public."material_request_items" ADD CONSTRAINT "material_request_items_material_request_id_fkey" FOREIGN KEY (material_request_id) REFERENCES public.material_requests(id);
ALTER TABLE public."vendor_quotations" ADD CONSTRAINT "vendor_quotations_vendor_id_fkey" FOREIGN KEY (vendor_id) REFERENCES public.vendors(id);
ALTER TABLE public."vendor_quotations" ADD CONSTRAINT "vendor_quotations_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id);
ALTER TABLE public."vendor_quotations" ADD CONSTRAINT "vendor_quotations_project_id_fkey" FOREIGN KEY (project_id) REFERENCES public.projects(id);
ALTER TABLE public."vendor_quotations" ADD CONSTRAINT "vendor_quotations_created_by_fkey" FOREIGN KEY (created_by) REFERENCES public.users(id);
ALTER TABLE public."vendor_quotation_items" ADD CONSTRAINT "vendor_quotation_items_vendor_quotation_id_fkey" FOREIGN KEY (vendor_quotation_id) REFERENCES public.vendor_quotations(id);
ALTER TABLE public."vendor_quotation_items" ADD CONSTRAINT "vendor_quotation_items_material_id_fkey" FOREIGN KEY (material_id) REFERENCES public.materials(id);
ALTER TABLE public."purchase_orders" ADD CONSTRAINT "purchase_orders_created_by_fkey" FOREIGN KEY (created_by) REFERENCES public.users(id);
ALTER TABLE public."purchase_orders" ADD CONSTRAINT "purchase_orders_project_id_fkey" FOREIGN KEY (project_id) REFERENCES public.projects(id);
ALTER TABLE public."purchase_orders" ADD CONSTRAINT "purchase_orders_vendor_id_fkey" FOREIGN KEY (vendor_id) REFERENCES public.vendors(id);
ALTER TABLE public."purchase_orders" ADD CONSTRAINT "purchase_orders_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id);
ALTER TABLE public."purchase_orders" ADD CONSTRAINT "purchase_orders_branch_id_fkey" FOREIGN KEY (branch_id) REFERENCES public.branches(id);
ALTER TABLE public."purchase_order_items" ADD CONSTRAINT "purchase_order_items_purchase_order_id_fkey" FOREIGN KEY (purchase_order_id) REFERENCES public.purchase_orders(id);
ALTER TABLE public."purchase_order_items" ADD CONSTRAINT "purchase_order_items_material_id_fkey" FOREIGN KEY (material_id) REFERENCES public.materials(id);
ALTER TABLE public."goods_receipts" ADD CONSTRAINT "goods_receipts_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id);
ALTER TABLE public."goods_receipts" ADD CONSTRAINT "goods_receipts_purchase_order_id_fkey" FOREIGN KEY (purchase_order_id) REFERENCES public.purchase_orders(id);
ALTER TABLE public."goods_receipts" ADD CONSTRAINT "goods_receipts_received_by_fkey" FOREIGN KEY (received_by) REFERENCES public.users(id);
ALTER TABLE public."goods_receipt_items" ADD CONSTRAINT "goods_receipt_items_purchase_order_item_id_fkey" FOREIGN KEY (purchase_order_item_id) REFERENCES public.purchase_order_items(id);
ALTER TABLE public."goods_receipt_items" ADD CONSTRAINT "goods_receipt_items_goods_receipt_id_fkey" FOREIGN KEY (goods_receipt_id) REFERENCES public.goods_receipts(id);
ALTER TABLE public."expense_categories" ADD CONSTRAINT "expense_categories_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id);
ALTER TABLE public."expenses" ADD CONSTRAINT "expenses_approved_by_fkey" FOREIGN KEY (approved_by) REFERENCES public.users(id);
ALTER TABLE public."expenses" ADD CONSTRAINT "expenses_project_id_fkey" FOREIGN KEY (project_id) REFERENCES public.projects(id);
ALTER TABLE public."expenses" ADD CONSTRAINT "expenses_category_id_fkey" FOREIGN KEY (category_id) REFERENCES public.expense_categories(id);
ALTER TABLE public."expenses" ADD CONSTRAINT "expenses_branch_id_fkey" FOREIGN KEY (branch_id) REFERENCES public.branches(id);
ALTER TABLE public."expenses" ADD CONSTRAINT "expenses_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id);
ALTER TABLE public."expenses" ADD CONSTRAINT "expenses_created_by_fkey" FOREIGN KEY (created_by) REFERENCES public.users(id);
ALTER TABLE public."quotations" ADD CONSTRAINT "quotations_project_id_fkey" FOREIGN KEY (project_id) REFERENCES public.projects(id);
ALTER TABLE public."quotations" ADD CONSTRAINT "quotations_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id);
ALTER TABLE public."quotations" ADD CONSTRAINT "quotations_branch_id_fkey" FOREIGN KEY (branch_id) REFERENCES public.branches(id);
ALTER TABLE public."quotations" ADD CONSTRAINT "quotations_customer_id_fkey" FOREIGN KEY (customer_id) REFERENCES public.customers(id);
ALTER TABLE public."quotations" ADD CONSTRAINT "quotations_created_by_fkey" FOREIGN KEY (created_by) REFERENCES public.users(id);
ALTER TABLE public."quotation_items" ADD CONSTRAINT "quotation_items_quotation_id_fkey" FOREIGN KEY (quotation_id) REFERENCES public.quotations(id);
ALTER TABLE public."quotation_revisions" ADD CONSTRAINT "quotation_revisions_created_by_fkey" FOREIGN KEY (created_by) REFERENCES public.users(id);
ALTER TABLE public."quotation_revisions" ADD CONSTRAINT "quotation_revisions_quotation_id_fkey" FOREIGN KEY (quotation_id) REFERENCES public.quotations(id);
ALTER TABLE public."invoices" ADD CONSTRAINT "invoices_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id);
ALTER TABLE public."invoices" ADD CONSTRAINT "invoices_branch_id_fkey" FOREIGN KEY (branch_id) REFERENCES public.branches(id);
ALTER TABLE public."invoices" ADD CONSTRAINT "invoices_project_id_fkey" FOREIGN KEY (project_id) REFERENCES public.projects(id);
ALTER TABLE public."invoices" ADD CONSTRAINT "invoices_customer_id_fkey" FOREIGN KEY (customer_id) REFERENCES public.customers(id);
ALTER TABLE public."invoices" ADD CONSTRAINT "invoices_quotation_id_fkey" FOREIGN KEY (quotation_id) REFERENCES public.quotations(id);
ALTER TABLE public."invoices" ADD CONSTRAINT "invoices_created_by_fkey" FOREIGN KEY (created_by) REFERENCES public.users(id);
ALTER TABLE public."invoice_items" ADD CONSTRAINT "invoice_items_invoice_id_fkey" FOREIGN KEY (invoice_id) REFERENCES public.invoices(id);
ALTER TABLE public."payments" ADD CONSTRAINT "payments_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id);
ALTER TABLE public."payments" ADD CONSTRAINT "payments_invoice_id_fkey" FOREIGN KEY (invoice_id) REFERENCES public.invoices(id);
ALTER TABLE public."payments" ADD CONSTRAINT "payments_recorded_by_fkey" FOREIGN KEY (recorded_by) REFERENCES public.users(id);
ALTER TABLE public."documents" ADD CONSTRAINT "documents_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id);
ALTER TABLE public."documents" ADD CONSTRAINT "documents_branch_id_fkey" FOREIGN KEY (branch_id) REFERENCES public.branches(id);
ALTER TABLE public."documents" ADD CONSTRAINT "documents_project_id_fkey" FOREIGN KEY (project_id) REFERENCES public.projects(id);
ALTER TABLE public."documents" ADD CONSTRAINT "documents_uploaded_by_fkey" FOREIGN KEY (uploaded_by) REFERENCES public.users(id);
ALTER TABLE public."notifications" ADD CONSTRAINT "notifications_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id);
ALTER TABLE public."notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.users(id);
ALTER TABLE public."notification_events" ADD CONSTRAINT "notification_events_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id);
ALTER TABLE public."audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.users(id);
ALTER TABLE public."audit_logs" ADD CONSTRAINT "audit_logs_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id);
ALTER TABLE public."workspace_lifecycle" ADD CONSTRAINT "workspace_lifecycle_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id);
ALTER TABLE public."workspace_lifecycle" ADD CONSTRAINT "workspace_lifecycle_go_live_by_fkey" FOREIGN KEY (go_live_by) REFERENCES auth.users(id);
ALTER TABLE public."workspace_lifecycle_events" ADD CONSTRAINT "workspace_lifecycle_events_performed_by_fkey" FOREIGN KEY (performed_by) REFERENCES auth.users(id);
ALTER TABLE public."workspace_lifecycle_events" ADD CONSTRAINT "workspace_lifecycle_events_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id);
ALTER TABLE public."setup_extension_requests" ADD CONSTRAINT "setup_extension_requests_reviewed_by_fkey" FOREIGN KEY (reviewed_by) REFERENCES auth.users(id);
ALTER TABLE public."setup_extension_requests" ADD CONSTRAINT "setup_extension_requests_requested_by_fkey" FOREIGN KEY (requested_by) REFERENCES auth.users(id);
ALTER TABLE public."setup_extension_requests" ADD CONSTRAINT "setup_extension_requests_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id);
ALTER TABLE public."storage_cleanup_queue" ADD CONSTRAINT "storage_cleanup_queue_organization_id_fkey" FOREIGN KEY (organization_id) REFERENCES public.organizations(id);

-- ============================================================
-- Row Level Security
-- ============================================================
ALTER TABLE public."organizations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."branches" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."roles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."permissions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."role_permissions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."organization_members" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."member_branch_access" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."projects" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."project_members" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."customers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."project_sites" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."tasks" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."task_dependencies" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."daily_progress" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."daily_progress_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."daily_progress_photos" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."workers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."attendance" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."labour_allocations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."materials" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."project_materials" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."material_transactions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."vendors" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."material_requests" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."material_request_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."vendor_quotations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."vendor_quotation_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."purchase_orders" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."purchase_order_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."goods_receipts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."goods_receipt_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."expense_categories" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."expenses" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."quotations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."quotation_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."quotation_revisions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."invoices" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."invoice_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."payments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."documents" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."notifications" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."notification_events" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."audit_logs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."workspace_lifecycle" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."workspace_lifecycle_events" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."setup_extension_requests" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."storage_cleanup_queue" ENABLE ROW LEVEL SECURITY;

-- 2) FUNCTIONS
-- ============================================================
-- Helper / access-control functions
-- ============================================================

CREATE OR REPLACE FUNCTION public.is_org_member(target_org_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select exists (
    select 1
    from public.organization_members om
    join public.users u on u.id = om.user_id
    where om.organization_id = target_org_id
      and om.user_id = auth.uid()
      and om.status = 'active'
      and u.status = 'active'
  );
$function$;

CREATE OR REPLACE FUNCTION public.is_org_admin(target_org_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select exists (
    select 1
    from public.organization_members om
    join public.roles r on r.id = om.role_id
    where om.organization_id = target_org_id
      and om.user_id = auth.uid()
      and om.status = 'active'
      and lower(r.name) in ('owner','admin','organization admin')
  );
$function$;

CREATE OR REPLACE FUNCTION public.is_project_member(target_project_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select exists (
    select 1
    from public.project_members pm
    join public.users u on u.id = pm.user_id
    where pm.project_id = target_project_id
      and pm.user_id = auth.uid()
      and u.status = 'active'
  );
$function$;

CREATE OR REPLACE FUNCTION public.has_branch_access(target_branch_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select exists (
    select 1
    from public.branches b
    join public.organization_members om
      on om.organization_id = b.organization_id
    where b.id = target_branch_id
      and om.user_id = auth.uid()
      and om.status = 'active'
      and (
        public.is_org_admin(b.organization_id)
        or exists (
          select 1 from public.member_branch_access mba
          where mba.member_id = om.id
            and mba.branch_id = b.id
        )
      )
  );
$function$;

CREATE OR REPLACE FUNCTION public.has_project_access(target_project_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select exists (
    select 1
    from public.projects p
    where p.id = target_project_id
      and (
        public.is_org_admin(p.organization_id)
        or public.has_branch_access(p.branch_id)
        or public.is_project_member(p.id)
      )
  );
$function$;

CREATE OR REPLACE FUNCTION public.setup_data_default()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select coalesce(
    (select wl.mode = 'setup'
       from public.workspace_lifecycle wl
       join public.organization_members om on om.organization_id = wl.organization_id
      where om.user_id = auth.uid()
        and om.status = 'active'
      order by wl.updated_at desc
      limit 1),
    false
  );
$function$;

-- ============================================================
-- Onboarding
-- ============================================================

CREATE OR REPLACE FUNCTION public.create_organization_with_owner(p_name text, p_client_code text DEFAULT NULL::text, p_branch_name text DEFAULT NULL::text, p_branch_code text DEFAULT NULL::text, p_full_name text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_user_id uuid := auth.uid();
  v_org_id uuid;
  v_role_id uuid;
  v_client_code text;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  if nullif(trim(p_name), '') is null then raise exception 'Organization name is required'; end if;
  if nullif(trim(p_branch_name), '') is null then raise exception 'Branch name is required'; end if;
  if nullif(trim(p_branch_code), '') is null then raise exception 'Branch code is required'; end if;
  if exists (select 1 from public.organization_members where user_id = v_user_id and status = 'active') then
    raise exception 'User already belongs to an organization';
  end if;

  if nullif(trim(p_client_code), '') is not null then
    v_client_code := upper(trim(p_client_code));
  else
    loop
      v_client_code := 'BOS-' || upper(substr(md5(random()::text || clock_timestamp()::text || v_user_id::text), 1, 8));
      exit when not exists (
        select 1 from public.organizations where lower(client_code) = lower(v_client_code)
      );
    end loop;
  end if;

  insert into public.users (id, full_name, status)
  values (v_user_id, nullif(trim(p_full_name), ''), 'active')
  on conflict (id) do update
    set full_name = coalesce(nullif(trim(p_full_name), ''), public.users.full_name),
        status = 'active',
        updated_at = now();

  insert into public.organizations (name, client_code)
  values (trim(p_name), v_client_code)
  returning id into v_org_id;

  insert into public.roles (organization_id, name, description, is_system)
  values (v_org_id, 'Owner', 'Full organization ownership and administration', true)
  returning id into v_role_id;

  insert into public.organization_members (organization_id, user_id, role_id, status, joined_at)
  values (v_org_id, v_user_id, v_role_id, 'active', now());

  insert into public.branches (organization_id, name, code, status)
  values (v_org_id, trim(p_branch_name), upper(trim(p_branch_code)), 'active');

  return v_org_id;
exception
  when unique_violation then
    raise exception 'Client code or branch code already exists';
end;
$function$;

CREATE OR REPLACE FUNCTION public.initialize_workspace_lifecycle()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  insert into public.workspace_lifecycle (organization_id)
  values (new.id)
  on conflict (organization_id) do nothing;

  insert into public.workspace_lifecycle_events (
    organization_id, event_type, performed_by, previous_mode, new_mode
  )
  values (new.id, 'setup_started', auth.uid(), null, 'setup');

  return new;
end;
$function$;

-- ============================================================
-- Workspace lifecycle / setup data / Go Live
-- ============================================================

CREATE OR REPLACE FUNCTION public.assert_workspace_writable()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$ declare v_mode text; v_org_id uuid; begin v_org_id := new.organization_id; select mode into v_mode from public.workspace_lifecycle where organization_id=v_org_id; if v_mode is null then raise exception 'Workspace lifecycle is not initialized'; end if; if v_mode not in ('setup','live') then raise exception 'Workspace is % and cannot accept new transactions. Please contact BuildOS support for an extension or reactivation.', v_mode; end if; return new; end; $function$;

CREATE OR REPLACE FUNCTION public.mark_new_transaction_as_setup_data()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_mode text;
begin
  select mode into v_mode
    from public.workspace_lifecycle
   where organization_id = new.organization_id;

  if v_mode = 'setup' then
    new.is_setup_data := true;
  elsif v_mode = 'live' then
    new.is_setup_data := false;
  end if;

  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.expire_workspace_if_needed(target_org_id uuid)
 RETURNS text
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare v_mode text; v_expires timestamptz;
begin
 select mode,setup_expires_at into v_mode,v_expires from public.workspace_lifecycle where organization_id=target_org_id for update;
 if v_mode='setup' and v_expires<=now() then
  update public.workspace_lifecycle set mode='expired',updated_at=now() where organization_id=target_org_id;
  insert into public.workspace_lifecycle_events(organization_id,event_type,performed_by,previous_mode,new_mode) values(target_org_id,'setup_expired',auth.uid(),'setup','expired');
  return 'expired';
 end if;
 return coalesce(v_mode,'missing');
end; $function$;

CREATE OR REPLACE FUNCTION public.queue_setup_storage_for_cleanup(target_org_id uuid)
 RETURNS bigint
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare v_photo_count bigint := 0; v_doc_count bigint := 0;
begin
  insert into public.storage_cleanup_queue(organization_id, storage_path, source_type, source_id)
  select dp.organization_id, dpp.storage_path, 'daily_progress_photo', dpp.id
  from public.daily_progress_photos dpp join public.daily_progress dp on dp.id=dpp.daily_progress_id
  where dp.organization_id=target_org_id and dp.is_setup_data=true and dpp.storage_path is not null
  on conflict (organization_id, storage_path) do nothing;
  get diagnostics v_photo_count = row_count;
  insert into public.storage_cleanup_queue(organization_id, storage_path, source_type, source_id)
  select d.organization_id, d.storage_path, 'document', d.id
  from public.documents d where d.organization_id=target_org_id and d.is_setup_data=true and d.storage_path is not null
  on conflict (organization_id, storage_path) do nothing;
  get diagnostics v_doc_count = row_count;
  return v_photo_count + v_doc_count;
end;
$function$;

CREATE OR REPLACE FUNCTION public.get_setup_storage_paths(target_org_id uuid)
 RETURNS TABLE(bucket_id text, storage_path text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  if not exists (
    select 1 from public.organization_members om
    join public.roles r on r.id = om.role_id
    where om.organization_id = target_org_id
      and om.user_id = v_user_id
      and om.status = 'active'
      and lower(r.name) in ('owner','admin','organization admin')
  ) then raise exception 'Organization admin access required'; end if;

  return query
    select 'buildos-files'::text, d.storage_path
      from public.documents d
     where d.organization_id = target_org_id
       and d.is_setup_data = true
       and d.storage_path is not null
    union all
    select 'buildos-files'::text, p.storage_path
      from public.daily_progress_photos p
      join public.daily_progress dp on dp.id = p.daily_progress_id
     where dp.organization_id = target_org_id
       and dp.is_setup_data = true
       and p.storage_path is not null;
end;
$function$;

CREATE OR REPLACE FUNCTION public.cleanup_setup_storage_files(target_org_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_user_id uuid := auth.uid();
  v_is_admin boolean;
  v_deleted_documents integer := 0;
  v_deleted_photos integer := 0;
  v_paths jsonb := '[]'::jsonb;
begin
  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  select exists (
    select 1
      from public.organization_members om
      join public.roles r on r.id = om.role_id
     where om.organization_id = target_org_id
       and om.user_id = v_user_id
       and om.status = 'active'
       and lower(r.name) in ('owner','admin','organization admin')
  ) into v_is_admin;

  if not v_is_admin then
    raise exception 'Organization admin access required';
  end if;

  select coalesce(jsonb_agg(jsonb_build_object('bucket','buildos-files','path',storage_path)), '[]'::jsonb)
    into v_paths
    from public.documents
   where organization_id = target_org_id
     and is_setup_data = true
     and storage_path is not null;

  select v_paths || coalesce(jsonb_agg(jsonb_build_object('bucket','buildos-files','path',storage_path)), '[]'::jsonb)
    into v_paths
    from public.daily_progress_photos dp
    join public.daily_progress p on p.id = dp.daily_progress_id
   where p.organization_id = target_org_id
     and p.is_setup_data = true;

  delete from public.documents
   where organization_id = target_org_id
     and is_setup_data = true;
  get diagnostics v_deleted_documents = row_count;

  delete from public.daily_progress_photos dp
   where dp.daily_progress_id in (
     select id from public.daily_progress where organization_id = target_org_id and is_setup_data = true
   );
  get diagnostics v_deleted_photos = row_count;

  return jsonb_build_object(
    'documents_deleted', v_deleted_documents,
    'photos_deleted', v_deleted_photos,
    'storage_objects', v_paths
  );
end;
$function$;

CREATE OR REPLACE FUNCTION public.go_live_workspace()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_user_id uuid := auth.uid();
  v_org_id uuid;
  v_mode text;
  v_expires_at timestamptz;
  v_counts jsonb := '{}'::jsonb;
  v_count bigint;
  v_storage_count bigint := 0;
begin
  select om.organization_id, wl.mode, wl.setup_expires_at
    into v_org_id, v_mode, v_expires_at
    from public.organization_members om
    join public.roles r on r.id = om.role_id
    join public.workspace_lifecycle wl on wl.organization_id = om.organization_id
   where om.user_id = v_user_id
     and om.status = 'active'
     and lower(r.name) in ('owner','admin','organization admin')
   limit 1;

  if v_org_id is null then raise exception 'Organization owner/admin access required'; end if;
  if v_mode = 'setup' and v_expires_at <= now() then
    perform public.expire_workspace_if_needed(v_org_id);
    v_mode := 'expired';
  end if;
  if v_mode <> 'setup' then raise exception 'Workspace is not in setup mode'; end if;
  if not exists (select 1 from public.branches where organization_id=v_org_id and status='active') then
    raise exception 'Create at least one active branch before Go Live';
  end if;

  insert into public.workspace_lifecycle_events(organization_id,event_type,performed_by,previous_mode,new_mode)
  values(v_org_id,'go_live_requested',v_user_id,'setup','setup');

  -- Queue private storage objects before their database parent rows are removed.
  v_storage_count := public.queue_setup_storage_for_cleanup(v_org_id);

  delete from public.payments where organization_id=v_org_id and is_setup_data=true;
  get diagnostics v_count = row_count; v_counts := v_counts || jsonb_build_object('payments',v_count);
  delete from public.invoices where organization_id=v_org_id and is_setup_data=true;
  get diagnostics v_count = row_count; v_counts := v_counts || jsonb_build_object('invoices',v_count);
  delete from public.goods_receipts where organization_id=v_org_id and is_setup_data=true;
  get diagnostics v_count = row_count; v_counts := v_counts || jsonb_build_object('goods_receipts',v_count);
  delete from public.purchase_orders where organization_id=v_org_id and is_setup_data=true;
  get diagnostics v_count = row_count; v_counts := v_counts || jsonb_build_object('purchase_orders',v_count);
  delete from public.vendor_quotations where organization_id=v_org_id and is_setup_data=true;
  get diagnostics v_count = row_count; v_counts := v_counts || jsonb_build_object('vendor_quotations',v_count);
  delete from public.quotations where organization_id=v_org_id and is_setup_data=true;
  get diagnostics v_count = row_count; v_counts := v_counts || jsonb_build_object('quotations',v_count);
  delete from public.material_transactions where organization_id=v_org_id and is_setup_data=true;
  get diagnostics v_count = row_count; v_counts := v_counts || jsonb_build_object('material_transactions',v_count);
  delete from public.material_requests where organization_id=v_org_id and is_setup_data=true;
  get diagnostics v_count = row_count; v_counts := v_counts || jsonb_build_object('material_requests',v_count);
  delete from public.expenses where organization_id=v_org_id and is_setup_data=true;
  get diagnostics v_count = row_count; v_counts := v_counts || jsonb_build_object('expenses',v_count);
  delete from public.labour_allocations where organization_id=v_org_id and is_setup_data=true;
  get diagnostics v_count = row_count; v_counts := v_counts || jsonb_build_object('labour_allocations',v_count);
  delete from public.attendance where organization_id=v_org_id and is_setup_data=true;
  get diagnostics v_count = row_count; v_counts := v_counts || jsonb_build_object('attendance',v_count);
  delete from public.daily_progress where organization_id=v_org_id and is_setup_data=true;
  get diagnostics v_count = row_count; v_counts := v_counts || jsonb_build_object('daily_progress',v_count);
  delete from public.tasks where organization_id=v_org_id and is_setup_data=true;
  get diagnostics v_count = row_count; v_counts := v_counts || jsonb_build_object('tasks',v_count);
  delete from public.documents where organization_id=v_org_id and is_setup_data=true;
  get diagnostics v_count = row_count; v_counts := v_counts || jsonb_build_object('documents',v_count);

  update public.workspace_lifecycle
     set mode='live', go_live_at=now(), go_live_by=v_user_id, updated_at=now()
   where organization_id=v_org_id;

  insert into public.workspace_lifecycle_events(organization_id,event_type,performed_by,previous_mode,new_mode,metadata)
  values(v_org_id,'go_live_completed',v_user_id,'setup','live',jsonb_build_object('deleted_setup_data',v_counts,'storage_cleanup_queued',v_storage_count));

  return jsonb_build_object('success',true,'mode','live','deleted_setup_data',v_counts,'storage_cleanup_queued',v_storage_count);
exception when others then
  if v_org_id is not null then
    insert into public.workspace_lifecycle_events(organization_id,event_type,performed_by,previous_mode,new_mode,metadata)
    values(v_org_id,'go_live_failed',v_user_id,coalesce(v_mode,'setup'),coalesce(v_mode,'setup'),jsonb_build_object('error',sqlerrm));
  end if;
  raise;
end;
$function$;

-- ============================================================
-- Setup extension requests
-- ============================================================

CREATE OR REPLACE FUNCTION public.request_setup_extension(p_requested_days integer, p_reason text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare v_user_id uuid := auth.uid(); v_org_id uuid; v_request_id uuid;
begin
 if v_user_id is null then raise exception 'Authentication required'; end if;
 select organization_id into v_org_id from public.organization_members where user_id=v_user_id and status='active' limit 1;
 if v_org_id is null then raise exception 'Organization membership required'; end if;
 if p_requested_days < 1 or p_requested_days > 30 then raise exception 'Extension must be between 1 and 30 days'; end if;
 if not exists (select 1 from public.workspace_lifecycle where organization_id=v_org_id and mode='expired') then raise exception 'Setup extension is available only for an expired workspace'; end if;
 if exists (select 1 from public.setup_extension_requests where organization_id=v_org_id and status='pending') then raise exception 'An extension request is already pending'; end if;
 insert into public.setup_extension_requests(organization_id,requested_by,requested_days,reason) values(v_org_id,v_user_id,p_requested_days,nullif(trim(p_reason),'')) returning id into v_request_id;
 return v_request_id;
end; $function$;

CREATE OR REPLACE FUNCTION public.review_setup_extension(p_request_id uuid, p_decision text, p_review_notes text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare v_user_id uuid := auth.uid(); v_org_id uuid; v_request public.setup_extension_requests%rowtype; v_new_expiry timestamptz;
begin
 if v_user_id is null then raise exception 'Authentication required'; end if;
 select organization_id into v_org_id from public.organization_members om join public.roles r on r.id=om.role_id where om.user_id=v_user_id and om.status='active' and lower(r.name) in ('owner','admin','organization admin') limit 1;
 if v_org_id is null then raise exception 'Organization administrator access required'; end if;
 select * into v_request from public.setup_extension_requests where id=p_request_id and organization_id=v_org_id for update;
 if not found then raise exception 'Extension request not found'; end if;
 if v_request.status <> 'pending' then raise exception 'Extension request is no longer pending'; end if;
 if p_decision not in ('approved','rejected') then raise exception 'Decision must be approved or rejected'; end if;
 if p_decision='approved' then
   update public.workspace_lifecycle set mode='setup', setup_expires_at=greatest(setup_expires_at, now()) + make_interval(days => v_request.requested_days), updated_at=now() where organization_id=v_org_id;
   select setup_expires_at into v_new_expiry from public.workspace_lifecycle where organization_id=v_org_id;
 else
   v_new_expiry := null;
 end if;
 update public.setup_extension_requests set status=p_decision, reviewed_by=v_user_id, reviewed_at=now(), review_notes=nullif(trim(p_review_notes),''), updated_at=now() where id=p_request_id;
 insert into public.workspace_lifecycle_events(organization_id,event_type,performed_by,previous_mode,new_mode,metadata) values(v_org_id,case when p_decision='approved' then 'setup_extended' else 'setup_expired' end,v_user_id,'expired',case when p_decision='approved' then 'setup' else 'expired' end,jsonb_build_object('request_id',p_request_id,'requested_days',v_request.requested_days,'review_notes',p_review_notes));
 return jsonb_build_object('status',p_decision,'setup_expires_at',v_new_expiry);
end; $function$;

CREATE OR REPLACE FUNCTION public.platform_review_setup_extension(p_request_id uuid, p_decision text, p_review_notes text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare v_user_id uuid:=auth.uid(); v_request public.setup_extension_requests%rowtype; v_new_expiry timestamptz;
begin
 if v_user_id is null or not exists(select 1 from public.users where id=v_user_id and platform_role='platform_admin') then raise exception 'Platform administrator access required'; end if;
 select * into v_request from public.setup_extension_requests where id=p_request_id for update;
 if not found then raise exception 'Extension request not found'; end if;
 if v_request.status <> 'pending' then raise exception 'Extension request is no longer pending'; end if;
 if p_decision not in ('approved','rejected') then raise exception 'Decision must be approved or rejected'; end if;
 if p_decision='approved' then
   update public.workspace_lifecycle set mode='setup', setup_expires_at=greatest(setup_expires_at,now())+make_interval(days=>v_request.requested_days), updated_at=now() where organization_id=v_request.organization_id;
   select setup_expires_at into v_new_expiry from public.workspace_lifecycle where organization_id=v_request.organization_id;
 else v_new_expiry:=null; end if;
 update public.setup_extension_requests set status=p_decision,reviewed_by=v_user_id,reviewed_at=now(),review_notes=nullif(trim(p_review_notes),''),updated_at=now() where id=p_request_id;
 insert into public.workspace_lifecycle_events(organization_id,event_type,performed_by,previous_mode,new_mode,metadata) values(v_request.organization_id,case when p_decision='approved' then 'setup_extended' else 'setup_expired' end,v_user_id,'expired',case when p_decision='approved' then 'setup' else 'expired' end,jsonb_build_object('request_id',p_request_id,'requested_days',v_request.requested_days,'review_notes',p_review_notes,'platform_review',true));
 return jsonb_build_object('status',p_decision,'setup_expires_at',v_new_expiry);
end; $function$;

-- ============================================================
-- Master data imports
-- ============================================================

CREATE OR REPLACE FUNCTION public.import_customers(p_rows jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_user_id uuid := auth.uid();
  v_org_id uuid;
  v_row jsonb;
  v_name text;
  v_email text;
  v_phone text;
  v_error text;
  v_errors jsonb := '[]'::jsonb;
  v_valid integer := 0;
  v_imported integer := 0;
  v_row_number integer := 0;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  if jsonb_typeof(p_rows) <> 'array' then raise exception 'Import rows must be a JSON array'; end if;
  if jsonb_array_length(p_rows) = 0 then raise exception 'No rows to import'; end if;
  if jsonb_array_length(p_rows) > 5000 then raise exception 'Maximum 5000 rows per import'; end if;

  select om.organization_id into v_org_id
  from organization_members om
  join roles r on r.id = om.role_id
  where om.user_id = v_user_id and om.status = 'active'
    and lower(r.name) in ('owner','admin','organization admin')
  limit 1;
  if v_org_id is null then raise exception 'Organization admin access required'; end if;

  for v_row in select value from jsonb_array_elements(p_rows) loop
    v_row_number := v_row_number + 1;
    v_name := nullif(trim(coalesce(v_row->>'name','')), '');
    v_email := lower(nullif(trim(coalesce(v_row->>'email','')), ''));
    v_phone := nullif(trim(coalesce(v_row->>'phone','')), '');
    v_error := null;

    if v_name is null then v_error := 'Name is required';
    elsif v_email is not null and v_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then v_error := 'Email format is invalid';
    elsif v_email is not null and exists (select 1 from customers c where c.organization_id=v_org_id and lower(c.email)=v_email) then v_error := 'Email already exists';
    elsif v_phone is not null and exists (select 1 from customers c where c.organization_id=v_org_id and regexp_replace(c.phone,'[^0-9]','','g')=regexp_replace(v_phone,'[^0-9]','','g')) then v_error := 'Phone already exists';
    end if;

    if v_error is not null then
      v_errors := v_errors || jsonb_build_array(jsonb_build_object('row',v_row_number,'error',v_error));
    else
      v_valid := v_valid + 1;
    end if;
  end loop;

  if jsonb_array_length(v_errors) > 0 then
    return jsonb_build_object('success',false,'imported',0,'valid_rows',v_valid,'error_rows',jsonb_array_length(v_errors),'errors',v_errors);
  end if;

  for v_row in select value from jsonb_array_elements(p_rows) loop
    insert into customers (organization_id, name, email, phone, status)
    values (v_org_id, trim(v_row->>'name'), lower(nullif(trim(v_row->>'email'),'')), nullif(trim(v_row->>'phone'),''), 'active');
    v_imported := v_imported + 1;
  end loop;

  return jsonb_build_object('success',true,'imported',v_imported,'valid_rows',v_valid,'error_rows',0,'errors','[]'::jsonb);
end;
$function$;

CREATE OR REPLACE FUNCTION public.import_vendors(p_rows jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare v_uid uuid:=auth.uid(); v_org uuid; v_row jsonb; v_count int:=0; v_name text; v_email text; v_phone text; v_branch uuid;
begin
 select organization_id into v_org from organization_members om where om.user_id=v_uid and om.status='active' limit 1;
 if v_org is null or not is_org_admin(v_org) then raise exception 'Organization admin access required'; end if;
 if jsonb_array_length(coalesce(p_rows,'[]'::jsonb))=0 or jsonb_array_length(p_rows)>5000 then raise exception 'Import must contain between 1 and 5000 rows'; end if;
 for v_row in select * from jsonb_array_elements(p_rows) loop
  v_name:=nullif(trim(v_row->>'name'),''); v_email:=nullif(lower(trim(v_row->>'email')),''); v_phone:=nullif(trim(v_row->>'phone'),'');
  if v_name is null then raise exception 'Vendor name is required'; end if;
  if v_email is not null and v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'Invalid vendor email: %',v_email; end if;
  if exists(select 1 from vendors where organization_id=v_org and ((v_email is not null and lower(email)=v_email) or (v_phone is not null and phone=v_phone))) then raise exception 'Duplicate vendor found: %',v_name; end if;
  select id into v_branch from branches where organization_id=v_org and status='active' order by created_at limit 1;
  insert into vendors(organization_id,branch_id,name,email,phone,status) values(v_org,v_branch,v_name,v_email,v_phone,'active'); v_count:=v_count+1;
 end loop;
 return jsonb_build_object('imported',v_count);
end; $function$;

CREATE OR REPLACE FUNCTION public.import_workers(p_rows jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare v_uid uuid:=auth.uid(); v_org uuid; v_row jsonb; v_count int:=0; v_name text; v_phone text; v_role text;
begin
 select organization_id into v_org from organization_members om where om.user_id=v_uid and om.status='active' limit 1;
 if v_org is null or not is_org_admin(v_org) then raise exception 'Organization admin access required'; end if;
 if jsonb_array_length(coalesce(p_rows,'[]'::jsonb))=0 or jsonb_array_length(p_rows)>5000 then raise exception 'Import must contain between 1 and 5000 rows'; end if;
 for v_row in select * from jsonb_array_elements(p_rows) loop
  v_name:=nullif(trim(v_row->>'name'),''); v_phone:=nullif(trim(v_row->>'phone'),''); v_role:=nullif(trim(v_row->>'role'),'');
  if v_name is null then raise exception 'Worker name is required'; end if;
  if exists(select 1 from workers where organization_id=v_org and v_phone is not null and phone=v_phone) then raise exception 'Duplicate worker phone found: %',v_phone; end if;
  insert into workers(organization_id,name,phone,role,status) values(v_org,v_name,v_phone,v_role,'active'); v_count:=v_count+1;
 end loop;
 return jsonb_build_object('imported',v_count);
end; $function$;

CREATE OR REPLACE FUNCTION public.import_materials(p_rows jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare v_uid uuid:=auth.uid(); v_org uuid; v_row jsonb; v_count int:=0; v_name text; v_unit text; v_category text;
begin
 select organization_id into v_org from organization_members om where om.user_id=v_uid and om.status='active' limit 1;
 if v_org is null or not is_org_admin(v_org) then raise exception 'Organization admin access required'; end if;
 if jsonb_array_length(coalesce(p_rows,'[]'::jsonb))=0 or jsonb_array_length(p_rows)>5000 then raise exception 'Import must contain between 1 and 5000 rows'; end if;
 for v_row in select * from jsonb_array_elements(p_rows) loop
  v_name:=nullif(trim(v_row->>'name'),''); v_unit:=nullif(trim(v_row->>'unit'),''); v_category:=nullif(trim(v_row->>'category'),'');
  if v_name is null or v_unit is null then raise exception 'Material name and unit are required'; end if;
  if exists(select 1 from materials where organization_id=v_org and lower(name)=lower(v_name)) then raise exception 'Duplicate material found: %',v_name; end if;
  insert into materials(organization_id,name,unit,category,status) values(v_org,v_name,v_unit,v_category,'active'); v_count:=v_count+1;
 end loop;
 return jsonb_build_object('imported',v_count);
end; $function$;

-- 3) TRIGGERS
-- ============================================================
-- Triggers
-- ============================================================

CREATE TRIGGER organizations_initialize_workspace_lifecycle
  AFTER INSERT ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION initialize_workspace_lifecycle();

CREATE TRIGGER enforce_workspace_writable
  BEFORE INSERT ON public.attendance
  FOR EACH ROW EXECUTE FUNCTION assert_workspace_writable();
CREATE TRIGGER attendance_mark_setup_data
  BEFORE INSERT ON public.attendance
  FOR EACH ROW EXECUTE FUNCTION mark_new_transaction_as_setup_data();

CREATE TRIGGER enforce_workspace_writable
  BEFORE INSERT ON public.daily_progress
  FOR EACH ROW EXECUTE FUNCTION assert_workspace_writable();
CREATE TRIGGER daily_progress_mark_setup_data
  BEFORE INSERT ON public.daily_progress
  FOR EACH ROW EXECUTE FUNCTION mark_new_transaction_as_setup_data();

CREATE TRIGGER enforce_workspace_writable
  BEFORE INSERT ON public.documents
  FOR EACH ROW EXECUTE FUNCTION assert_workspace_writable();
CREATE TRIGGER documents_mark_setup_data
  BEFORE INSERT ON public.documents
  FOR EACH ROW EXECUTE FUNCTION mark_new_transaction_as_setup_data();

CREATE TRIGGER enforce_workspace_writable
  BEFORE INSERT ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION assert_workspace_writable();
CREATE TRIGGER expenses_mark_setup_data
  BEFORE INSERT ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION mark_new_transaction_as_setup_data();

CREATE TRIGGER enforce_workspace_writable
  BEFORE INSERT ON public.goods_receipts
  FOR EACH ROW EXECUTE FUNCTION assert_workspace_writable();
CREATE TRIGGER goods_receipts_mark_setup_data
  BEFORE INSERT ON public.goods_receipts
  FOR EACH ROW EXECUTE FUNCTION mark_new_transaction_as_setup_data();

CREATE TRIGGER enforce_workspace_writable
  BEFORE INSERT ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION assert_workspace_writable();
CREATE TRIGGER invoices_mark_setup_data
  BEFORE INSERT ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION mark_new_transaction_as_setup_data();

CREATE TRIGGER enforce_workspace_writable
  BEFORE INSERT ON public.labour_allocations
  FOR EACH ROW EXECUTE FUNCTION assert_workspace_writable();
CREATE TRIGGER labour_allocations_mark_setup_data
  BEFORE INSERT ON public.labour_allocations
  FOR EACH ROW EXECUTE FUNCTION mark_new_transaction_as_setup_data();

CREATE TRIGGER enforce_workspace_writable
  BEFORE INSERT ON public.material_requests
  FOR EACH ROW EXECUTE FUNCTION assert_workspace_writable();
CREATE TRIGGER material_requests_mark_setup_data
  BEFORE INSERT ON public.material_requests
  FOR EACH ROW EXECUTE FUNCTION mark_new_transaction_as_setup_data();

CREATE TRIGGER enforce_workspace_writable
  BEFORE INSERT ON public.material_transactions
  FOR EACH ROW EXECUTE FUNCTION assert_workspace_writable();
CREATE TRIGGER material_transactions_mark_setup_data
  BEFORE INSERT ON public.material_transactions
  FOR EACH ROW EXECUTE FUNCTION mark_new_transaction_as_setup_data();

CREATE TRIGGER enforce_workspace_writable
  BEFORE INSERT ON public.payments
  FOR EACH ROW EXECUTE FUNCTION assert_workspace_writable();
CREATE TRIGGER payments_mark_setup_data
  BEFORE INSERT ON public.payments
  FOR EACH ROW EXECUTE FUNCTION mark_new_transaction_as_setup_data();

CREATE TRIGGER enforce_workspace_writable
  BEFORE INSERT ON public.purchase_orders
  FOR EACH ROW EXECUTE FUNCTION assert_workspace_writable();
CREATE TRIGGER purchase_orders_mark_setup_data
  BEFORE INSERT ON public.purchase_orders
  FOR EACH ROW EXECUTE FUNCTION mark_new_transaction_as_setup_data();

CREATE TRIGGER enforce_workspace_writable
  BEFORE INSERT ON public.quotations
  FOR EACH ROW EXECUTE FUNCTION assert_workspace_writable();
CREATE TRIGGER quotations_mark_setup_data
  BEFORE INSERT ON public.quotations
  FOR EACH ROW EXECUTE FUNCTION mark_new_transaction_as_setup_data();

CREATE TRIGGER enforce_workspace_writable
  BEFORE INSERT ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION assert_workspace_writable();
CREATE TRIGGER tasks_mark_setup_data
  BEFORE INSERT ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION mark_new_transaction_as_setup_data();

CREATE TRIGGER enforce_workspace_writable
  BEFORE INSERT ON public.vendor_quotations
  FOR EACH ROW EXECUTE FUNCTION assert_workspace_writable();
CREATE TRIGGER vendor_quotations_mark_setup_data
  BEFORE INSERT ON public.vendor_quotations
  FOR EACH ROW EXECUTE FUNCTION mark_new_transaction_as_setup_data();

-- 4) RLS POLICIES
-- ============================================================
-- Row Level Security policies
-- ============================================================
CREATE POLICY "attendance project access" ON public."attendance" FOR SELECT USING (has_project_access(project_id));
CREATE POLICY "attendance project access delete" ON public."attendance" FOR DELETE USING (has_project_access(project_id));
CREATE POLICY "attendance project access insert" ON public."attendance" FOR INSERT WITH CHECK (has_project_access(project_id));
CREATE POLICY "attendance project access update" ON public."attendance" FOR UPDATE USING (has_project_access(project_id)) WITH CHECK (has_project_access(project_id));
CREATE POLICY "members read audit logs" ON public."audit_logs" FOR SELECT USING (is_org_member(organization_id));
CREATE POLICY "org admins manage branches" ON public."branches" FOR ALL USING (is_org_admin(organization_id)) WITH CHECK (is_org_admin(organization_id));
CREATE POLICY "org members can read branches" ON public."branches" FOR SELECT USING (is_org_member(organization_id));
CREATE POLICY "customer admin delete" ON public."customers" FOR DELETE USING (is_org_admin(organization_id));
CREATE POLICY "customer branch access" ON public."customers" FOR SELECT USING ((((branch_id IS NULL) AND is_org_member(organization_id)) OR ((branch_id IS NOT NULL) AND has_branch_access(branch_id))));
CREATE POLICY "customer branch insert" ON public."customers" FOR INSERT WITH CHECK ((is_org_member(organization_id) AND ((branch_id IS NULL) OR has_branch_access(branch_id))));
CREATE POLICY "customer branch update" ON public."customers" FOR UPDATE USING ((is_org_member(organization_id) AND ((branch_id IS NULL) OR has_branch_access(branch_id)))) WITH CHECK ((is_org_member(organization_id) AND ((branch_id IS NULL) OR has_branch_access(branch_id))));
CREATE POLICY "progress project access" ON public."daily_progress" FOR SELECT USING (has_project_access(project_id));
CREATE POLICY "progress project access delete" ON public."daily_progress" FOR DELETE USING (has_project_access(project_id));
CREATE POLICY "progress project access insert" ON public."daily_progress" FOR INSERT WITH CHECK (has_project_access(project_id));
CREATE POLICY "progress project access update" ON public."daily_progress" FOR UPDATE USING (has_project_access(project_id)) WITH CHECK (has_project_access(project_id));
CREATE POLICY "progress items project access" ON public."daily_progress_items" FOR ALL USING ((EXISTS ( SELECT 1 FROM daily_progress dp WHERE ((dp.id = daily_progress_items.daily_progress_id) AND has_project_access(dp.project_id))))) WITH CHECK ((EXISTS ( SELECT 1 FROM daily_progress dp WHERE ((dp.id = daily_progress_items.daily_progress_id) AND has_project_access(dp.project_id)))));
CREATE POLICY "progress photos project access" ON public."daily_progress_photos" FOR ALL USING ((EXISTS ( SELECT 1 FROM daily_progress dp WHERE ((dp.id = daily_progress_photos.daily_progress_id) AND has_project_access(dp.project_id))))) WITH CHECK ((EXISTS ( SELECT 1 FROM daily_progress dp WHERE ((dp.id = daily_progress_photos.daily_progress_id) AND has_project_access(dp.project_id)))));
CREATE POLICY "documents delete" ON public."documents" FOR DELETE USING (is_org_admin(organization_id));
CREATE POLICY "documents insert" ON public."documents" FOR INSERT WITH CHECK ((is_org_member(organization_id) AND ((project_id IS NULL) OR has_project_access(project_id))));
CREATE POLICY "documents project access" ON public."documents" FOR SELECT USING ((is_org_member(organization_id) AND ((project_id IS NULL) OR has_project_access(project_id))));
CREATE POLICY "documents update" ON public."documents" FOR UPDATE USING ((is_org_member(organization_id) AND ((project_id IS NULL) OR has_project_access(project_id)))) WITH CHECK ((is_org_member(organization_id) AND ((project_id IS NULL) OR has_project_access(project_id))));
CREATE POLICY "members access expense categories" ON public."expense_categories" FOR ALL USING (is_org_member(organization_id)) WITH CHECK (is_org_member(organization_id));
CREATE POLICY "expenses delete" ON public."expenses" FOR DELETE USING (is_org_admin(organization_id));
CREATE POLICY "expenses insert" ON public."expenses" FOR INSERT WITH CHECK ((is_org_member(organization_id) AND ((project_id IS NULL) OR has_project_access(project_id))));
CREATE POLICY "expenses org/project access" ON public."expenses" FOR SELECT USING ((((project_id IS NULL) AND is_org_member(organization_id)) OR ((project_id IS NOT NULL) AND has_project_access(project_id))));
CREATE POLICY "expenses update" ON public."expenses" FOR UPDATE USING ((is_org_member(organization_id) AND ((project_id IS NULL) OR has_project_access(project_id)))) WITH CHECK ((is_org_member(organization_id) AND ((project_id IS NULL) OR has_project_access(project_id))));
CREATE POLICY "goods receipt items access" ON public."goods_receipt_items" FOR ALL USING ((EXISTS ( SELECT 1 FROM (goods_receipts gr JOIN purchase_orders po ON ((po.id = gr.purchase_order_id))) WHERE ((gr.id = goods_receipt_items.goods_receipt_id) AND (((po.project_id IS NULL) AND is_org_member(po.organization_id)) OR ((po.project_id IS NOT NULL) AND has_project_access(po.project_id))))))) WITH CHECK ((EXISTS ( SELECT 1 FROM (goods_receipts gr JOIN purchase_orders po ON ((po.id = gr.purchase_order_id))) WHERE ((gr.id = goods_receipt_items.goods_receipt_id) AND (((po.project_id IS NULL) AND is_org_member(po.organization_id)) OR ((po.project_id IS NOT NULL) AND has_project_access(po.project_id)))))));
CREATE POLICY "goods receipts delete" ON public."goods_receipts" FOR DELETE USING (is_org_admin(organization_id));
CREATE POLICY "goods receipts insert" ON public."goods_receipts" FOR INSERT WITH CHECK (is_org_member(organization_id));
CREATE POLICY "goods receipts org/project access" ON public."goods_receipts" FOR SELECT USING (is_org_member(organization_id));
CREATE POLICY "goods receipts update" ON public."goods_receipts" FOR UPDATE USING (is_org_member(organization_id)) WITH CHECK (is_org_member(organization_id));
CREATE POLICY "invoice items access" ON public."invoice_items" FOR ALL USING ((EXISTS ( SELECT 1 FROM invoices i WHERE ((i.id = invoice_items.invoice_id) AND (((i.project_id IS NULL) AND is_org_member(i.organization_id)) OR ((i.project_id IS NOT NULL) AND has_project_access(i.project_id))))))) WITH CHECK ((EXISTS ( SELECT 1 FROM invoices i WHERE ((i.id = invoice_items.invoice_id) AND (((i.project_id IS NULL) AND is_org_member(i.organization_id)) OR ((i.project_id IS NOT NULL) AND has_project_access(i.project_id)))))));
CREATE POLICY "invoices delete" ON public."invoices" FOR DELETE USING (is_org_admin(organization_id));
CREATE POLICY "invoices insert" ON public."invoices" FOR INSERT WITH CHECK ((is_org_member(organization_id) AND ((project_id IS NULL) OR has_project_access(project_id))));
CREATE POLICY "invoices org/project access" ON public."invoices" FOR SELECT USING ((is_org_member(organization_id) AND ((project_id IS NULL) OR has_project_access(project_id))));
CREATE POLICY "invoices update" ON public."invoices" FOR UPDATE USING ((is_org_member(organization_id) AND ((project_id IS NULL) OR has_project_access(project_id)))) WITH CHECK ((is_org_member(organization_id) AND ((project_id IS NULL) OR has_project_access(project_id))));
CREATE POLICY "labour project access" ON public."labour_allocations" FOR SELECT USING (has_project_access(project_id));
CREATE POLICY "labour project access delete" ON public."labour_allocations" FOR DELETE USING (has_project_access(project_id));
CREATE POLICY "labour project access insert" ON public."labour_allocations" FOR INSERT WITH CHECK (has_project_access(project_id));
CREATE POLICY "labour project access update" ON public."labour_allocations" FOR UPDATE USING (has_project_access(project_id)) WITH CHECK (has_project_access(project_id));
CREATE POLICY "material request items project access" ON public."material_request_items" FOR ALL USING ((EXISTS ( SELECT 1 FROM material_requests mr WHERE ((mr.id = material_request_items.material_request_id) AND has_project_access(mr.project_id))))) WITH CHECK ((EXISTS ( SELECT 1 FROM material_requests mr WHERE ((mr.id = material_request_items.material_request_id) AND has_project_access(mr.project_id)))));
CREATE POLICY "material requests delete" ON public."material_requests" FOR DELETE USING (has_project_access(project_id));
CREATE POLICY "material requests insert" ON public."material_requests" FOR INSERT WITH CHECK (has_project_access(project_id));
CREATE POLICY "material requests project access" ON public."material_requests" FOR SELECT USING (has_project_access(project_id));
CREATE POLICY "material requests update" ON public."material_requests" FOR UPDATE USING (has_project_access(project_id)) WITH CHECK (has_project_access(project_id));
CREATE POLICY "material transactions delete" ON public."material_transactions" FOR DELETE USING (is_org_admin(organization_id));
CREATE POLICY "material transactions insert" ON public."material_transactions" FOR INSERT WITH CHECK (has_project_access(project_id));
CREATE POLICY "material transactions project access" ON public."material_transactions" FOR SELECT USING (has_project_access(project_id));
CREATE POLICY "material transactions update" ON public."material_transactions" FOR UPDATE USING (has_project_access(project_id)) WITH CHECK (has_project_access(project_id));
CREATE POLICY "members access materials" ON public."materials" FOR ALL USING (is_org_member(organization_id)) WITH CHECK (is_org_member(organization_id));
CREATE POLICY "admins manage branch access" ON public."member_branch_access" FOR ALL USING ((EXISTS ( SELECT 1 FROM organization_members om WHERE ((om.id = member_branch_access.member_id) AND is_org_admin(om.organization_id))))) WITH CHECK ((EXISTS ( SELECT 1 FROM organization_members om WHERE ((om.id = member_branch_access.member_id) AND is_org_admin(om.organization_id)))));
CREATE POLICY "members can read branch access" ON public."member_branch_access" FOR SELECT USING ((EXISTS ( SELECT 1 FROM organization_members om WHERE ((om.id = member_branch_access.member_id) AND is_org_member(om.organization_id)))));
CREATE POLICY "notification events admins" ON public."notification_events" FOR ALL USING (is_org_admin(organization_id)) WITH CHECK (is_org_admin(organization_id));
CREATE POLICY "members access notifications" ON public."notifications" FOR SELECT USING ((is_org_member(organization_id) AND (user_id = auth.uid())));
CREATE POLICY "users update notifications" ON public."notifications" FOR UPDATE USING ((is_org_member(organization_id) AND (user_id = auth.uid()))) WITH CHECK ((is_org_member(organization_id) AND (user_id = auth.uid())));
CREATE POLICY "admins manage org memberships" ON public."organization_members" FOR ALL USING (is_org_admin(organization_id)) WITH CHECK (is_org_admin(organization_id));
CREATE POLICY "members can read org memberships" ON public."organization_members" FOR SELECT USING (is_org_member(organization_id));
CREATE POLICY "members can read organizations" ON public."organizations" FOR SELECT USING (is_org_member(id));
CREATE POLICY "platform admins can read all organizations" ON public."organizations" FOR SELECT USING ((EXISTS ( SELECT 1 FROM users u WHERE ((u.id = auth.uid()) AND (u.platform_role = 'platform_admin'::text)))));
CREATE POLICY "payments delete" ON public."payments" FOR DELETE USING (is_org_admin(organization_id));
CREATE POLICY "payments insert" ON public."payments" FOR INSERT WITH CHECK (is_org_member(organization_id));
CREATE POLICY "payments invoice access" ON public."payments" FOR SELECT USING (is_org_member(organization_id));
CREATE POLICY "payments update" ON public."payments" FOR UPDATE USING (is_org_member(organization_id)) WITH CHECK (is_org_member(organization_id));
CREATE POLICY "authenticated can read permissions" ON public."permissions" FOR SELECT USING ((auth.uid() IS NOT NULL));
CREATE POLICY "project materials access" ON public."project_materials" FOR SELECT USING (has_project_access(project_id));
CREATE POLICY "project materials delete" ON public."project_materials" FOR DELETE USING (has_project_access(project_id));
CREATE POLICY "project materials insert" ON public."project_materials" FOR INSERT WITH CHECK (has_project_access(project_id));
CREATE POLICY "project materials update" ON public."project_materials" FOR UPDATE USING (has_project_access(project_id)) WITH CHECK (has_project_access(project_id));
CREATE POLICY "project members admin delete" ON public."project_members" FOR DELETE USING ((EXISTS ( SELECT 1 FROM projects p WHERE ((p.id = project_members.project_id) AND is_org_admin(p.organization_id)))));
CREATE POLICY "project members admin insert" ON public."project_members" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1 FROM projects p WHERE ((p.id = project_members.project_id) AND is_org_admin(p.organization_id)))));
CREATE POLICY "project members admin update" ON public."project_members" FOR UPDATE USING ((EXISTS ( SELECT 1 FROM projects p WHERE ((p.id = project_members.project_id) AND is_org_admin(p.organization_id))))) WITH CHECK ((EXISTS ( SELECT 1 FROM projects p WHERE ((p.id = project_members.project_id) AND is_org_admin(p.organization_id)))));
CREATE POLICY "project members read" ON public."project_members" FOR SELECT USING (has_project_access(project_id));
CREATE POLICY "site project access" ON public."project_sites" FOR SELECT USING (has_project_access(project_id));
CREATE POLICY "site project access delete" ON public."project_sites" FOR DELETE USING (is_org_admin(organization_id));
CREATE POLICY "site project access insert" ON public."project_sites" FOR INSERT WITH CHECK (has_project_access(project_id));
CREATE POLICY "site project access update" ON public."project_sites" FOR UPDATE USING (has_project_access(project_id)) WITH CHECK (has_project_access(project_id));
CREATE POLICY "project access delete" ON public."projects" FOR DELETE USING (is_org_admin(organization_id));
CREATE POLICY "project access insert" ON public."projects" FOR INSERT WITH CHECK ((is_org_admin(organization_id) OR has_branch_access(branch_id)));
CREATE POLICY "project access select" ON public."projects" FOR SELECT USING (has_project_access(id));
CREATE POLICY "project access update" ON public."projects" FOR UPDATE USING (has_project_access(id)) WITH CHECK ((is_org_admin(organization_id) OR has_branch_access(branch_id)));
CREATE POLICY "purchase order items access" ON public."purchase_order_items" FOR ALL USING ((EXISTS ( SELECT 1 FROM purchase_orders po WHERE ((po.id = purchase_order_items.purchase_order_id) AND (((po.project_id IS NULL) AND is_org_member(po.organization_id)) OR ((po.project_id IS NOT NULL) AND has_project_access(po.project_id))))))) WITH CHECK ((EXISTS ( SELECT 1 FROM purchase_orders po WHERE ((po.id = purchase_order_items.purchase_order_id) AND (((po.project_id IS NULL) AND is_org_member(po.organization_id)) OR ((po.project_id IS NOT NULL) AND has_project_access(po.project_id)))))));
CREATE POLICY "purchase orders delete" ON public."purchase_orders" FOR DELETE USING (is_org_admin(organization_id));
CREATE POLICY "purchase orders insert" ON public."purchase_orders" FOR INSERT WITH CHECK ((is_org_member(organization_id) AND ((project_id IS NULL) OR has_project_access(project_id))));
CREATE POLICY "purchase orders project access" ON public."purchase_orders" FOR SELECT USING ((((project_id IS NULL) AND is_org_member(organization_id)) OR ((project_id IS NOT NULL) AND has_project_access(project_id))));
CREATE POLICY "purchase orders update" ON public."purchase_orders" FOR UPDATE USING ((is_org_member(organization_id) AND ((project_id IS NULL) OR has_project_access(project_id)))) WITH CHECK ((is_org_member(organization_id) AND ((project_id IS NULL) OR has_project_access(project_id))));
CREATE POLICY "quotation items access" ON public."quotation_items" FOR ALL USING ((EXISTS ( SELECT 1 FROM quotations q WHERE ((q.id = quotation_items.quotation_id) AND (((q.project_id IS NULL) AND is_org_member(q.organization_id)) OR ((q.project_id IS NOT NULL) AND has_project_access(q.project_id))))))) WITH CHECK ((EXISTS ( SELECT 1 FROM quotations q WHERE ((q.id = quotation_items.quotation_id) AND (((q.project_id IS NULL) AND is_org_member(q.organization_id)) OR ((q.project_id IS NOT NULL) AND has_project_access(q.project_id)))))));
CREATE POLICY "quotation revisions access" ON public."quotation_revisions" FOR ALL USING ((EXISTS ( SELECT 1 FROM quotations q WHERE ((q.id = quotation_revisions.quotation_id) AND (((q.project_id IS NULL) AND is_org_member(q.organization_id)) OR ((q.project_id IS NOT NULL) AND has_project_access(q.project_id))))))) WITH CHECK ((EXISTS ( SELECT 1 FROM quotations q WHERE ((q.id = quotation_revisions.quotation_id) AND (((q.project_id IS NULL) AND is_org_member(q.organization_id)) OR ((q.project_id IS NOT NULL) AND has_project_access(q.project_id)))))));
CREATE POLICY "quotations delete" ON public."quotations" FOR DELETE USING (is_org_admin(organization_id));
CREATE POLICY "quotations insert" ON public."quotations" FOR INSERT WITH CHECK ((is_org_member(organization_id) AND ((project_id IS NULL) OR has_project_access(project_id))));
CREATE POLICY "quotations org/project access" ON public."quotations" FOR SELECT USING ((is_org_member(organization_id) AND ((project_id IS NULL) OR has_project_access(project_id))));
CREATE POLICY "quotations update" ON public."quotations" FOR UPDATE USING ((is_org_member(organization_id) AND ((project_id IS NULL) OR has_project_access(project_id)))) WITH CHECK ((is_org_member(organization_id) AND ((project_id IS NULL) OR has_project_access(project_id))));
CREATE POLICY "admins manage role permissions" ON public."role_permissions" FOR ALL USING ((EXISTS ( SELECT 1 FROM roles r WHERE ((r.id = role_permissions.role_id) AND is_org_admin(r.organization_id))))) WITH CHECK ((EXISTS ( SELECT 1 FROM roles r WHERE ((r.id = role_permissions.role_id) AND is_org_admin(r.organization_id)))));
CREATE POLICY "members can read role permissions" ON public."role_permissions" FOR SELECT USING ((EXISTS ( SELECT 1 FROM roles r WHERE ((r.id = role_permissions.role_id) AND is_org_member(r.organization_id)))));
CREATE POLICY "admins manage roles" ON public."roles" FOR ALL USING (is_org_admin(organization_id)) WITH CHECK (is_org_admin(organization_id));
CREATE POLICY "members can read roles" ON public."roles" FOR SELECT USING (is_org_member(organization_id));
CREATE POLICY "members can read setup extension requests" ON public."setup_extension_requests" FOR SELECT USING (is_org_member(organization_id));
CREATE POLICY "members can request setup extension" ON public."setup_extension_requests" FOR INSERT WITH CHECK ((is_org_member(organization_id) AND (requested_by = auth.uid()) AND (status = 'pending'::text)));
CREATE POLICY "platform admins can read all extension requests" ON public."setup_extension_requests" FOR SELECT USING ((EXISTS ( SELECT 1 FROM users u WHERE ((u.id = auth.uid()) AND (u.platform_role = 'platform_admin'::text)))));
CREATE POLICY "platform admins can update extension requests" ON public."setup_extension_requests" FOR UPDATE USING ((EXISTS ( SELECT 1 FROM users u WHERE ((u.id = auth.uid()) AND (u.platform_role = 'platform_admin'::text))))) WITH CHECK ((EXISTS ( SELECT 1 FROM users u WHERE ((u.id = auth.uid()) AND (u.platform_role = 'platform_admin'::text)))));
CREATE POLICY "org admins can read storage cleanup queue" ON public."storage_cleanup_queue" FOR SELECT USING (is_org_admin(organization_id));
CREATE POLICY "task dependencies project access" ON public."task_dependencies" FOR ALL USING ((EXISTS ( SELECT 1 FROM tasks t WHERE ((t.id = task_dependencies.task_id) AND has_project_access(t.project_id))))) WITH CHECK ((EXISTS ( SELECT 1 FROM tasks t WHERE ((t.id = task_dependencies.task_id) AND has_project_access(t.project_id)))));
CREATE POLICY "task project access" ON public."tasks" FOR SELECT USING (has_project_access(project_id));
CREATE POLICY "task project access delete" ON public."tasks" FOR DELETE USING (has_project_access(project_id));
CREATE POLICY "task project access insert" ON public."tasks" FOR INSERT WITH CHECK (has_project_access(project_id));
CREATE POLICY "task project access update" ON public."tasks" FOR UPDATE USING (has_project_access(project_id)) WITH CHECK (has_project_access(project_id));
CREATE POLICY "platform admins can read all users" ON public."users" FOR SELECT USING ((platform_role = 'platform_admin'::text));
CREATE POLICY "users can read own profile" ON public."users" FOR SELECT USING ((id = auth.uid()));
CREATE POLICY "users can update own profile" ON public."users" FOR UPDATE USING ((id = auth.uid())) WITH CHECK ((id = auth.uid()));
CREATE POLICY "vendor quotation items access" ON public."vendor_quotation_items" FOR ALL USING ((EXISTS ( SELECT 1 FROM vendor_quotations vq WHERE ((vq.id = vendor_quotation_items.vendor_quotation_id) AND (((vq.project_id IS NULL) AND is_org_member(vq.organization_id)) OR ((vq.project_id IS NOT NULL) AND has_project_access(vq.project_id))))))) WITH CHECK ((EXISTS ( SELECT 1 FROM vendor_quotations vq WHERE ((vq.id = vendor_quotation_items.vendor_quotation_id) AND (((vq.project_id IS NULL) AND is_org_member(vq.organization_id)) OR ((vq.project_id IS NOT NULL) AND has_project_access(vq.project_id)))))));
CREATE POLICY "vendor quotations delete" ON public."vendor_quotations" FOR DELETE USING (is_org_admin(organization_id));
CREATE POLICY "vendor quotations insert" ON public."vendor_quotations" FOR INSERT WITH CHECK ((is_org_member(organization_id) AND ((project_id IS NULL) OR has_project_access(project_id))));
CREATE POLICY "vendor quotations project access" ON public."vendor_quotations" FOR SELECT USING ((((project_id IS NULL) AND is_org_member(organization_id)) OR ((project_id IS NOT NULL) AND has_project_access(project_id))));
CREATE POLICY "vendor quotations update" ON public."vendor_quotations" FOR UPDATE USING ((is_org_member(organization_id) AND ((project_id IS NULL) OR has_project_access(project_id)))) WITH CHECK ((is_org_member(organization_id) AND ((project_id IS NULL) OR has_project_access(project_id))));
CREATE POLICY "members access vendors" ON public."vendors" FOR ALL USING (is_org_member(organization_id)) WITH CHECK (is_org_member(organization_id));
CREATE POLICY "worker admin delete" ON public."workers" FOR DELETE USING (is_org_admin(organization_id));
CREATE POLICY "worker branch access" ON public."workers" FOR SELECT USING ((((branch_id IS NULL) AND is_org_member(organization_id)) OR ((branch_id IS NOT NULL) AND has_branch_access(branch_id))));
CREATE POLICY "worker branch insert" ON public."workers" FOR INSERT WITH CHECK ((is_org_member(organization_id) AND ((branch_id IS NULL) OR has_branch_access(branch_id))));
CREATE POLICY "worker branch update" ON public."workers" FOR UPDATE USING ((is_org_member(organization_id) AND ((branch_id IS NULL) OR has_branch_access(branch_id)))) WITH CHECK ((is_org_member(organization_id) AND ((branch_id IS NULL) OR has_branch_access(branch_id))));
CREATE POLICY "admins manage workspace lifecycle" ON public."workspace_lifecycle" FOR ALL USING (is_org_admin(organization_id)) WITH CHECK (is_org_admin(organization_id));
CREATE POLICY "members can read workspace lifecycle" ON public."workspace_lifecycle" FOR SELECT USING (is_org_member(organization_id));
CREATE POLICY "platform admins can read all workspace lifecycles" ON public."workspace_lifecycle" FOR SELECT USING ((EXISTS ( SELECT 1 FROM users u WHERE ((u.id = auth.uid()) AND (u.platform_role = 'platform_admin'::text)))));
CREATE POLICY "admins create lifecycle events" ON public."workspace_lifecycle_events" FOR INSERT WITH CHECK (is_org_admin(organization_id));
CREATE POLICY "members can read lifecycle events" ON public."workspace_lifecycle_events" FOR SELECT USING (is_org_member(organization_id));
CREATE POLICY "platform admins can read all lifecycle events" ON public."workspace_lifecycle_events" FOR SELECT USING ((EXISTS ( SELECT 1 FROM users u WHERE ((u.id = auth.uid()) AND (u.platform_role = 'platform_admin'::text)))));