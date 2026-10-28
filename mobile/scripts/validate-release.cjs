const fs = require('fs')
const path = require('path')
const root = path.join(__dirname, '..')
const production =
  process.argv.includes('--production') ||
  process.env.EAS_BUILD_PROFILE === 'production'
const errors = []
const warnings = []
const required = [
  'EXPO_PUBLIC_API_URL',
  'EXPO_PUBLIC_SUPABASE_URL',
  'EXPO_PUBLIC_SUPABASE_ANON_KEY',
]
if (production)
  required.push(
    'EXPO_PUBLIC_AUTH_ORIGIN',
    'EXPO_PUBLIC_EAS_PROJECT_ID',
    'EXPO_PUBLIC_SENTRY_DSN',
    'EXPO_PUBLIC_REVENUECAT_IOS_KEY',
    'EXPO_PUBLIC_REVENUECAT_ANDROID_KEY',
    'SENTRY_AUTH_TOKEN',
    'SENTRY_ORG',
    'SENTRY_PROJECT',
  )
for (const key of required)
  if (!process.env[key]) (production ? errors : warnings).push(`Missing ${key}`)
for (const key of [
  'EXPO_PUBLIC_API_URL',
  'EXPO_PUBLIC_SUPABASE_URL',
  'EXPO_PUBLIC_AUTH_ORIGIN',
]) {
  const value = process.env[key]
  if (value) {
    try {
      const url = new URL(value)
      if (
        production &&
        (url.protocol !== 'https:' ||
          /localhost|127\.0\.0\.1/.test(url.hostname))
      )
        errors.push(`${key} requires a public HTTPS URL`)
      if (url.username || url.password || url.search || url.hash)
        errors.push(`${key} must not contain credentials/query/fragment`)
    } catch {
      errors.push(`Invalid ${key}`)
    }
  }
}
if (production && process.env.EXPO_PUBLIC_APP_ENV !== 'production')
  errors.push('Production environment required')
for (const key of Object.keys(process.env))
  if (
    /^EXPO_PUBLIC_.*(SERVICE_ROLE|PRIVATE_KEY|AUTH_TOKEN|CRON_SECRET|GEMINI|ANTHROPIC|WEBHOOK_SECRET)/.test(
      key,
    )
  )
    errors.push(`Secret-like public variable: ${key}`)
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
if (anonKey?.startsWith('sb_secret_'))
  errors.push('Supabase secret key cannot be bundled as an anon key')
if (anonKey?.split('.').length === 3) {
  try {
    const claims = JSON.parse(
      Buffer.from(anonKey.split('.')[1], 'base64url').toString(),
    )
    if (claims.role !== 'anon')
      errors.push('Supabase bundled JWT must have the anon role')
  } catch {
    errors.push('Invalid bundled Supabase JWT')
  }
}
for (const key of [
  'EXPO_PUBLIC_REVENUECAT_IOS_KEY',
  'EXPO_PUBLIC_REVENUECAT_ANDROID_KEY',
])
  if (process.env[key]?.startsWith('sk_'))
    errors.push(
      'RevenueCat server secret cannot be bundled in a platform SDK key',
    )
const app = JSON.parse(fs.readFileSync(path.join(root, 'app.json'))).expo
if (app.updates?.enabled !== false)
  errors.push('Production OTA must remain disabled for v1')
if (
  !app.android.blockedPermissions?.includes('android.permission.RECORD_AUDIO')
)
  errors.push('Microphone permission must be blocked')
if (production) {
  try {
    require('node:child_process').execFileSync(
      process.execPath,
      [path.join(root, 'scripts/apply-security-patches.cjs'), '--check'],
      { stdio: 'pipe' },
    )
  } catch {
    errors.push('Installed security patches are missing or changed')
  }
  const evidence = JSON.parse(
    fs.readFileSync(path.join(root, 'docs/release-evidence.json')),
  )
  const requiredGates = [
    'permissions',
    'legal-links',
    'account-deletion',
    'security',
    'authentication',
    'email-verification',
    'password-recovery',
    'onboarding',
    'core-flow',
    'persistence',
    'subscriptions',
    'restore-purchases',
    'loading-states',
    'empty-states',
    'error-states',
    'connectivity',
    'push',
    'telemetry',
    'device-matrix',
    'user-beta',
    'backend-contracts',
    'store-accounts',
    'store-metadata',
    'native-release-builds',
  ]
  for (const id of requiredGates)
    if (evidence.gates.filter((item) => item.id === id).length !== 1)
      errors.push(`Missing/duplicate evidence gate: ${id}`)
  for (const item of evidence.gates)
    if (
      item.status !== 'verified' ||
      !item.evidence ||
      !item.verifiedBy ||
      !item.verifiedAt
    )
      errors.push(`Release gate not verified: ${item.id}`)
}
for (const warning of warnings) console.warn(warning)
for (const error of errors) console.error(error)
if (errors.length) process.exitCode = 1
else
  console.log(
    production
      ? 'Release configuration and recorded evidence passed. Store approval remains external.'
      : 'Development configuration inspected. This is not release approval.',
  )
