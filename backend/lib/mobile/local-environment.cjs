const STAGING_REF = 'vcyqtbzhfanbpclfhibv'
function assertLocalStaging(env) {
  if (env.MOBILE_ENVIRONMENT !== 'staging' ||
      env.NEXT_PUBLIC_SUPABASE_URL !== `https://${STAGING_REF}.supabase.co`)
    throw new Error('Local API requires the isolated staging Supabase environment.')
  for (const name of ['NEXT_PUBLIC_SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY']) {
    const value = env[name]
    if (!value) throw new Error(`Missing local staging ${name}; no production fallback.`)
    if (value.split('.').length === 3) {
      let claims
      try { claims = JSON.parse(Buffer.from(value.split('.')[1], 'base64url').toString()) }
      catch { throw new Error(`Invalid local staging ${name}.`) }
      const role = name === 'SUPABASE_SERVICE_ROLE_KEY' ? 'service_role' : 'anon'
      if (claims.ref !== STAGING_REF || claims.role !== role)
        throw new Error(`Local staging ${name} belongs to the wrong project or role.`)
    } else if (name === 'NEXT_PUBLIC_SUPABASE_ANON_KEY' &&
               value !== 'sb_publishable_V-Bl66ix0kROl-keYBheuA_5NChBjw_') {
      throw new Error('Unknown staging publishable key; explicitly review key rotations.')
    } else if (name === 'SUPABASE_SERVICE_ROLE_KEY' && !value.startsWith('sb_secret_')) {
      throw new Error('Invalid local staging server key.')
    }
  }
  if (!env.GEMINI_API_KEY) throw new Error('Missing local staging GEMINI_API_KEY; no legacy fallback.')
}
module.exports = { assertLocalStaging }
if (require.main === module) {
  require('@next/env').loadEnvConfig(require('node:path').resolve(__dirname, '../..'), true)
  assertLocalStaging(process.env)
  console.log('Local API: staging only; credentials present; values hidden.')
}
