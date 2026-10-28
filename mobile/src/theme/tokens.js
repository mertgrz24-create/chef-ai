/**
 * "Mise en Place" design tokens — the single source of truth for the palette.
 *
 * Three places consume this that would otherwise repeat hex values by hand:
 *   1. tailwind.config.js          — requires this file; drives every className
 *   2. src/lib/expiry.ts           — freshness ramp, applied via inline style
 *   3. src/app/(app)/_layout.tsx   — navigator chrome, which can't take classNames
 *
 * CommonJS on purpose: tailwind.config.js runs in Node and has to require() it.
 */

const colors = {
  // brand
  pantry: '#1E3A2F', // deep pantry green — brand surfaces
  zest: '#CDF23E', // electric lime — the one bold accent
  ink: '#17180F', // warm near-black — text, dark surfaces
  chalk: '#F5F0E5', // warm cream — light base

  // ink family — dark chrome
  'ink-deep': '#14150E', // tab bar, a shade below ink
  'ink-line': '#2E3125', // hairline on dark chrome

  // light surfaces
  surface: '#FFF9EF',
  'surface-2': '#EBE3D3',
  border: '#DDD3C1',

  // text on light surfaces
  'ink-2': '#4A4E42',
  'ink-muted': '#6B705F',

  // text on dark (pantry) surfaces — mirrors the ink ramp above.
  // chalk-muted replaces #8fa093, which measured 4.48:1 against pantry green
  // and so failed WCAG AA (4.5:1) at the 10-11px label sizes it was used for.
  'chalk-2': '#C3C8BA', // secondary body — 7.22:1
  'chalk-muted': '#A4B5A8', // secondary labels, readable on both dark surfaces
  'chalk-dim': '#5F7267', // placeholder, disabled icon

  // freshness ramp: expired -> urgent -> soon -> fresh (fresh reuses `zest`)
  clay: '#E8623D',
  'danger-text': '#FFB29C', // legible error text on pantry surfaces
  'surface-dark': '#294337',
  'border-dark': '#526A5B',
  ember: '#F0913D',
  honey: '#E7C84B',

  // Cream workspace: warm surfaces with the original green and lime accents.
  canvas: '#F5F0E5',
  panel: '#FFF9EF',
  line: '#DDD3C1',
  content: '#17180F',
  secondary: '#4A4E42',
  muted: '#6B705F',
  'error-ink': '#963F27', // darker clay for readable text on paper
  'warm-ink': '#835C16', // functional expiry text on light surfaces
}

const fontFamily = {
  display: ['BricolageGrotesque_600SemiBold'],
  'display-bold': ['BricolageGrotesque_700Bold'],
  sans: ['InstrumentSans_400Regular'],
  'sans-bold': ['InstrumentSans_600SemiBold'],
  mono: ['SpaceMono_400Regular'],
  'mono-bold': ['SpaceMono_700Bold'],
}

/**
 * [size, lineHeight]. Replaces the arbitrary `text-[15px]` / `leading-[22px]`
 * pairs that were duplicated across every screen.
 */
const fontSize = {
  'display-xl': ['34px', '38px'],
  'display-lg': ['28px', '32px'],
  'display-md': ['24px', '28px'],
  'display-sm': ['18px', '24px'],
  body: ['16px', '24px'],
  'body-sm': ['14px', '21px'],
  label: ['13px', '18px'],
  meta: ['12px', '16px'],
  micro: ['11px', '14px'],
  nano: ['12px', '16px'],
}

const letterSpacing = {
  eyebrow: '2px',
  label: '1.5px',
}

/**
 * 13 -> 52px makes `h-13` real. It was written in five files and silently
 * overridden by an inline style={{ height: 52 }} in every one of them.
 */
const spacing = {
  13: '52px',
}

module.exports = { colors, fontFamily, fontSize, letterSpacing, spacing }
