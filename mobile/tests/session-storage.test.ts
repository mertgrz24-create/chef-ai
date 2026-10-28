import { describe, it, expect, jest, beforeEach } from '@jest/globals'
import * as SecureStore from 'expo-secure-store'
import { secureSessionStorage } from '@/lib/release/session-storage'
const values = new Map<string, string>()
beforeEach(() => {
  values.clear()
  jest
    .mocked(SecureStore.getItemAsync)
    .mockImplementation(async (key) => values.get(key) ?? null)
  jest
    .mocked(SecureStore.setItemAsync)
    .mockImplementation(async (key, value) => {
      values.set(key, value)
    })
  jest.mocked(SecureStore.deleteItemAsync).mockImplementation(async (key) => {
    values.delete(key)
  })
})
describe('secure session persistence', () => {
  it('round-trips a long session through bounded keychain values', async () => {
    const data = 'x'.repeat(6000)
    await secureSessionStorage.setItem('session', data)
    expect([...values.values()].every((v) => v.length <= 900)).toBe(true)
    await expect(secureSessionStorage.getItem('session')).resolves.toBe(data)
  })
  it('keeps every new session item on this device and behind the unlocked keychain', async () => {
    await secureSessionStorage.setItem('session', 'x'.repeat(6000))
    for (const call of jest.mocked(SecureStore.setItemAsync).mock.calls) {
      expect(call[2]).toEqual({ keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY })
    }
  })
  it('preserves Unicode without splitting surrogate pairs', async () => {
    const data = '🍋ş'.repeat(2000)
    await secureSessionStorage.setItem('session', data)
    expect(
      [...values.values()].every(
        (v) => new TextEncoder().encode(v).length < 2048,
      ),
    ).toBe(true)
    await expect(secureSessionStorage.getItem('session')).resolves.toBe(data)
  })
  it('reads legacy sessions without mutation', async () => {
    values.set('session', 'legacy')
    await expect(secureSessionStorage.getItem('session')).resolves.toBe(
      'legacy',
    )
    expect(values.size).toBe(1)
  })
  it('removes manifest and session chunks on signout', async () => {
    await secureSessionStorage.setItem('session', 'token'.repeat(1000))
    await secureSessionStorage.removeItem('session')
    expect(values.size).toBe(0)
  })
  it('does not return a partial corrupted session', async () => {
    await secureSessionStorage.setItem('session', 'token')
    values.delete('session.test-request-uuid.0')
    await expect(secureSessionStorage.getItem('session')).rejects.toThrow(
      'session_storage_incomplete',
    )
  })
})
