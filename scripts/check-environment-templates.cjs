// Inspect templates only; never load or print actual dotenv credentials.
const fs = require('node:fs')
const path = require('node:path')
const root = path.resolve(__dirname, '..')
function template(name) {
  const values = new Map()
  for (const line of fs.readFileSync(path.join(root, name, '.env.example'), 'utf8').split(/\r?\n/)) {
    const match = /^([A-Z][A-Z0-9_]*)=(.*)$/.exec(line)
    if (!match) continue
    if (values.has(match[1])) throw new Error('Duplicate template variable: ' + match[1])
    values.set(match[1], match[2].split(/\s+#/)[0].trim())
  }
  return values
}
const mobile = template('mobile'), backend = template('backend')
if ([...mobile.keys()].some(k => !k.startsWith('EXPO_PUBLIC_'))) throw new Error('Mobile template contains a server variable')
for (const [key,value] of mobile) {
  if (/GEMINI|SERVICE_ROLE|PRIVATE|SECRET|WEBHOOK|AUTH_TOKEN/.test(key)) throw new Error('Server secret-like field in mobile template')
  if (/KEY|DSN|PROJECT_ID/.test(key) && value) throw new Error('Keep template credential/identity fields blank: ' + key)
}
for (const [key,value] of backend) {
  if (/KEY|SECRET|WEBHOOK_AUTH|ACCESS_TOKEN/.test(key) && value) throw new Error('Keep server template credentials blank: ' + key)
  if (/^MOBILE_.*READY$/.test(key) && value !== 'false') throw new Error('Readiness must fail closed in templates: ' + key)
}
if (mobile.get('EXPO_PUBLIC_SUPABASE_URL') !== backend.get('NEXT_PUBLIC_SUPABASE_URL')) throw new Error('Template Supabase environments differ')
if (mobile.get('EXPO_PUBLIC_APP_ENV') !== 'staging' || backend.get('MOBILE_ENVIRONMENT') !== 'staging') throw new Error('Templates must default to staging')
for (const required of ['GEMINI_API_KEY','SUPABASE_SERVICE_ROLE_KEY','MOBILE_AI_DAILY_ATTEMPT_LIMIT','MOBILE_REPORT_RETENTION_DAYS']) if (!backend.has(required)) throw new Error('Missing backend template variable: ' + required)
for (const required of ['EXPO_PUBLIC_API_URL','EXPO_PUBLIC_SUPABASE_URL','EXPO_PUBLIC_SUPABASE_ANON_KEY']) if (!mobile.has(required)) throw new Error('Missing mobile template variable: ' + required)
console.log('Environment templates: separate public/server scopes, blank credentials, matching staging and disabled readiness verified.')
