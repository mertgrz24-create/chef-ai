import { describe, it, expect } from '@jest/globals'
import { aiErrorMessage } from '@/lib/release/ai-error'
import { ApiError } from '@/lib/release/request'

describe('AI error presentation', () => {
  it.each(['ai_provider_busy', 'ai_provider_timeout'])('explains temporary provider failure: %s', (code) => {
    expect(aiErrorMessage(new ApiError('private provider content', 503, code), 'fallback')).toMatch(/temporarily busy/)
  })
  it.each(['ai_provider_quota', 'ai_provider_configuration', 'ai_unavailable'])('does not label provider failure as user quota: %s', (code) => {
    expect(aiErrorMessage(new ApiError('private', 503, code), 'fallback')).toMatch(/currently unavailable/)
  })
  it('retains caller fallback for unrelated errors without exposing messages', () => {
    expect(aiErrorMessage(new Error('private'), 'fallback')).toBe('fallback')
    expect(aiErrorMessage(new ApiError('private', 403, 'limit_reached'), 'fallback')).toBe('fallback')
  })
})
