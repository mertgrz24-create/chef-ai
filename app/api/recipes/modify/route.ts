import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { modifyRecipe } from '@/lib/ai/gemini'
import { getRecipeImage } from '@/lib/unsplash'
import type { Recipe } from '@/types/recipe'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Giriş yapmanız gerekiyor.' }, { status: 401 })
  }

  let body: Record<string, unknown>
  try {
    body = await request.json() as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: 'Geçersiz istek gövdesi.' }, { status: 400 })
  }

  if (typeof body.recipeId !== 'string' || body.recipeId.trim() === '') {
    return NextResponse.json({ error: 'recipeId alanı zorunlu.' }, { status: 400 })
  }
  if (typeof body.instruction !== 'string' || body.instruction.trim() === '') {
    return NextResponse.json({ error: 'instruction alanı zorunlu.' }, { status: 400 })
  }

  // Fetch the source recipe — user must own it
  const { data: sourceData, error: fetchError } = await supabase
    .from('recipes')
    .select('*')
    .eq('id', body.recipeId.trim())
    .eq('user_id', user.id)
    .single()

  if (fetchError || !sourceData) {
    return NextResponse.json({ error: 'Tarif bulunamadı.' }, { status: 404 })
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
      if (profileData.diet_type) parts.push(`Diyet tipi: ${profileData.diet_type}`)
      if (profileData.daily_calorie_goal) parts.push(`Günlük kalori hedefi: ${profileData.daily_calorie_goal} kcal`)
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
      dietContext
    )
  } catch (err) {
    console.error('[POST /api/recipes/modify] AI hatası:', err)
    return NextResponse.json({ error: 'Tarif güncellenemedi. Lütfen tekrar deneyin.' }, { status: 500 })
  }

  const image_url = await getRecipeImage(modified.name)

  const { data: inserted, error: insertError } = await supabase
    .from('recipes')
    .insert({
      user_id: user.id,
      name: modified.name,
      ingredients: modified.ingredients,
      instructions: modified.instructions,
      macros: modified.macros ?? null,
      image_url,
      is_public: true,
    })
    .select()
    .single()

  if (insertError) {
    console.error('[POST /api/recipes/modify] DB insert hatası:', insertError)
    return NextResponse.json({ error: 'Tarif kaydedilemedi.' }, { status: 500 })
  }

  return NextResponse.json({ recipe: inserted as Recipe }, { status: 201 })
}
