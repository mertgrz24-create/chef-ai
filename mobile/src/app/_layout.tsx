import { AiRecoveryProvider } from '@/components/release/ai-recovery'
import { KitchenDataProvider } from '@/lib/release/kitchen-data'
import { t, useLocale } from '@/lib/release/locale'
import '../global.css'

import { Stack } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { useEffect } from 'react'
import { StatusBar } from 'expo-status-bar'
import {
  BricolageGrotesque_600SemiBold,
  BricolageGrotesque_700Bold,
} from '@expo-google-fonts/bricolage-grotesque'
import {
  InstrumentSans_400Regular,
  InstrumentSans_600SemiBold,
} from '@expo-google-fonts/instrument-sans'
import {
  SpaceMono_400Regular,
  SpaceMono_700Bold,
} from '@expo-google-fonts/space-mono'
import { useFonts } from 'expo-font'
import { colors } from '@/theme/tokens'
import { AuthProvider, useAuth } from '@/lib/auth'
import { ReleaseProvider, useRelease } from '@/lib/release/state'
import { RuntimeGate, PushLifecycle } from '@/components/release/runtime'
import { Onboarding } from '@/components/release/gates'
import { Button, Notice, ScreenScroll, BusyState } from '@/components/ui'
import { initTelemetry } from '@/lib/release/telemetry'
export { ErrorBoundary } from './error'
initTelemetry()

SplashScreen.preventAutoHideAsync()

function RootNavigator({ fontsReady }: { fontsReady: boolean }) {
  const { session, initializing, initError, retryInit, recovery } = useAuth()
  const { preferences, preferencesReady, preferenceError } = useRelease()
  const ready = fontsReady && !initializing

  useEffect(() => {
    if (ready) SplashScreen.hideAsync()
  }, [ready])

  if (!ready) return null
  if (initError)
    return (
      <ScreenScroll>
        <Notice title={t('Your session could not load')} />
        <Button
          label={t('Try again')}
          onPress={() => {
            void retryInit()
          }}
        />
      </ScreenScroll>
    )
  if (session && !recovery && !preferencesReady)
    return (
      <ScreenScroll>
        <BusyState label={t('Loading preferences…')} />
      </ScreenScroll>
    )
  if (session && !recovery && (!preferences.onboarded || preferenceError))
    return <Onboarding />

  return (
    <>
      <PushLifecycle />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.canvas },
        }}
      >
        {/* Signed in → the app. Signed out → auth. Router swaps automatically
          when the session changes, so sign-in/out needs no manual navigation. */}
        <Stack.Protected
          guard={!!session && !recovery}
          redirectTo={recovery ? '/reset-password' : '/login'}
        >
          <Stack.Screen name="(app)" />
        </Stack.Protected>
        <Stack.Protected guard={!session || recovery} redirectTo="/">
          <Stack.Screen name="(auth)" />
        </Stack.Protected>
        <Stack.Screen name="auth/callback" />
      </Stack>
    </>
  )
}

export default function RootLayout() {
  useLocale()
  const [fontsLoaded, fontError] = useFonts({
    BricolageGrotesque_600SemiBold,
    BricolageGrotesque_700Bold,
    InstrumentSans_400Regular,
    InstrumentSans_600SemiBold,
    SpaceMono_400Regular,
    SpaceMono_700Bold,
  })

  return (
    <AuthProvider>
      <StatusBar style="dark" />
      <AccountRoot fontsReady={fontsLoaded || !!fontError} />
    </AuthProvider>
  )
}

function AccountRoot({ fontsReady }: { fontsReady: boolean }) {
  const { session } = useAuth()
  return (
    <ReleaseProvider key={session?.user.id ?? 'signed-out'}>
      <KitchenDataProvider><AiRecoveryProvider owner={session?.user.id ?? null}><RuntimeGate>
        <RootNavigator fontsReady={fontsReady} />
      </RuntimeGate></AiRecoveryProvider></KitchenDataProvider>
    </ReleaseProvider>
  )
}
