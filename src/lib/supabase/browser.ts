import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

// TODO: replace `any` with generated Database types once the schema type file
// is checked into the repository. This keeps existing client screens compatible
// with Supabase relationship responses while we complete that migration.
export function createClient(): SupabaseClient<any> {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  )
}
