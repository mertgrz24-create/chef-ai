import { beforeEach, it, expect, jest } from '@jest/globals'
let mockOwner = 'fixture'
const mockToken = jest.fn<() => Promise<{ data: string }>>()
const mockPermissions = jest.fn<() => Promise<unknown>>(),
  mockPrompt = jest.fn<() => Promise<unknown>>(),
  mockApi = jest.fn<(...args: unknown[]) => Promise<unknown>>(),
  mockWrite = jest.fn<(...args: unknown[]) => Promise<void>>()
jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  getPermissionsAsync: () => mockPermissions(),
  requestPermissionsAsync: () => mockPrompt(),
  getExpoPushTokenAsync: () => mockToken(),
  AndroidImportance: { DEFAULT: 3 },
}))
jest.mock('expo-device', () => ({ isDevice: true }))
jest.mock('expo-constants', () => ({
  __esModule: true,
  default: { expoConfig: { extra: { eas: { projectId: 'fixture' } } } },
}))
jest.mock('@/lib/api', () => ({
  apiFetch: (...args: unknown[]) => mockApi(...args),
}))
jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: async () => ({
        data: { session: { user: { id: mockOwner } } },
      }),
    },
  },
}))
jest.mock('@/lib/release/storage', () => ({
  readPreference: async () => 'ExpoPushToken[fixture-device-token]',
  writePreference: (...args: unknown[]) => mockWrite(...args),
}))
import { refreshPush, enablePush, detachPush } from '@/lib/notifications'
beforeEach(() => {
  jest.clearAllMocks()
  mockOwner = 'fixture'
  mockToken.mockResolvedValue({ data: 'ExpoPushToken[fixture-device-token]' })
  mockPermissions.mockResolvedValue({ granted: false, canAskAgain: true })
  mockPrompt.mockResolvedValue({ granted: true })
  mockApi.mockResolvedValue({ ok: true })
  mockWrite.mockResolvedValue()
})
it('foreground refresh never prompts and removes registration after OS revocation', async () => {
  await refreshPush()
  expect(mockPrompt).not.toHaveBeenCalled()
  expect(mockApi).toHaveBeenCalledWith(
    '/api/push/unregister',
    expect.anything(),
    expect.anything(),
  )
  expect(mockWrite).toHaveBeenCalledWith('chef.push.fixture', null)
})
it('only the explicit enable action may request permission and register', async () => {
  await enablePush()
  expect(mockPrompt).toHaveBeenCalledTimes(1)
  expect(mockApi).toHaveBeenCalledWith(
    '/api/push/register',
    expect.anything(),
    expect.anything(),
  )
})

it('does not register when the account changes during the OS permission prompt', async () => {
  mockPrompt.mockImplementationOnce(async () => {
    mockOwner = 'other-user'
    return { granted: true }
  })
  await expect(enablePush()).rejects.toThrow('cancelled')
  expect(mockToken).not.toHaveBeenCalled()
  expect(mockApi).not.toHaveBeenCalled()
  expect(mockWrite).not.toHaveBeenCalled()
})
it('does not register when the account changes during token retrieval', async () => {
  mockToken.mockImplementationOnce(async () => {
    mockOwner = 'other-user'
    return { data: 'ExpoPushToken[fixture-device-token]' }
  })
  await expect(enablePush()).rejects.toThrow('cancelled')
  expect(mockApi).not.toHaveBeenCalled()
  expect(mockWrite).not.toHaveBeenCalled()
})
it('pins register requests to the initiating account and does not save under a later login', async () => {
  mockApi.mockImplementationOnce(async () => {
    mockOwner = 'other-user'
    return { ok: true }
  })
  await expect(enablePush()).rejects.toThrow('cancelled')
  expect(mockApi).toHaveBeenCalledWith('/api/push/register',
    expect.objectContaining({ expectedUserId: 'fixture' }), expect.anything())
  expect(mockWrite).not.toHaveBeenCalled()
})
it('invalidates active and queued registrations before detaching', async () => {
  let release!: (value: unknown) => void
  let started!: () => void
  const prompting = new Promise<void>(resolve => { started = resolve })
  mockPrompt.mockImplementationOnce(() => {
    started()
    return new Promise(resolve => { release = resolve })
  })
  const first = enablePush().catch(error => error)
  await prompting
  const queued = enablePush().catch(error => error)
  const detached = detachPush()
  release({ granted: true })
  expect(await first).toBeInstanceOf(Error)
  expect(await queued).toBeInstanceOf(Error)
  await detached
  expect(mockApi).toHaveBeenCalledTimes(1)
  expect(mockApi).toHaveBeenCalledWith('/api/push/unregister',
    expect.objectContaining({ expectedUserId: 'fixture' }), expect.anything())
  expect(mockToken).not.toHaveBeenCalled()
})
