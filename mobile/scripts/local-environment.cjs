const STAGING_URL = 'https://vcyqtbzhfanbpclfhibv.supabase.co'
const STAGING_API = 'https://chef-ai-staging-nu.vercel.app'
function assertLocalStaging(env) {
  if (env.EXPO_PUBLIC_APP_ENV !== 'staging' || env.EXPO_PUBLIC_SUPABASE_URL !== STAGING_URL)
    throw new Error('Local mobile development requires staging; production configuration refused.')
  const api = new URL(env.EXPO_PUBLIC_API_URL || 'https://missing.invalid')
  const local = ['localhost', '127.0.0.1', '10.0.2.2'].includes(api.hostname) &&
    ['http:', 'https:'].includes(api.protocol)
  if ((!local && api.origin !== STAGING_API) || api.username || api.password || api.search || api.hash || api.pathname !== '/')
    throw new Error('Local mobile API must be staging or an explicit loopback development server.')
  const key = env.EXPO_PUBLIC_SUPABASE_ANON_KEY || ''
  if (key.split('.').length === 3) {
    let claims
    try { claims = JSON.parse(Buffer.from(key.split('.')[1], 'base64url').toString()) }
    catch { throw new Error('Invalid staging public Supabase key.') }
    if (claims.ref !== 'vcyqtbzhfanbpclfhibv' || claims.role !== 'anon')
      throw new Error('Local public Supabase key must match staging and have the anon role.')
  } else if (key !== 'sb_publishable_V-Bl66ix0kROl-keYBheuA_5NChBjw_') {
    throw new Error('Unknown staging public key; explicitly review key rotations.')
  }
  for (const name of Object.keys(env)) {
    if (/^EXPO_PUBLIC_.*(GEMINI|ANTHROPIC|SERVICE_ROLE|PRIVATE_KEY|AUTH_TOKEN|CRON_SECRET|WEBHOOK_SECRET)/.test(name) && env[name])
      throw new Error('Server secret detected in a public mobile environment variable.')
  }
}
module.exports = { assertLocalStaging }
if (require.main === module) {
  process.env.NODE_ENV ||= 'development'
  require('@expo/env').load(require('node:path').resolve(__dirname, '..'), { mode: 'development' })
  assertLocalStaging(process.env)
  console.log('Local mobile: staging Supabase and API; public key only.')
}
