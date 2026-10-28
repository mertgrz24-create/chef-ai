import { failure } from './service'

// Provider details may contain keys, URLs or user prompts. Return fixed codes only.
export function providerError(error: unknown) {
  const status = error && typeof error === 'object' && 'status' in error
    ? error.status : undefined
  if(error instanceof Error && error.message==='dispatch_not_authorized')return failure('ai_dispatch_denied',503)
  if (status === 429 || status === 402) return failure('ai_provider_quota', 503)
  if (status === 503 || status === 500) return failure('ai_provider_busy', 503)
  if (status === 401 || status === 403 || status === 404)
    return failure('ai_provider_configuration', 503)
  if (status===504)return failure('ai_provider_timeout',504)
  if (error instanceof Error && (error.name === 'AbortError' || error.name === 'TimeoutError'))
    return failure('ai_provider_timeout', 504)
  if (error instanceof Error && error.message === 'invalid_ai_output')
    return failure('invalid_ai_output', 502)
  return typeof status==='number' && status>=400 && status<=599 ? failure('generation_failed',502) : failure('ai_provider_uncertain', 503)
}

export const safeAiErrorCodes = new Set([
  'ai_provider_quota', 'ai_provider_busy', 'ai_provider_configuration',
  'ai_provider_timeout', 'ai_provider_uncertain', 'ai_dispatch_denied', 'invalid_ai_output',
])
