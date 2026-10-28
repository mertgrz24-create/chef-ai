import { databaseFailure } from '@/lib/mobile/logging'
import { NextResponse } from 'next/server'
import { createApiClient } from '@/lib/supabase/api'
import type { Recipe } from '@/types/recipe'

// GET /api/recipes/history — last 20 saved recipes for the current user
export async function GET() {
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

  const { data, error } = await supabase
    .from('recipes')
    .select('id,name,ingredients,instructions,macros,is_public,created_at')
    .eq('user_id', user.id)
    .eq('is_public', false)
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) {
    console.error('[GET /api/recipes/history]', databaseFailure(error))
    return NextResponse.json(
      { error: 'Could not fetch recipe history.' },
      { status: 500 },
    )
  }

  return NextResponse.json(
    { recipes: data as Recipe[] },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}
