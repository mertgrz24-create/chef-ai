import { isObject } from './validation'
const text = (v: unknown, max: number) =>
  typeof v === 'string' && v.trim().length > 0 && v.length <= max
export function validMacros(v: unknown) {
  return (
    isObject(v) &&
    ['calories', 'protein_g', 'carbs_g', 'fat_g'].every(
      (k) =>
        typeof v[k] === 'number' &&
        Number.isFinite(v[k]) &&
        Number(v[k]) >= 0 &&
        Number(v[k]) <= 100000,
    ) && ['fiber_g','net_carbs_g'].every(k=>v[k]===undefined||(typeof v[k]==='number'&&Number.isFinite(v[k])&&Number(v[k])>=0&&Number(v[k])<=100000))
  )
}
export function validRecipe(v: unknown, allowNullMacros=true) {
  return (
    isObject(v) &&
    text(v.name, 200) &&
    Array.isArray(v.ingredients) &&
    v.ingredients.length > 0 &&
    v.ingredients.length <= 100 &&
    v.ingredients.every((i) => text(i, 300)) &&
    text(v.instructions, 20000) &&
    ['prep_time_min', 'cook_time_min'].every(
      (k) =>
        v[k] === undefined ||
        (typeof v[k] === 'number' &&
          Number.isFinite(v[k]) &&
          Number(v[k]) >= 0),
    ) &&
    (v.servings===undefined||(typeof v.servings==='number'&&Number.isFinite(v.servings)&&v.servings>0)) &&
    (v.chefs_note===undefined||(typeof v.chefs_note==='string'&&v.chefs_note.length<=2000)) &&
    (v.macros === undefined || (allowNullMacros&&v.macros === null) || validMacros(v.macros))
  )
}
export function validMeals(v: unknown) {
  const days = [
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
    'sunday',
  ]
  return (
    Array.isArray(v) &&
    v.length === 7 &&
    new Set(v.map((d) => (isObject(d) ? d.day : null))).size === 7 &&
    v.every(
      (d) =>
        isObject(d) &&
        days.includes(String(d.day)) &&
        validRecipe(d.breakfast,false) &&
        validRecipe(d.dinner,false),
    )
  )
}
export function validScan(v: unknown) {
  return Array.isArray(v) && v.length <= 100 && v.every((i) => text(i, 200))
}
