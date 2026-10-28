import * as Notifications from 'expo-notifications'
import { AndroidImportance } from 'expo-notifications'
import * as Device from 'expo-device'
import Constants from 'expo-constants'
import { Platform } from 'react-native'
import { apiFetch } from './api'
import { ackSchema } from './release/contracts'
import { getLocale } from './release/locale'
import { readPreference, writePreference } from './release/storage'
import { supabase } from './supabase'
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
})
let pending: Promise<unknown> = Promise.resolve()
let blocked = false
let generation = 0
async function currentOwner() {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('unauthenticated')
  return session.user.id
}
async function assertOwner(owner: string) {
  if (await currentOwner() !== owner) throw new Error('cancelled')
}
function assertEnabled(epoch: number) {
  if (blocked || generation !== epoch) throw new Error('push_disabled')
}
async function registerPush(allowPrompt: boolean, owner: string, epoch: number) {
  await assertOwner(owner)
  assertEnabled(epoch)
  if (!Device.isDevice || Platform.OS === 'web')
    throw new Error('physical_device_required')
  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId
  if (!projectId) throw new Error('push_unavailable')
  if (Platform.OS === 'android')
    await Notifications.setNotificationChannelAsync('expiry-alerts', {
      name:
        getLocale() === 'tr' ? 'Son kullanım hatırlatıcıları' : 'Expiry alerts',
      importance: AndroidImportance.DEFAULT,
    })
  let permissions = await Notifications.getPermissionsAsync()
  await assertOwner(owner)
  assertEnabled(epoch)
  if (!permissions.granted && allowPrompt && permissions.canAskAgain)
    permissions = await Notifications.requestPermissionsAsync()
  await assertOwner(owner)
  assertEnabled(epoch)
  if (!permissions.granted) throw new Error('permission_denied')
  const { data: token } = await Notifications.getExpoPushTokenAsync({
    projectId,
  })
  await assertOwner(owner)
  assertEnabled(epoch)
  await apiFetch(
    '/api/push/register',
    {
      method: 'POST',
      expectedUserId: owner,
      body: JSON.stringify({
        token,
        platform: Platform.OS,
        locale: getLocale(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        enabled: true,
      }),
    },
    ackSchema,
  )
  // Persist against the captured owner, never the session returned after upload.
  await assertOwner(owner)
  await writePreference(`chef.push.${owner}`, token)
  return token
}
export async function enablePush() {
  blocked = false
  const epoch = generation
  const owner = await currentOwner()
  assertEnabled(epoch)
  const task = pending.then(() => registerPush(true, owner, epoch))
  pending = task.catch(() => {})
  return task
}
export async function detachPush() {
  blocked = true
  generation++
  // Capture before waiting: a new login must never detach the new user's token.
  const ownerPromise = currentOwner().catch(() => null)
  await pending
  const owner = await ownerPromise
  if (!owner) return
  const token = await readPreference(`chef.push.${owner}`)
  if (!token) return
  await apiFetch(
    '/api/push/unregister',
    { method: 'POST', expectedUserId: owner, body: JSON.stringify({ token }) },
    ackSchema,
  )
  await writePreference(`chef.push.${owner}`, null)
}
export async function refreshPush() {
  const owner = await currentOwner().catch(() => null)
  if (!owner || blocked) return
  const epoch = generation
  const token = await readPreference(`chef.push.${owner}`)
  if (token && !blocked && epoch === generation) {
    const permission = await Notifications.getPermissionsAsync()
    await assertOwner(owner)
    assertEnabled(epoch)
    if (!permission.granted) {
      await detachPush()
      return
    }
    const task = pending.then(() => registerPush(false, owner, epoch))
    pending = task.catch(() => {})
    await task
  }
}
export function notificationPath(
  data: Record<string, unknown>,
): '/pantry' | null {
  return data.screen === 'pantry' ? '/pantry' : null
}
