import { createAdminClient } from '@/lib/supabase/admin'
import { authenticated, acknowledged, failure } from '@/lib/mobile/service'
import { payloadHash, readJson, requestKey } from '@/lib/mobile/validation'
export async function POST(request: Request) {
  const { user } = await authenticated()
  if (!user) return failure('unauthenticated', 401)
  let body
  try {
    body = await readJson(request, 6000)
  } catch {
    return failure('invalid_body', 400)
  }
  if (
    !['recipe', 'meal-plan', 'scan'].includes(String(body.source)) ||
    !Number.isInteger(body.category) ||
    Number(body.category) < 0 ||
    Number(body.category) > 3 ||
    (body.details !== undefined &&
      (typeof body.details !== 'string' || body.details.length > 1000))
  )
    return failure('invalid_report', 400)
  let resultId: string | null = null
  const db = createAdminClient()
  if (
    body.resultId !== null &&
    body.resultId !== undefined &&
    body.resultId !== ''
  ) {
    if (
      typeof body.resultId !== 'string' ||
      !/^[-a-f0-9]{36}$/i.test(body.resultId)
    )
      return failure('invalid_result', 400)
    resultId = body.resultId
    const { data: job, error: jobError } = await db
      .from('mobile_ai_jobs')
      .select('kind,status')
      .eq('id', resultId)
      .eq('user_id', user.id)
      .maybeSingle()
    if (jobError) return failure('report_unavailable')
    let owned =
      job?.status === 'succeeded' &&
      job.kind ===
        ({ recipe: 'recipes', 'meal-plan': 'plans', scan: 'scans' }[
          String(body.source)
        ] ?? '')
    if (!owned && body.source !== 'scan') {
      const { data: row, error } = await db
        .from(body.source === 'recipe' ? 'recipes' : 'meal_plans')
        .select('id')
        .eq('id', resultId)
        .eq('user_id', user.id)
        .maybeSingle()
      if (error) return failure('report_unavailable')
      owned = !!row
    }
    if (!owned) return failure('result_not_found', 404)
  }
  const key = requestKey(request.headers.get('Idempotency-Key'))
  if (!key) return failure('idempotency_key_required', 400)
  const { data, error } = await db.rpc('submit_mobile_report', {
    p_user: user.id,
    p_source: body.source,
    p_result: resultId,
    p_category: body.category,
    p_details: body.details ?? null,
    p_key: key,
    p_hash: payloadHash(body),
  })
  if (error) return failure('report_unavailable')
  if (data === 'rate_limited') return failure('rate_limited', 429)
  if (data === 'conflict') return failure('idempotency_conflict', 409)
  return data === 'ok' ? acknowledged() : failure('report_unavailable')
}
