import * as Notifications from 'expo-notifications'
import { AndroidImportance, SchedulableTriggerInputTypes } from 'expo-notifications'
import { randomUUID } from 'expo-crypto'
import { Platform } from 'react-native'
import { getLocale, t } from './locale'
import { readPreference, writePreference } from './storage'
import { KitchenTimer, UnknownNotificationId } from './kitchen-timer'

const storageKey = 'chef.kitchen.timer.v1'
const channelId = 'cooking-timer'
export const kitchenTimer = new KitchenTimer({
  now: Date.now,
  id: () => `chef-timer-${randomUUID()}`,
  read: () => readPreference(storageKey),
  write: value => writePreference(storageKey, value),
  permission: async () => {
    if (Platform.OS === 'web') return false
    if (Platform.OS === 'android') await Notifications.setNotificationChannelAsync(channelId, {
      name: getLocale() === 'tr' ? 'Pişirme zamanlayıcısı' : 'Cooking timer',
      importance: AndroidImportance.HIGH,
      sound: 'default',
    })
    let permission = await Notifications.getPermissionsAsync()
    if (!permission.granted && permission.canAskAgain) permission = await Notifications.requestPermissionsAsync({ ios: { allowAlert: true, allowSound: true, allowBadge: false } })
    return permission.granted && (Platform.OS !== 'ios' || permission.ios?.allowsSound === true)
  },
  schedule: async (id, deadline) => {
    const scheduled = await Notifications.scheduleNotificationAsync({
      identifier: id,
      content: { title: t('Cooking timer'), body: t('Time is up.'), sound: 'default' },
      trigger: { type: SchedulableTriggerInputTypes.DATE, date: new Date(deadline), ...(Platform.OS === 'android' ? { channelId } : {}) },
    })
    if (scheduled !== id) {
      try { await Notifications.cancelScheduledNotificationAsync(scheduled) }
      catch { throw new UnknownNotificationId(scheduled) }
      throw new Error('timer_identifier_mismatch')
    }
  },
  cancel: id => Notifications.cancelScheduledNotificationAsync(id),
  pending: async () => (await Notifications.getAllScheduledNotificationsAsync()).map(notification => notification.identifier),
})
