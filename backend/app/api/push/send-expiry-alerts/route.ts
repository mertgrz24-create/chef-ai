import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { cronAuthorized } from '@/lib/mobile/cron'
import { failure } from '@/lib/mobile/service'
import { isObject } from '@/lib/mobile/validation'
export const maxDuration = 60
const headers = () => ({
  'Content-Type': 'application/json',
  Accept: 'application/json',
  ...(process.env.EXPO_ACCESS_TOKEN
    ? { Authorization: `Bearer ${process.env.EXPO_ACCESS_TOKEN}` }
    : {}),
})
export async function GET(request: Request) {
  if (!cronAuthorized(request)) return failure('unauthorized', 401)
  if (process.env.MOBILE_PUSH_READY !== 'true')
    return failure('push_unavailable')
  const db = createAdminClient()
  let accepted = 0,
    receiptOk = 0,
    unknown = 0
  const { data: pending, error: receiptError } = await db
    .from('mobile_push_deliveries')
    .select('id,token_id,ticket_id')
    .eq('status', 'accepted')
    .lt('created_at', new Date(Date.now() - 15 * 60 * 1000).toISOString())
    .limit(100)
  if (receiptError) return failure('push_storage_unavailable')
  if (pending?.length)
    try {
      const res = await fetch('https://exp.host/--/api/v2/push/getReceipts', {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({ ids: pending.map((p) => p.ticket_id) }),
        signal: AbortSignal.timeout(15000),
      })
      const raw: unknown = await res.json()
      const receipts =
        res.ok && isObject(raw) && isObject(raw.data) ? raw.data : null
      if (receipts)
        for (const row of pending) {
          const receipt = receipts[String(row.ticket_id)]
          if (!isObject(receipt)) continue
          if (receipt.status === 'ok') {
            const { error } = await db
              .from('mobile_push_deliveries')
              .update({ status: 'receipt_ok' })
              .eq('id', row.id)
            if (!error) receiptOk++
          } else if (receipt.status === 'error') {
            if (
              isObject(receipt.details) &&
              receipt.details.error === 'DeviceNotRegistered'
            )
              await db.from('push_tokens').delete().eq('id', row.token_id)
            else
              await db
                .from('mobile_push_deliveries')
                .update({ status: 'error' })
                .eq('id', row.id)
          }
        }
    } catch {
      /* Retry receipt READ on the next cron; never repeat the send. */
    }
  await db
    .from('mobile_push_deliveries')
    .update({ status: 'unknown' })
    .eq('status', 'accepted')
    .lt('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
  const { data: claims, error } = await db.rpc('claim_mobile_expiry_push')
  if (error || !Array.isArray(claims)) return failure('push_claim_unavailable')
  const candidates = claims
    .filter(isObject)
    .filter(
      (c) =>
        typeof c.token === 'string' &&
        typeof c.token_id === 'string' &&
        typeof c.delivery_id === 'string',
    )
  const { data: enabled, error: enabledError } = await db
    .from('push_tokens')
    .select('id,token')
    .in(
      'id',
      candidates.map((c) => c.token_id),
    )
    .eq('enabled', true)
  if (enabledError) return failure('push_storage_unavailable')
  const batch = candidates.filter((c) =>
    enabled?.some((t) => t.id === c.token_id && t.token === c.token),
  )
  if (batch.length)
    try {
      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify(
          batch.map((c) => ({
            to: c.token,
            title: c.locale === 'tr' ? 'Kilerine göz at' : 'Check your pantry',
            body:
              c.locale === 'tr'
                ? 'Bazı malzemelerin yarın son kullanım tarihine ulaşıyor.'
                : 'Some ingredients reach their expiry date tomorrow.',
            sound: 'default',
            channelId: 'expiry-alerts',
            data: { screen: 'pantry' },
          })),
        ),
        signal: AbortSignal.timeout(15000),
      })
      const raw: unknown = await response.json(),
        tickets =
          response.ok && isObject(raw) && Array.isArray(raw.data)
            ? raw.data
            : []
      for (let offset = 0; offset < batch.length; offset += 20)
        await Promise.all(
          batch.slice(offset, offset + 20).map(async (c, index) => {
            const ticket: unknown = tickets[offset + index]
            const acceptedTicket =
              isObject(ticket) &&
              ticket.status === 'ok' &&
              typeof ticket.id === 'string'
            const state = acceptedTicket
              ? 'accepted'
              : isObject(ticket) && ticket.status === 'error'
                ? 'error'
                : 'unknown'
            const { error: stored } = await db
              .from('mobile_push_deliveries')
              .update({
                status: state,
                ...(acceptedTicket ? { ticket_id: ticket.id } : {}),
              })
              .eq('id', c.delivery_id)
            if (acceptedTicket && !stored) accepted++
            else if (state === 'unknown' || stored) unknown++
            if (
              isObject(ticket) &&
              isObject(ticket.details) &&
              ticket.details.error === 'DeviceNotRegistered'
            )
              await db.from('push_tokens').delete().eq('id', c.token_id)
          }),
        )
    } catch {
      unknown += batch.length
      // Never resend an uncertain outcome, even if process/DB bookkeeping failed.
      await db
        .from('mobile_push_deliveries')
        .update({ status: 'unknown' })
        .in(
          'id',
          batch.map((c) => c.delivery_id),
        )
        .eq('status', 'claimed')
    }
  // Expo acceptance/receipts are not proof of delivery to a physical device.
  return NextResponse.json(
    { accepted, receiptOk, unknown },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}
export const POST = GET
