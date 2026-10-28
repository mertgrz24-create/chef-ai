import { QuotaStatus } from '@/components/release/quota-status'
import { useRef, useState } from 'react'
import { Alert, Linking, Text, View } from 'react-native'
import Constants from 'expo-constants'
import { router } from 'expo-router'
import {
  Button,
  Card,
  Chip,
  Notice,
  ScreenHeader,
  ScreenScroll,
  SectionLabel,
} from '@/components/ui'
import { LegalLinks } from '@/components/release/gates'
import { apiFetch } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { useRelease } from '@/lib/release/state'
import {
  t,
  useLocale,
  getLocale,
  getUnits,
  setLocale,
  setUnits,
} from '@/lib/release/locale'
import { detachPush, enablePush } from '@/lib/notifications'
export default function Profile() {
  useLocale()
  const { session, signOut, clearDeletedAccount } = useAuth()
  const {
    config,
    membership,
    preferences,
    updatePreferences,
    revokeAi,
    offline,
  } = useRelease()
  const [busy, setBusy] = useState<string | null>(null),
    [message, setMessage] = useState<string | null>(null),
    [error, setError] = useState(false)
  const lock = useRef(false)
  async function run(name: string, action: () => Promise<unknown>) {
    if (lock.current) return
    lock.current = true
    setBusy(name)
    setMessage(null)
    setError(false)
    try {
      await action()
    } catch {
      setError(true)
      setMessage('The change could not be confirmed. Please try again.')
    } finally {
      setBusy(null)
      lock.current = false
    }
  }
  async function removeAccount() {
    await apiFetch('/api/account', { method: 'DELETE' })
    await clearDeletedAccount()
  }
  function confirmDelete() {
    Alert.alert(
      t('Delete account?'),
      t(
        'This permanently deletes your account and associated data. It does not cancel a store subscription. Manage your subscription before deleting your account.',
      ),
      [
        { text: t('Cancel'), style: 'cancel' },
        {
          text: t('Delete everything'),
          style: 'destructive',
          onPress: () => {
            void run('delete', removeAccount)
          },
        },
      ],
    )
  }
  return (
    <ScreenScroll>
      <ScreenHeader
        eyebrow={t('SETTINGS')}
        title={t('Profile')}
        description={t('Your account details and app information.')}
      />
      <SectionLabel>{t('Account details')}</SectionLabel>
      <Card>
        <Text className="font-sans text-label text-muted">{t('Email')}</Text>
        <Text selectable className="mt-1 font-sans text-body text-content">
          {session?.user.email ?? '—'}
        </Text>
        <Text className="mt-4 font-sans text-label text-muted">
          {t('Member since')}
        </Text>
        <Text className="mt-1 font-sans text-body text-content">
          {session?.user.created_at
            ? new Date(session.user.created_at).toLocaleDateString(
                getLocale(),
                { month: 'long', year: 'numeric' },
              )
            : '—'}
        </Text>
      </Card>
      <SectionLabel>{t('Preferences')}</SectionLabel>
      <Card>
        <Text className="mb-3 font-sans-bold text-label text-pantry">
          {t('Language')}
        </Text>
        <View className="mb-5 flex-row gap-2">
          {(['tr', 'en'] as const).map((l) => (
            <Chip
              key={l}
              label={l === 'tr' ? 'Türkçe' : 'English'}
              active={getLocale() === l}
              disabled={!!busy}
              onPress={() => {
                void run('language', () => setLocale(l))
              }}
            />
          ))}
        </View>
        <Text className="mb-3 font-sans-bold text-label text-pantry">
          {t('Units')}
        </Text>
        <View className="flex-row gap-2">
          {(['metric', 'imperial'] as const).map((u) => (
            <Chip
              key={u}
              label={t(u === 'metric' ? 'Metric' : 'Imperial')}
              active={getUnits() === u}
              disabled={!!busy}
              onPress={() => {
                void run('units', () => setUnits(u))
              }}
            />
          ))}
        </View>
      </Card>
      <QuotaStatus />
      <SectionLabel>{t('Premium')}</SectionLabel>
      <Card>
        <Text className="mb-3 font-sans text-body text-pantry">
          {membership
            ? `${t(membership.plan)} · ${t(membership.status)}`
            : t('Membership could not be verified.')}
        </Text>
        <Button
          label={t('Upgrade to Premium')}
          onPress={() => router.navigate('/premium')}
        />
        <View className="mt-2">
          <Button
            variant="ghost"
            label={t('Restore purchases')}
            onPress={() => router.navigate('/premium')}
          />
        </View>
      </Card>
      <SectionLabel>{t('Notifications')}</SectionLabel>
      <Text className="mb-3 font-sans text-body-sm text-secondary">
        {t(
          'Get reminders before your ingredients expire. Optional; you can change permissions in device Settings.',
        )}
      </Text>
      <View className="gap-2">
        <Button
          label={t('Enable reminders')}
          disabled={!!busy || offline || !config?.capabilities.push}
          onPress={() => {
            void run('push', async () => {
              await enablePush()
              setMessage('Reminders enabled.')
            })
          }}
          loading={busy === 'push'}
        />
        <Button
          label={t('Disable reminders')}
          variant="ghost"
          disabled={!!busy || offline}
          onPress={() => {
            void run('push', async () => {
              await detachPush()
              setMessage('Reminders disabled.')
            })
          }}
        />
        <Button
          label={t('Open settings')}
          variant="ghost"
          onPress={() => {
            void Linking.openSettings().catch(() => {
              setError(true)
              setMessage('Device Settings could not open.')
            })
          }}
        />
      </View>
      <SectionLabel>{t('Privacy and data')}</SectionLabel>
      <Text className="mb-3 font-sans text-body-sm text-secondary">
        {t(
          'Crash diagnostics use Sentry with personal content removed. Optional usage analytics contain only limited event categories. No ad tracking or session replay is used.',
        )}
      </Text>
      <Button
        label={`${t('Usage analytics')}: ${t(preferences.analytics ? 'On' : 'Off')}`}
        variant="ghost"
        disabled={!!busy}
        onPress={() => {
          void run('analytics', () =>
            updatePreferences({ analytics: !preferences.analytics }),
          )
        }}
      />
      <View className="mt-2">
        <Button
          label={t('Withdraw AI permission')}
          variant="ghost"
          disabled={!!busy || !preferences.aiConsent}
          onPress={() => {
            void run('consent', revokeAi)
          }}
        />
      </View>
      <LegalLinks />
      <View className="my-6 rounded-2xl bg-pantry p-5">
        <Text className="font-display text-display-md text-chalk">
          Chef<Text className="text-zest">AI</Text>
        </Text>
        <Text className="mt-2 font-sans text-body-sm text-chalk-2">
          {t('Cook what you already have.')}
        </Text>
        <Text className="mt-4 font-mono text-meta text-chalk-muted">
          {Constants.expoConfig?.version ?? '1.0.0'} ·{' '}
          {process.env.EXPO_PUBLIC_APP_ENV ?? 'development'}
        </Text>
      </View>
      <Button
        label={t('Sign out')}
        disabled={!!busy}
        loading={busy === 'signout'}
        onPress={() => {
          void run('signout', signOut)
        }}
      />
      {message ? (
        <Notice tone={error ? 'error' : 'success'} title={t(message)} />
      ) : null}
      <SectionLabel>{t('Delete your account')}</SectionLabel>
      <Text className="mb-4 font-sans text-body-sm text-secondary">
        {t('Permanently remove your account and all of your Chef-AI data.')}
      </Text>
      <Button
        label={t('Manage subscription')}
        variant="ghost"
        onPress={() => router.navigate('/premium')}
      />
      <View className="mt-3">
        <Button
          label={t('Delete account')}
          variant="danger"
          disabled={!!busy || offline}
          loading={busy === 'delete'}
          onPress={confirmDelete}
        />
      </View>
    </ScreenScroll>
  )
}
