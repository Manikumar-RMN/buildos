import { createBrowserClient } from '@supabase/ssr'

// Temporary compatibility boundary for the existing client screens.
// The database schema types are generated and will be wired here in the
// dedicated type-safety pass; until then this keeps relationship-heavy
// legacy screens from blocking production compilation.
export function createClient(): any {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  )
}
