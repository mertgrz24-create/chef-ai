import { useEffect } from 'react'
import { AppState, View, Text } from 'react-native'
import { router } from 'expo-router'
import * as Notifications from 'expo-notifications'
import { useRelease } from '@/lib/release/state'
import { compareVersions } from '@/lib/release/contracts'
import { t, useLocale } from '@/lib/release/locale'
import { Button, Notice, ScreenHeader, ScreenScroll } from '@/components/ui'
import Constants from 'expo-constants'
import { notificationPath, refreshPush } from '@/lib/notifications'
export function RuntimeGate({ children }: { children: React.ReactNode }) {
  useLocale()
  const { config, configError, configLoading, reload, offline } = useRelease()
  const needsUpdate =
    config &&
    compareVersions(
      Constants.expoConfig?.version ?? '0.0.0',
      config.minimumVersion,
    ) < 0
  if (config?.maintenance || needsUpdate)
    return (
      <ScreenScroll>
        <ScreenHeader
          title={t(needsUpdate ? 'Update required' : 'Maintenance')}
          description={t(
            needsUpdate
              ? 'Install the latest store version to continue.'
              : 'Please try again later.',
          )}
        />
        <Button
          label={t('Try again')}
          onPress={() => {
            void reload()
          }}
          loading={configLoading}
        />
      </ScreenScroll>
    )
  return (
    <View className="flex-1 bg-canvas">
      {offline ? (
        <View
          accessibilityLiveRegion="polite"
          className="bg-surface-2 px-5 pb-2 pt-12"
        >
          <Text className="font-sans-bold text-label text-pantry">
            {t('Offline')}
          </Text>
          <Text className="font-sans text-label text-secondary">
            {t(
              'You can keep viewing loaded content. Reconnect before making changes.',
            )}
          </Text>
        </View>
      ) : null}
      {configError ? (
        <View className="px-5 pt-8">
          <Notice
            tone="info"
            title={t('Service unavailable')}
            description={t(
              'Server capabilities could not be verified. New integrations remain unavailable.',
            )}
            action={
              configLoading
                ? undefined
                : {
                    label: t('Try again'),
                    onPress: () => {
                      void reload()
                    },
                  }
            }
          />
        </View>
      ) : null}
      {children}
    </View>
  )
}
export function PushLifecycle() {
  const { config } = useRelease()
  useEffect(() => {
    if (!config?.capabilities.push) return
    const open = (data: Record<string, unknown>) => {
      const path = notificationPath(data)
      if (path) router.navigate(path)
    }
    void Notifications.getLastNotificationResponseAsync()
      .then((r) => {
        if (r) open(r.notification.request.content.data ?? {})
      })
      .catch(() => {})
    const response = Notifications.addNotificationResponseReceivedListener(
      (r) => open(r.notification.request.content.data ?? {}),
    )
    const token = Notifications.addPushTokenListener(() => {
      void refreshPush().catch(() => {})
    })
    const app = AppState.addEventListener('change', (state) => {
      if (state === 'active') void refreshPush().catch(() => {})
    })
    return () => {
      response.remove()
      token.remove()
      app.remove()
    }
  }, [config])
  return null
}
