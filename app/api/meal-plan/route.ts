import { NextResponse } from 'next/server'
import { createApiClient } from '@/lib/supabase/api'

function getWeekStartDate(): string {
  const now = new Date()
  const day = now.getDay()
  const diff = day === 0 ? -6 : 1 - day
  const monday = new Date(now)
  monday.setDate(now.getDate() + diff)
  return monday.toISOString().split('T')[0]
}

export async function GET() {
  const supabase = await createApiClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
  }

  const week_start_date = getWeekStartDate()

  const { data, error } = await supabase
    .from('meal_plans')
    .select('*')
    .eq('user_id', user.id)
    .eq('week_start_date', week_start_date)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'No plan found for this week.' }, { status: 404 })
  }

  return NextResponse.json({ plan: data })
}
