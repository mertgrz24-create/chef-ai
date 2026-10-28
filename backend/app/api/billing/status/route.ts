import { NextResponse } from 'next/server'
import { authenticated, failure } from '@/lib/mobile/service'
import { createAdminClient } from '@/lib/supabase/admin'
import { verifiedMembership } from '@/lib/mobile/revenuecat'
import { billingReady, premiumLimits } from '@/lib/mobile/membership'
export const dynamic = 'force-dynamic'
export async function GET() {
  const { user } = await authenticated()
  if (!user) return failure('unauthenticated', 401)
  const now = new Date(),
    period = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
      .toISOString()
      .slice(0, 10),
    resetsAt = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1),
    ).toISOString()
  try {
    const member = await verifiedMembership(user.id),
      paid = premiumLimits(),
      limits =
        member.plan === 'premium'
          ? paid
          : {
              recipes: 10,
              scans: Number(process.env.MOBILE_FREE_SCAN_LIMIT),
              plans: Number(process.env.MOBILE_FREE_PLAN_LIMIT),
            }
    if (
      !limits ||
      !Object.values(limits).every(
        (n) => Number.isInteger(n) && n > 0 && n <= 10000,
      )
    )
      return failure('quota_configuration_incomplete')
    const db=createAdminClient()
    const settlement=await db.rpc('reconcile_mobile_ai_user',{p_user:user.id})
    if(settlement.error)return failure('quota_unavailable')
    const { data, error } = await db
      .from('mobile_ai_usage')
      .select('kind,used')
      .eq('user_id', user.id)
      .eq('period', period)
    if (error) return failure('quota_unavailable')
    const quotas = Object.fromEntries(
      Object.entries(limits).map(([kind, limit]) => [
        kind,
        {
          used: data?.find((row) => row.kind === kind)?.used ?? 0,
          limit,
          resetsAt,
        },
      ]),
    )
    return NextResponse.json(
      {
        plan: member.plan,
        status: member.status,
        expiresAt: member.expiresAt,
        quotas,
        ...(billingReady() && paid ? { premiumLimits: paid } : {}),
      },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch {
    return failure('membership_unavailable')
  }
}
