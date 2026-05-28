import { GoogleGenerativeAI } from '@google/generative-ai'
import type { MealItem, MealPlanDay } from '@/types/meal-plan'

const client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

const VISION_PROMPT = `Identify all food and drink ingredients visible in this photo.

Rules:
- Only list ingredients usable in cooking (vegetables, fruits, meat, dairy, spices, etc.)
- Include packaged goods (milk carton, yogurt container, etc.)
- Write ingredient names in English, lowercase
- Return ONLY a comma-separated list of ingredients, nothing else
- If no food is visible, return an empty response

Example response: chicken breast, onion, tomato, garlic, green bell pepper, yogurt`

export interface VisionResult {
  ingredients: string[]
}

// ─── Recipe generation ────────────────────────────────────────────────────────

export interface RecipeMacros {
  calories: number
  protein_g: number
  carbs_g: number
  fat_g: number
}

export interface RecipeResult {
  text: string
  macros: RecipeMacros | null
  inputTokens: number
  outputTokens: number
}

const RECIPE_SYSTEM_PROMPT = `You are Chef-AI's recipe assistant. You create creative, delicious, and achievable recipes based on the ingredients the user has on hand.

Rules:
- Always respond in English.
- Return ONLY a valid JSON object; no markdown, explanations, or extra text.
- Use only the ingredients provided; if additional ingredients help, mention them as optional in instructions.
- Use imperial measurements: cups, oz, lbs, tbsp, tsp, °F (not metric).
- Steps should be numbered and concise; separate them with \\n inside instructions.
- Use a friendly, encouraging tone.
- Macros are estimates; provide reasonable, realistic values.

Output format (this JSON only, nothing else):
{
  "name": "Recipe Name",
  "ingredients": ["1 lb chicken breast", "1/2 cup diced onion"],
  "instructions": "1. First step.\\n2. Second step.\\n3. Third step.",
  "macros": {
    "calories": 450,
    "protein_g": 32,
    "carbs_g": 28,
    "fat_g": 14
  }
}`

function parseRecipeJson(raw: string): { text: string; macros: RecipeMacros | null } {
  // Strip markdown code fence in case the model wraps the JSON
  let jsonStr = raw.trim()
  if (jsonStr.startsWith('```')) {
    jsonStr = jsonStr.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()
  }

  const parsed = JSON.parse(jsonStr) as {
    name?: string
    ingredients?: string[]
    instructions?: string
    macros?: Partial<RecipeMacros>
  }

  const lines: string[] = []
  if (parsed.name) lines.push(`🍽️ ${parsed.name}`)
  if (parsed.ingredients?.length) {
    lines.push('\n📝 Ingredients')
    parsed.ingredients.forEach((i) => lines.push(`• ${i}`))
  }
  if (parsed.instructions) {
    lines.push('\n👨‍🍳 Instructions')
    lines.push(parsed.instructions)
  }

  const m = parsed.macros
  const macros: RecipeMacros | null =
    m &&
    typeof m.calories === 'number' &&
    typeof m.protein_g === 'number' &&
    typeof m.carbs_g === 'number' &&
    typeof m.fat_g === 'number'
      ? { calories: m.calories, protein_g: m.protein_g, carbs_g: m.carbs_g, fat_g: m.fat_g }
      : null

  return { text: lines.join('\n'), macros }
}

export async function generateRecipeWithGemini(
  ingredients: string[],
  dietContext?: string
): Promise<RecipeResult> {
  const model = client.getGenerativeModel({
    model: 'gemini-2.5-pro',
    systemInstruction: RECIPE_SYSTEM_PROMPT,
  })

  const userMessage = `I have these ingredients: ${ingredients.join(', ')}.${
    dietContext ? `\n${dietContext}` : ''
  }\nCan you suggest a recipe?`

  const result = await model.generateContent(userMessage)
  const rawText = result.response.text().trim()

  let text: string
  let macros: RecipeMacros | null = null

  try {
    const parsed = parseRecipeJson(rawText)
    text = parsed.text
    macros = parsed.macros
  } catch {
    text = rawText
  }

  return {
    text,
    macros,
    inputTokens: result.response.usageMetadata?.promptTokenCount ?? 0,
    outputTokens: result.response.usageMetadata?.candidatesTokenCount ?? 0,
  }
}

