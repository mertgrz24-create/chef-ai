import { createAdminClient } from '@/lib/supabase/admin'
import { authenticated, acknowledged, failure } from '@/lib/mobile/service'
import {
  readJson,
  validPushToken,
  isLocale,
  validTimezone,
} from '@/lib/mobile/validation'
export async function POST(request: Request) {
  const { user } = await authenticated()
  if (!user) return failure('unauthenticated', 401)
  if (process.env.MOBILE_PUSH_READY !== 'true')
    return failure('push_unavailable')
  let body
  try {
    body = await readJson(request, 4096)
  } catch {
    return failure('invalid_body', 400)
  }
  if (
    !validPushToken(body.token) ||
    !['ios', 'android'].includes(String(body.platform)) ||
    !isLocale(body.locale) ||
    !validTimezone(body.timeZone) ||
    body.enabled !== true
  )
    return failure('invalid_push_registration', 400)
  const db = createAdminClient()
  const { data: existing, error: lookupError } = await db
    .from('push_tokens')
    .select('user_id')
    .eq('token', body.token)
    .maybeSingle()
  if (lookupError) return failure('push_unavailable')
  if (existing && existing.user_id !== user.id)
    return failure('push_ownership_conflict', 409)
  const { count, error: countError } = await db
    .from('push_tokens')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
  if (countError) return failure('push_unavailable')
  if (!existing && (count ?? 0) >= 10)
    return failure('device_limit_reached', 429)
  const row = {
    user_id: user.id,
    token: body.token,
    platform: body.platform,
    locale: body.locale,
    time_zone: body.timeZone,
    enabled: true,
    updated_at: new Date().toISOString(),
  }
  // Updates never move a token between users. A concurrent first insert fails safely.
  const result = existing
    ? await db
        .from('push_tokens')
        .update(row)
        .eq('token', body.token)
        .eq('user_id', user.id)
    : await db.from('push_tokens').insert(row)
  return result.error
    ? failure(
        'push_registration_failed',
        result.error.code === '23505' ? 409 : 503,
      )
    : acknowledged()
}
