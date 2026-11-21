import { NextResponse } from 'next/server'
import { createApiClient } from '@/lib/supabase/api'
import { readJson } from '@/lib/mobile/validation'

export async function POST(request: Request) {
  const supabase = await createApiClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ code: 'unauthenticated' }, { status: 401 })
  let body: Record<string, unknown>
  try { body = await readJson(request, 40000) } catch { return NextResponse.json({ code: 'invalid_body' }, { status: 400 }) }
  if (Object.keys(body).some(key => key !== 'names') || !Array.isArray(body.names) || body.names.length < 1 || body.names.length > 100 ||
      body.names.some(name => typeof name !== 'string' || !name.trim() || name.length > 300))
    return NextResponse.json({ code: 'invalid_body' }, { status: 400 })
  const rows = (body.names as string[]).map(name => ({ user_id: user.id, name: name.trim() }))
  const { data, error } = await supabase.from('shopping_items').insert(rows).select('id,name,checked,created_at,revision')
  if (error) return NextResponse.json({ code: 'storage_unavailable' }, { status: 503 })
  return NextResponse.json({ items: data }, { status: 201, headers: { 'Cache-Control': 'no-store' } })
}
