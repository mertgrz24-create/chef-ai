import { isObject } from './validation'
export type MembershipState = {
  plan: 'free' | 'premium'
  status: 'active' | 'grace' | 'hold' | 'expired'
  expiresAt: string | null
  revision: number
}
export function premiumLimits() {
  const values = {
    recipes: Number(process.env.MOBILE_PREMIUM_RECIPE_LIMIT),
    scans: Number(process.env.MOBILE_PREMIUM_SCAN_LIMIT),
    plans: Number(process.env.MOBILE_PREMIUM_PLAN_LIMIT),
  }
  return Object.values(values).every(
    (n) => Number.isInteger(n) && n > 0 && n <= 10000,
  ) && values.recipes > 10
    ? values
    : null
}
export function billingReady() {
  return (
    ['staging', 'production'].includes(process.env.MOBILE_ENVIRONMENT ?? '') &&
    (process.env.VERCEL_ENV !== 'production' ||
      process.env.MOBILE_ENVIRONMENT === 'production') &&
    process.env.MOBILE_BILLING_READY === 'true' &&
    !!process.env.REVENUECAT_SECRET_KEY &&
    !!process.env.REVENUECAT_ENTITLEMENT_ID &&
    !!process.env.REVENUECAT_IOS_MONTHLY_PRODUCT &&
    !!process.env.REVENUECAT_ANDROID_MONTHLY_PRODUCT &&
    !!premiumLimits()
  )
}
export function parseMembership(
  raw: unknown,
  user: string,
  now = Date.now(),
): MembershipState {
  if (
    !isObject(raw) ||
    typeof raw.request_date_ms !== 'number' ||
    !Number.isFinite(raw.request_date_ms) ||
    Math.abs(raw.request_date_ms - now) > 300000 ||
    !isObject(raw.subscriber) ||
    raw.subscriber.original_app_user_id !== user ||
    !isObject(raw.subscriber.entitlements) ||
    !isObject(raw.subscriber.subscriptions)
  )
    throw new Error('invalid_membership')
  const base: MembershipState = {
    plan: 'free',
    status: 'active',
    expiresAt: null,
    revision: raw.request_date_ms,
  }
  const ent =
    raw.subscriber.entitlements[process.env.REVENUECAT_ENTITLEMENT_ID ?? '']
  if (ent === undefined) return base
  if (
    !isObject(ent) ||
    typeof ent.product_identifier !== 'string' ||
    ![
      process.env.REVENUECAT_IOS_MONTHLY_PRODUCT,
      process.env.REVENUECAT_ANDROID_MONTHLY_PRODUCT,
    ].includes(ent.product_identifier)
  )
    throw new Error('unsupported_product')
  const sub = raw.subscriber.subscriptions[ent.product_identifier]
  if (
    !isObject(sub) ||
    !['app_store', 'play_store'].includes(String(sub.store)) ||
    typeof sub.is_sandbox !== 'boolean' ||
    (process.env.MOBILE_ENVIRONMENT === 'production' && sub.is_sandbox) ||
    sub.ownership_type !== 'PURCHASED'
  )
    throw new Error('ownership_conflict')
  if (
    typeof ent.expires_date !== 'string' ||
    !Number.isFinite(Date.parse(ent.expires_date))
  )
    throw new Error('invalid_expiry')
  const expiry = Date.parse(ent.expires_date),
    grace =
      typeof ent.grace_period_expires_date === 'string'
        ? Date.parse(ent.grace_period_expires_date)
        : 0
  if (sub.refunded_at)
    return { ...base, status: 'expired', expiresAt: ent.expires_date }
  if (expiry > now)
    return {
      ...base,
      plan: 'premium',
      status: 'active',
      expiresAt: ent.expires_date,
    }
  if (Number.isFinite(grace) && grace > now)
    return {
      ...base,
      plan: 'premium',
      status: 'grace',
      expiresAt: new Date(grace).toISOString(),
    }
  return {
    ...base,
    status: sub.billing_issues_detected_at ? 'hold' : 'expired',
    expiresAt: ent.expires_date,
  }
}
