import { expect, it, jest } from '@jest/globals'
const mockChannel = jest.fn<(...args: unknown[]) => Promise<unknown>>().mockResolvedValue({})
const mockPermission = jest.fn<() => Promise<unknown>>().mockResolvedValue({ granted: true })
const mockSchedule = jest.fn<(value: { identifier: string }) => Promise<string>>().mockImplementation(async value => value.identifier)
const mockCancel = jest.fn<(...args: unknown[]) => Promise<void>>().mockResolvedValue()
let mockSaved: string | null = null
jest.mock('react-native', () => ({ Platform: { OS: 'android' } }))
jest.mock('expo-crypto', () => ({ randomUUID: () => 'uuid' }))
jest.mock('expo-notifications', () => ({
  AndroidImportance: { HIGH: 4 }, SchedulableTriggerInputTypes: { DATE: 'date' },
  setNotificationChannelAsync: (...args: unknown[]) => mockChannel(...args),
  getPermissionsAsync: () => mockPermission(),
  requestPermissionsAsync: jest.fn(),
  scheduleNotificationAsync: (value: { identifier: string }) => mockSchedule(value),
  cancelScheduledNotificationAsync: (...args: unknown[]) => mockCancel(...args),
  getAllScheduledNotificationsAsync: async () => [],
}))
jest.mock('@/lib/release/storage', () => ({ readPreference: async () => mockSaved, writePreference: async (_key: string, value: string | null) => { mockSaved = value } }))
jest.mock('@/lib/release/locale', () => ({ t: (value: string) => value, getLocale: () => 'en' }))
import { kitchenTimer } from '@/lib/release/kitchen-timer-native'
it('creates a dedicated channel and schedules only the local timer notification', async () => {
  await kitchenTimer.load()
  await kitchenTimer.start(1)
  expect(mockChannel).toHaveBeenCalledWith('cooking-timer', expect.objectContaining({ sound: 'default' }))
  expect(mockSchedule).toHaveBeenCalledWith(expect.objectContaining({ identifier: 'chef-timer-uuid', content: expect.objectContaining({ sound: 'default' }) }))
  await kitchenTimer.stop()
  expect(mockCancel).toHaveBeenCalledWith('chef-timer-uuid')
  expect(mockSaved).toBeNull()
})
