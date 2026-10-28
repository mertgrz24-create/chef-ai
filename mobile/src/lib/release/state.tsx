import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import NetInfo from '@react-native-community/netinfo'
import { AppState, Platform } from 'react-native'
import Constants from 'expo-constants'
import { useAuth } from '@/lib/auth'
import { apiFetch, publicFetch } from '@/lib/api'
import {
  ackSchema,
  mobileConfigSchema,
  membershipSchema,
  type MobileConfig,
  type Membership,
} from './contracts'
import { getLocale, getUnits, loadLocale, useLocale } from './locale'
import { readPreference, writePreference } from './storage'

export type Preferences = {
  onboarded: boolean
  analytics: boolean
  aiConsent: string | null
}
const defaults: Preferences = {
  onboarded: false,
  analytics: false,
  aiConsent: null,
}
export type EventName =
  | 'onboarding_completed'
  | 'first_ingredient_added'
  | 'scan_completed'
  | 'recipe_generated'
  | 'recipe_saved'
  | 'plan_created'
  | 'paywall_opened'
  | 'restore_completed'
export type AnalyticsEvent = {
  event: EventName
  version: string
  platform: string
  locale: string
  result: 'success' | 'failure'
}
export interface AnalyticsSink {
  send(event: AnalyticsEvent): Promise<void>
}
export class HttpAnalyticsSink implements AnalyticsSink {
  async send(event: AnalyticsEvent) {
    await apiFetch(
      '/api/mobile/analytics',
      { method: 'POST', body: JSON.stringify(event) },
      ackSchema,
    )
  }
}
type ReleaseState = {
  config: MobileConfig | null
  configLoading: boolean
  configError: boolean
  reload: () => Promise<void>
  offline: boolean
  preferences: Preferences
  preferencesReady: boolean
  preferenceError: boolean
  updatePreferences: (patch: Partial<Preferences>) => Promise<void>
  acceptAi: () => Promise<void>
  revokeAi: () => Promise<void>
  aiAllowed: boolean
  membership: Membership | null
  refreshMembership: () => Promise<Membership | null>
  track: (event: EventName, result?: 'success' | 'failure') => Promise<void>
}
const Context = createContext<ReleaseState | undefined>(undefined)
export function ReleaseProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth()
  const id = session?.user.id
  useLocale()
  const [config, setConfig] = useState<MobileConfig | null>(null),
    [configLoading, setLoading] = useState(true),
    [configError, setError] = useState(false)
  const [offline, setOffline] = useState(false),
    [preferences, setPreferences] = useState(defaults),
    [preferencesReady, setReady] = useState(false),
    [preferenceError, setPreferenceError] = useState(false)
  const [membership, setMembership] = useState<Membership | null>(null)
  const live = useRef(true),
    version = useRef(0)
  async function reload() {
    const request = ++version.current
    setLoading(true)
    try {
      const next = await publicFetch('/api/mobile/config', mobileConfigSchema)
      if (!live.current || request !== version.current) return
      setConfig(next)
      setError(false)
    } catch {
      if (live.current && request === version.current) {
        setConfig(null)
        setError(true)
      }
    } finally {
      if (live.current && request === version.current) setLoading(false)
    }
  }
  const membershipRequest=useRef<Promise<Membership|null>|null>(null)
  const refreshMembership = useCallback(async () => {
    if (!id) return null
    if(membershipRequest.current)return membershipRequest.current
    const request=(async()=>{
    try {
      const next = await apiFetch('/api/billing/status', {}, membershipSchema)
      if (live.current) setMembership(next)
      return next
    } catch {
      if (live.current) setMembership(null)
      return null
    }
    })()
    membershipRequest.current=request
    try{return await request}finally{if(membershipRequest.current===request)membershipRequest.current=null}
  }, [id])
  useEffect(() => {
    live.current = true
    void Promise.resolve().then(reload)
    void (async () => {
      try {
        await loadLocale()
        if (id) {
          const raw = await readPreference(`chef.user.${id}`)
          if (raw) {
            const p = JSON.parse(raw)
            if (live.current)
              setPreferences({
                onboarded: p.onboarded === true,
                analytics: p.analytics === true,
                aiConsent: typeof p.aiConsent === 'string' ? p.aiConsent : null,
              })
          }
        }
      } catch {
        if (live.current) setPreferenceError(true)
      } finally {
        if (live.current) setReady(true)
      }
    })()
    const network = NetInfo.addEventListener((state) => {
      setOffline(
        state.isConnected === false || state.isInternetReachable === false,
      )
    })
    const app = AppState.addEventListener('change', (state) => {
      if (state === 'active') {void reload();void refreshMembership()}
    })
    return () => {
      live.current = false
      network()
      app.remove()
    }
  }, [id,refreshMembership])
  useEffect(() => {
    void Promise.resolve().then(refreshMembership)
  }, [refreshMembership,config?.capabilities.billing])
  async function updatePreferences(patch: Partial<Preferences>) {
    if (!id) throw new Error('unauthenticated')
    const next = { ...preferences, ...patch }
    await writePreference(`chef.user.${id}`, JSON.stringify(next))
    if (live.current) {
      setPreferences(next)
      setPreferenceError(false)
    }
  }
  async function acceptAi() {
    if (!config?.capabilities.consents || offline)
      throw new Error('consent_unavailable')
    await apiFetch(
      '/api/privacy/consents',
      {
        method: 'POST',
        body: JSON.stringify({
          scope: 'ai',
          version: config.ai.consentVersion,
          accepted: true,
          locale: getLocale(),
        }),
      },
      ackSchema,
    )
    await updatePreferences({ aiConsent: config.ai.consentVersion })
  }
  async function revokeAi() {
    // Block local AI immediately, even if server revocation cannot be delivered.
    await updatePreferences({ aiConsent: null })
    if (config?.capabilities.consents)
      await apiFetch(
        '/api/privacy/consents',
        {
          method: 'POST',
          body: JSON.stringify({
            scope: 'ai',
            version: config.ai.consentVersion,
            accepted: false,
            locale: getLocale(),
          }),
        },
        ackSchema,
      )
  }
  const aiAllowed = !!(
    preferencesReady &&
    preferences.onboarded &&
    preferences.aiConsent === config?.ai.consentVersion &&
    config?.capabilities.ai &&
    config.capabilities.consents &&
    config.capabilities.reports &&
    (getLocale() !== 'tr' || config.capabilities.localizedAi) &&
    !config.maintenance &&
    !offline
  )
  async function track(
    event: EventName,
    result: 'success' | 'failure' = 'success',
  ) {
    if (
      !live.current ||
      !preferences.analytics ||
      !config?.capabilities.analytics ||
      offline ||
      !id
    )
      return
    // No disk queue, identities, inputs, free text or timestamps from the device.
    try {
      await new HttpAnalyticsSink().send({
        event,
        result,
        version: Constants.expoConfig?.version ?? '0.0.0',
        platform: Platform.OS,
        locale: getLocale(),
      })
    } catch {
      /* analytics must never block a task */
    }
  }
  return (
    <Context.Provider
      value={{
        config,
        configLoading,
        configError,
        reload,
        offline,
        preferences,
        preferencesReady,
        preferenceError,
        updatePreferences,
        acceptAi,
        revokeAi,
        aiAllowed,
        membership,
        refreshMembership,
        track,
      }}
    >
      {children}
    </Context.Provider>
  )
}
export function useRelease() {
  const ctx = useContext(Context)
  if (!ctx) throw new Error('ReleaseProvider missing')
  return ctx
}
export function requestMetadata() {
  return { locale: getLocale(), units: getUnits() }
}
