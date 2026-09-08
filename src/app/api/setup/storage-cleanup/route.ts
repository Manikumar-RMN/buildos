'use server'

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

const BUCKET = 'buildos-files'

export async function POST() {
  const supabase = await createClient()
  const { data: userData } = await supabase.auth.getUser()

  if (!userData.user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  const serviceKey = process.env.SUPABASE_SECRET_KEY
  if (!serviceKey) {
    return NextResponse.json({ error: 'Server storage cleanup is not configured' }, { status: 503 })
  }

  const { data: membership, error: membershipError } = await supabase
    .from('organization_members')
    .select('organization_id, role_id, roles(name)')
    .eq('user_id', userData.user.id)
    .eq('status', 'active')
    .limit(1)
    .maybeSingle()

  if (membershipError || !membership) {
    return NextResponse.json({ error: 'Organization membership could not be verified' }, { status: 403 })
  }

  const role = Array.isArray(membership.roles) ? membership.roles[0] : membership.roles
  const roleName = String(role?.name ?? '').toLowerCase()
  if (!['owner', 'admin', 'organization admin'].includes(roleName)) {
    return NextResponse.json({ error: 'Owner/Admin access required' }, { status: 403 })
  }

  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )

  const { data: lifecycle, error: lifecycleError } = await admin
    .from('workspace_lifecycle')
    .select('mode')
    .eq('organization_id', membership.organization_id)
    .maybeSingle()

  if (lifecycleError || lifecycle?.mode !== 'live') {
    return NextResponse.json({ error: 'Workspace must be live before storage cleanup' }, { status: 409 })
  }

  const { data: rows, error: queueError } = await admin
    .from('storage_cleanup_queue')
    .select('id, storage_path')
    .eq('organization_id', membership.organization_id)
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .limit(500)

  if (queueError) {
    return NextResponse.json({ error: queueError.message }, { status: 500 })
  }

  let processed = 0
  const failed: string[] = []

  for (const row of rows ?? []) {
    const { error } = await admin.storage.from(BUCKET).remove([row.storage_path])
    if (error) {
      failed.push(row.storage_path)
      await admin.from('storage_cleanup_queue').update({ status: 'failed', error_message: error.message }).eq('id', row.id)
      continue
    }

    processed += 1
    await admin.from('storage_cleanup_queue').update({ status: 'processed', processed_at: new Date().toISOString(), error_message: null }).eq('id', row.id)
  }

  return NextResponse.json({ processed, failed: failed.length, remaining: Math.max((rows?.length ?? 0) - processed - failed.length, 0), failed_paths: failed })
}
