import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { MealPlanDay } from '@/types/meal-plan'

function getWeekStartDate(): string {
  const now = new Date()
  const day = now.getDay()
  const diff = day === 0 ? -6 : 1 - day
  const monday = new Date(now)
  monday.setDate(now.getDate() + diff)
  return monday.toISOString().split('T')[0]
}

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Giriş yapmanız gerekiyor.' }, { status: 401 })
  }

  const week_start_date = getWeekStartDate()

  // Fetch this week's meal plan
  const { data: planData } = await supabase
    .from('meal_plans')
    .select('meals')
    .eq('user_id', user.id)
    .eq('week_start_date', week_start_date)
    .single()

  if (!planData) {
    return NextResponse.json({
      items: [],
      fromPlan: false,
      generatedAt: new Date().toISOString(),
    })
  }

  const meals = planData.meals as MealPlanDay[]

  // Collect all ingredients from all meals
  const allIngredients = meals.flatMap((day) => [
    ...day.breakfast.ingredients,
    ...day.dinner.ingredients,
  ])

  // Deduplicate (preserve casing of first occurrence)
  const seen = new Set<string>()
  const unique: string[] = []
  for (const ing of allIngredients) {
    const key = ing.toLowerCase().trim()
    if (!seen.has(key)) {
      seen.add(key)
      unique.push(ing.trim())
    }
  }

  // Fetch pantry items to subtract
  const { data: pantryData } = await supabase
    .from('pantry')
    .select('name')
    .eq('user_id', user.id)

  const pantryNames = new Set(
    (pantryData ?? []).map((p: { name: string }) => p.name.toLowerCase().trim())
  )

  // Filter: remove exact case-insensitive matches
  const filtered = unique.filter((ing) => !pantryNames.has(ing.toLowerCase().trim()))

  // Sort alphabetically (Turkish locale)
  const sorted = filtered.sort((a, b) => a.localeCompare(b, 'tr'))

  return NextResponse.json({
    items: sorted,
    fromPlan: true,
    generatedAt: new Date().toISOString(),
  })
}
