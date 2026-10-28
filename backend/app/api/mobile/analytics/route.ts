import { authenticated, acknowledged, failure } from '@/lib/mobile/service'
import { readJson, isLocale } from '@/lib/mobile/validation'
import { createAdminClient } from '@/lib/supabase/admin'
const events = [
  'onboarding_completed',
  'first_ingredient_added',
  'scan_completed',
  'recipe_generated',
  'recipe_saved',
  'plan_created',
  'paywall_opened',
  'restore_completed',
]
export async function POST(request: Request) {
  const { user } = await authenticated()
  if (!user) return failure('unauthenticated', 401)
  if (process.env.MOBILE_ANALYTICS_READY !== 'true')
    return failure('analytics_unavailable')
  let body
  try {
    body = await readJson(request, 2048)
  } catch {
    return failure('invalid_body', 400)
  }
  if (
    Object.keys(body).some(
      (key) =>
        !['event', 'version', 'platform', 'locale', 'result'].includes(key),
    ) ||
    !events.includes(String(body.event)) ||
    !isLocale(body.locale) ||
    !['ios', 'android', 'web'].includes(String(body.platform)) ||
    !['success', 'failure'].includes(String(body.result)) ||
    !process.env.MOBILE_APP_VERSION ||
    body.version !== process.env.MOBILE_APP_VERSION
  )
    return failure('invalid_event', 400)
  // Authentication ends here: neither user identifiers nor raw requests enter aggregate storage.
  const { data, error } = await createAdminClient().rpc(
    'record_mobile_analytics',
    {
      p_event: body.event,
      p_version: body.version,
      p_platform: body.platform,
      p_locale: body.locale,
      p_result: body.result,
    },
  )
  return !error && data === true
    ? acknowledged()
    : failure('analytics_unavailable')
}
