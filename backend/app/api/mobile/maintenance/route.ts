import { cronAuthorized } from '@/lib/mobile/cron'
import { createAdminClient } from '@/lib/supabase/admin'
import { failure, acknowledged } from '@/lib/mobile/service'
export async function GET(request: Request) {
  if (!cronAuthorized(request)) return failure('unauthorized', 401)
  const days = Number(process.env.MOBILE_REPORT_RETENTION_DAYS)
  if (!Number.isInteger(days) || days < 1 || days > 365)
    return failure('retention_configuration_required')
  const db = createAdminClient(),
    now = new Date()
  const { data: deletions, error: queueError } = await db
    .from('mobile_processor_deletions')
    .select('user_id')
    .limit(10)
  if (queueError) return failure('cleanup_failed')
  let processorError = false
  for (const row of deletions ?? []) {
    const check = await db.auth.admin.getUserById(row.user_id)
    if (check.data.user) continue
    if (check.error?.status !== 404) {
      processorError = true
      continue
    }
    if (!process.env.REVENUECAT_SECRET_KEY) {
      processorError = true
      continue
    }
    try {
      const response = await fetch(
        `https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(row.user_id)}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${process.env.REVENUECAT_SECRET_KEY}`,
          },
          signal: AbortSignal.timeout(5000),
        },
      )
      if (response.status === 200 || response.status === 404) {
        const { error } = await db
          .from('mobile_processor_deletions')
          .delete()
          .eq('user_id', row.user_id)
          .eq('provider', 'revenuecat')
        if (error) processorError = true
      } else processorError = true
    } catch {
      processorError = true
    }
  }
  const { error } = await db.rpc('cleanup_mobile_ai')
  if (error) return failure('cleanup_failed')
  const { error: reportError } = await db
    .from('mobile_content_reports')
    .delete()
    .lt('created_at', new Date(now.getTime() - days * 86400000).toISOString())
  const { error: pushError } = await db
    .from('mobile_push_deliveries')
    .delete()
    .lt('created_at', new Date(now.getTime() - 30 * 86400000).toISOString())
  return processorError || reportError || pushError
    ? failure('cleanup_failed')
    : acknowledged()
}
