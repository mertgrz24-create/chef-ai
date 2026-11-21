import { NextResponse } from 'next/server'
import { createApiClient } from '@/lib/supabase/api'
import { readJson } from '@/lib/mobile/validation'

const fields = 'id,name,checked,created_at,revision'

export async function GET() {
  const supabase = await createApiClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ code: 'unauthenticated' }, { status: 401 })
  const { data, error } = await supabase.from('shopping_items').select(fields)
    .eq('user_id', user.id).order('created_at', { ascending: true }).limit(500)
  if (error) return NextResponse.json({ code: 'storage_unavailable' }, { status: 503 })
  return NextResponse.json({ items: data }, { headers: { 'Cache-Control': 'no-store' } })
}

export async function POST(request: Request) {
  const supabase = await createApiClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ code: 'unauthenticated' }, { status: 401 })
  let body: Record<string, unknown>
  try { body = await readJson(request, 2048) } catch { return NextResponse.json({ code: 'invalid_body' }, { status: 400 }) }
  if (typeof body.name !== 'string' || !body.name.trim() || body.name.length > 300 || Object.keys(body).some(key => key !== 'name'))
    return NextResponse.json({ code: 'invalid_body' }, { status: 400 })
  const { data, error } = await supabase.from('shopping_items').insert({ user_id: user.id, name: body.name.trim() }).select(fields).single()
  if (error) return NextResponse.json({ code: 'storage_unavailable' }, { status: 503 })
  return NextResponse.json({ item: data }, { status: 201, headers: { 'Cache-Control': 'no-store' } })
}
