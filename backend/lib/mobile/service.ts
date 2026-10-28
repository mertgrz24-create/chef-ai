import { NextResponse } from 'next/server'
import { createApiClient } from '@/lib/supabase/api'
export function failure(code: string, status = 503) {
  return NextResponse.json(
    { code },
    { status, headers: { 'Cache-Control': 'no-store' } },
  )
}
export async function authenticated() {
  const db = await createApiClient()
  const {
    data: { user },
    error,
  } = await db.auth.getUser()
  return { db, user: error ? null : user }
}
export function acknowledged() {
  return NextResponse.json(
    { ok: true },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}
