import { readJson } from '@/lib/mobile/validation'
import { providerError } from '@/lib/mobile/provider-error'
import { validRecipe } from '@/lib/mobile/output'
import { withAi, aiPreferences } from '@/lib/mobile/ai'
import { NextRequest, NextResponse } from 'next/server'
import { createApiClient } from '@/lib/supabase/api'
import { modifyRecipe } from '@/lib/ai/gemini'
import { getRecipeImage } from '@/lib/pexels'
import type { Recipe } from '@/types/recipe'

async function handlePOST(request: NextRequest) {
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
    body = (await readJson(request)) as Record<string, unknown>
  } catch {
    return NextResponse.json(
      { error: 'Invalid request body.' },
      { status: 400 },
    )
  }

  if (typeof body.recipeId !== 'string' || body.recipeId.trim() === '') {
    return NextResponse.json(
      { error: 'recipeId field is required.' },
      { status: 400 },
    )
  }
  if (typeof body.instruction !== 'string' || body.instruction.trim() === '') {
    return NextResponse.json(
      { error: 'instruction field is required.' },
      { status: 400 },
    )
  }
  if (body.instruction.length > 500) {
    return NextResponse.json(
      { error: 'instruction is too long (max 500 characters).' },
      { status: 400 },
    )
  }

  // Fetch the source recipe — user must own it
  const { data: sourceData, error: fetchError } = await supabase
    .from('recipes')
    .select('*')
    .eq('id', body.recipeId.trim())
    .eq('user_id', user.id)
    .single()

  if (fetchError || !sourceData) {
    return NextResponse.json({ error: 'Recipe not found.' }, { status: 404 })
  }

  const source = sourceData as Recipe

  // Fetch diet context from user profile (optional, non-blocking)
  let dietContext: string | undefined
  try {
    const { data: profileData } = await supabase
      .from('profiles')
      .select('diet_type, daily_calorie_goal')
      .eq('id', user.id)
      .single()
    if (profileData) {
      const parts: string[] = []
      if (profileData.diet_type)
        parts.push(`Diet type: ${profileData.diet_type}`)
      if (profileData.daily_calorie_goal)
        parts.push(`Daily calorie goal: ${profileData.daily_calorie_goal} kcal`)
      if (parts.length) dietContext = parts.join(', ')
    }
  } catch {
    // non-fatal — proceed without diet context
  }

  let modified: Awaited<ReturnType<typeof modifyRecipe>>
  try {
    modified = await modifyRecipe(
      {
        name: source.name,
        ingredients: source.ingredients,
        instructions: source.instructions,
      },
      body.instruction.trim(),
      [dietContext, aiPreferences(request)].filter(Boolean).join('\n'),
    )
  } catch (error) {
    return providerError(error)
  }

  if (!validRecipe(modified))
    return NextResponse.json({ code: 'invalid_ai_output' }, { status: 502 })
  const image_url = await getRecipeImage(modified.name)

  return NextResponse.json({ recipe: { name: modified.name, ingredients: modified.ingredients, instructions: modified.instructions, macros: modified.macros ?? null, image_url } }, { status: 201 })
}

export async function POST(request: NextRequest) {
  return withAi(request, 'modify', () => handlePOST(request))
}

// Host support must be verified before deployment; no background runtime assumed.
export const maxDuration = 120
