import { verifyWebhook, reconcileMembership } from '@/lib/mobile/revenuecat'
import { acknowledged, failure } from '@/lib/mobile/service'
import { isObject } from '@/lib/mobile/validation'
export const maxDuration = 60
const uuid = (v: unknown): v is string =>
  typeof v === 'string' &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v)
export async function POST(request: Request) {
  const reader = request.body?.getReader()
  if (!reader) return failure('invalid_body', 400)
  let size = 0
  const chunks: Uint8Array[] = []
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      size += value.length
      if (size > 100000) {
        await reader.cancel()
        return failure('body_too_large', 413)
      }
      chunks.push(value)
    }
  } finally {
    reader.releaseLock()
  }
  const raw = Buffer.concat(chunks)
  if (
    !verifyWebhook(
      raw,
      request.headers.get('X-RevenueCat-Webhook-Signature'),
      request.headers.get('authorization'),
    )
  )
    return failure('invalid_webhook_signature', 401)
  let body: unknown
  try {
    body = JSON.parse(raw.toString('utf8'))
  } catch {
    return failure('invalid_body', 400)
  }
  if (
    !isObject(body) ||
    !isObject(body.event) ||
    typeof body.event.id !== 'string' ||
    body.event.id.length > 200
  )
    return failure('invalid_event', 400)
  const event = body.event
  if (event.type === 'TEST') return acknowledged()
  if (
    event.environment !==
    (process.env.MOBILE_ENVIRONMENT === 'production' ? 'PRODUCTION' : 'SANDBOX')
  )
    return failure('wrong_store_environment', 403)
  const users =
    event.type === 'TRANSFER'
      ? [
          ...(Array.isArray(event.transferred_from)
            ? event.transferred_from
            : []),
          ...(Array.isArray(event.transferred_to) ? event.transferred_to : []),
        ]
      : [event.app_user_id]
  if (!users.length || users.length > 4 || !users.every(uuid))
    return failure('unsupported_account_identity', 422)
  try {
    await Promise.all(
      [...new Set(users as string[])].map((user) =>
        reconcileMembership(user, String(event.id)),
      ),
    )
    return acknowledged()
  } catch {
    return failure('membership_sync_failed')
  }
}
