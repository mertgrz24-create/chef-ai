import 'react-native-url-polyfill/auto'
import { createClient } from '@supabase/supabase-js'
import * as SecureStore from 'expo-secure-store'
import { Platform } from 'react-native'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY. Copy .env.example to .env.'
  )
}

/**
 * Session storage backed by the device keychain (iOS) / keystore (Android)
 * rather than AsyncStorage, which is plain unencrypted disk. The Supabase
 * session contains a bearer token that grants full access to the user's row —
 * it belongs behind the OS secret store.
 *
 * SecureStore has no web implementation, so the web target falls through to
 * supabase-js's default (localStorage).
 */
const SecureStorageAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: Platform.OS === 'web' ? undefined : SecureStorageAdapter,
    autoRefreshToken: true,
    persistSession: true,
    // Native apps have no URL bar to parse an auth callback out of.
    detectSessionInUrl: false,
  },
})
