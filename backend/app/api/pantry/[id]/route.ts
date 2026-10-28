import { readJson, validCalendarDate } from '@/lib/mobile/validation'
import { databaseFailure } from '@/lib/mobile/logging'
import { NextRequest, NextResponse } from 'next/server'
import { createApiClient } from '@/lib/supabase/api'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// DELETE /api/pantry/[id] — remove a pantry item (RLS enforces ownership)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createApiClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
  }

  const { id } = await params

  // Reject malformed ids before hitting the DB — a non-uuid otherwise raises a
  // Postgres 22P02 and leaks out as a noisy 500.
  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: 'Ingredient not found.' }, { status: 404 })
  }

  const { error } = await supabase
    .from('pantry')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id) // redundant with RLS but explicit is safer

  if (error) {
    console.error('[DELETE /api/pantry/[id]]', databaseFailure(error))
    return NextResponse.json({ error: 'Could not delete ingredient.' }, { status: 500 })
  }

  return new NextResponse(null, { status: 204 })
}

// Atomic compare-and-swap. The trigger owns revision increments, including direct writes.
export async function PATCH(request: NextRequest, {params}:{params:Promise<{id:string}>}) {
  const supabase=await createApiClient()
  const {data:{user},error:authError}=await supabase.auth.getUser()
  if(authError||!user)return NextResponse.json({code:'unauthenticated'},{status:401})
  const {id}=await params
  if(!UUID_RE.test(id))return NextResponse.json({code:'not_found'},{status:404})
  let body:Record<string,unknown>
  try {body=await readJson(request)} catch {return NextResponse.json({code:'invalid_body'},{status:400})}
  if(typeof body.name!=='string'||!body.name.trim()||body.name.length>200||
    typeof body.expiry_date!=='string'||!validCalendarDate(body.expiry_date)||
    !(body.quantity===null||typeof body.quantity==='string'&&body.quantity.length<=100)||
    !Number.isInteger(body.expectedRevision)||Number(body.expectedRevision)<0||Number(body.expectedRevision)>2147483646||
    Object.keys(body).some(key=>!['name','quantity','expiry_date','expectedRevision'].includes(key)))
    return NextResponse.json({code:'invalid_body'},{status:400})
  const {data,error}=await supabase.from('pantry').update({name:body.name.trim(),quantity:typeof body.quantity==='string'?body.quantity.trim()||null:null,expiry_date:body.expiry_date})
    .eq('id',id).eq('user_id',user.id).eq('revision',body.expectedRevision)
    .select('id,name,quantity,expiry_date,created_at,revision').maybeSingle()
  if(error)return NextResponse.json({code:error.code==='42703'?'pantry_edit_unavailable':'storage_unavailable'},{status:503})
  if(data){
    if(data.revision!==Number(body.expectedRevision)+1)return NextResponse.json({code:'revision_confirmation_failed'},{status:503})
    return NextResponse.json({item:data},{headers:{'Cache-Control':'no-store'}})
  }
  const current=await supabase.from('pantry').select('id').eq('id',id).eq('user_id',user.id).maybeSingle()
  if(current.error)return NextResponse.json({code:'storage_unavailable'},{status:503})
  return NextResponse.json({code:current.data?'revision_conflict':'not_found'},{status:current.data?409:404})
}
