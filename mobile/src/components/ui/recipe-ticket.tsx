import { t, useLocale } from '@/lib/release/locale'
import { useState } from 'react'
import { Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import type { StructuredRecipe, RecipeMacros } from '@/lib/types'
import { colors } from '@/theme/tokens'
import { RecipeShopping } from '@/components/release/recipe-shopping'
import { CookingMode } from '@/components/release/cooking-mode'
import { Button } from '@/components/ui/button'

type RecipeTicketProps = { recipe: StructuredRecipe; macros?: RecipeMacros | null; title?: string }
export function RecipeTicket(props: RecipeTicketProps) {
  return <RecipeTicketContent key={JSON.stringify([props.recipe.name, props.recipe.ingredients, props.recipe.instructions])} {...props} />
}
function RecipeTicketContent({
  recipe,
  macros,
  title = 'YOUR RECIPE',
}: RecipeTicketProps) {
  useLocale()
  const [cooking, setCooking] = useState(false)
  const timing = [
    recipe.prep_time_min != null
      ? { label: 'Prep', value: `${recipe.prep_time_min} ${t('min')}` }
      : null,
    recipe.cook_time_min != null
      ? { label: 'Cook', value: `${recipe.cook_time_min} ${t('min')}` }
      : null,
    recipe.servings != null
      ? { label: 'Serves', value: `${recipe.servings}` }
      : null,
  ].filter((item) => item !== null)
  const lines = recipe.instructions
    .trim()
    .split(/\n\s*\n|\n(?=\s*\d+[.)]\s)/)
    .filter(Boolean)
  const numbered =
    lines.length > 0 && lines.every((line) => /^\s*\d+[.)]\s/.test(line))
  const steps = numbered
    ? lines.map((line) => line.replace(/^\s*\d+[.)]\s*/, ''))
    : null
  if (cooking) return <CookingMode recipe={recipe} onClose={() => setCooking(false)} />
  return (
    <View className="overflow-hidden rounded-3xl bg-panel">
      <View className="px-5 pb-6 pt-5">
        <View className="mb-4 flex-row items-center gap-2">
          <Ionicons name="receipt-outline" size={16} color={colors.pantry} />
          <Text className="font-mono text-meta tracking-label text-muted">
            {t(title)}
          </Text>
        </View>
        <Text
          accessibilityRole="header"
          className="font-display text-display-xl tracking-tight text-pantry"
        >
          {recipe.name}
        </Text>
        <View className="mt-4"><Button label={t('Start cooking')} onPress={() => setCooking(true)} /></View>
        {timing.length ? (
          <View className="mt-5 flex-row flex-wrap gap-x-6 gap-y-3 border-y border-line py-4">
            {timing.map((item) => (
              <View key={t(item.label)}>
                <Text className="font-sans text-meta text-muted">
                  {t(item.label)}
                </Text>
                <Text className="mt-1 font-sans-bold text-body-sm text-pantry">
                  {item.value}
                </Text>
              </View>
            ))}
          </View>
        ) : null}
        <View className="mb-3 mt-6 flex-row items-baseline justify-between">
          <Text
            accessibilityRole="header"
            className="font-display text-display-sm text-pantry"
          >
            {t('Ingredients')}
          </Text>
          <Text className="font-sans text-meta text-muted">
            {recipe.ingredients.length} {t('items')}
          </Text>
        </View>
        {recipe.ingredients.map((line, index) => (
          <View
            key={`${line}-${index}`}
            className="flex-row items-start gap-3 border-b border-line py-3"
          >
            <View className="mt-2 h-1 w-1 rounded-full bg-pantry" />
            <Text className="flex-1 font-sans text-body-sm text-secondary">
              {line}
            </Text>
          </View>
        ))}
        <RecipeShopping ingredients={recipe.ingredients} />
        <Text
          accessibilityRole="header"
          className="mb-4 mt-7 font-display text-display-sm text-pantry"
        >
          {t('Method')}
        </Text>
        {steps ? (
          steps.map((step, index) => (
            <View key={index} className="mb-5 flex-row items-start gap-3">
              <View className="h-7 w-7 items-center justify-center rounded-full bg-surface-2">
                <Text className="font-mono-bold text-meta text-pantry">
                  {index + 1}
                </Text>
              </View>
              <Text className="flex-1 font-sans text-body text-secondary">
                {step}
              </Text>
            </View>
          ))
        ) : (
          <Text className="font-sans text-body text-secondary">
            {recipe.instructions}
          </Text>
        )}
        {recipe.chefs_note ? (
          <View className="mt-4 rounded-2xl bg-canvas p-4">
            <View className="mb-2 flex-row items-center gap-2">
              <Ionicons name="bulb-outline" size={17} color={colors.pantry} />
              <Text className="font-sans-bold text-label text-pantry">
                {t('Kitchen note')}
              </Text>
            </View>
            <Text className="font-sans text-body-sm text-secondary">
              {recipe.chefs_note}
            </Text>
          </View>
        ) : null}
        {macros ? (
          <View className="mt-7 border-t border-dashed border-line pt-5">
            <Text
              accessibilityRole="header"
              className="font-display text-display-sm text-pantry"
            >
              {t('Estimated nutrition')}
            </Text>
            <View className="mt-4 flex-row flex-wrap">
              {[
                { value: macros.calories, unit: 'kcal', label: 'Energy' },
                { value: macros.protein_g, unit: 'g', label: 'Protein' },
                { value: macros.carbs_g, unit: 'g', label: 'Carbs' },
                { value: macros.fat_g, unit: 'g', label: 'Fat' },
              ].map((item) => (
                <View key={t(item.label)} className="w-1/2 pb-4">
                  <Text className="font-display text-display-md text-pantry">
                    {item.value}
                    <Text className="font-sans text-label text-muted">
                      {' '}
                      {item.unit}
                    </Text>
                  </Text>
                  <Text className="mt-1 font-sans text-meta text-muted">
                    {t(item.label)}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}
      </View>
      <View className="h-2 bg-zest" />
    </View>
  )
}
