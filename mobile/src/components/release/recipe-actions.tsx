import { useKitchenInvalidation } from '@/lib/release/kitchen-data'
import { useRef, useState } from 'react'
import { View, Text } from 'react-native'
import { router } from 'expo-router'
import { Button, Notice, MotionView } from '@/components/ui'
import { t, useLocale } from '@/lib/release/locale'
import { useRelease } from '@/lib/release/state'
import { saveRecipe } from '@/lib/release/recipes'
import { DUR } from '@/theme/motion'
import { requestId } from '@/lib/release/request'
import type { GenerateRecipeResponse } from '@/lib/types'
export function RecipeActions({ result }: { result: GenerateRecipeResponse }) {
  useLocale()
  const invalidate=useKitchenInvalidation()
  const { config, offline, track } = useRelease()
  const [saved, setSaved] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(false)
  const lock = useRef(false),
    key = useRef<string | null>(null)
  const canSave =
    config?.capabilities.privateRecipes &&
    config.capabilities.idempotency &&
    !!result.structured
  async function save() {
    if (lock.current || saved || !canSave || offline) return
    lock.current = true
    setBusy(true)
    setError(false)
    key.current ??= requestId()
    try {
      await saveRecipe(result, key.current)
      invalidate?.('recipes')
      setSaved(true)
      await track('recipe_saved')
    } catch {
      setError(true)
    } finally {
      lock.current = false
      setBusy(false)
    }
  }
  return (
    <View className="mt-4 gap-3">
      <MotionView transitionKey={saved?1:0} distance={0} duration={DUR.chip}><Text
        accessibilityLiveRegion="polite"
        className="font-sans text-label text-muted"
      >
        {saved?'✓ ':''}{t(saved ? 'Saved' : 'Not saved yet')}
      </Text></MotionView>
      {canSave ? (
        <Button
          label={t(saved ? 'Saved' : 'Save recipe')}
          loadingLabel={t('Saving…')}
          onPress={save}
          loading={busy}
          disabled={saved || offline}
        />
      ) : (
        <Text className="font-sans text-label text-muted">
          {t('Private saving is not available yet.')}
        </Text>
      )}
      {error ? (
        <Notice
          title={t(
            'Saving could not be confirmed. Check saved recipes before retrying.',
          )}
        />
      ) : null}
      <Button
        label={t('Saved recipes')}
        variant="ghost"
        onPress={() => router.navigate('/saved-recipes')}
      />
      <Button
        label={t('Report a problem')}
        variant="ghost"
        onPress={() =>
          router.navigate({
            pathname: '/report',
            params: { source: 'recipe', resultId: result.resultId ?? '' },
          })
        }
      />
    </View>
  )
}
