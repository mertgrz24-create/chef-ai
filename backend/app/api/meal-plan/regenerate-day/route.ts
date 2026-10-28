import { readJson } from '@/lib/mobile/validation'
import { providerError } from '@/lib/mobile/provider-error'
import { validRecipe, validMeals } from '@/lib/mobile/output'
import { withAi, aiPreferences } from '@/lib/mobile/ai'
import { NextRequest, NextResponse } from 'next/server'
import { createApiClient } from '@/lib/supabase/api'
import { getWeekStartDate } from '@/lib/date'
import { generateSingleMeal } from '@/lib/ai/gemini'
import type { MealPlanDay } from '@/types/meal-plan'

const VALID_DAYS = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
] as const

type ValidDay = (typeof VALID_DAYS)[number]
type ValidMeal = 'breakfast' | 'dinner'

type ProfileRow = {
  daily_calorie_goal: number | null
  protein_goal_g: number | null
  carbs_goal_g: number | null
  fat_goal_g: number | null
  water_goal_l: number | null
  diet_type: string | null
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

async function handlePATCH(request: NextRequest) {
  // 1. Validate body
  let day: ValidDay
  let meal: ValidMeal

  try {
    const body = (await readJson(request)) as { day?: unknown; meal?: unknown }
    if (
      typeof body.day !== 'string' ||
      !(VALID_DAYS as readonly string[]).includes(body.day)
    ) {
      return NextResponse.json(
        { error: `Invalid day. Expected: ${VALID_DAYS.join(' | ')}` },
        { status: 400 },
      )
    }
    if (body.meal !== 'breakfast' && body.meal !== 'dinner') {
      return NextResponse.json(
        { error: 'meal must be "breakfast" or "dinner".' },
        { status: 400 },
      )
    }
    day = body.day as ValidDay
    meal = body.meal
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

  // 3. Fetch current week's plan
  const week_start_date = getWeekStartDate()
  const { data: currentPlan, error: fetchError } = await supabase
    .from('meal_plans')
    .select('*')
    .eq('user_id', user.id)
    .eq('week_start_date', week_start_date)
    .single()

  if (fetchError || !currentPlan) {
    return NextResponse.json(
      { error: 'No plan found for this week.' },
      { status: 404 },
    )
  }

  // 4. Fetch diet context (non-fatal)
  const { data: profileData } = await supabase
    .from('profiles')
    .select(
      'daily_calorie_goal, protein_goal_g, carbs_goal_g, fat_goal_g, water_goal_l, diet_type',
    )
    .eq('id', user.id)
    .single()

  const dietContext = [
    buildDietContext(profileData as ProfileRow | null),
    aiPreferences(request),
  ]
    .filter(Boolean)
    .join('\n')

  // 5. Regenerate the single meal
  try {
    const newMeal = await generateSingleMeal(day, meal, dietContext)

    if (!validRecipe(newMeal,false)) throw new Error('invalid_ai_output')
    const updatedMeals = (currentPlan.meals as MealPlanDay[]).map((d) => {
      if (d.day !== day) return d
      return { ...d, [meal]: newMeal }
    })

    if(!validMeals(updatedMeals))throw new Error('invalid_ai_output')
    return NextResponse.json({ plan: { id: currentPlan.id, week_start_date, meals: updatedMeals } })
  } catch (error) {
    return providerError(error)
  }
}

export async function PATCH(request: NextRequest) {
  return withAi(request, 'regenerate', () => handlePATCH(request))
}

// Host support must be verified before deployment; no background runtime assumed.
export const maxDuration = 120
