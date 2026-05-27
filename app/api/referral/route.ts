import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST /api/referral — apply a referral code to the current user's profile
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Giriş yapmanız gerekiyor.' }, { status: 401 })
  }

  let code: string
  try {
    const body = await request.json() as { code?: unknown }
    if (typeof body.code !== 'string' || body.code.trim() === '') {
      return NextResponse.json({ error: 'code alanı zorunlu.' }, { status: 400 })
    }
    code = body.code.trim().toUpperCase()
  } catch {
    return NextResponse.json({ error: 'Geçersiz istek gövdesi.' }, { status: 400 })
  }

  // Check current user hasn't already been referred
  const { data: myProfile } = await supabase
    .from('profiles')
    .select('referred_by, referral_code')
    .eq('id', user.id)
    .single()

  if (myProfile?.referred_by) {
    return NextResponse.json({ error: 'Zaten bir referans kodu kullandın.' }, { status: 409 })
  }

  // Prevent self-referral
  if (myProfile?.referral_code === code) {
    return NextResponse.json({ error: 'Kendi kodunu kullanamazsın.' }, { status: 400 })
  }

  // Find the referrer
  const { data: referrer } = await supabase
    .from('profiles')
    .select('id, referral_count')
    .eq('referral_code', code)
    .single()

  if (!referrer) {
    return NextResponse.json({ error: 'Geçersiz referans kodu.' }, { status: 404 })
  }

  // Apply referral atomically (best-effort)
  await Promise.all([
    supabase.from('profiles').update({ referred_by: code }).eq('id', user.id),
    supabase.from('profiles').update({ referral_count: (referrer.referral_count ?? 0) + 1 }).eq('id', referrer.id),
  ])

  return NextResponse.json({ success: true })
}
