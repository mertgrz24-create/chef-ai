import { useCallback, useState } from 'react'
import { ActivityIndicator, LayoutAnimation, Platform, Pressable, ScrollView, Text, UIManager, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Stack, useFocusEffect } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { ApiError, apiFetch } from '@/lib/api'
import type { MealItem, MealPlan } from '@/lib/types'

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true)
}

type MealKey = 'breakfast' | 'dinner'

function MealRow({
  meal,
  item,
  expanded,
  onToggle,
  onRegenerate,
  regenerating,
}: {
  meal: MealKey
  item: MealItem
  expanded: boolean
  onToggle: () => void
  onRegenerate: () => void
  regenerating: boolean
}) {
  return (
    <View className="mt-2 rounded-xl border border-chalk/10 bg-chalk/[0.03] overflow-hidden">
      <Pressable onPress={onToggle} className="flex-row items-center px-4 py-3">
        <Text className="w-20 font-mono text-[10px] tracking-[1.5px] text-[#8fa093]">
          {meal.toUpperCase()}
        </Text>
        <Text className="flex-1 font-sans text-[14px] text-chalk" numberOfLines={1}>
          {regenerating ? 'Cooking up something new…' : item.name}
        </Text>
        {regenerating ? (
          <ActivityIndicator size="small" color="#CDF23E" />
        ) : (
          <Pressable onPress={onRegenerate} hitSlop={8} className="pl-2">
            <Ionicons name="refresh" size={16} color="#8fa093" />
          </Pressable>
        )}
      </Pressable>

      {expanded && !regenerating ? (
        <View className="px-4 pb-4">
          <View className="mb-3 h-px bg-chalk/10" />
          {item.ingredients.map((line, i) => (
            <View key={`${line}-${i}`} className="mb-1 flex-row gap-2">
              <Text className="text-zest">▪</Text>
              <Text className="flex-1 font-mono text-[12px] text-[#c3c8ba]">{line}</Text>
            </View>
          ))}
          <Text className="mt-3 font-sans text-[13px] leading-[20px] text-[#c3c8ba]">
            {item.instructions}
          </Text>
          {item.macros ? (
            <View className="mt-3 flex-row justify-between">
              {[`${item.macros.calories} KCAL`, `${item.macros.protein_g} P`, `${item.macros.carbs_g} C`, `${item.macros.fat_g} F`].map((m) => (
                <Text key={m} className="font-mono text-[10px] text-[#8fa093]">{m}</Text>
              ))}
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  )
}

export default function MealPlanScreen() {
  const [plan, setPlan] = useState<MealPlan | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [regenKey, setRegenKey] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const { plan } = await apiFetch<{ plan: MealPlan }>('/api/meal-plan')
      setPlan(plan)
      setError(null)
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) setPlan(null)
      else setError(e instanceof Error ? e.message : 'Could not load plan.')
    } finally {
      setLoading(false)
    }
  }, [])

  useFocusEffect(useCallback(() => { load() }, [load]))

  async function generate() {
    setGenerating(true)
    setError(null)
    try {
      const { plan } = await apiFetch<{ plan: MealPlan }>('/api/meal-plan/generate', { method: 'POST' })
      setPlan(plan)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not generate a plan.')
    } finally {
      setGenerating(false)
    }
  }

  async function regenerate(day: string, meal: MealKey) {
    const key = `${day}-${meal}`
    setRegenKey(key)
    try {
      const { plan } = await apiFetch<{ plan: MealPlan }>('/api/meal-plan/regenerate-day', {
        method: 'PATCH',
        body: JSON.stringify({ day, meal }),
      })
      setPlan(plan)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not regenerate that meal.')
    } finally {
      setRegenKey(null)
    }
  }

  function toggle(key: string) {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
    setExpanded((cur) => (cur === key ? null : key))
  }

  return (
    <View className="flex-1 bg-pantry">
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView className="flex-1" edges={['top']}>
        <ScrollView contentContainerClassName="px-6 pb-12 pt-4" showsVerticalScrollIndicator={false}>
          <Text className="font-mono text-[11px] tracking-[2px] text-zest">THIS WEEK</Text>
          <Text className="mt-2 font-display text-[30px] text-chalk">Your meal plan.</Text>

          {loading ? (
            <ActivityIndicator className="mt-10" color="#CDF23E" />
          ) : plan ? (
            <>
              <Pressable
                onPress={generate}
                disabled={generating}
                className="mt-5 flex-row items-center justify-center gap-2 rounded-full border border-chalk/20 py-2.5"
              >
                {generating ? (
                  <ActivityIndicator size="small" color="#CDF23E" />
                ) : (
                  <Ionicons name="refresh" size={15} color="#8fa093" />
                )}
                <Text className="font-mono text-[11px] tracking-wide text-[#8fa093]">
                  {generating ? 'REGENERATING…' : 'REGENERATE WHOLE WEEK'}
                </Text>
              </Pressable>

              {error ? <Text className="mt-4 font-sans text-[13px] text-clay">{error}</Text> : null}

              {plan.meals.map((d) => (
                <View key={d.day} className="mt-6">
                  <Text className="font-mono-bold text-[12px] tracking-[2px] text-chalk">
                    {d.day.toUpperCase()}
                  </Text>
                  {(['breakfast', 'dinner'] as const).map((meal) => {
                    const key = `${d.day}-${meal}`
                    return (
                      <MealRow
                        key={key}
                        meal={meal}
                        item={d[meal]}
                        expanded={expanded === key}
                        onToggle={() => toggle(key)}
                        onRegenerate={() => regenerate(d.day, meal)}
                        regenerating={regenKey === key}
                      />
                    )
                  })}
                </View>
              ))}
            </>
          ) : (
            <View className="mt-10 items-center">
              <View className="h-16 w-16 items-center justify-center rounded-full border border-dashed border-chalk/20">
                <Ionicons name="calendar-outline" size={28} color="#5f7267" />
              </View>
              <Text className="mt-4 text-center font-sans text-[14px] text-[#8fa093]">
                No plan for this week yet.{'\n'}Let Chef-AI build seven days of meals.
              </Text>
              {error ? <Text className="mt-3 font-sans text-[13px] text-clay">{error}</Text> : null}
              <Pressable
                onPress={generate}
                disabled={generating}
                className={`mt-6 h-13 w-full items-center justify-center rounded-full bg-zest ${generating ? 'opacity-70' : ''}`}
                style={{ height: 52 }}
              >
                {generating ? (
                  <ActivityIndicator color="#17180F" />
                ) : (
                  <Text className="font-mono-bold text-[13px] tracking-wide text-ink">
                    GENERATE THIS WEEK&apos;S PLAN →
                  </Text>
                )}
              </Pressable>
              {generating ? (
                <Text className="mt-3 text-center font-sans text-[13px] text-[#8fa093]">
                  Planning seven days of meals — this takes a moment…
                </Text>
              ) : (
                <View className="mt-10 w-full">
                  <Text className="mb-4 text-center font-mono text-[10px] tracking-[2px] text-[#8fa093]">
                    WHAT YOU&apos;LL GET
                  </Text>
                  {[
                    { icon: 'sunny-outline' as const, t: 'Breakfast & dinner for all 7 days' },
                    { icon: 'nutrition-outline' as const, t: 'Calories & macros on every meal' },
                    { icon: 'refresh-outline' as const, t: 'Swap any single meal you don’t like' },
                  ].map((row) => (
                    <View key={row.t} className="mb-3 flex-row items-center gap-3">
                      <View className="h-9 w-9 items-center justify-center rounded-xl bg-chalk/[0.06]">
                        <Ionicons name={row.icon} size={17} color="#CDF23E" />
                      </View>
                      <Text className="flex-1 font-sans text-[14px] text-[#c3c8ba]">{row.t}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  )
}
