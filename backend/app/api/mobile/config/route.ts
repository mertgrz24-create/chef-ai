import { billingReady } from '@/lib/mobile/membership'
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { failure } from '@/lib/mobile/service'
export const dynamic = 'force-dynamic'
export async function GET() {
  const links = {
    privacy: process.env.MOBILE_PRIVACY_URL,
    terms: process.env.MOBILE_TERMS_URL,
    support: process.env.MOBILE_SUPPORT_URL,
    deletion: process.env.MOBILE_DELETION_URL,
  }
  const version = process.env.MOBILE_AI_CONSENT_VERSION,
    retention = {
      en: process.env.MOBILE_AI_RETENTION_EN,
      tr: process.env.MOBILE_AI_RETENTION_TR,
    }
  const min = process.env.MOBILE_MINIMUM_VERSION ?? '1.0.0'
  if (
    !version ||
    !retention.en ||
    !retention.tr ||
    !/^\d+\.\d+\.\d+$/.test(min)
  )
    return failure('mobile_configuration_incomplete')
  for (const value of Object.values(links)) {
    try {
      if (!value || new URL(value).protocol !== 'https:')
        return failure('mobile_configuration_incomplete')
    } catch {
      return failure('mobile_configuration_incomplete')
    }
  }
  let ready = false
  try {
    const db = createAdminClient()
    const probes = await Promise.all([
      db.from('recipes').select('save_request_key,save_request_hash').limit(0),
      db.from('mobile_consents').select('user_id').limit(0),
      db.from('mobile_content_reports').select('id').limit(0),
      db.from('push_tokens').select('locale,time_zone,enabled').limit(0),
      db.from('mobile_ai_jobs').select('id').limit(0),
      db.from('mobile_ai_usage').select('user_id').limit(0),
      db.from('mobile_memberships').select('user_id').limit(0),
      db.from('mobile_push_deliveries').select('id').limit(0),
      db.from('mobile_analytics_daily').select('event').limit(0),
    ])
    ready = probes.every((probe) => !probe.error)
  } catch {
    ready = false
  }
  return NextResponse.json(
    {
      schemaVersion: 1,
      maintenance: process.env.MOBILE_MAINTENANCE === 'true',
      minimumVersion: min,
      links,
      ai: { provider: 'Google Gemini', consentVersion: version, retention },
      capabilities: {
        ai:
          ready &&
          process.env.MOBILE_AI_READY === 'true' &&
          !!process.env.GEMINI_API_KEY &&
          !!process.env.MOBILE_AI_DAILY_ATTEMPT_LIMIT &&
          !!process.env.MOBILE_FREE_SCAN_LIMIT &&
          !!process.env.MOBILE_FREE_PLAN_LIMIT,
        localizedAi: ready && process.env.MOBILE_LOCALIZED_AI_READY === 'true',
        privateRecipes: ready,
        idempotency: ready,
        billing: ready && billingReady(),
        reports: ready,
        consents: ready,
        push: ready && process.env.MOBILE_PUSH_READY === 'true',
        analytics:
          ready &&
          process.env.MOBILE_ANALYTICS_READY === 'true' &&
          !!process.env.MOBILE_APP_VERSION,
      },
    },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}
