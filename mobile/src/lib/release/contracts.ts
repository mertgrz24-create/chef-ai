import { z } from 'zod'
import { isCalendarDate, weekDays } from './meal-plan'

const safeUrl = z
  .string()
  .url()
  .refine((value) => new URL(value).protocol === 'https:')
export const mobileConfigSchema = z.object({
  schemaVersion: z.literal(1),
  maintenance: z.boolean(),
  minimumVersion: z.string().regex(/^\d+\.\d+\.\d+$/),
  links: z.object({
    privacy: safeUrl,
    terms: safeUrl,
    support: safeUrl,
    deletion: safeUrl,
  }),
  ai: z.object({
    provider: z.string().min(1),
    consentVersion: z.string().min(1),
    retention: z.object({ en: z.string().min(1), tr: z.string().min(1) }),
  }),
  capabilities: z.object({
    ai: z.boolean(),
    localizedAi: z.boolean(),
    privateRecipes: z.boolean(),
    idempotency: z.boolean(),
    billing: z.boolean(),
    reports: z.boolean(),
    consents: z.boolean(),
    push: z.boolean(),
    analytics: z.boolean(),
  }),
})
export type MobileConfig = z.infer<typeof mobileConfigSchema>
export const quotaSchema = z.object({
  used: z.number().int().nonnegative(),
  limit: z.number().int().nonnegative(),
  resetsAt: z.string().datetime(),
})
export const membershipSchema = z.object({
  plan: z.enum(['free', 'premium']),
  status: z.enum(['active', 'grace', 'hold', 'expired', 'syncing']),
  expiresAt: z.string().datetime().nullable(),
  premiumLimits: z
    .object({
      recipes: z.number().int().min(11),
      scans: z.number().int().positive(),
      plans: z.number().int().positive(),
    })
    .optional(),
  quotas: z.object({
    recipes: quotaSchema,
    scans: quotaSchema,
    plans: quotaSchema,
  }),
})
export type Membership = z.infer<typeof membershipSchema>
const finitePositive = z.number().finite().nonnegative()
export const macrosSchema = z.object({
  calories: finitePositive,
  protein_g: finitePositive,
  carbs_g: finitePositive,
  fat_g: finitePositive,
  fiber_g: finitePositive.optional(),
  net_carbs_g: finitePositive.optional(),
})
export const structuredRecipeSchema = z.object({
  name: z.string().trim().min(1).max(200),
  ingredients: z.array(z.string().min(1).max(300)).min(1).max(100),
  instructions: z.string().min(1).max(20000),
  prep_time_min: finitePositive.optional(),
  cook_time_min: finitePositive.optional(),
  servings: z.number().positive().optional(),
  chefs_note: z.string().optional(),
})
export const recipeResponseSchema = z.object({
  recipe: z.string(),
  structured: structuredRecipeSchema.nullable(),
  macros: macrosSchema.nullable(),
  resultId: z.string().min(1).optional(),
})
export const pantryItemSchema = z.object({
  revision: z.number().int().nonnegative().optional(),
  id: z.string().min(1),
  name: z.string().min(1),
  quantity: z.string().nullable(),
  expiry_date: z.string().nullable(),
  created_at: z.string(),
})
export const pantrySchema = z.object({ items: z.array(pantryItemSchema) })
export const savedRecipeSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  ingredients: z.array(z.string()),
  instructions: z.string(),
  macros: macrosSchema.partial().nullable(),
  is_public: z.literal(false),
  created_at: z.string(),
})
export type SavedRecipe = z.infer<typeof savedRecipeSchema>
export const historySchema = z.object({
  recipes: z.array(savedRecipeSchema).max(20),
})
export const mealItemSchema = structuredRecipeSchema.extend({
  macros: macrosSchema.optional(),
})
export const mealPlanSchema = z.object({
  plan: z.object({
    id: z.string(),
    user_id: z.string(),
    week_start_date: z.string().refine(isCalendarDate),
    created_at: z.string(),
    updated_at: z.string(),
    meals: z
      .array(
        z.object({
          day: z.enum(weekDays),
          breakfast: mealItemSchema,
          dinner: mealItemSchema,
        }),
      )
      .min(1)
      .max(7)
      .refine((meals) => new Set(meals.map((day) => day.day)).size === meals.length)
      .transform((meals) => [...meals].sort((a, b) => weekDays.indexOf(a.day) - weekDays.indexOf(b.day))),
  }),
})
export const visionSchema = z.object({
  ingredients: z.array(z.string().min(1).max(200)).max(100),
  resultId: z.string().optional(),
})
export const ackSchema = z.object({ ok: z.literal(true) })
export function compareVersions(a: string, b: string) {
  const aa = a.split('.').map(Number),
    bb = b.split('.').map(Number)
  for (let i = 0; i < 3; i++) {
    const d = (aa[i] ?? 0) - (bb[i] ?? 0)
    if (d) return Math.sign(d)
  }
  return 0
}
