import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import { AppState } from 'react-native'
import type { Session } from '@supabase/supabase-js'
import * as Linking from 'expo-linking'
import { supabase } from './supabase'
import { parseAuthCallback } from './release/callback'
import { detachPush } from './notifications'
import { clearBilling } from './release/billing'
import { writePreference } from './release/storage'

type AuthState = {
  session: Session | null
  initializing: boolean
  initError: boolean
  recovery: boolean
  callbackError: boolean
  retryInit: () => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signUp: (
    email: string,
    password: string,
  ) => Promise<{ needsConfirmation: boolean }>
  resend: (email: string) => Promise<void>
  resetPassword: (email: string) => Promise<void>
  updatePassword: (password: string) => Promise<void>
  signOut: () => Promise<void>
  clearDeletedAccount: () => Promise<void>
  handleCallback: (url: string) => Promise<void>
}
const AuthContext = createContext<AuthState | undefined>(undefined)
const redirectTo = process.env.EXPO_PUBLIC_AUTH_ORIGIN
  ? `${process.env.EXPO_PUBLIC_AUTH_ORIGIN}/auth/callback`
  : 'chefai://auth/callback'
let lastEmailAt = 0
async function emailAction(action: () => Promise<{ error: unknown }>) {
  if (Date.now() - lastEmailAt < 60000) throw new Error('email_cooldown')
  lastEmailAt = Date.now()
  const { error } = await action()
  if (error) throw error
}
const handled = new Set<string>()
let callbackInFlight: Promise<void> | null = null
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [initializing, setInitializing] = useState(true)
  const [initError, setInitError] = useState(false)
  const [recovery, setRecovery] = useState(false)
  const [callbackError, setCallbackError] = useState(false)
  async function retryInit() {
    setInitializing(true)
    setInitError(false)
    try {
      const { data, error } = await Promise.race([
        supabase.auth.getSession(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('timeout')), 15000),
        ),
      ])
      if (error) throw error
      setSession(data.session)
    } catch {
      setInitError(true)
    } finally {
      setInitializing(false)
    }
  }
  async function handleCallback(url: string) {
    if (handled.has(url)) return
    if (callbackInFlight) return callbackInFlight
    callbackInFlight = (async () => {
      try {
        const parsed = parseAuthCallback(
          url,
          process.env.EXPO_PUBLIC_AUTH_ORIGIN,
        )
        const result =
          parsed.kind === 'code'
            ? await supabase.auth.exchangeCodeForSession(parsed.code)
            : await supabase.auth.verifyOtp({
                token_hash: parsed.tokenHash,
                type: parsed.type,
              })
        if (result.error) throw result.error
        if (parsed.kind === 'otp' && parsed.type === 'recovery')
          setRecovery(true)
        // Keep only one token-bearing URL in memory and never persist or log it.
        handled.clear()
        handled.add(url)
        setCallbackError(false)
      } catch {
        setCallbackError(true)
        throw new Error('invalid_callback')
      }
    })().finally(() => {
      callbackInFlight = null
    })
    return callbackInFlight
  }
  useEffect(() => {
    void Promise.resolve().then(retryInit)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, next) => {
      setSession(next)
      if (event === 'PASSWORD_RECOVERY') setRecovery(true)
      if (event === 'SIGNED_OUT') {
        setRecovery(false)
        void clearBilling().catch(() => {})
      }
    })
    const state = AppState.addEventListener('change', (next) => {
      if (next === 'active') supabase.auth.startAutoRefresh()
      else supabase.auth.stopAutoRefresh()
    })
    if (AppState.currentState === 'active') supabase.auth.startAutoRefresh()
    const receive = (url: string) => {
      if (
        url.includes('/auth/callback') ||
        url.startsWith('chefai://auth/callback')
      )
        void handleCallback(url).catch(() => {})
    }
    void Linking.getInitialURL().then((url) => {
      if (url) receive(url)
    })
    const link = Linking.addEventListener('url', ({ url }) => receive(url))
    return () => {
      subscription.unsubscribe()
      state.remove()
      link.remove()
      supabase.auth.stopAutoRefresh()
    }
  }, [])
  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
  }
  const signUp = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: redirectTo },
    })
    if (error) throw error
    return { needsConfirmation: !data.session }
  }
  const resend = (email: string) =>
    emailAction(() =>
      supabase.auth.resend({
        type: 'signup',
        email,
        options: { emailRedirectTo: redirectTo },
      }),
    )
  const resetPassword = (email: string) =>
    emailAction(() =>
      supabase.auth.resetPasswordForEmail(email, { redirectTo }),
    )
  const updatePassword = async (password: string) => {
    if (!recovery) throw new Error('invalid_callback')
    const { error } = await supabase.auth.updateUser({ password })
    if (error) throw error
    setRecovery(false)
  }
  async function cleanup(id?: string) {
    if (id) {
      await writePreference(`chef.user.${id}`, null).catch(() => {})
      await writePreference(`chef.push.${id}`, null).catch(() => {})
    }
    await clearBilling().catch(() => {})
    handled.clear()
  }
  const signOut = async () => {
    // Detach must succeed before remote logout to avoid alerts for a former account.
    await detachPush()
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    await cleanup(session?.user.id)
    setSession(null)
    setRecovery(false)
  }
  const clearDeletedAccount = async () => {
    const id = session?.user.id
    // Server deletion already succeeded: never retain the deleted account's screens.
    setSession(null)
    setRecovery(false)
    try {
      await supabase.auth.signOut({ scope: 'local' })
    } finally {
      await cleanup(id)
    }
  }
  return (
    <AuthContext.Provider
      value={{
        session,
        initializing,
        initError,
        recovery,
        callbackError,
        retryInit,
        signIn,
        signUp,
        resend,
        resetPassword,
        updatePassword,
        signOut,
        clearDeletedAccount,
        handleCallback,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('AuthProvider missing')
  return ctx
}
