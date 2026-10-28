import { QuotaStatus } from '@/components/release/quota-status'
import { useKitchenInvalidation } from '@/lib/release/kitchen-data'
import { aiErrorMessage } from '@/lib/release/ai-error'
import { t, useLocale, getLocale } from '@/lib/release/locale'
import { useCallback, useEffect, useRef, useState, type ComponentRef } from 'react'
import { ActivityIndicator, Modal, ScrollView, Text, View, useWindowDimensions } from 'react-native'
import { router, useFocusEffect } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { ApiError, apiFetch } from '@/lib/api'
import type { MealPlan } from '@/lib/types'
import {
  BusyState,
  Button,
  EmptyState,
  LoadingRows,
  Notice,
  MotionView,
  PressableScale,
  RecipeTicket,
  ScreenHeader,
  ScreenScroll,
  SectionLabel,
} from '@/components/ui'
import { colors } from '@/theme/tokens'
import { useRelease } from '@/lib/release/state'
import { useReducedMotion } from '@/theme/use-reduced-motion'
import { useModalFocus } from '@/theme/use-modal-focus'
import { AiGate } from '@/components/release/gates'
import { dateForMealDay, mealOperationKey, type MealKey } from '@/lib/release/meal-plan'
export default function MealPlanScreen() {
  useLocale()
  const invalidate=useKitchenInvalidation()
  const { aiAllowed, track, offline, refreshMembership } = useRelease()
  const [plan, setPlan] = useState<MealPlan | null>(null)
  const [loading, setLoading] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [loadError, setLoadError] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeDay, setActiveDay] = useState(0)
  const [detail, setDetail] = useState<{
    day: string
    meal: MealKey
  } | null>(null)
  const reduced = useReducedMotion()
  const {fontScale} = useWindowDimensions()
  const detailTrigger = useRef<ComponentRef<typeof View>>(null)
  const mealRefs = useRef(new Map<string,ComponentRef<typeof View>>())
  const {heading: headingRef,onShow: onModalShow,onDismiss: onModalDismiss} = useModalFocus(!!detail,detailTrigger)
  const [regenKey, setRegenKey] = useState<string | null>(null)
  const operation = useRef(false)
  const requestVersion = useRef(0)
  const mounted = useRef(true)
  const read = useRef<AbortController | null>(null)
  const mutation = useRef<AbortController | null>(null)
  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
      read.current?.abort()
      mutation.current?.abort()
    }
  }, [])
  const load = useCallback(async () => {
    if (operation.current || offline || !mounted.current) return
    read.current?.abort()
    const controller = new AbortController()
    read.current = controller
    const version = ++requestVersion.current
    setLoading(true)
    try {
      const { plan } = await apiFetch<{
        plan: MealPlan
      }>('/api/meal-plan', { signal: controller.signal })
      if (!mounted.current || version !== requestVersion.current) return
      setPlan(plan)
      setLoaded(true)
      setLoadError(false)
    } catch (e) {
      if (!mounted.current || version !== requestVersion.current) return
      if (e instanceof ApiError && e.status === 404) {
        setPlan(null)
        setLoaded(true)
        setLoadError(false)
      } else setLoadError(true)
    } finally {
      if (mounted.current && version === requestVersion.current) setLoading(false)
    }
  }, [offline])
  useFocusEffect(
    useCallback(() => {
      if (!offline) void load()
      else setLoading(false)
      return () => {
        ++requestVersion.current
        read.current?.abort()
      }
    }, [load, offline]),
  )
  async function generate(day?: string, meal?: MealKey) {
    if (operation.current || !aiAllowed || offline || !mounted.current) return
    operation.current = true
    ++requestVersion.current
    read.current?.abort()
    const controller = new AbortController()
    mutation.current = controller
    setLoading(false)
    setError(null)
    const single = !!(day && meal)
    if (single) setRegenKey(mealOperationKey(day!, meal!))
    else setGenerating(true)
    try {
      const { plan } = await apiFetch<{
        plan: MealPlan
      }>(single ? '/api/meal-plan/regenerate-day' : '/api/meal-plan/generate', {
        method: single ? 'PATCH' : 'POST',
        signal: controller.signal,
        ...(single ? { body: JSON.stringify({ day, meal }) } : {}),
      })
      if (!mounted.current) return
      setPlan(plan)
      invalidate?.('plan')
      if (!single) {
        setActiveDay(0)
        setDetail(null)
      }
      void track('plan_created')
      setLoaded(true)
      setLoadError(false)
    } catch (e) {
      if (!mounted.current) return
      setError(
        aiErrorMessage(
          e,
          e instanceof ApiError && e.status === 403 && e.code === 'limit_reached'
          ? 'Your plan doesn’t include more meal generation. You can still view your existing plan.'
          : single
            ? 'Couldn’t replace this meal. Your current meal is still here; try again.'
            : 'Couldn’t create your plan. Please try again in a moment.',
        ),
      )
    } finally {
      void refreshMembership?.()
      mutation.current = null
      if (mounted.current) {
        setGenerating(false)
        setRegenKey(null)
      }
      operation.current = false
    }
  }
  const busy = generating || !!regenKey
  const day = plan?.meals[Math.min(activeDay, plan.meals.length - 1)]
  const detailItem = detail
    ? plan?.meals.find((d) => d.day === detail.day)?.[detail.meal]
    : null
  return (
    <>
      <ScreenScroll>
        <ScreenHeader
          eyebrow={t('YOUR WEEK, SORTED')}
          title={t('Weekly menu')}
          description={t('A little planning. A lot to look forward to.')}
          onBack={() => router.navigate('/')}
        />
        <QuotaStatus kind="plans" />
      <AiGate />
        {offline ? (
          <Notice tone="info" title={t('You’re offline')} description={t('Connect to load or update your weekly menu. Any meals already shown are kept here.')} />
        ) : null}
        {loadError ? (
          <Notice
            title={t('Your meal plan couldn\u2019t load')}
            description={t('Check your connection and try again.')}
            action={loading || offline || busy ? undefined : { label: 'Try again', onPress: load }}
          />
        ) : null}
        {error ? (
          <Notice
            title={t('Your plan couldn\u2019t update')}
            description={error}
          />
        ) : null}
        {(loading || (!loaded && !loadError && !offline)) && !plan ? (
          <LoadingRows />
        ) : plan ? (
          <>
            <View className="mt-6 flex-row items-center justify-between">
              <Text className="font-sans-bold text-body text-pantry">
                {t('Week of')}{' '}
                {new Date(
                  `${plan.week_start_date}T00:00:00`,
                ).toLocaleDateString(getLocale(), {
                  month: 'short',
                  day: 'numeric',
                })}
              </Text>
              <View className="rounded-full bg-surface-2 px-3 py-2">
                <Text className="font-mono text-meta text-secondary">
                  {plan.meals.length * 2}{' '}
                  {t('MEALS')}
                </Text>
              </View>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="mt-4"
              contentContainerStyle={{ gap: 8, paddingBottom: 4 }}
            >
              {plan.meals.map((entry, index) => {
                const date = dateForMealDay(plan.week_start_date, entry.day)
                const active = day?.day === entry.day
                return (
                  <PressableScale
                    key={entry.day}
                    onPress={() => setActiveDay(index)}
                    accessibilityLabel={t('Show %{day} meals', { day: t(entry.day) })}
                    accessibilityRole="tab"
                    accessibilityState={{ selected: active }}
                    className={`min-h-20 w-14 items-center justify-center rounded-2xl ${active ? 'bg-pantry' : 'bg-panel'}`}
                  >
                    <Text
                      className={`font-sans text-label ${active ? 'text-chalk-2' : 'text-muted'}`}
                    >
                      {date.toLocaleDateString(getLocale(), {
                        weekday: 'short',
                      })}
                    </Text>
                    <Text
                      className={`mt-1 font-display text-display-sm ${active ? 'text-zest' : 'text-pantry'}`}
                    >
                      {date.getDate()}
                    </Text>
                  </PressableScale>
                )
              })}
            </ScrollView>
            {day ? (
              <>
                <SectionLabel>
                  {t(day.day)}
                  {t('\u2019s menu')}
                </SectionLabel>
                {(['breakfast', 'dinner'] as const).map((meal) => {
                  const item = day[meal]
                  const key = mealOperationKey(day.day, meal)
                  return (
                    <MotionView key={meal} transitionKey={`${day.day}:${item.name}:${item.instructions}`} style={{marginBottom:12}}><View
                      className="overflow-hidden rounded-3xl bg-panel p-5"
                    >
                      <View className="flex-row items-center justify-between">
                        <View className="flex-row items-center gap-2">
                          <Ionicons
                            name={
                              meal === 'breakfast'
                                ? 'sunny-outline'
                                : 'moon-outline'
                            }
                            size={18}
                            color={colors.pantry}
                          />
                          <Text className="font-sans-bold text-label capitalize text-secondary">
                            {t(meal)}
                          </Text>
                        </View>
                        <PressableScale
                          onPress={() => generate(day.day, meal)}
                          disabled={busy || !aiAllowed || offline}
                          accessibilityLabel={t('Regenerate %{meal}: %{name}', { meal: t(meal), name: item.name })}
                          accessibilityState={{ busy: regenKey === key }}
                          className="h-11 w-11 items-center justify-center rounded-full bg-canvas"
                        >
                          {regenKey === key ? (
                            <ActivityIndicator color={colors.pantry} />
                          ) : (
                            <Ionicons
                              name="refresh"
                              size={18}
                              color={colors.pantry}
                            />
                          )}
                        </PressableScale>
                      </View>
                      <PressableScale
                        nativeRef={node=>{if(node)mealRefs.current.set(key,node);else mealRefs.current.delete(key)}}
                        onPress={() => {detailTrigger.current=mealRefs.current.get(key)??null;setDetail({ day: day.day, meal })}}
                        accessibilityLabel={`${t(meal)}: ${item.name}`}
                        className="py-2"
                      >
                        <Text numberOfLines={2} style={{minHeight:56*fontScale}} className="font-display text-display-md text-pantry">
                          {item.name}
                        </Text>
                        <View className="mt-4 flex-row items-center gap-3">
                          <Text numberOfLines={2} style={{minHeight:36*fontScale}} className="flex-1 font-sans text-label text-muted">
                            {(item.prep_time_min ?? 0) +
                            (item.cook_time_min ?? 0)
                              ? `${(item.prep_time_min ?? 0) + (item.cook_time_min ?? 0)} ${t('min')} · `
                              : ''}
                            {item.ingredients.length}{' '}
                            {t('ingredients')}
                            {item.macros
                              ? ` · ${item.macros.calories} kcal`
                              : ''}
                          </Text>
                          <Ionicons
                            name="arrow-forward"
                            size={20}
                            color={colors.pantry}
                          />
                        </View>
                      </PressableScale>
                    </View></MotionView>
                  )
                })}
              </>
            ) : null}
            <Text className="mb-5 mt-1 font-sans text-label text-muted">
              {t(
                'Tap a meal for ingredients and cooking steps. Use \u21BB to swap just one.',
              )}
            </Text>
            <Button
              label={t('Regenerate whole week')}
              loadingLabel={t('Planning your week\u2026')}
              variant="ghost"
              onPress={() => generate()}
              loading={generating}
              disabled={!!regenKey || !aiAllowed || offline}
            />
            {generating ? (
              <BusyState
                label={t('Planning seven days of meals\u2026')}
                description={t(
                  'Your current plan stays here until the new one is ready.',
                )}
              />
            ) : null}
          </>
        ) : loaded ? (
          <>
            <EmptyState
              icon="calendar-outline"
              title={t('Your week starts here')}
              description={t(
                'A week of breakfasts and dinners, with ingredients and cooking steps for every meal.',
              )}
            />
            <Button
              label={t('Generate this week\u2019s plan')}
              loadingLabel={t('Planning your week\u2026')}
              onPress={() => generate()}
              loading={generating}
              disabled={!aiAllowed || offline}
            />
            {generating ? (
              <BusyState
                label={t('Putting your week together\u2026')}
                description={t(
                  'Keep this screen open while your meals are prepared.',
                )}
              />
            ) : null}
          </>
        ) : null}
      </ScreenScroll>
      <Modal
        visible={!!detail && !!detailItem}
        animationType={reduced?'none':'slide'}
        onShow={onModalShow}
        onDismiss={onModalDismiss}
        presentationStyle="pageSheet"
        onRequestClose={() => setDetail(null)}
      >
        <View style={{flex:1}} accessibilityViewIsModal><ScreenScroll>
          <View className="mb-5 flex-row items-center justify-between">
            <Text ref={headingRef} accessible accessibilityRole="header" className="font-sans-bold text-body capitalize text-pantry">
              {detail?.day ? t(detail.day) : ''} ·{' '}
              {detail?.meal ? t(detail.meal) : ''}
            </Text>
            <PressableScale
              onPress={() => setDetail(null)}
              accessibilityLabel={t('Close meal details')}
              className="h-11 w-11 items-center justify-center rounded-full bg-surface-2"
            >
              <Ionicons name="close" size={22} color={colors.pantry} />
            </PressableScale>
          </View>
          {detailItem ? (
            <RecipeTicket
              recipe={detailItem}
              macros={detailItem.macros}
              title={t('WEEKLY MENU')}
            />
          ) : null}
        </ScreenScroll></View>
      </Modal>
    </>
  )
}
