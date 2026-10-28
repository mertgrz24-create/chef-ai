import * as SecureStore from 'expo-secure-store'
import { randomUUID } from 'expo-crypto'
const storageOptions = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
}
type Manifest = { chefChunks: 1; revision: string; count: number }
function manifest(raw: string | null): Manifest | null {
  if (!raw) return null
  try {
    const p = JSON.parse(raw)
    return p.chefChunks === 1 &&
      typeof p.revision === 'string' &&
      /^[a-zA-Z0-9-]+$/.test(p.revision) &&
      Number.isInteger(p.count) &&
      p.count > 0 &&
      p.count < 100
      ? p
      : null
  } catch {
    return null
  }
}
async function clearChunks(key: string, m: Manifest | null) {
  if (m)
    await Promise.all(
      Array.from({ length: m.count }, (_, i) =>
        SecureStore.deleteItemAsync(`${key}.${m.revision}.${i}`),
      ),
    )
}
// Commit a short manifest only after every chunk is durable. Legacy sessions remain readable.
export const secureSessionStorage = {
  async getItem(key: string) {
    const raw = await SecureStore.getItemAsync(key)
    const m = manifest(raw)
    if (!m) return raw
    const chunks = await Promise.all(
      Array.from({ length: m.count }, (_, i) =>
        SecureStore.getItemAsync(`${key}.${m.revision}.${i}`),
      ),
    )
    if (chunks.some((c) => c === null))
      throw new Error('session_storage_incomplete')
    return chunks.join('')
  },
  async setItem(key: string, value: string) {
    const previous = manifest(await SecureStore.getItemAsync(key))
    const points = Array.from(value)
    const chunks = Array.from(
      { length: Math.max(1, Math.ceil(points.length / 450)) },
      (_, i) => points.slice(i * 450, (i + 1) * 450).join(''),
    )
    const next: Manifest = {
      chefChunks: 1,
      revision: randomUUID(),
      count: chunks.length,
    }
    if (next.count >= 100) throw new Error('session_storage_too_large')
    try {
      for (let i = 0; i < next.count; i++)
        await SecureStore.setItemAsync(
          `${key}.${next.revision}.${i}`,
          chunks[i],
          storageOptions,
        )
      await SecureStore.setItemAsync(key, JSON.stringify(next), storageOptions)
    } catch (error) {
      await clearChunks(key, next).catch(() => {})
      throw error
    }
    await clearChunks(key, previous).catch(() => {})
  },
  async removeItem(key: string) {
    const previous = manifest(await SecureStore.getItemAsync(key))
    await SecureStore.deleteItemAsync(key)
    await clearChunks(key, previous)
  },
}
