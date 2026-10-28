import { describe, expect, it } from '@jest/globals'
import { mealPlanSchema } from '@/lib/release/contracts'
import { dateForMealDay, isCalendarDate, mealOperationKey } from '@/lib/release/meal-plan'
const meal = { name: 'Soup', ingredients: ['tomato'], instructions: 'Simmer' }
const entry = (day: string) => ({ day, breakfast: meal, dinner: meal })
const base = { id: 'fixture', user_id: 'fixture', week_start_date: '2026-10-12', created_at: '', updated_at: '' }
describe('weekly menu contracts and identity', () => {
  it('sorts provider day order without changing recipe content', () => {
    const result = mealPlanSchema.parse({ plan: { ...base, meals: [entry('sunday'), entry('monday'), entry('wednesday')] } })
    expect(result.plan.meals.map(d => d.day)).toEqual(['monday','wednesday','sunday'])
    expect(result.plan.meals[0].breakfast).toEqual(meal)
  })
  it('rejects duplicate or unknown days rather than showing misleading dates', () => {
    for (const meals of [[entry('monday'),entry('monday')], [entry('Pazartesi')], [entry('noday')]]) {
      expect(mealPlanSchema.safeParse({plan:{...base,meals}}).success).toBe(false)
    }
  })
  it('rejects impossible week dates and accepts leap dates', () => {
    for (const value of ['2026-02-30','2026-13-01','not-a-date','2026-1-1']) expect(isCalendarDate(value)).toBe(false)
    expect(isCalendarDate('2028-02-29')).toBe(true)
    expect(mealPlanSchema.safeParse({plan:{...base,week_start_date:'2026-02-30',meals:[entry('monday')]}}).success).toBe(false)
  })
  it('dates a partial week by actual weekday rather than list index', () => {
    expect(dateForMealDay('2026-10-12','wednesday').getDate()).toBe(14)
    expect(dateForMealDay('2026-10-12','sunday').getDate()).toBe(18)
  })
  it('keeps operation identity independent of display language', () => {
    expect(mealOperationKey('monday','breakfast')).toBe('monday-breakfast')
  })
})
