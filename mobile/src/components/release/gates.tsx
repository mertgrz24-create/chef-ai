import { useRef, useState } from 'react'
import { Linking, Text, View } from 'react-native'
import {
  Button,
  Card,
  Notice,
  ScreenScroll,
  ScreenHeader,
} from '@/components/ui'
import { t, useLocale, getLocale } from '@/lib/release/locale'
import { useRelease } from '@/lib/release/state'

export function LegalLinks() {
  const { config } = useRelease()
  const [error, setError] = useState(false)
  useLocale()
  async function open(key: 'privacy' | 'terms' | 'support') {
    const url = config?.links[key]
    if (!url) {
      setError(true)
      return
    }
    try {
      await Linking.openURL(url)
    } catch {
      setError(true)
    }
  }
  return (
    <View className="mt-4 gap-2">
      {(['privacy', 'terms', 'support'] as const).map((key, index) => (
        <Button
          key={key}
          variant="ghost"
          label={t(['Privacy policy', 'Terms of use', 'Support'][index])}
          onPress={() => open(key)}
        />
      ))}
      {error ? (
        <Notice
          title={t('Service unavailable')}
          description={t(
            'Links must be configured and verified before release.',
          )}
        />
      ) : null}
    </View>
  )
}
export function AiGate() {
  const { config, aiAllowed, offline, acceptAi } = useRelease()
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(false)
  const lock = useRef(false)
  useLocale()
  if (aiAllowed) return null
  const ready =
    config?.capabilities.ai &&
    config.capabilities.consents &&
    config.capabilities.reports &&
    (getLocale() !== 'tr' || config.capabilities.localizedAi)
  return (
    <View className="my-4">
      <Card>
        <Text className="font-display text-display-sm text-pantry">
          {t('Before using AI')}
        </Text>
        <Text className="mt-3 font-sans text-body-sm text-secondary">
          {t(
            'Ingredient text and selected photos are sent through our server to the AI provider. Do not include people or personal details. You can use Pantry without AI.',
          )}
        </Text>
        {config ? (
          <Text className="mt-3 font-sans text-label text-secondary">
            {config.ai.provider} · {config.ai.retention[getLocale()]}
          </Text>
        ) : null}
        {ready && !offline ? (
          <View className="mt-4">
            <Button
              label={t('Allow AI data transfer')}
              loading={busy}
              onPress={async () => {
                if (lock.current) return
                lock.current = true
                setBusy(true)
                setError(false)
                try {
                  await acceptAi()
                } catch {
                  setError(true)
                } finally {
                  lock.current = false
                  setBusy(false)
                }
              }}
            />
          </View>
        ) : (
          <Text className="mt-3 font-sans text-label text-muted">
            {t(
              'AI integration is not available yet. Pantry remains available.',
            )}
          </Text>
        )}
        {error ? (
          <Notice
            title={t('Permission could not be saved. Please try again.')}
          />
        ) : null}
      </Card>
    </View>
  )
}
export function Onboarding() {
  const { updatePreferences, track } = useRelease()
  const [step, setStep] = useState(0),
    [adult, setAdult] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(false)
  useLocale()
  const titles = [
    'Start with your kitchen',
    'For adults, with clear choices',
    'Make it your own',
  ]
  const descriptions = [
    'Add ingredients, scan a photo, then cook and save a recipe.',
    'Chef-AI is intended for adults aged 18 and over. AI recipes and nutrition are estimates, not medical or food safety guarantees.',
    'Language and units can be changed in Profile. Notifications and usage analytics are optional and off until you choose them.',
  ]
  return (
    <ScreenScroll>
      <ScreenHeader
        eyebrow={`${step + 1} / 3`}
        title={t(titles[step])}
        description={t(descriptions[step])}
      />
      {step === 1 ? (
        <>
          <View className="mt-6">
            <Button
              label={t(
                adult
                  ? 'I confirm I am 18 or older'
                  : 'Confirm you are 18 or older',
              )}
              variant={adult ? 'primary' : 'ghost'}
              onPress={() => setAdult(!adult)}
            />
          </View>
          <LegalLinks />
        </>
      ) : null}
      <View className="mt-8 gap-3">
        <Button
          label={t(step === 2 ? 'Finish' : 'Continue')}
          disabled={step === 1 && !adult}
          loading={busy}
          onPress={async () => {
            if (step < 2) {
              setStep(step + 1)
              return
            }
            setBusy(true)
            try {
              await updatePreferences({ onboarded: true })
              await track('onboarding_completed')
            } catch {
              setError(true)
            } finally {
              setBusy(false)
            }
          }}
        />
        {step > 0 ? (
          <Button
            variant="ghost"
            label={t('Back')}
            onPress={() => setStep(step - 1)}
            disabled={busy}
          />
        ) : null}
      </View>
      {error ? (
        <Notice
          title={t('Preferences could not be saved. Please try again.')}
        />
      ) : null}
    </ScreenScroll>
  )
}
