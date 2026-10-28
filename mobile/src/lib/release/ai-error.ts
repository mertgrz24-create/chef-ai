import { ApiError } from './request'

// Stable message IDs; never display raw provider errors or prompts.
export function aiErrorMessage(error: unknown, fallback: string) {
  if (!(error instanceof ApiError)) return fallback
  if(error.code==='ai_result_unavailable')return 'No result was confirmed within five minutes. Your usage credit was returned.'
  if(['result_confirmation_pending','result_confirmation_failed','ai_job_not_found','operation_pending'].includes(error.code))return 'Your AI result is not yet confirmed. Check the existing operation before starting another.'
  if (['ai_provider_busy', 'ai_provider_timeout'].includes(error.code))
    return 'AI is temporarily busy. Your input is preserved. Try again later.'
  if (['ai_provider_quota', 'ai_provider_configuration', 'ai_unavailable', 'localized_ai_unavailable'].includes(error.code))
    return 'AI is currently unavailable. You can continue using Pantry and your saved content.'
  if (error.code === 'consent_required')
    return 'Review and accept AI data transfer before continuing.'
  return fallback
}
