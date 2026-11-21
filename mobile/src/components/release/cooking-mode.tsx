import { useCallback, useEffect, useState, useSyncExternalStore } from 'react'
import { AppState, Text, TextInput, View } from 'react-native'
import { useFocusEffect } from 'expo-router'
import { useKeepAwake } from 'expo-keep-awake'
import { Button } from '@/components/ui/button'
import { PressableScale } from '@/components/ui/pressable-scale'
import { t, useLocale } from '@/lib/release/locale'
import type { StructuredRecipe } from '@/lib/types'
import { kitchenTimer } from '@/lib/release/kitchen-timer-native'

function KeepScreenAwake() {
  useKeepAwake(undefined, { suppressDeactivateWarnings: true })
  return null
}
export function CookingMode({ recipe, onClose }: { recipe: StructuredRecipe; onClose: () => void }) {
  useLocale()
  const [step, setStep] = useState(0)
  const [checked, setChecked] = useState<Set<number>>(new Set())
  const [focused, setFocused] = useState(false)
  const [minutes, setMinutes] = useState('5'), [now, setNow] = useState(() => Date.now())
  const timer = useSyncExternalStore(kitchenTimer.subscribe, kitchenTimer.snapshot, kitchenTimer.snapshot)
  const deadline = timer.deadline
  useFocusEffect(useCallback(() => { setFocused(true); return () => setFocused(false) }, []))
  useEffect(() => { if (kitchenTimer.snapshot().status === 'loading') void kitchenTimer.load() }, [])
  useEffect(() => {
    if (deadline === null) return
    const tick = () => { const current = Date.now(); setNow(current); if (current >= deadline) clearInterval(interval) }
    const interval = setInterval(tick, 1000)
    tick()
    const listener = AppState.addEventListener('change', state => { if (state === 'active') tick() })
    return () => { clearInterval(interval); listener.remove() }
  }, [deadline])
  const lines = recipe.instructions.trim().split(/\n\s*\n|\n(?=\s*\d+[.)]\s)/).filter(Boolean)
  const steps = lines.length && lines.every(line => /^\s*\d+[.)]\s/.test(line))
    ? lines.map(line => line.replace(/^\s*\d+[.)]\s*/, ''))
    : [recipe.instructions]
  const remaining = deadline === null ? null : Math.max(0, Math.ceil((deadline - now) / 1000))
  const validMinutes = /^\d{1,3}$/.test(minutes) && Number(minutes) >= 1 && Number(minutes) <= 180
  return <View className="rounded-3xl bg-panel p-5">
    {focused ? <KeepScreenAwake /> : null}
    <Text accessibilityRole="header" className="font-display text-display-md text-pantry">{recipe.name}</Text>
    <Text className="mb-3 mt-5 font-sans-bold text-label text-muted">{t('Step %{current} of %{total}', { current: step + 1, total: steps.length })}</Text>
    <Text accessibilityLiveRegion="polite" className="mb-5 font-sans text-body text-content">{steps[step]}</Text>
    <Text accessibilityRole="header" className="mb-2 font-sans-bold text-body text-pantry">{t('Ingredients')}</Text>
    {recipe.ingredients.map((ingredient, index) => <PressableScale key={`${ingredient}-${index}`} accessibilityRole="checkbox" accessibilityLabel={t('Ingredient: %{name}', { name: ingredient })} accessibilityState={{ checked: checked.has(index) }} onPress={() => setChecked(previous => { const next = new Set(previous); if (next.has(index)) next.delete(index); else next.add(index); return next })} className="border-b border-line py-3">
      <Text className="font-sans text-body-sm text-secondary">{checked.has(index) ? '✓ ' : '○ '}{ingredient}</Text>
    </PressableScale>)}
    <View className="my-5 gap-3 rounded-2xl bg-canvas p-4">
      <Text accessibilityRole="header" className="font-sans-bold text-body text-pantry">{t('Cooking timer')}</Text>
      <Text className="font-sans text-label text-muted">{t(timer.mode === 'visual' ? 'Visual timer only: notifications are unavailable. No sound will play.' : 'Notifications depend on device settings and may be delayed. The timer continues after closing this screen.')}</Text>
      {timer.status === 'error' ? <><Text accessibilityRole="alert" className="font-sans text-body-sm text-error-ink">{t('The timer could not be confirmed. Check it before relying on an alert.')}</Text><Button label={t('Clear timer')} variant="ghost" onPress={() => void kitchenTimer.stop()} /></> : null}
      {timer.status === 'loading' || timer.status === 'busy' ? <Text className="font-sans text-body-sm text-muted">{t('Updating timer…')}</Text> : null}
      {timer.status === 'idle' ? <>
        <Text className="font-sans-bold text-label text-secondary">{t('Minutes')}</Text>
        <TextInput accessibilityLabel={t('Minutes')} value={minutes} onChangeText={setMinutes} keyboardType="number-pad" maxLength={3} className="min-h-13 rounded-xl border border-line bg-panel px-4 font-sans text-body text-content" />
        <Button label={t('Start timer')} onPress={() => { if (validMinutes) void kitchenTimer.start(Number(minutes)) }} disabled={!validMinutes} />
      </> : null}
      {timer.status === 'running' && remaining !== null ? <>
        {remaining > 0 ? <Text accessibilityLiveRegion="none" className="font-display text-display-md text-pantry">{String(Math.floor(remaining / 60)).padStart(2, '0')}:{String(remaining % 60).padStart(2, '0')}</Text> : <Text accessibilityLiveRegion="polite" className="font-sans-bold text-body text-pantry">{t('Time is up.')}</Text>}
        <Button label={t(remaining > 0 ? 'Stop timer' : 'Reset timer')} variant="ghost" onPress={() => void kitchenTimer.stop()} />
      </> : null}
    </View>
    <View className="gap-3">
      <Button label={t('Previous step')} variant="ghost" onPress={() => setStep(value => Math.max(0, value - 1))} disabled={step === 0} />
      <Button label={t('Next step')} onPress={() => setStep(value => Math.min(steps.length - 1, value + 1))} disabled={step === steps.length - 1} />
      <Button label={t('Close cooking mode')} variant="ghost" onPress={onClose} />
    </View>
  </View>
}
