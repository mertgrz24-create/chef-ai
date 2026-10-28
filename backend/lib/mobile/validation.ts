import { createHash } from 'node:crypto'
export const requestKey = (value: string | null) =>
  value && /^[A-Za-z0-9._:-]{8,128}$/.test(value) ? value : null
export const payloadHash = (value: unknown) =>
  createHash('sha256').update(JSON.stringify(value)).digest('hex')
export const isObject = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value)
export const isLocale = (value: unknown): value is 'tr' | 'en' =>
  value === 'tr' || value === 'en'
export function validTimezone(value: unknown): value is string {
  if (
    typeof value !== 'string' ||
    value.length > 100 ||
    !/^[A-Za-z_]+(?:\/[A-Za-z0-9_+.-]+)*$/.test(value)
  )
    return false
  try {
    new Intl.DateTimeFormat('en', { timeZone: value })
    return true
  } catch {
    return false
  }
}
export const validPushToken = (value: unknown): value is string =>
  typeof value === 'string' &&
  /^(ExponentPushToken|ExpoPushToken)\[[A-Za-z0-9_-]{10,200}\]$/.test(value)
export async function readJson(
  request: Request,
  max = 64000,
): Promise<Record<string, unknown>> {
  const reader = request.body?.getReader()
  if (!reader) throw new Error('invalid_body')
  const chunks: Uint8Array[] = []
  let size = 0
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      size += value.byteLength
      if (size > max) {
        await reader.cancel()
        throw new Error('body_too_large')
      }
      chunks.push(value)
    }
  } finally {
    reader.releaseLock()
  }
  const value: unknown = JSON.parse(Buffer.concat(chunks).toString('utf8'))
  if (!isObject(value)) throw new Error('invalid_body')
  return value
}

export function validImage(bytes: Uint8Array, mime: string) {
  return mime === 'image/jpeg'
    ? bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
    : mime === 'image/png'
      ? Buffer.from(bytes.subarray(0, 8)).equals(
          Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
        )
      : mime === 'image/webp'
        ? Buffer.from(bytes.subarray(0, 4)).toString() === 'RIFF' &&
          Buffer.from(bytes.subarray(8, 12)).toString() === 'WEBP'
        : false
}


export function validCalendarDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(`${value}T00:00:00Z`)
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value
}
