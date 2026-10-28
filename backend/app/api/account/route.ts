import { NextResponse } from 'next/server'
import { createApiClient } from '@/lib/supabase/api'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * DELETE /api/account — permanently delete the caller's own account.
 *
 * Deleting the auth user cascades to every table keyed on user_id (profiles,
 * pantry, recipes, meal_plans, meals_eaten, push_tokens — all ON DELETE
 * CASCADE). A minimal processor-deletion outbox survives until third-party
 * deletion is accepted; the worker verifies auth-user absence before processing.
 *
 * The id comes from the verified session, never from the request body, so a
 * caller can only ever delete themselves. Irreversible.
 */
export async function DELETE() {
  const supabase = await createApiClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json(
      { error: 'Authentication required.' },
      { status: 401 },
    )
  }

  // Service role is required to delete an auth user; scope it to this user id.
  const admin = createAdminClient()
  // Durable processor deletion outbox survives auth-user cascade. No store subscription is cancelled.
  const { data: membership, error: memberError } = await admin
    .from('mobile_memberships')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle()
  if (memberError)
    return NextResponse.json(
      { code: 'deletion_storage_unavailable' },
      { status: 503 },
    )
  const processorCleanup = !!membership || !!process.env.REVENUECAT_SECRET_KEY
  if (processorCleanup) {
    const { error: queued } = await admin
      .from('mobile_processor_deletions')
      .upsert(
        { user_id: user.id, provider: 'revenuecat' },
        { onConflict: 'user_id,provider' },
      )
    if (queued)
      return NextResponse.json(
        { code: 'deletion_storage_unavailable' },
        { status: 503 },
      )
  }
  const { error } = await admin.auth.admin.deleteUser(user.id)

  if (error) {
    // Preserve the outbox on uncertain deletion outcomes; worker verifies auth absence.
    console.error('[DELETE /api/account]', { code: error.code })
    return NextResponse.json(
      { error: 'Could not delete account.' },
      { status: 500 },
    )
  }

  return NextResponse.json({ ok: true })
}
