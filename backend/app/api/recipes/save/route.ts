import { NextRequest, NextResponse } from 'next/server'
import { createApiClient } from '@/lib/supabase/api'
import { readJson, requestKey, payloadHash } from '@/lib/mobile/validation'
import type { Recipe } from '@/types/recipe'

const MACRO_FIELDS = [
  'calories',
  'protein_g',
  'carbs_g',
  'fat_g',
  'fiber_g',
  'net_carbs_g',
] as const

// Keep only known numeric macro fields — reject arbitrary jsonb payloads
function sanitizeMacros(input: unknown): Record<string, number> | null {
  if (typeof input !== 'object' || input === null || Array.isArray(input))
    return null
  const out: Record<string, number> = {}
  for (const key of MACRO_FIELDS) {
    const value = (input as Record<string, unknown>)[key]
    if (
      typeof value === 'number' &&
      Number.isFinite(value) &&
      value >= 0 &&
      value <= 100000
    ) {
      out[key] = Math.round(value)
    }
  }
  return Object.keys(out).length > 0 ? out : null
}

export async function POST(request: NextRequest) {
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

  let body: Record<string, unknown>
  try {
    body = await readJson(request)
  } catch {
    return NextResponse.json(
      { error: 'Invalid request body.' },
      { status: 400 },
    )
  }

  if (typeof body.name !== 'string' || body.name.trim() === '') {
    return NextResponse.json(
      { error: 'name field is required.' },
      { status: 400 },
    )
  }
  if (
    !Array.isArray(body.ingredients) ||
    body.ingredients.length === 0 ||
    body.ingredients.length > 100 ||
    body.ingredients.some(
      (i) => typeof i !== 'string' || !i.trim() || i.length > 300,
    )
  ) {
    return NextResponse.json(
      { error: 'ingredients must be a non-empty array of strings.' },
      { status: 400 },
    )
  }
  if (
    typeof body.instructions !== 'string' ||
    body.instructions.trim() === ''
  ) {
    return NextResponse.json(
      { error: 'instructions field is required.' },
      { status: 400 },
    )
  }
  if (body.instructions.length > 20000) {
    return NextResponse.json(
      { error: 'instructions is too long.' },
      { status: 400 },
    )
  }

  if (body.is_public === true)
    return NextResponse.json(
      { code: 'public_sharing_disabled' },
      { status: 422 },
    )
  const key = requestKey(request.headers.get('Idempotency-Key'))
  if (!key)
    return NextResponse.json(
      { code: 'idempotency_key_required' },
      { status: 400 },
    )
  const recipeName = body.name.trim().slice(0, 200)
  const fingerprint = payloadHash({
    name: recipeName,
    ingredients: body.ingredients,
    instructions: body.instructions.trim(),
    macros: sanitizeMacros(body.macros),
  })
  async function replay() {
    const { data: existing, error } = await supabase
      .from('recipes')
      .select('*')
      .eq('user_id', user!.id)
      .eq('save_request_key', key)
      .maybeSingle()
    if (error)
      return NextResponse.json({ code: 'storage_unavailable' }, { status: 503 })
    if (!existing) return null
    if (existing.save_request_hash !== fingerprint)
      return NextResponse.json(
        { code: 'idempotency_conflict' },
        { status: 409 },
      )
    // Responses disclose only the private recipe, never internal hashes/keys.
    const {
      save_request_hash: _hash,
      save_request_key: _key,
      ...recipe
    } = existing
    void _hash
    void _key
    return NextResponse.json(
      { recipe },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  }
  const prior = await replay()
  if (prior) return prior

  const { data, error } = await supabase
    .from('recipes')
    .insert({
      user_id: user.id,
      name: recipeName,
      ingredients: body.ingredients as string[],
      instructions: body.instructions.trim(),
      macros: sanitizeMacros(body.macros),
      diet_context: null,
      image_url: null,
      is_public: false,
      save_request_key: key,
      save_request_hash: fingerprint,
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      const prior = await replay()
      if (prior) return prior
    }
    console.error('[POST /api/recipes/save]', { code: error.code })
    return NextResponse.json(
      { error: 'Could not save recipe.' },
      { status: 500 },
    )
  }

  const { save_request_hash: _hash, save_request_key: _key, ...recipe } = data
  void _hash
  void _key
  return NextResponse.json(
    { recipe: recipe as Recipe },
    { status: 201, headers: { 'Cache-Control': 'no-store' } },
  )
}
