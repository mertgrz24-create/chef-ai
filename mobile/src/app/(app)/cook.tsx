import { useCallback, useState } from 'react'
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useFocusEffect } from 'expo-router'
import { ApiError, apiFetch } from '@/lib/api'
import type { GenerateRecipeResponse, PantryItem, StructuredRecipe } from '@/lib/types'

function RecipeTicket({ recipe, macros }: { recipe: StructuredRecipe; macros: GenerateRecipeResponse['macros'] }) {
  const timing = [recipe.prep_time_min && `PREP ${recipe.prep_time_min}M`, recipe.cook_time_min && `COOK ${recipe.cook_time_min}M`]
    .filter(Boolean)
    .join('  ·  ')

  return (
    <View className="mt-6 overflow-hidden rounded-2xl bg-surface">
      <View className="flex-row items-center justify-between bg-ink px-4 py-2.5">
        <Text className="font-mono text-[11px] tracking-widest text-chalk">TONIGHT&apos;S TICKET</Text>
        {timing ? <Text className="font-mono text-[11px] tracking-widest text-zest">{timing}</Text> : null}
      </View>
      <View className="px-5 pb-5 pt-4">
        <Text className="font-display text-[24px] leading-[28px] text-ink">{recipe.name}</Text>

        <Text className="mb-1.5 mt-4 font-mono-bold text-[10px] tracking-[2px] text-pantry">INGREDIENTS</Text>
        {recipe.ingredients.map((line, i) => (
          <View key={`${line}-${i}`} className="mb-1 flex-row gap-2">
            <Text className="text-pantry">▪</Text>
            <Text className="flex-1 font-mono text-[12px] text-ink-2">{line}</Text>
          </View>
        ))}

        <Text className="mb-1.5 mt-4 font-mono-bold text-[10px] tracking-[2px] text-pantry">METHOD</Text>
        <Text className="font-sans text-[14px] leading-[21px] text-ink-2">{recipe.instructions}</Text>

        {recipe.chefs_note ? (
          <View className="mt-4 rounded-lg bg-accent-light p-3">
            <Text className="font-sans text-[13px] italic text-ink-2">💡 {recipe.chefs_note}</Text>
          </View>
        ) : null}

        {macros ? (
          <>
            <View className="my-4 border-t border-dashed border-border" />
            <View className="flex-row justify-between">
              {[`${macros.calories} KCAL`, `${macros.protein_g} P`, `${macros.carbs_g} C`, `${macros.fat_g} F`].map((m) => (
                <Text key={m} className="font-mono text-[11px] text-ink-muted">{m}</Text>
              ))}
            </View>
          </>
        ) : null}
      </View>
    </View>
  )
}

export default function Cook() {
  const [pantry, setPantry] = useState<PantryItem[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [extra, setExtra] = useState('')

  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<GenerateRecipeResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [limitReached, setLimitReached] = useState(false)

  useFocusEffect(
    useCallback(() => {
      apiFetch<{ items: PantryItem[] }>('/api/pantry')
        .then(({ items }) => setPantry(items))
        .catch(() => {})
    }, [])
  )

  function toggle(name: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })
  }

  async function fire() {
    const ingredients = [
      ...selected,
      ...extra.split(',').map((s) => s.trim()).filter(Boolean),
    ]
    if (ingredients.length === 0 || loading) return

    setLoading(true)
    setError(null)
    setLimitReached(false)
    setResult(null)
    try {
      const data = await apiFetch<GenerateRecipeResponse>('/api/recipes', {
        method: 'POST',
        body: JSON.stringify({ ingredients }),
      })
      setResult(data)
    } catch (e) {
      if (e instanceof ApiError && e.status === 403) {
        setLimitReached(true)
      } else {
        setError(e instanceof Error ? e.message : 'Could not generate a recipe.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <View className="flex-1 bg-pantry">
      <SafeAreaView className="flex-1" edges={['top']}>
        <ScrollView contentContainerClassName="px-6 pb-28 pt-6" showsVerticalScrollIndicator={false}>
          <Text className="font-mono text-[11px] tracking-[2px] text-zest">FIRE A RECIPE</Text>
          <Text className="mt-2 font-display text-[30px] text-chalk">Cook what you pick.</Text>

          {pantry.length > 0 ? (
            <>
              <Text className="mb-2.5 mt-6 font-mono text-[10px] tracking-[2px] text-[#8fa093]">
                FROM YOUR PANTRY
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {pantry.map((item) => {
                  const on = selected.has(item.name)
                  return (
                    <Pressable
                      key={item.id}
                      onPress={() => toggle(item.name)}
                      className={`rounded-full border px-3 py-1.5 ${on ? 'border-zest bg-zest' : 'border-chalk/20'}`}
                    >
                      <Text className={`font-mono text-[12px] ${on ? 'text-ink' : 'text-[#e4e8dd]'}`}>
                        {item.name}
                      </Text>
                    </Pressable>
                  )
                })}
              </View>
            </>
          ) : (
            <Text className="mt-6 font-sans text-[14px] text-[#8fa093]">
              No pantry items yet — type a few below, comma-separated.
            </Text>
          )}

          <Text className="mb-2 mt-6 font-mono text-[10px] tracking-[2px] text-[#8fa093]">
            OR ADD YOUR OWN
          </Text>
          <TextInput
            value={extra}
            onChangeText={setExtra}
            placeholder="e.g. eggs, tomato, feta"
            placeholderTextColor="#5f7267"
            className="rounded-xl border border-chalk/15 bg-chalk/5 px-4 py-3.5 font-sans text-[15px] text-chalk"
          />

          <Pressable
            onPress={fire}
            disabled={loading}
            className={`mt-5 h-13 items-center justify-center rounded-full bg-zest ${loading ? 'opacity-70' : ''}`}
            style={{ height: 52 }}
          >
            {loading ? (
              <ActivityIndicator color="#17180F" />
            ) : (
              <Text className="font-mono-bold text-[13px] tracking-wide text-ink">FIRE RECIPE →</Text>
            )}
          </Pressable>

          {loading ? (
            <Text className="mt-4 text-center font-sans text-[13px] text-[#8fa093]">
              Reading your ingredients, firing a recipe…
            </Text>
          ) : null}

          {error ? <Text className="mt-4 font-sans text-[13px] text-clay">{error}</Text> : null}

          {limitReached ? (
            <View className="mt-5 rounded-xl border border-zest/40 bg-zest/10 p-4">
              <Text className="font-display text-[16px] text-chalk">You&apos;ve used your 10 free recipes</Text>
              <Text className="mt-1 font-sans text-[13px] text-[#c3c8ba]">
                Upgrade to Premium for unlimited recipes, photo analysis and weekly plans.
              </Text>
            </View>
          ) : null}

          {result?.structured ? <RecipeTicket recipe={result.structured} macros={result.macros} /> : null}
        </ScrollView>
      </SafeAreaView>
    </View>
  )
}
