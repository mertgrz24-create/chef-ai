/**
 * Expiry urgency, mirroring the web PantryClient colour code:
 * 🔴 already expired (≤0 days) · 🟠 ≤3 · 🟡 ≤7 · 🟢 more than a week.
 */
export type Urgency = 'expired' | 'urgent' | 'soon' | 'fresh'

const URGENCY_COLOR: Record<Urgency, string> = {
  expired: '#E8623D', // clay
  urgent: '#F0913D',
  soon: '#E7C84B',
  fresh: '#CDF23E', // zest
}

export function daysUntil(expiry: string | null): number | null {
  if (!expiry) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(expiry + 'T00:00:00')
  return Math.round((target.getTime() - today.getTime()) / 86_400_000)
}

export function urgencyOf(expiry: string | null): Urgency | null {
  const d = daysUntil(expiry)
  if (d === null) return null
  if (d <= 0) return 'expired'
  if (d <= 3) return 'urgent'
  if (d <= 7) return 'soon'
  return 'fresh'
}

export function urgencyColor(urgency: Urgency | null): string {
  return urgency ? URGENCY_COLOR[urgency] : '#8A8E80'
}

export function expiryLabel(expiry: string | null): string {
  const d = daysUntil(expiry)
  if (d === null) return 'no date'
  if (d < 0) return `${Math.abs(d)}d ago`
  if (d === 0) return 'today'
  if (d === 1) return 'tomorrow'
  return `${d}d left`
}
