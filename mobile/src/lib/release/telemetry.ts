import * as Sentry from '@sentry/react-native'
import Constants from 'expo-constants'

// Allowlisted metadata only. Unknown SDK fields must not become a content side channel.
const record = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === 'object' && !Array.isArray(v)
const identifier = (v: unknown, max = 200) =>
  typeof v === 'string' && /^[a-zA-Z0-9_.$:[\]<>@ /+()-]+$/.test(v) ? v.slice(0, max) : undefined
const address = (v: unknown) => typeof v === 'string' && /^0x[0-9a-f]+$/i.test(v) ? v : undefined
function codePath(value: unknown) {
  if (typeof value !== 'string') return undefined
  const clean = value.split(/[?#]/)[0]
  const name = clean.split(/[\\/]/).pop()
  if (!name || !/^[A-Za-z0-9_.+-]{1,200}$/.test(name)) return undefined
  return clean.startsWith('app:///') ? `app:///${name}` : name
}
export function scrubEvent<T extends object>(event: T): T {
  const input = event as Record<string, unknown>
  const safe: Record<string, unknown> = {}
  for (const key of ['event_id','timestamp','platform','release','dist','environment','level','type']) {
    const value = input[key]
    if (typeof value === 'string' || typeof value === 'number') safe[key] = value
  }
  if (record(input.exception) && Array.isArray(input.exception.values)) {
    safe.exception = { values: input.exception.values.slice(0, 10).filter(record).map(v => ({
      type: identifier(v.type, 80) ?? 'Error',
      value: 'Application error (details removed)',
      stacktrace: safeStack(v.stacktrace),
      mechanism: record(v.mechanism) ? {
        type: identifier(v.mechanism.type, 80),
        handled: typeof v.mechanism.handled === 'boolean' ? v.mechanism.handled : undefined,
      } : undefined,
    })) }
  }
  // Retain native / source-map debug IDs needed for symbolication, never arbitrary debug metadata.
  if (record(input.debug_meta) && Array.isArray(input.debug_meta.images)) {
    safe.debug_meta = { images: input.debug_meta.images.slice(0, 200).filter(record).map(image => ({
      type: identifier(image.type, 40),
      debug_id: typeof image.debug_id === 'string' && /^[a-f0-9-]{8,80}$/i.test(image.debug_id) ? image.debug_id : undefined,
      code_id: typeof image.code_id === 'string' && /^[a-f0-9-]{8,100}$/i.test(image.code_id) ? image.code_id : undefined,
      image_addr: address(image.image_addr),
      image_size: typeof image.image_size === 'number' && Number.isFinite(image.image_size) ? image.image_size : undefined,
      arch: identifier(image.arch, 40),
      code_file: codePath(image.code_file),
      debug_file: codePath(image.debug_file),
    })) }
  }
  return safe as T
}
function safeStack(value: unknown) {
  if (!record(value) || !Array.isArray(value.frames)) return undefined
  return { frames: value.frames.slice(-200).filter(record).map(frame => ({
    function: identifier(frame.function),
    filename: codePath(frame.filename),
    lineno: Number.isInteger(frame.lineno) ? frame.lineno : undefined,
    colno: Number.isInteger(frame.colno) ? frame.colno : undefined,
    in_app: typeof frame.in_app === 'boolean' ? frame.in_app : undefined,
    instruction_addr: address(frame.instruction_addr),
    image_addr: address(frame.image_addr),
  })) }
}
export function initTelemetry() {
  const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN
  if (!dsn || __DEV__) return
  Sentry.init({
    dsn,
    sendDefaultPii: false,
    enableLogs: false,
    tracesSampleRate: 0,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0,
    environment: process.env.EXPO_PUBLIC_APP_ENV ?? 'development',
    release: `chef-ai@${Constants.expoConfig?.version ?? '0.0.0'}`,
    dist: Constants.nativeBuildVersion ?? undefined,
    beforeSend: (event) => scrubEvent(event),
    beforeBreadcrumb: () => null,
  })
}
export function reportError(category: string) {
  // Do not pass raw API/auth error objects to third-party telemetry.
  Sentry.captureException(
    new Error(category.replace(/[^a-z_]/g, '').slice(0, 50)),
  )
}
