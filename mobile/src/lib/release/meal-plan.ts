export const weekDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const
export type MealKey = 'breakfast' | 'dinner'

// IDs stay language-independent; only visible labels are translated.
export function mealOperationKey(day: string, meal: MealKey) {
  return `${day}-${meal}`
}
export function dateForMealDay(weekStart: string, day: string) {
  const date = new Date(`${weekStart}T00:00:00`)
  const offset = weekDays.indexOf(day as typeof weekDays[number])
  date.setDate(date.getDate() + Math.max(0, offset))
  return date
}
export function isCalendarDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(`${value}T00:00:00Z`)
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value
}
