import { timingSafeEqual } from 'node:crypto'
export function cronAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  const expected = Buffer.from(`Bearer ${secret}`),
    actual = Buffer.from(request.headers.get('authorization') ?? '')
  return actual.length === expected.length && timingSafeEqual(actual, expected)
}
