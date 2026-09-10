-- BuildOS baseline schema, reconstructed from the live Supabase project
-- on 2026-09-10 to restore version control over the database.
-- Safe to run on a fresh Supabase project; uses IF NOT EXISTS / OR REPLACE.

CREATE TABLE IF NOT EXISTS public.organizations (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  name text NOT NULL,
  industry text DEFAULT 'Construction'::text NOT NULL,
  timezone text DEFAULT 'Asia/Kolkata'::text NOT NULL,
  currency text DEFAULT 'INR'::text NOT NULL,
  status text DEFAULT 'active'::text NOT NULL CHECK (status = ANY (ARRAY['active'::text, 'inactive'::text])),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  client_code text,
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.branches (
  id uuid DEFAULT gen_random_uuid() NOT NULL,
  organization_id uuid NOT NULL,
  name text NOT NULL,
  code text NOT NULL,
  address text,
  city text,
  state text,
  country text DEFAULT 'India'::text NOT NULL,
  status text DEFAULT 'active'::text NOT NULL CHECK (status = ANY (ARRAY['active'::text, 'inactive'::text])),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  PRIMARY KEY (id)
);

-- NOTE: The complete live-project snapshot is preserved in the uploaded baseline
-- source and should be kept as the authoritative database reference.
-- This repository file is being established as the version-controlled baseline.
