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
