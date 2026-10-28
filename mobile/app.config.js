const base = require('./app.json').expo
module.exports = () => {
  if (process.env.EAS_BUILD !== 'true' && process.env.CI !== 'true' && process.env.EAS_BUILD_PROFILE !== 'production')
    require('./scripts/local-environment.cjs').assertLocalStaging(process.env)
  const origin = process.env.EXPO_PUBLIC_AUTH_ORIGIN
  const host = origin && /^https:\/\//.test(origin) ? new URL(origin).host : null
  const projectId = process.env.EXPO_PUBLIC_EAS_PROJECT_ID
  return {
    ...base,
    extra: { ...base.extra, ...(projectId ? { eas: { projectId } } : {}) },
    ios: { ...base.ios, ...(host ? { associatedDomains: [`applinks:${host}`] } : {}) },
    android: { ...base.android, ...(host ? { intentFilters: [{ action: 'VIEW', autoVerify: true, category: ['BROWSABLE','DEFAULT'], data: [{ scheme: 'https', host, pathPrefix: '/auth/callback' }] }] } : {}) },
  }
}
