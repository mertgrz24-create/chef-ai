import type { MealPlan, PantryItem, StructuredRecipe } from '@/lib/types';
import type { SavedRecipe } from './contracts';
import { isCalendarDate } from './meal-plan';
export type Candidate = {
    key: string;
    source: 'saved' | 'plan';
    recipe: StructuredRecipe;
    macros?: SavedRecipe['macros'];
    minutes: number | null;
    matches: number;
    urgent: number;
    matchedIngredients: string[];
    reviewIngredients: string[];
};
export type RecommendationMode = 'pantry' | 'quick';
export const localDay = (now: Date) => `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
export function localWeek(now: Date) {
    const monday = new Date(now);
    monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
    return localDay(monday);
}
const normalize = (value: string) => value.normalize('NFKC').toLowerCase().replace(/\u0307/g, '').trim().replace(/\s+/g, ' ');
// Whole names only; no stemming, substring matches or food substitutions.
const aliases: Record<string, string> = {
    tomato: 'tomato', tomatoes: 'tomato', domates: 'tomato',
    egg: 'egg', eggs: 'egg', yumurta: 'egg', flour: 'flour', un: 'flour',
    milk: 'milk', süt: 'milk', 'almond milk': 'almond milk', 'badem sütü': 'almond milk',
    'olive oil': 'olive oil', zeytinyağı: 'olive oil',
};
export function ingredientName(value: string) {
    const text = normalize(value).replace(/^[-•]\s*/, '');
    const stripped = text.replace(/^(?:\d+(?:[.,]\d+)?(?:\s*\/\s*\d+)?)(?:\s+(?:g|gr|kg|ml|l|cup|cups|tbsp|tsp|adet|su bardağı|yemek kaşığı|çay kaşığı))?\s+/, '');
    // Ambiguous compound instructions are not confidently parsed as a food name.
    if (!stripped || /[\d,;:/()[\]{}]/.test(stripped))
        return null;
    return aliases[stripped] ?? stripped;
}
function duration(recipe: StructuredRecipe) {
    const a = recipe.prep_time_min, b = recipe.cook_time_min;
    return typeof a === 'number' && Number.isFinite(a) && a >= 0 &&
        typeof b === 'number' && Number.isFinite(b) && b >= 0 ? a + b : null;
}
export function recommendations(recipes: SavedRecipe[], plan: MealPlan | null, pantry: PantryItem[], mode: RecommendationMode, now = new Date()) {
    const today = localDay(now), near = new Date(now);
    near.setDate(now.getDate() + 3);
    const stock = new Map<string, boolean>();
    for (const item of pantry) {
        const date = item.expiry_date;
        if (date && (!isCalendarDate(date) || date <= today))
            continue;
        const name = ingredientName(item.name);
        if (name)
            stock.set(name, (stock.get(name) ?? false) || !!date && date <= localDay(near));
    }
    const raw: Candidate[] = recipes.map(recipe => ({ key: `saved:${recipe.id}`, source: 'saved', recipe, macros: recipe.macros, minutes: duration(recipe), matches: 0, urgent: 0, matchedIngredients: [], reviewIngredients: [] }));
    if (plan?.week_start_date === localWeek(now))
        for (const day of plan.meals)
            for (const meal of ['breakfast', 'dinner'] as const) {
                const recipe = day[meal];
                raw.push({ key: `plan:${plan.id}:${day.day}:${meal}`, source: 'plan', recipe, macros: recipe.macros, minutes: duration(recipe), matches: 0, urgent: 0, matchedIngredients: [], reviewIngredients: [] });
            }
    const identities=new Set<string>(),unique=new Map<string,Candidate>();
    for(const item of raw) {
        if(!item.recipe.name.trim()||!item.recipe.instructions.trim()||!item.recipe.ingredients.length||identities.has(item.key))continue;
        identities.add(item.key);
        const signature=JSON.stringify([normalize(item.recipe.name),item.recipe.ingredients.map(normalize).sort(),normalize(item.recipe.instructions)]);
        const existing=unique.get(signature);
        // Prefer the source which actually supplies verified timing; do not invent timing on a saved recipe.
        if(!existing || existing.minutes===null && item.minutes!==null)unique.set(signature,item);
    }
    const candidates=[...unique.values()].map(item=>{
        const names = new Set(item.recipe.ingredients.map(ingredientName).filter((s): s is string => !!s));
        const matched = [...names].filter(name => stock.has(name));
        const matchedIngredients = item.recipe.ingredients.filter(line => {
            const name = ingredientName(line);
            return name !== null && stock.has(name);
        });
        const reviewIngredients = item.recipe.ingredients.filter(line => {
            const name = ingredientName(line);
            return name === null || !stock.has(name);
        });
        return { ...item, matches: matched.length, urgent: matched.filter(name => stock.get(name)).length, matchedIngredients, reviewIngredients };
    });
    const knownTimes = candidates.filter(item => item.minutes !== null).length;
    const eligible = candidates.filter(item => mode === 'quick' ? item.minutes !== null && item.minutes <= 30 : pantry.length === 0 || item.matches > 0);
    eligible.sort((a, b) => b.matches / b.recipe.ingredients.length - a.matches / a.recipe.ingredients.length || b.urgent - a.urgent || a.key.localeCompare(b.key));
    return { items: eligible.slice(0, 3), total: candidates.length, knownTimes,
        empty: candidates.length === 0 ? 'no_content' : mode === 'quick' && knownTimes === 0 ? 'unknown_time' : mode === 'quick' && eligible.length === 0 ? 'no_quick' : 'no_matches' };
}
