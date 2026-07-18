import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'
import Constants from 'expo-constants'
import { Platform } from 'react-native'
import { apiFetch } from './api'

// Foreground behaviour: still show the banner/list when the app is open.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
})

/**
 * Gets this device's Expo push token, or null if unavailable.
 *
 * Returns null (rather than throwing) for the expected "can't get a token"
 * cases — simulator, denied permission, or no EAS projectId yet — so callers
 * can treat push as best-effort. A real token needs a physical device AND an
 * EAS projectId in app.json (extra.eas.projectId), which lands with M6.
 */
export async function getExpoPushToken(): Promise<string | null> {
  if (!Device.isDevice) return null

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('expiry-alerts', {
      name: 'Expiry alerts',
      importance: Notifications.AndroidImportance.HIGH,
    })
  }

  const existing = await Notifications.getPermissionsAsync()
  let status = existing.status
  if (status !== 'granted') {
    status = (await Notifications.requestPermissionsAsync()).status
  }
  if (status !== 'granted') return null

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId
  if (!projectId) {
    // Expected until an EAS project is created (M6).
    console.warn('[notifications] no EAS projectId yet — skipping push registration')
    return null
  }

  const { data } = await Notifications.getExpoPushTokenAsync({ projectId })
  return data
}

/**
 * Registers this device for expiry push alerts: gets the token and stores it
 * server-side. Best-effort — silently no-ops if a token can't be obtained.
 */
export async function registerPushToken(): Promise<void> {
  try {
    const token = await getExpoPushToken()
    if (!token) return
    await apiFetch('/api/push/register', {
      method: 'POST',
      body: JSON.stringify({ token, platform: Platform.OS }),
    })
  } catch (err) {
    // Never let notification setup break the app.
    console.warn('[notifications] registration failed', err)
  }
}
