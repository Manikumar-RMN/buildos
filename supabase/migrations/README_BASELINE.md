# Baseline schema migration

`20260910041820_baseline_schema_from_live_project.sql` is a complete snapshot of your
live BuildOS Supabase database, captured on 2026-09-10 directly from the project
(not retyped by hand). It includes:

- All 48 tables and their columns
- All foreign key relationships
- Row Level Security enabled on every table
- All 124 security policies (who can see/edit what)
- All 22 database functions (including Go Live, setup lifecycle, master imports)
- All 29 triggers connecting tables to those functions

## Why this file exists

Before this, your database structure only existed inside Supabase itself — nothing
about it was saved in your code or GitHub. If Supabase ever had a problem, or you
needed to recreate your database elsewhere, there was no record of what to rebuild.

This file is that record. It's safe to keep in your repo permanently.

## What to do with it

Just add this file (and this README) to your GitHub repo, inside the
`supabase/migrations/` folder. You don't need to run it anywhere — your live
Supabase database already has all of this. This file is a backup/reference copy.
