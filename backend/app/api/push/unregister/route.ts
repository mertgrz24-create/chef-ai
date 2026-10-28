import { authenticated, acknowledged, failure } from '@/lib/mobile/service'
import { readJson, validPushToken } from '@/lib/mobile/validation'
export async function POST(request: Request) {
  const { db, user } = await authenticated()
  if (!user) return failure('unauthenticated', 401)
  let body
  try {
    body = await readJson(request, 2048)
  } catch {
    return failure('invalid_body', 400)
  }
  if (!validPushToken(body.token)) return failure('invalid_token', 400)
  const { error } = await db
    .from('push_tokens')
    .delete()
    .eq('user_id', user.id)
    .eq('token', body.token)
  return error ? failure('push_unavailable') : acknowledged()
}
