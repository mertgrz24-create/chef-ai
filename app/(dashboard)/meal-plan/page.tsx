'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { CookingMode } from '@/components/cooking-mode'
import { EatButton } from '@/components/eat-button'
import type { MealPlan, MealItem } from '@/types/meal-plan'

const DAY_LABELS: Record<string, string> = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
  sunday: 'Sunday',
}

const DAY_ORDER = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
const MEAL_ICONS = { breakfast: '🌅', dinner: '🌙' } as const
const MEAL_LABELS = { breakfast: 'Breakfast', dinner: 'Dinner' } as const

type CookingModal = { recipeName: string; instructions: string }

export default function MealPlanPage() {
  const [plan, setPlan] = useState<MealPlan | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [regenKey, setRegenKey] = useState<string | null>(null)
  const [expandedKey, setExpandedKey] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [cookingModal, setCookingModal] = useState<CookingModal | null>(null)

  // Image cache: keyed by meal name — undefined = not fetched, null = no image, string = url
  const imageCache = useRef<Map<string, string | null>>(new Map())
  const [mealImages, setMealImages] = useState<Map<string, string | null>>(new Map())

  const fetchPlan = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/meal-plan')
      if (res.ok) {
        const data = (await res.json()) as { plan: MealPlan }
        setPlan(data.plan)
      } else if (res.status === 404) {
        setPlan(null)
      } else {
        setError('Failed to load plan.')
      }
    } catch {
      setError('Failed to load plan.')
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    void fetchPlan()
  }, [fetchPlan])

  useEffect(() => {
    if (!plan) return
    let cancelled = false

    async function fetchImages() {
      for (const dayKey of DAY_ORDER) {
        if (cancelled) break
        const dayData = plan!.meals.find((m) => m.day === dayKey)
        if (!dayData) continue
        for (const mealType of ['breakfast', 'dinner'] as const) {
          if (cancelled) break
          const name = (dayData[mealType] as MealItem).name
          if (imageCache.current.has(name)) continue
          try {
            const res = await fetch(`/api/meal-image?name=${encodeURIComponent(name)}`)
            const data = (await res.json()) as { url: string | null }
            imageCache.current.set(name, data.url ?? null)
            setMealImages((prev) => new Map(prev).set(name, data.url ?? null))
          } catch {
            imageCache.current.set(name, null)
            setMealImages((prev) => new Map(prev).set(name, null))
          }
        }
      }
    }

    void fetchImages()
    return () => { cancelled = true }
  }, [plan])

  async function generatePlan() {
    setGenerating(true)
    setError(null)
    try {
      const res = await fetch('/api/meal-plan/generate', { method: 'POST' })
      if (res.ok) {
        const data = (await res.json()) as { plan: MealPlan }
        setPlan(data.plan)
      } else {
        setError('Could not generate plan. Please try again.')
      }
    } catch {
      setError('Could not generate plan. Please try again.')
    }
    setGenerating(false)
  }

  async function regenMeal(day: string, meal: 'breakfast' | 'dinner') {
    const key = `${day}-${meal}`
    setRegenKey(key)
    setError(null)
    try {
      const res = await fetch('/api/meal-plan/regenerate-day', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ day, meal }),
      })

      const data = (await res.json()) as { plan?: MealPlan; error?: string; detail?: string }
      console.log('[regenMeal] response:', res.status, data)

      if (!res.ok) {
        setError(data.error ?? 'Could not refresh meal. Please try again.')
        return
      }

      if (!data.plan) {
        setError('Could not refresh meal: API returned empty response.')
        return
      }

      const newMealItem = data.plan.meals.find((d) => d.day === day)?.[meal]
      if (newMealItem) {
        setPlan((prev) =>
          prev
            ? {
                ...prev,
                meals: prev.meals.map((d) =>
                  d.day === day ? { ...d, [meal]: newMealItem } : d
                ),
              }
            : prev
        )
      } else {
        setPlan(data.plan ?? null)
      }
    } catch (err) {
      console.error('[regenMeal] fetch error:', err)
      setError('Could not refresh meal. Please try again.')
    } finally {
      setRegenKey(null)
    }
  }

  function toggleExpand(key: string) {
    setExpandedKey((prev) => (prev === key ? null : key))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <div className="mb-3 text-4xl">⏳</div>
          <p className="text-sm text-[var(--text-muted)]">Loading...</p>
        </div>
      </div>
    )
  }

  const sortedDays = plan
    ? DAY_ORDER.map((d) => plan.meals.find((m) => m.day === d)).filter(Boolean)
    : []

  return (
    <div>
      {/* Page header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">🗓️ Weekly Meal Plan</h1>
        {plan && !generating && (
          <button
            onClick={() => { void generatePlan() }}
            className="rounded-xl border border-[var(--accent-border)] bg-[var(--accent-light)] px-4 py-2 text-sm font-medium text-amber-600 dark:text-amber-400 transition hover:opacity-80"
          >
            🔄 Regenerate Plan
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 px-4 py-3 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Generating whole plan spinner */}
      {generating && (
        <div className="rounded-2xl border border-[var(--accent-border)] bg-[var(--accent-light)] p-12 text-center">
          <div className="mb-3 flex justify-center">
            <span className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-amber-300 border-t-transparent" />
          </div>
          <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
            Generating your plan... This may take a moment.
          </p>
        </div>
      )}

      {/* Empty state */}
      {!plan && !generating && (
        <div className="rounded-2xl border-2 border-dashed border-[var(--border)] bg-[var(--bg-card)] p-12 text-center">
          <div className="mb-4 text-5xl">🗓️</div>
          <h2 className="mb-2 text-lg font-semibold text-[var(--text-secondary)]">
            No plan for this week yet
          </h2>
          <p className="mb-6 text-sm text-[var(--text-muted)]">
            AI generates a personalized 7-day plan based on your diet goals.
          </p>
          <button
            onClick={() => { void generatePlan() }}
            className="inline-flex items-center gap-2 rounded-2xl px-8 py-3.5 text-sm font-semibold text-white transition hover:opacity-90"
            style={{ backgroundColor: '#ffa51f' }}
          >
            🗓️ Generate My Weekly Plan
          </button>
        </div>
      )}

      {/* Plan list */}
      {plan && !generating && (
        <div className="space-y-4">
          {sortedDays.map((dayData) => {
            if (!dayData) return null
            return (
              <div
                key={dayData.day}
                className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] shadow-sm"
              >
                {/* Day header */}
                <div className="border-b border-[var(--border-subtle)] bg-[var(--bg)] px-5 py-3">
                  <span className="text-sm font-semibold text-[var(--text-secondary)]">
                    📅 {DAY_LABELS[dayData.day] ?? dayData.day}
                  </span>
                </div>

                {/* Meals */}
                <div className="divide-y divide-[var(--border-subtle)]">
                  {(['breakfast', 'dinner'] as const).map((mealType) => {
                    const mealItem = dayData[mealType] as MealItem
                    const key = `${dayData.day}-${mealType}`
                    const isExpanded = expandedKey === key
                    const isRegening = regenKey === key

                    return (
                      <div key={mealType}>
                        {/* Meal row */}
                        <div className="flex items-center gap-3 px-5 py-3.5">
                          {/* Thumbnail */}
                          <div className="relative h-[60px] w-[60px] flex-shrink-0 overflow-hidden rounded-lg">
                            {mealImages.get(mealItem.name) ? (
                              <Image
                                src={mealImages.get(mealItem.name)!}
                                alt={mealItem.name}
                                fill
                                className="object-cover"
                                sizes="60px"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-amber-100 to-orange-200 dark:from-amber-900/30 dark:to-orange-900/20">
                                {mealImages.has(mealItem.name) ? (
                                  <span className="text-xl">🍽️</span>
                                ) : (
                                  <span className="h-3 w-3 animate-pulse rounded-full bg-amber-300" />
                                )}
                              </div>
                            )}
                          </div>
                          <span className="text-lg">{MEAL_ICONS[mealType]}</span>
                          <span className="w-16 flex-shrink-0 text-xs font-medium text-[var(--text-muted)]">
                            {MEAL_LABELS[mealType]}
                          </span>
                          <button
                            type="button"
                            onClick={() => toggleExpand(key)}
                            className="min-w-0 flex-1 text-left text-sm font-medium text-[var(--text-primary)] transition hover:text-amber-500"
                          >
                            {isRegening ? (
                              <span className="flex items-center gap-2 text-[var(--text-muted)]">
                                <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-gray-300 border-t-transparent" />
                                Refreshing...
                              </span>
                            ) : (
                              <span className="flex items-center gap-1.5">
                                {mealItem.name}
                                <span className="text-xs text-[var(--text-muted)]">
                                  {isExpanded ? '▲' : '▼'}
                                </span>
                              </span>
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => { void regenMeal(dayData.day, mealType) }}
                            disabled={isRegening || regenKey !== null}
                            title="Refresh this meal"
                            className="flex-shrink-0 rounded-lg p-1.5 text-sm text-[var(--text-muted)] transition hover:bg-[var(--accent-light)] hover:text-amber-500 disabled:opacity-30"
                          >
                            🔄
                          </button>
                        </div>

                        {/* Accordion detail — smooth height animation */}
                        <AnimatePresence initial={false}>
                          {isExpanded && !isRegening && (
                            <motion.div
                              key="detail"
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.25, ease: 'easeOut' }}
                              style={{ overflow: 'hidden' }}
                            >
                              <div className="space-y-3 border-t border-[var(--border-subtle)] bg-[var(--bg)] px-5 py-4">
                                {mealItem.ingredients.length > 0 && (
                                  <div>
                                    <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                                      Ingredients
                                    </p>
                                    <ul className="space-y-0.5">
                                      {mealItem.ingredients.map((ing, i) => (
                                        <li key={i} className="text-sm text-[var(--text-secondary)]">
                                          • {ing}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                                {mealItem.instructions && (
                                  <div>
                                    <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                                      Instructions
                                    </p>
                                    <p className="whitespace-pre-line text-sm text-[var(--text-secondary)]">
                                      {mealItem.instructions}
                                    </p>
                                  </div>
                                )}
                                {mealItem.macros && (
                                  <div className="flex flex-wrap gap-2 pt-1">
                                    <MacroBadge icon="🔥" value={`${mealItem.macros.calories} kcal`} />
                                    <MacroBadge icon="💪" value={`${mealItem.macros.protein_g}g protein`} />
                                    <MacroBadge icon="🍚" value={`${mealItem.macros.carbs_g}g carbs`} />
                                    <MacroBadge icon="🧈" value={`${mealItem.macros.fat_g}g fat`} />
                                  </div>
                                )}
                                <div className="mt-1 flex flex-wrap gap-2">
                                  {mealItem.instructions && (
                                    <button
                                      type="button"
                                      onClick={() => setCookingModal({ recipeName: mealItem.name, instructions: mealItem.instructions })}
                                      className="flex items-center gap-1.5 rounded-xl border border-[var(--border)] px-4 py-2 text-xs font-semibold text-[var(--text-secondary)] transition hover:border-amber-300 hover:text-amber-600 dark:hover:text-amber-400"
                                    >
                                      👨‍🍳 Cook
                                    </button>
                                  )}
                                  <EatButton
                                    recipeName={mealItem.name}
                                    macros={mealItem.macros}
                                    source="meal_plan"
                                  />
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {cookingModal && (
        <CookingMode
          recipeName={cookingModal.recipeName}
          instructions={cookingModal.instructions}
          open={true}
          onClose={() => setCookingModal(null)}
        />
      )}
    </div>
  )
}

function MacroBadge({ icon, value }: { icon: string; value: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-lg bg-[var(--accent-light)] px-2.5 py-1 text-xs font-medium text-amber-700 dark:text-amber-400">
      {icon} {value}
    </span>
  )
}
