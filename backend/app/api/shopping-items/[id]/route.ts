import { NextResponse } from 'next/server'
import { createApiClient } from '@/lib/supabase/api'
import { readJson } from '@/lib/mobile/validation'

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const fields = 'id,name,checked,created_at,revision'
type Context = { params: Promise<{ id: string }> }

export async function PATCH(request: Request, { params }: Context) {
  const supabase = await createApiClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ code: 'unauthenticated' }, { status: 401 })
  const { id } = await params
  if (!uuid.test(id)) return NextResponse.json({ code: 'not_found' }, { status: 404 })
  let body: Record<string, unknown>
  try { body = await readJson(request, 2048) } catch { return NextResponse.json({ code: 'invalid_body' }, { status: 400 }) }
  if (typeof body.name !== 'string' || !body.name.trim() || body.name.length > 300 || typeof body.checked !== 'boolean' ||
      !Number.isInteger(body.expectedRevision) || Number(body.expectedRevision) < 0 || Number(body.expectedRevision) > 2147483646 ||
      Object.keys(body).some(key => !['name', 'checked', 'expectedRevision'].includes(key)))
    return NextResponse.json({ code: 'invalid_body' }, { status: 400 })
  const { data, error } = await supabase.from('shopping_items').update({ name: body.name.trim(), checked: body.checked })
    .eq('id', id).eq('user_id', user.id).eq('revision', body.expectedRevision).select(fields).maybeSingle()
  if (error) return NextResponse.json({ code: 'storage_unavailable' }, { status: 503 })
  if (!data) return NextResponse.json({ code: 'revision_conflict' }, { status: 409 })
  if (data.revision !== Number(body.expectedRevision) + 1) return NextResponse.json({ code: 'revision_confirmation_failed' }, { status: 503 })
  return NextResponse.json({ item: data }, { headers: { 'Cache-Control': 'no-store' } })
}

export async function DELETE(request: Request, { params }: Context) {
  const supabase = await createApiClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ code: 'unauthenticated' }, { status: 401 })
  const { id } = await params
  if (!uuid.test(id)) return NextResponse.json({ code: 'not_found' }, { status: 404 })
  const revision = new URL(request.url).searchParams.get('revision')
  if (revision === null || !/^(0|[1-9]\d{0,9})$/.test(revision) || Number(revision) > 2147483646)
    return NextResponse.json({ code: 'invalid_revision' }, { status: 400 })
  const { data, error } = await supabase.from('shopping_items').delete().eq('id', id).eq('user_id', user.id).eq('revision', Number(revision)).select('id').maybeSingle()
  if (error) return NextResponse.json({ code: 'storage_unavailable' }, { status: 503 })
  if (!data) return NextResponse.json({ code: 'revision_conflict' }, { status: 409 })
  return new NextResponse(null, { status: 204 })
}
