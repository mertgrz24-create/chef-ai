import { aiOperation, aiStatusSchema, startPendingAi, clearPendingAi, hidePendingAi, pendingAiStore, recoverAiResult, showPendingAi } from './release/ai-recovery'
import { z } from 'zod'
import { supabase } from './supabase'
import {
  ApiError,
  transport,
  requestId,
  type RequestOptions,
} from './release/request'
import { getLocale, getUnits } from './release/locale'
import {
  pantrySchema,
  pantryItemSchema,
  recipeResponseSchema,
  mealPlanSchema,
  visionSchema,
  ackSchema,
} from './release/contracts'
export { ApiError } from './release/request'
let refresh: ReturnType<typeof supabase.auth.refreshSession> | null = null
let authGeneration = 0
supabase.auth.onAuthStateChange((event) => {
  if (event === 'SIGNED_OUT' || event === 'SIGNED_IN') {
    authGeneration++
    const previous=pendingAiStore.getSnapshot()
    if(previous){hidePendingAi(previous.owner);if(event==='SIGNED_OUT')void clearPendingAi(previous.owner,previous.pending.key).catch(()=>{})}
  }
})
export function apiBase() {
  const API_URL = process.env.EXPO_PUBLIC_API_URL
  if (!API_URL) throw new ApiError('API is not configured.', 0, 'configuration')
  const url = new URL(API_URL)
  if (
    url.protocol !== 'https:' &&
    !(__DEV__ && ['localhost', '127.0.0.1', '10.0.2.2'].includes(url.hostname))
  )
    throw new ApiError('HTTPS required.', 0, 'configuration')
  return API_URL.replace(/\/$/, '')
}
export async function publicFetch<T>(
  path: string,
  schema: z.ZodType<T>,
): Promise<T> {
  const data = await transport(`${apiBase()}${path}`, {})
  const parsed = schema.safeParse(data)
  if (!parsed.success)
    throw new ApiError('Incompatible server response.', 502, 'invalid_response')
  return parsed.data
}
function schemaFor(path: string, method: string): z.ZodType | undefined {
  if (path === '/api/pantry')
    return method === 'GET'
      ? pantrySchema
      : z.object({ item: pantryItemSchema })
  if (path.startsWith('/api/pantry/') && method === 'PATCH') return z.object({item:pantryItemSchema.extend({revision:z.number().int().nonnegative()})})
  if (path === '/api/recipes') return recipeResponseSchema
  if (path.startsWith('/api/meal-plan')) return mealPlanSchema
  if (path === '/api/vision') return visionSchema
  if (path === '/api/account') return ackSchema
}
export async function apiFetch<T>(
  path: string,
  options: RequestOptions & { expectedUserId?: string } = {},
  schema?: z.ZodType<T>,
): Promise<T> {
  if (!path.startsWith('/api/') || path.includes('://'))
    throw new ApiError('Invalid API path.', 0, 'configuration')
  const generation = authGeneration
  const {
    data: { session },
  } = await supabase.auth.getSession()
  // Session lookup can finish after sign-out/sign-in. Reject before sending a
  // write, otherwise an old screen's data could be committed to the new user.
  if (generation !== authGeneration)
    throw new ApiError('Account changed.', 0, 'cancelled')
  if (!session) throw new ApiError('Not signed in.', 401, 'unauthenticated')
  const { expectedUserId, ...requestOptions } = options
  if (expectedUserId && session.user.id !== expectedUserId)
    throw new ApiError('Account changed.', 0, 'cancelled')
  const sessionToken=session.access_token,sessionUserId=session.user.id
  const method = (options.method ?? 'GET').toUpperCase()
  const id = options.requestId ?? requestId()
  const operation=aiOperation(path,method)
  const pending=operation?{operation,key:new Headers(options.headers).get('Idempotency-Key')??id,startedAt:Date.now()}:null
  if(pending) {
    await startPendingAi(session.user.id,pending)
    if(generation!==authGeneration){await clearPendingAi(session.user.id,pending.key);throw new ApiError('Account changed.',0,'cancelled',id)}
  }
  const send = (token: string) => {
    const headers = new Headers(options.headers)
    if (!(options.body instanceof FormData))
      headers.set('Content-Type', 'application/json')
    headers.set('Authorization', `Bearer ${token}`)
    headers.set('X-App-Locale', getLocale())
    headers.set('X-Unit-System', getUnits())
    if (method !== 'GET' && !headers.has('Idempotency-Key'))
      headers.set('Idempotency-Key', id)
    return transport(`${apiBase()}${path}`, {
      ...requestOptions,
      headers,
      requestId: id,
      timeoutMs:
        options.timeoutMs ??
        (method === 'GET'
          ? 20000
          : path.includes('recipes') ||
              path.includes('meal-plan') ||
              path.includes('vision')
            ? 120000
            : 20000),
    })
  }
  async function execute():Promise<unknown> {
  try {
    return await send(sessionToken)
  } catch (error) {
    if (
      !(error instanceof ApiError) ||
      error.status !== 401 ||
      generation !== authGeneration
    )
      throw error
    // Only safe reads are replayed. A write may already have had a side effect.
    if (!refresh)
      refresh = supabase.auth.refreshSession().finally(() => {
        refresh = null
      })
    const refreshed = await refresh
    if (
      refreshed.error ||
      !refreshed.data.session ||
      refreshed.data.session.user.id !== sessionUserId ||
      generation !== authGeneration
    )
      throw new ApiError('Sign in again.', 401, 'unauthenticated', id)
    if (method !== 'GET')
      throw new ApiError(
        'Session renewed. Check the result before retrying.',
        401,
        'session_renewed',
        id,
      )
    return await send(refreshed.data.session.access_token)
  }
  }
  let data:unknown
  try {data=await execute()} catch(error) {
    const uncertain=error instanceof ApiError && (error.status>=500 || ['timeout','offline','session_renewed','invalid_response','operation_pending'].includes(error.code))
    if(pending&&uncertain&&generation===authGeneration&&!options.signal?.aborted) {
      showPendingAi(session.user.id,pending,true)
      try {
        data=await recoverAiResult(pending,async signal=>{
          if(generation!==authGeneration)throw new ApiError('Account changed.',401,'cancelled',id)
          return apiFetch(`/api/mobile/ai-status?operation=${pending.operation}`,{headers:{'Idempotency-Key':pending.key},signal},aiStatusSchema)
        },{signal:options.signal??undefined})
      } catch(recoveryError) {
        if(recoveryError instanceof ApiError && recoveryError.status>=300 && !['ai_job_not_found','cancelled'].includes(recoveryError.code) && ![401,403].includes(recoveryError.status))await clearPendingAi(session.user.id,pending.key)
        else if(generation===authGeneration)showPendingAi(session.user.id,pending,false)
        throw recoveryError
      }
    } else {
      if(pending&&error instanceof ApiError&&error.status>=400&&error.status<500&&error.code!=='cancelled')await clearPendingAi(session.user.id,pending.key)
      throw error
    }
  }
  if (generation !== authGeneration)
    throw new ApiError('Account changed.', 0, 'cancelled', id)
  const validator = schema ?? schemaFor(path, method)
  if (validator) {
    const parsed = validator.safeParse(data)
    if (!parsed.success)
      throw new ApiError(
        'Incompatible server response.',
        502,
        'invalid_response',
        id,
      )
    if(pending)await clearPendingAi(session.user.id,pending.key)
    return parsed.data as T
  }
  if(pending)await clearPendingAi(session.user.id,pending.key)
  return data as T
}
export async function apiUpload<T>(path: string, form: FormData, signal?: AbortSignal): Promise<T> {
  return apiFetch<T>(path, { method: 'POST', body: form, timeoutMs: 120000, signal })
}
