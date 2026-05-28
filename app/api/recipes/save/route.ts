import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { Recipe } from '@/types/recipe'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
  }

  let body: Record<string, unknown>
  try {
    body = await request.json() as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  if (typeof body.name !== 'string' || body.name.trim() === '') {
    return NextResponse.json({ error: 'name field is required.' }, { status: 400 })
  }
  if (
    !Array.isArray(body.ingredients) ||
    body.ingredients.length === 0 ||
    body.ingredients.some((i) => typeof i !== 'string')
  ) {
    return NextResponse.json(
      { error: 'ingredients must be a non-empty array of strings.' },
      { status: 400 }
    )
  }
  if (typeof body.instructions !== 'string' || body.instructions.trim() === '') {
    return NextResponse.json({ error: 'instructions field is required.' }, { status: 400 })
  }

  const recipeName = body.name.trim()

  const { data, error } = await supabase
    .from('recipes')
    .insert({
      user_id: user.id,
      name: recipeName,
      ingredients: body.ingredients as string[],
      instructions: body.instructions.trim(),
      macros: body.macros ?? null,
      diet_context: typeof body.diet_context === 'string' ? body.diet_context : null,
      image_url: null,
      is_public: true,
    })
    .select()
    .single()

  if (error) {
    console.error('[POST /api/recipes/save]', error)
    return NextResponse.json({ error: 'Could not save recipe.' }, { status: 500 })
  }

  return NextResponse.json({ recipe: data as Recipe }, { status: 201 })
}
