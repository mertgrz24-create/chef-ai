// Shapes returned by the Next.js API routes the app consumes.

export type PantryItem = {
  id: string
  name: string
  expiry_date: string | null
  quantity: string | null
  created_at: string
}

export type RecipeMacros = {
  calories: number
  protein_g: number
  carbs_g: number
  fat_g: number
  fiber_g?: number
  net_carbs_g?: number
}

export type StructuredRecipe = {
  name: string
  prep_time_min?: number
  cook_time_min?: number
  servings?: number
  ingredients: string[]
  instructions: string
  chefs_note?: string
}

export type GenerateRecipeResponse = {
  recipe: string
  structured: StructuredRecipe | null
  macros: RecipeMacros | null
}

export type MealItem = {
  name: string
  prep_time_min?: number
  cook_time_min?: number
  servings?: number
  ingredients: string[]
  instructions: string
  chefs_note?: string
  macros?: RecipeMacros
}

export type MealPlanDay = {
  day: string
  breakfast: MealItem
  dinner: MealItem
}

export type MealPlan = {
  id: string
  user_id: string
  week_start_date: string
  meals: MealPlanDay[]
  created_at: string
  updated_at: string
}
