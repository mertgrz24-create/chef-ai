export type AuthCallback =
  | { kind: 'code'; code: string }
  | { kind: 'otp'; tokenHash: string; type: 'recovery' | 'signup' | 'email' }
export function parseAuthCallback(
  raw: string,
  httpsOrigin?: string,
): AuthCallback {
  const url = new URL(raw)
  const isCustom =
    url.protocol === 'chefai:' &&
    url.hostname === 'auth' &&
    url.pathname === '/callback'
  const isHttps =
    httpsOrigin &&
    url.origin === new URL(httpsOrigin).origin &&
    url.protocol === 'https:' &&
    url.pathname === '/auth/callback'
  if (!isCustom && !isHttps) throw new Error('invalid_callback')
  // Implicit access/refresh-token links are deliberately unsupported. Use PKCE or token_hash.
  if (
    url.hash ||
    url.searchParams.has('access_token') ||
    url.searchParams.has('refresh_token')
  )
    throw new Error('invalid_callback')
  const code = url.searchParams.get('code')
  if (code && code.length <= 2048) return { kind: 'code', code }
  const tokenHash = url.searchParams.get('token_hash'),
    type = url.searchParams.get('type')
  if (
    tokenHash &&
    tokenHash.length <= 2048 &&
    (type === 'recovery' || type === 'signup' || type === 'email')
  )
    return { kind: 'otp', tokenHash, type }
  throw new Error('invalid_callback')
}
