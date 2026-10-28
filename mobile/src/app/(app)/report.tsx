import { useRef, useState } from 'react'
import { Text, View } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import {
  Button,
  Chip,
  Field,
  Notice,
  ScreenHeader,
  ScreenScroll,
} from '@/components/ui'
import { useRelease } from '@/lib/release/state'
import { apiFetch } from '@/lib/api'
import { ackSchema } from '@/lib/release/contracts'
import { t, useLocale } from '@/lib/release/locale'
const categories = [
  'Unsafe advice',
  'Offensive content',
  'Incorrect result',
  'Other',
] as const
export default function Report() {
  useLocale()
  const params = useLocalSearchParams<{ source?: string; resultId?: string }>()
  const { config, offline } = useRelease()
  const [category, setCategory] = useState<string>(categories[0]),
    [details, setDetails] = useState(''),
    [busy, setBusy] = useState(false),
    [sent, setSent] = useState(false),
    [error, setError] = useState(false)
  const lock = useRef(false)
  async function send() {
    if (lock.current || sent || !config?.capabilities.reports || offline) return
    lock.current = true
    setBusy(true)
    setError(false)
    try {
      await apiFetch(
        '/api/content-reports',
        {
          method: 'POST',
          body: JSON.stringify({
            source: ['recipe', 'meal-plan', 'scan'].includes(
              params.source ?? '',
            )
              ? params.source
              : 'recipe',
            resultId:
              typeof params.resultId === 'string' ? params.resultId : null,
            category: categories.indexOf(
              category as (typeof categories)[number],
            ),
            details: details.trim() || undefined,
          }),
        },
        ackSchema,
      )
      setSent(true)
    } catch {
      setError(true)
    } finally {
      lock.current = false
      setBusy(false)
    }
  }
  return (
    <ScreenScroll>
      <ScreenHeader title={t('Report a problem')} />
      <View className="my-5 flex-row flex-wrap gap-2">
        {categories.map((c) => (
          <Chip
            key={c}
            label={t(c)}
            active={c === category}
            onPress={() => setCategory(c)}
            disabled={busy || sent}
          />
        ))}
      </View>
      <Text className="mb-4 font-sans text-body-sm text-secondary">
        {t(
          'Only the result reference, category and details you enter are sent. Do not include personal or sensitive information.',
        )}
      </Text>
      <Field
        label={t('Optional details')}
        value={details}
        onChangeText={setDetails}
        maxLength={1000}
        multiline
        editable={!busy && !sent}
      />
      <Button
        label={t('Send report')}
        onPress={send}
        loading={busy}
        disabled={!config?.capabilities.reports || offline || sent}
      />
      {sent ? (
        <Notice tone="success" title={t('Report received. Thank you.')} />
      ) : null}
      {error ? (
        <Notice title={t('Report could not be sent. Please try again.')} />
      ) : null}
      {!config?.capabilities.reports ? (
        <Notice
          tone="info"
          title={t(
            'Reporting is not available yet. AI generation remains disabled.',
          )}
        />
      ) : null}
      <Button label={t('Back')} variant="ghost" onPress={() => router.back()} />
    </ScreenScroll>
  )
}
