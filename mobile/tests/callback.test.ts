import { describe, it, expect } from '@jest/globals'
import { parseAuthCallback } from '@/lib/release/callback'
describe('auth callback allowlist', () => {
  it('accepts a PKCE app callback', () =>
    expect(parseAuthCallback('chefai://auth/callback?code=abc')).toEqual({
      kind: 'code',
      code: 'abc',
    }))
  it('accepts verified HTTPS origin only', () =>
    expect(
      parseAuthCallback(
        'https://chef.example/auth/callback?code=abc',
        'https://chef.example',
      ),
    ).toEqual({ kind: 'code', code: 'abc' }))
  it('supports recovery OTP for another device', () =>
    expect(
      parseAuthCallback('chefai://auth/callback?token_hash=abc&type=recovery'),
    ).toEqual({ kind: 'otp', tokenHash: 'abc', type: 'recovery' }))
  it.each([
    'https://attacker.example/auth/callback?code=abc',
    'chefai://other/callback?code=abc',
    'chefai://auth/other?code=abc',
    'chefai://auth/callback#access_token=secret',
    'chefai://auth/callback?refresh_token=secret',
    'chefai://auth/callback?token_hash=abc&type=unknown',
    'chefai://auth/callback',
  ])('rejects %s', (url) =>
    expect(() => parseAuthCallback(url, 'https://chef.example')).toThrow(),
  )
})