// ─── Weekly meal plan ─────────────────────────────────────────────────────────

const MEAL_PLAN_SYSTEM_PROMPT = `You are Chef-AI's weekly meal plan assistant. You create varied, balanced 7-day meal plans tailored to the user's dietary goals.

Rules:
- Always write recipe names and instructions in English.
- Return ONLY a valid JSON array; no markdown, explanations, or extra text.
- Generate a 7-day plan. Day values in order: monday, tuesday, wednesday, thursday, friday, saturday, sunday.
- Each day has a breakfast and a dinner meal.
- Use imperial measurements: cups, oz, lbs, tbsp, tsp, °F (not metric).
- Ensure variety; don't repeat the same recipe on two different days.
- Macros are estimates; provide reasonable, realistic values.

Output format (this JSON array only, nothing else):
[
  {
    "day": "monday",
    "breakfast": {
      "name": "Recipe Name",
      "ingredients": ["1 cup rolled oats", "1/2 cup milk"],
      "instructions": "1. First step.\\n2. Second step.",
      "macros": { "calories": 350, "protein_g": 15, "carbs_g": 45, "fat_g": 10 }
    },
    "dinner": {
      "name": "Recipe Name",
      "ingredients": ["1 lb chicken breast", "2 tbsp olive oil"],
      "instructions": "1. First step.\\n2. Second step.",
      "macros": { "calories": 550, "protein_g": 35, "carbs_g": 40, "fat_g": 18 }
    }
  }
]`

const SINGLE_MEAL_SYSTEM_PROMPT = `You are Chef-AI's meal assistant. You suggest original recipes for a single meal.

Rules:
- Always respond in English.
- Return ONLY a valid JSON object; no markdown, explanations, or extra text.
- Use imperial measurements: cups, oz, lbs, tbsp, tsp, °F (not metric).
- Macros are estimates; provide reasonable, realistic values.

Output format (this JSON object only, nothing else):
{
  "name": "Recipe Name",
  "ingredients": ["1 lb ground beef", "1/2 cup breadcrumbs"],
  "instructions": "1. First step.\\n2. Second step.",
  "macros": { "calories": 450, "protein_g": 30, "carbs_g": 35, "fat_g": 15 }
}`

function parseMealPlanJson(raw: string): MealPlanDay[] {
  let jsonStr = raw.trim()
  if (jsonStr.startsWith('```')) {
    jsonStr = jsonStr.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()
  }
  const parsed = JSON.parse(jsonStr) as unknown
  if (!Array.isArray(parsed)) throw new Error('Expected JSON array')
  return parsed as MealPlanDay[]
}

function parseMealItemJson(raw: string): MealItem {
  let jsonStr = raw.trim()
  if (jsonStr.startsWith('```')) {
    jsonStr = jsonStr.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()
  }
  return JSON.parse(jsonStr) as MealItem
}

export async function generateWeeklyMealPlan(dietContext?: string): Promise<MealPlanDay[]> {
  const model = client.getGenerativeModel({
    model: 'gemini-2.5-pro',
    systemInstruction: MEAL_PLAN_SYSTEM_PROMPT,
  })

  const userMessage = `Create a 7-day weekly meal plan for me.${
    dietContext ? `\n${dietContext}` : ''
  }`

  console.log('[gemini] generateWeeklyMealPlan starting...')
  const result = await model.generateContent(userMessage)
  const rawText = result.response.text().trim()
  console.log('[gemini] generateWeeklyMealPlan raw response (first 300 chars):', rawText.slice(0, 300))

  try {
    return parseMealPlanJson(rawText)
  } catch (parseErr) {
    console.error('[gemini] generateWeeklyMealPlan JSON parse error:', parseErr)
    console.error('[gemini] Full raw response:', rawText)
    throw parseErr
  }
}

