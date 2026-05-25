import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { MealEaten, DailyTotals } from '@/types/meals-eaten'

function getTodayStart(): string {
  const now = new Date()
  now.setUTCHours(0, 0, 0, 0)
  return now.toISOString()
}

// GET /api/meals-eaten — today's records + totals
export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Giriş yapmanız gerekiyor.' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('meals_eaten')
    .select('*')
    .eq('user_id', user.id)
    .gte('eaten_at', getTodayStart())
    .order('eaten_at', { ascending: false })

  if (error) {
    console.error('[GET /api/meals-eaten]', error)
    return NextResponse.json({ error: 'Kayıtlar getirilemedi.' }, { status: 500 })
  }

  const meals = (data ?? []) as MealEaten[]

  const totals: DailyTotals = meals.reduce(
    (acc, m) => ({
      calories: acc.calories + (m.calories ?? 0),
      protein_g: acc.protein_g + (m.protein_g ?? 0),
      carbs_g: acc.carbs_g + (m.carbs_g ?? 0),
      fat_g: acc.fat_g + (m.fat_g ?? 0),
    }),
    { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 }
  )

  return NextResponse.json({ meals, totals })
}

// POST /api/meals-eaten — log a new meal
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Giriş yapmanız gerekiyor.' }, { status: 401 })
  }

  let recipe_name: string
  let calories: number | undefined
  let protein_g: number | undefined
  let carbs_g: number | undefined
  let fat_g: number | undefined
  let source: string | undefined

  try {
    const body = await request.json() as {
      recipe_name?: unknown
      calories?: unknown
      protein_g?: unknown
      carbs_g?: unknown
      fat_g?: unknown
      source?: unknown
    }

    if (typeof body.recipe_name !== 'string' || body.recipe_name.trim() === '') {
      return NextResponse.json({ error: 'recipe_name alanı zorunlu.' }, { status: 400 })
    }

    recipe_name = body.recipe_name.trim()
    calories = typeof body.calories === 'number' ? Math.round(body.calories) : undefined
    protein_g = typeof body.protein_g === 'number' ? Math.round(body.protein_g) : undefined
    carbs_g = typeof body.carbs_g === 'number' ? Math.round(body.carbs_g) : undefined
    fat_g = typeof body.fat_g === 'number' ? Math.round(body.fat_g) : undefined
    source = typeof body.source === 'string' ? body.source : 'manual'
  } catch {
    return NextResponse.json({ error: 'Geçersiz istek gövdesi.' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('meals_eaten')
    .insert({ user_id: user.id, recipe_name, calories, protein_g, carbs_g, fat_g, source })
    .select('*')
    .single()

  if (error) {
    console.error('[POST /api/meals-eaten]', error)
    return NextResponse.json({ error: 'Kayıt eklenemedi.' }, { status: 500 })
  }

  return NextResponse.json({ meal: data as MealEaten }, { status: 201 })
}
