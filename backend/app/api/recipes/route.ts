import { readJson } from '@/lib/mobile/validation'
import { providerError } from '@/lib/mobile/provider-error'
import { validRecipe, validMacros } from '@/lib/mobile/output'
import { withAi, aiPreferences } from '@/lib/mobile/ai'
import { NextRequest, NextResponse } from 'next/server'
import { createApiClient } from '@/lib/supabase/api'
import { generateRecipeWithGemini } from '@/lib/ai/gemini'
import { providerFailure } from '@/lib/mobile/diagnostics'

type ProfileRow = {
  daily_calorie_goal: number | null
  protein_goal_g: number | null
  carbs_goal_g: number | null
  fat_goal_g: number | null
  water_goal_l: number | null
  diet_type: string | null
  is_premium: boolean
  recipe_count_this_month: number
  recipe_count_reset_at: string
}

function buildDietContext(profile: ProfileRow | null): string | undefined {
  if (!profile) return undefined
  const parts: string[] = []
  if (profile.daily_calorie_goal)
    parts.push(`daily calories ${profile.daily_calorie_goal} kcal`)
  if (profile.protein_goal_g) parts.push(`protein ${profile.protein_goal_g}g`)
  if (profile.carbs_goal_g) parts.push(`carbs ${profile.carbs_goal_g}g`)
  if (profile.fat_goal_g) parts.push(`fat ${profile.fat_goal_g}g`)
  if (profile.water_goal_l) parts.push(`water ${profile.water_goal_l} L`)
  if (profile.diet_type) parts.push(`diet type: ${profile.diet_type}`)
  if (parts.length === 0) return undefined
  return `My diet goals: ${parts.join(', ')}. Please suggest a recipe that fits these goals.`
}

async function handlePOST(request: NextRequest) {
  // 1. Parse body
  let ingredients: string[]
  try {
    const body = (await readJson(request)) as { ingredients?: unknown }
    if (
      !Array.isArray(body.ingredients) ||
      body.ingredients.length === 0 ||
      body.ingredients.length > 50 ||
      body.ingredients.some((i) => typeof i !== 'string' || i.length > 200)
    ) {
      return NextResponse.json(
        {
          error:
            'ingredients must be a non-empty array of up to 50 strings (max 200 chars each).',
        },
        { status: 400 },
      )
    }
    // Drop blanks; bound the AI prompt cost
    ingredients = (body.ingredients as string[])
      .map((i) => i.trim())
      .filter(Boolean)
    if (ingredients.length === 0) {
      return NextResponse.json(
        { error: 'ingredients must contain at least one non-empty value.' },
        { status: 400 },
      )
    }
  } catch {
    return NextResponse.json(
      { error: 'Invalid request body.' },
      { status: 400 },
    )
  }

  // 2. Auth check
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

  // 3. Fetch profile (diet context + usage data)
  const { data: profileData } = await supabase
    .from('profiles')
    .select(
      'daily_calorie_goal, protein_goal_g, carbs_goal_g, fat_goal_g, water_goal_l, diet_type, is_premium, recipe_count_this_month, recipe_count_reset_at',
    )
    .eq('id', user.id)
    .single()

  const profile = profileData as ProfileRow | null

  // 5. Generate recipe
  const dietContext = [buildDietContext(profile), aiPreferences(request)]
    .filter(Boolean)
    .join('\n')

  let result: Awaited<ReturnType<typeof generateRecipeWithGemini>>
  try {
    result = await generateRecipeWithGemini(ingredients, dietContext)
  } catch (error) {
    providerFailure('recipe', error)
    return providerError(error)
  }

  if (
    (result.structured && !validRecipe(result.structured)) ||
    (result.macros && !validMacros(result.macros))
  )
    return NextResponse.json({ code: 'invalid_ai_output' }, { status: 502 })
  return NextResponse.json({
    recipe: result.text,
    structured: result.structured,
    macros: result.macros,
  })
}

export async function POST(request: NextRequest) {
  return withAi(request, 'recipes', () => handlePOST(request))
}

// Host support must be verified before deployment; no background runtime assumed.
export const maxDuration = 120
