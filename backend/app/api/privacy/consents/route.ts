import { createAdminClient } from '@/lib/supabase/admin'
import { authenticated, acknowledged, failure } from '@/lib/mobile/service'
import { isLocale, readJson } from '@/lib/mobile/validation'
export async function POST(request: Request) {
  const { user } = await authenticated()
  if (!user) return failure('unauthenticated', 401)
  let body
  try {
    body = await readJson(request, 2048)
  } catch {
    return failure('invalid_body', 400)
  }
  const version = process.env.MOBILE_AI_CONSENT_VERSION
  if (!version) return failure('consent_unavailable')
  if (
    body.scope !== 'ai' ||
    body.version !== version ||
    typeof body.accepted !== 'boolean' ||
    !isLocale(body.locale)
  )
    return failure('invalid_consent', 400)
  const admin = createAdminClient()
  const { error } = await admin
    .from('mobile_consents')
    .upsert(
      {
        user_id: user.id,
        scope: 'ai',
        version,
        accepted: body.accepted,
        locale: body.locale,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,scope' },
    )
  return error ? failure('consent_unavailable') : acknowledged()
}
