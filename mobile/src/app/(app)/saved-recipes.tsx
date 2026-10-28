import { useCallback, useState } from 'react'
import { Text, View } from 'react-native'
import { router, useFocusEffect } from 'expo-router'
import {
  Button,
  EmptyState,
  LoadingRows,
  Notice,
  RecipeTicket,
  ScreenHeader,
  ScreenScroll,
} from '@/components/ui'
import { recipeHistory } from '@/lib/release/recipes'
import { type SavedRecipe, macrosSchema } from '@/lib/release/contracts'
import { useRelease } from '@/lib/release/state'
import { t, useLocale } from '@/lib/release/locale'
export default function SavedRecipes() {
  useLocale()
  const { config, offline } = useRelease()
  const [rows, setRows] = useState<SavedRecipe[]>([]),
    [selected, setSelected] = useState<SavedRecipe | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(false)
  const load = useCallback(async () => {
    if (!config?.capabilities.privateRecipes || offline) return
    setBusy(true)
    setError(false)
    try {
      const { recipes } = await recipeHistory()
      setRows(recipes)
    } catch {
      setError(true)
    } finally {
      setBusy(false)
    }
  }, [config, offline])
  useFocusEffect(
    useCallback(() => {
      void load()
    }, [load]),
  )
  return (
    <ScreenScroll>
      <ScreenHeader
        title={t('Saved recipes')}
        description={t('Your latest 20 saved recipes.')}
      />
      <Button
        variant="ghost"
        label={t('Back')}
        onPress={() =>
          selected ? setSelected(null) : router.navigate('/cook')
        }
      />
      {!config?.capabilities.privateRecipes ? (
        <Notice tone="info" title={t('Private saving is not available yet.')} />
      ) : selected ? (
        <RecipeTicket
          recipe={selected}
          macros={
            macrosSchema.safeParse(selected.macros).success
              ? macrosSchema.parse(selected.macros)
              : null
          }
        />
      ) : (
        <>
          {busy ? <LoadingRows /> : null}
          {error ? (
            <Notice
              title={t('Saved recipes could not load')}
              action={{ label: t('Try again'), onPress: load }}
            />
          ) : !busy && !rows.length ? (
            <EmptyState
              icon="bookmark-outline"
              title={t('No saved recipes')}
              description={t('Save a recipe from Cook to find it here.')}
            />
          ) : null}
          {rows.map((recipe) => (
            <View key={recipe.id} className="mt-3 rounded-2xl bg-panel p-4">
              <Text className="mb-3 font-display text-display-sm text-pantry">
                {recipe.name}
              </Text>
              <Button
                variant="ghost"
                label={t('View recipe')}
                onPress={() => setSelected(recipe)}
              />
            </View>
          ))}
        </>
      )}
    </ScreenScroll>
  )
}
