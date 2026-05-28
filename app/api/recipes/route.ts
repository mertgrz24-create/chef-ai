import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateRecipeWithGemini } from '@/lib/ai/gemini'

const FREE_MONTHLY_LIMIT = 10

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
  if (profile.daily_calorie_goal) parts.push(`daily calories ${profile.daily_calorie_goal} kcal`)
  if (profile.protein_goal_g) parts.push(`protein ${profile.protein_goal_g}g`)
  if (profile.carbs_goal_g) parts.push(`carbs ${profile.carbs_goal_g}g`)
  if (profile.fat_goal_g) parts.push(`fat ${profile.fat_goal_g}g`)
  if (profile.water_goal_l) parts.push(`water ${profile.water_goal_l} L`)
  if (profile.diet_type) parts.push(`diet type: ${profile.diet_type}`)
  if (parts.length === 0) return undefined
  return `My diet goals: ${parts.join(', ')}. Please suggest a recipe that fits these goals.`
}

function getMonthStart(): string {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
}

export async function POST(request: NextRequest) {
  // 1. Parse body
  let ingredients: string[]
  try {
    const body = await request.json() as { ingredients?: unknown }
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
    ingredients = body.ingredients as string[]
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  // 2. Auth check
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
  }

  // 3. Fetch profile (diet context + usage data)
  const { data: profileData } = await supabase
    .from('profiles')
    .select('daily_calorie_goal, protein_goal_g, carbs_goal_g, fat_goal_g, water_goal_l, diet_type, is_premium, recipe_count_this_month, recipe_count_reset_at')
    .eq('id', user.id)
    .single()

  const profile = profileData as ProfileRow | null

  // 4. Freemium limit check
  const monthStart = getMonthStart()
  let currentCount = profile?.recipe_count_this_month ?? 0

  // Reset counter if it's a new month
  if (profile && profile.recipe_count_reset_at < monthStart) {
    currentCount = 0
    await supabase
      .from('profiles')
      .update({ recipe_count_this_month: 0, recipe_count_reset_at: new Date().toISOString() })
      .eq('id', user.id)
  }

  if (!profile?.is_premium && currentCount >= FREE_MONTHLY_LIMIT) {
    return NextResponse.json(
      {
        error: 'limit_reached',
        message: `You've used all ${FREE_MONTHLY_LIMIT} free recipes this month. Upgrade to Premium!`,
      },
      { status: 403 }
    )
  }

  // 5. Generate recipe
  const dietContext = buildDietContext(profile)

  let result: Awaited<ReturnType<typeof generateRecipeWithGemini>>
  try {
    result = await generateRecipeWithGemini(ingredients, dietContext)
  } catch (err) {
    console.error('[/api/recipes] Recipe generation error:', err)
    return NextResponse.json(
      { error: 'Could not generate recipe. Please try again.' },
      { status: 500 }
    )
  }

  // 6. Increment usage counter (non-fatal)
  await supabase
    .from('profiles')
    .update({ recipe_count_this_month: currentCount + 1 })
    .eq('id', user.id)

  return NextResponse.json({ recipe: result.text, macros: result.macros })
}
