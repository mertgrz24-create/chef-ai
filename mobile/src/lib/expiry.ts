import {t} from './release/locale'
import { colors } from '@/theme/tokens'

/**
 * Expiry urgency and its colour ramp:
 * already expired (<=0 days) · urgent <=3 · soon <=7 · fresh beyond a week.
 */
export type Urgency = 'expired' | 'urgent' | 'soon' | 'fresh'

const URGENCY_COLOR: Record<Urgency, string> = {
  expired: colors.clay,
  urgent: colors.ember,
  soon: colors.honey,
  fresh: colors.zest,
}

/** Today + `days`, as YYYY-MM-DD — the shape the pantry API expects. */
export function isoInDays(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
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

/**
 * Undated items fall back to the muted label colour rather than the old
 * #8A8E80, which measured 3.68:1 on pantry green and failed WCAG AA.
 */
export function urgencyColor(urgency: Urgency | null): string {
  return urgency ? URGENCY_COLOR[urgency] : colors['chalk-muted']
}

export function expiryLabel(expiry: string | null): string {
  const d = daysUntil(expiry)
  if (d === null) return t('no date')
  if (d < 0) return t('%{count}d ago',{count:Math.abs(d)})
  if (d === 0) return t('today')
  if (d === 1) return t('tomorrow')
  return t('%{count}d left',{count:d})
}
