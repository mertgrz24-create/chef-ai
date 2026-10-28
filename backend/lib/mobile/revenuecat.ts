import { createHmac, timingSafeEqual, randomUUID } from 'node:crypto'
import { createAdminClient } from '@/lib/supabase/admin'
import { isObject } from './validation'
import {
  billingReady,
  parseMembership,
  type MembershipState,
} from './membership'
export function verifyWebhook(
  raw: Uint8Array,
  header: string | null,
  authorization: string | null,
  now = Date.now(),
) {
  const auth = process.env.REVENUECAT_WEBHOOK_AUTH,
    secret = process.env.REVENUECAT_WEBHOOK_SIGNING_SECRET
  if (!auth || auth.length < 32 || !secret || !header || !authorization)
    return false
  const expected = Buffer.from(auth),
    actual = Buffer.from(authorization)
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual))
    return false
  const match = /^t=(\d+),\s*v1=([a-f0-9]{64})$/.exec(header)
  if (!match || Math.abs(now / 1000 - Number(match[1])) > 300) return false
  const digest = createHmac('sha256', secret)
    .update(`${match[1]}.`)
    .update(raw)
    .digest()
  return timingSafeEqual(digest, Buffer.from(match[2], 'hex'))
}
export async function reconcileMembership(user: string, eventId: string) {
  if (!billingReady()) throw new Error('billing_unavailable')
  const response = await fetch(
    `https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(user)}`,
    {
      headers: { Authorization: `Bearer ${process.env.REVENUECAT_SECRET_KEY}` },
      cache: 'no-store',
      signal: AbortSignal.timeout(10000),
    },
  )
  if (!response.ok) throw new Error('membership_unavailable')
  const snapshot = parseMembership(await response.json(), user)
  const { data, error } = await createAdminClient().rpc(
    'apply_mobile_membership',
    {
      p_user: user,
      p_event: eventId,
      p_revision: snapshot.revision,
      p_plan: snapshot.plan,
      p_status: snapshot.status,
      p_expiry: snapshot.expiresAt,
    },
  )
  if (
    error ||
    !isObject(data) ||
    !['free', 'premium'].includes(String(data.plan)) ||
    !['active', 'grace', 'hold', 'expired'].includes(String(data.status)) ||
    typeof data.revision !== 'number'
  )
    throw new Error('membership_confirmation_failed')
  return data as MembershipState
}
export async function verifiedMembership(
  user: string,
): Promise<MembershipState> {
  if (!billingReady())
    return {
      plan: 'free',
      status: 'active',
      expiresAt: null,
      revision: Date.now(),
    }
  const { data, error } = await createAdminClient()
    .from('mobile_memberships')
    .select('*')
    .eq('user_id', user)
    .maybeSingle()
  if (error) throw new Error('membership_unavailable')
  if (!data || Date.now() - Date.parse(data.verified_at) > 60000)
    return reconcileMembership(user, `refresh:${randomUUID()}`)
  const expiresAt = typeof data.expires_at === 'string' ? data.expires_at : null
  if (
    data.plan === 'premium' &&
    expiresAt &&
    Date.parse(expiresAt) <= Date.now()
  )
    return reconcileMembership(user, `expiry:${randomUUID()}`)
  return {
    plan: data.plan,
    status: data.status,
    expiresAt,
    revision: Number(data.revision),
  }
}
