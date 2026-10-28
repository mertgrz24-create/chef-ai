import { z } from 'zod'
import { apiFetch } from '@/lib/api'
import type { GenerateRecipeResponse } from '@/lib/types'
import { savedRecipeSchema, historySchema } from './contracts'
export async function saveRecipe(
  result: GenerateRecipeResponse,
  idempotencyKey: string,
) {
  if (!result.structured) throw new Error('structured_required')
  const recipe = await apiFetch(
    '/api/recipes/save',
    {
      method: 'POST',
      headers: { 'Idempotency-Key': idempotencyKey },
      body: JSON.stringify({
        ...result.structured,
        macros: result.macros,
        is_public: false,
      }),
    },
    z.object({ recipe: savedRecipeSchema }),
  )
  return recipe.recipe
}
export function recipeHistory() {
  return apiFetch('/api/recipes/history', {}, historySchema)
}