export async function generateSingleMeal(
  day: string,
  mealType: 'breakfast' | 'dinner',
  dietContext?: string
): Promise<MealItem> {
  const model = client.getGenerativeModel({
    model: 'gemini-2.5-pro',
    systemInstruction: SINGLE_MEAL_SYSTEM_PROMPT,
  })

  const mealLabel = mealType === 'breakfast' ? 'breakfast' : 'dinner'
  const userMessage = `Suggest a ${mealLabel} recipe for ${day}.${
    dietContext ? `\n${dietContext}` : ''
  }`

  const result = await model.generateContent(userMessage)
  const rawText = result.response.text().trim()
  return parseMealItemJson(rawText)
}

// ─── Recipe modification ──────────────────────────────────────────────────────

const MODIFY_RECIPE_SYSTEM_PROMPT = `You are Chef-AI's recipe editing assistant. You modify existing recipes based on the user's request.

Rules:
- Always respond in English.
- Return ONLY a valid JSON object; no markdown, explanations, or extra text.
- Edit the existing recipe according to the user's request (reduce calories, make vegetarian, change servings, etc.).
- Use imperial measurements: cups, oz, lbs, tbsp, tsp, °F (not metric).
- Update the recipe name if needed; separate instruction steps with \\n.
- Macros are estimates; reflect the changes made.

Output format (this JSON only, nothing else):
{
  "name": "Updated Recipe Name",
  "ingredients": ["2 cups flour", "1/2 tsp salt"],
  "instructions": "1. First step.\\n2. Second step.\\n3. Third step.",
  "macros": {
    "calories": 350,
    "protein_g": 25,
    "carbs_g": 30,
    "fat_g": 10
  }
}`

export interface ModifyRecipeInput {
  name: string
  ingredients: string[]
  instructions: string
}

export interface ModifyRecipeResult {
  name: string
  ingredients: string[]
  instructions: string
  macros: RecipeMacros | null
}

export async function modifyRecipe(
  recipe: ModifyRecipeInput,
  instruction: string,
  dietContext?: string
): Promise<ModifyRecipeResult> {
  const model = client.getGenerativeModel({
    model: 'gemini-2.5-pro',
    systemInstruction: MODIFY_RECIPE_SYSTEM_PROMPT,
  })

  const userMessage = `Current recipe:
Name: ${recipe.name}
Ingredients: ${recipe.ingredients.join(', ')}
Instructions: ${recipe.instructions}

User request: ${instruction}${dietContext ? `\nDiet goals: ${dietContext}` : ''}

Please modify this recipe according to the user's request.`

  const result = await model.generateContent(userMessage)
  const rawText = result.response.text().trim()

  let jsonStr = rawText
  if (jsonStr.startsWith('```')) {
    jsonStr = jsonStr.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()
  }

  const parsed = JSON.parse(jsonStr) as {
    name?: string
    ingredients?: string[]
    instructions?: string
    macros?: Partial<RecipeMacros>
  }

  const m = parsed.macros
  const macros: RecipeMacros | null =
    m &&
    typeof m.calories === 'number' &&
    typeof m.protein_g === 'number' &&
    typeof m.carbs_g === 'number' &&
    typeof m.fat_g === 'number'
      ? { calories: m.calories, protein_g: m.protein_g, carbs_g: m.carbs_g, fat_g: m.fat_g }
      : null

  return {
    name: parsed.name ?? recipe.name,
    ingredients: parsed.ingredients ?? recipe.ingredients,
    instructions: parsed.instructions ?? recipe.instructions,
    macros,
  }
}

export async function analyzeIngredients(
  imageBase64: string,
  mimeType: 'image/jpeg' | 'image/png' | 'image/webp'
): Promise<VisionResult> {
  const model = client.getGenerativeModel({ model: 'gemini-2.5-pro' })

  const result = await model.generateContent([
    VISION_PROMPT,
    {
      inlineData: {
        data: imageBase64,
        mimeType,
      },
    },
  ])

  const text = result.response.text().trim()

  if (!text) return { ingredients: [] }

  const ingredients = text
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter((s) => s.length > 0)

  return { ingredients }
}
