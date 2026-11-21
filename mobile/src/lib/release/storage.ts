import * as SecureStore from 'expo-secure-store'
import { Platform } from 'react-native'

// Preferences, opaque AI recovery pointers and timer metadata only. No recipe, image, password or bearer token is cached here.
export async function readPreference(key: string): Promise<string | null> {
  if (Platform.OS === 'web')
    return globalThis.localStorage?.getItem(key) ?? null
  return SecureStore.getItemAsync(key)
}
export async function writePreference(key: string, value: string | null) {
  if (Platform.OS === 'web') {
    if (value === null) globalThis.localStorage?.removeItem(key)
    else globalThis.localStorage?.setItem(key, value)
  } else if (value === null) await SecureStore.deleteItemAsync(key)
  else await SecureStore.setItemAsync(key, value)
}
