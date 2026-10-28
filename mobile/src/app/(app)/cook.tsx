import { useRecoveredAi } from '@/components/release/ai-recovery'
import { recipeResponseSchema } from '@/lib/release/contracts'
import { QuotaStatus } from '@/components/release/quota-status'
import { aiErrorMessage } from '@/lib/release/ai-error'
import { t, useLocale } from '@/lib/release/locale'
import { useCallback, useRef, useState } from 'react'
import { Text, View } from 'react-native'
import { router, useFocusEffect } from 'expo-router'
import { ApiError, apiFetch } from '@/lib/api'
import { useRelease } from '@/lib/release/state'
import { AiGate } from '@/components/release/gates'
import { RecipeActions } from '@/components/release/recipe-actions'
import type { GenerateRecipeResponse, PantryItem } from '@/lib/types'
import {
  BusyState,
  Button,
  Chip,
  Field,
  LoadingRows,
  Notice,
  MotionView,
  RecipeTicket,
  ScreenHeader,
  ScreenScroll,
  SectionLabel,
  Ticket,
} from '@/components/ui'
export default function Cook() {
  useLocale()
  const { aiAllowed, offline, track, refreshMembership } = useRelease()
  const operation = useRef(false)
  const [pantry, setPantry] = useState<PantryItem[] | null>(null)
  const [pantryError, setPantryError] = useState(false)
  const [fetching, setFetching] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [extra, setExtra] = useState('')
  const [loading, setLoading] = useState(false)
  const [animateRecipe, setAnimateRecipe] = useState(false)
  const [result, setResult] = useState<GenerateRecipeResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  const [limitReached, setLimitReached] = useState(false)
  const load = useCallback(async () => {
    setFetching(true)
    try {
      const { items } = await apiFetch<{
        items: PantryItem[]
      }>('/api/pantry')
      setPantry(items)
      setPantryError(false)
      // Ingredients removed from the pantry must not remain silently selected.
      setSelected(
        (prev) =>
          new Set(
            [...prev].filter((name) => items.some((i) => i.name === name)),
          ),
      )
    } catch {
      setPantryError(true)
    } finally {
      setFetching(false)
    }
  }, [])
  useFocusEffect(
    useCallback(() => {
      void load()
    }, [load]),
  )
  const ingredients = [
    ...new Set([
      ...selected,
      ...extra
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    ]),
  ]
  const recovered=useRecoveredAi('recipes')
  useFocusEffect(useCallback(()=>{
    if(!recovered?.result)return
    const parsed=recipeResponseSchema.safeParse(recovered.result.response)
    if(parsed.success){setAnimateRecipe(true);setResult(parsed.data);setEditing(false);recovered.consume()}
  },[recovered]))
  function toggle(name: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })
  }
  async function fire() {
    if (!ingredients.length || operation.current || limitReached || !aiAllowed)
      return
    operation.current = true
    setLoading(true)
    setError(null)
    try {
      const data = await apiFetch<GenerateRecipeResponse>('/api/recipes', {
        method: 'POST',
        body: JSON.stringify({ ingredients }),
      })
      setAnimateRecipe(true)
      setResult(data)
      void track('recipe_generated')
      setEditing(false)
    } catch (e) {
      if (
        e instanceof ApiError &&
        e.status === 403 &&
        e.code === 'limit_reached'
      )
        setLimitReached(true)
      else
        setError(
          aiErrorMessage(
            e,
            e instanceof ApiError && e.status === 429
            ? 'Recipe generation is busy. Wait a moment and try again.'
              : 'Couldn’t generate a recipe. Your ingredients are still selected; please try again.',
          ),
        )
    } finally {
      void refreshMembership?.()
      setLoading(false)
      operation.current = false
    }
  }
  const showRecipe = !!result && !editing
  return (
    <ScreenScroll key={showRecipe ? 'recipe' : 'ingredients'}>
      <ScreenHeader
        title={showRecipe ? 'Your recipe' : 'Make a recipe'}
        description={
          showRecipe
            ? undefined
            : 'Choose what you want to use. We’ll take it from there.'
        }
      />
      <View className="mt-4">
        <Button
          variant="ghost"
          label={t('Saved recipes')}
          onPress={() => router.navigate('/saved-recipes')}
        />
      </View>
      <QuotaStatus kind="recipes" />
      <AiGate />
      {showRecipe && result ? (
        <>
          <View className="mb-5 mt-4">
            <Button
              label={t('Change ingredients')}
              variant="ghost"
              onPress={() => setEditing(true)}
            />
          </View>
          <MotionView animate={animateRecipe} transitionKey={result.resultId??result.recipe} onEntered={()=>setAnimateRecipe(false)}>
          {result.structured ? (
            <RecipeTicket recipe={result.structured} macros={result.macros} />
          ) : (
            <Ticket title={t('YOUR RECIPE')}>
              <Text className="font-sans text-body text-secondary">
                {result.recipe}
              </Text>
            </Ticket>
          )}
          </MotionView>
          <RecipeActions result={result} />
        </>
      ) : (
        <>
          {result ? (
            <View className="mt-4">
              <Button
                label={t('Back to recipe')}
                variant="ghost"
                onPress={() => setEditing(false)}
                disabled={loading}
              />
            </View>
          ) : null}
          <View className="mb-3 mt-6 flex-row items-baseline justify-between">
            <SectionLabel className="">{t('Your ingredients')}</SectionLabel>
            <Text
              accessibilityLiveRegion="polite"
              className="font-sans text-label text-muted"
            >
              {ingredients.length}
              {t('selected')}
            </Text>
          </View>
          {pantry === null && fetching ? <LoadingRows /> : null}
          {pantryError ? (
            <Notice
              title={t('Your pantry couldn\u2019t load')}
              description={t('You can still enter ingredients below.')}
              action={
                fetching ? undefined : { label: 'Reload pantry', onPress: load }
              }
            />
          ) : null}
          {pantry?.length ? (
            <View className="flex-row flex-wrap gap-2">
              {[...new Set(pantry.map((item) => item.name))].map((name) => (
                <Chip
                  key={name}
                  label={name}
                  active={selected.has(name)}
                  onPress={() => toggle(name)}
                  disabled={loading}
                />
              ))}
            </View>
          ) : pantry ? (
            <View className="rounded-2xl bg-panel p-4">
              <Text className="mb-4 font-sans text-body-sm text-secondary">
                {t(
                  'Your pantry is empty. Enter ingredients below or scan your fridge.',
                )}
              </Text>
              <Button
                label={t('Scan your fridge')}
                variant="ghost"
                onPress={() => router.navigate('/scan')}
              />
            </View>
          ) : null}
          <View className="mt-6">
            <Field
              label={t('Anything else?')}
              hint={t('Separate ingredients with commas.')}
              value={extra}
              onChangeText={setExtra}
              placeholder={t('e.g. eggs, tomato, feta')}
              editable={!loading}
              multiline
            />
          </View>
          <View className="mt-6 rounded-2xl bg-panel p-4">
            <Text className="mb-4 font-sans text-body-sm text-secondary">
              {ingredients.length
                ? t(
                    '%{count} ingredients ready. Your recipe will include instructions and estimated nutrition.',
                    { count: ingredients.length },
                  )
                : 'Choose or enter at least one ingredient to get started.'}
            </Text>
            <Button
              label={result ? 'Generate another recipe' : 'Generate recipe'}
              loadingLabel={t('Creating your recipe\u2026')}
              onPress={fire}
              loading={loading}
              disabled={
                !ingredients.length || limitReached || !aiAllowed || offline
              }
            />
          </View>
          {loading ? (
            <BusyState
              label={t('Finding your next dinner')}
              description={t(
                'Keep this screen open while your recipe is prepared.',
              )}
            />
          ) : null}
          {error ? (
            <Notice
              title={t('Your recipe isn\u2019t ready')}
              description={error}
              action={{ label: 'Try again', onPress: fire }}
            />
          ) : null}
          {limitReached ? (
            <Notice
              tone="info"
              title={t('Free recipe limit reached')}
              description={t(
                'You\u2019ve used the recipes included in your free plan. You can still manage your pantry and revisit your existing recipe.',
              )}
            />
          ) : null}
        </>
      )}
    </ScreenScroll>
  )
}
