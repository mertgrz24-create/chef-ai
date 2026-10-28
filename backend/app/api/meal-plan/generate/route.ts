import { providerError } from '@/lib/mobile/provider-error'
import { validMeals } from '@/lib/mobile/output'
import { withAi, aiPreferences } from '@/lib/mobile/ai'
import { NextResponse } from 'next/server'
import { createApiClient } from '@/lib/supabase/api'
import { getWeekStartDate } from '@/lib/date'
import { generateWeeklyMealPlan } from '@/lib/ai/gemini'

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
  return `My diet goals: ${parts.join(', ')}. Please suggest recipes that fit these goals.`
}

async function handlePOST(request: Request) {
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

  const week_start_date = getWeekStartDate()
  try {
    const meals = await generateWeeklyMealPlan(dietContext)
    if (!validMeals(meals)) throw new Error('invalid_ai_output')
    return NextResponse.json({ plan: { week_start_date, meals } }, { status: 201 })
  } catch (error) {
    return providerError(error)
  }
}

export async function POST(request: Request) {
  return withAi(request, 'plan', () => handlePOST(request))
}

// Host support must be verified before deployment; no background runtime assumed.
export const maxDuration = 120
