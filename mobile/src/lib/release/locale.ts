import { useSyncExternalStore } from 'react'
import { getLocales } from 'expo-localization'
import { I18n } from 'i18n-js'
import { readPreference, writePreference } from './storage'
import { messages } from './messages'
export type Locale = 'en' | 'tr'
export type Units = 'metric' | 'imperial'
let locale: Locale = getLocales()[0]?.languageCode === 'tr' ? 'tr' : 'en'
let units: Units = locale === 'tr' ? 'metric' : 'imperial'
const listeners = new Set<() => void>()
const engine = new I18n({ en: {}, tr: {} })
function key(value: string) {
  let hash = 5381
  for (const char of value) hash = (hash * 33) ^ char.charCodeAt(0)
  return `m${hash >>> 0}`
}
engine.store({
  en: Object.fromEntries(Object.keys(messages).map((s) => [key(s), s])),
  tr: Object.fromEntries(
    Object.entries(messages).map(([s, tr]) => [key(s), tr]),
  ),
})
engine.enableFallback = true
engine.defaultLocale = 'en'
export function t(
  value: string,
  options: Record<string, string | number> = {},
): string {
  engine.locale = locale
  return value in messages ? String(engine.t(key(value), options)) : value
}
export function getLocale() {
  return locale
}
export function getUnits() {
  return units
}
export function useLocale() {
  return useSyncExternalStore(
    (fn) => {
      listeners.add(fn)
      return () => {
        listeners.delete(fn)
      }
    },
    () => `${locale}:${units}`,
    () => 'en:imperial',
  )
}
function emit() {
  for (const fn of listeners) fn()
}
export async function loadLocale() {
  const saved = await readPreference('chef.locale')
  const savedUnits = await readPreference('chef.units')
  if (saved === 'tr' || saved === 'en') locale = saved
  units =
    savedUnits === 'metric' || savedUnits === 'imperial'
      ? savedUnits
      : locale === 'tr'
        ? 'metric'
        : 'imperial'
  emit()
}
export async function setLocale(next: Locale) {
  await writePreference('chef.locale', next)
  locale = next
  emit()
}
export async function setUnits(next: Units) {
  await writePreference('chef.units', next)
  units = next
  emit()
}
