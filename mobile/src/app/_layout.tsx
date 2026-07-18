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
import { SpaceMono_400Regular, SpaceMono_700Bold } from '@expo-google-fonts/space-mono'
import { useFonts } from 'expo-font'
import { AuthProvider, useAuth } from '@/lib/auth'

SplashScreen.preventAutoHideAsync()

function RootNavigator({ fontsReady }: { fontsReady: boolean }) {
  const { session, initializing } = useAuth()
  const ready = fontsReady && !initializing

  useEffect(() => {
    if (ready) SplashScreen.hideAsync()
  }, [ready])

  if (!ready) return null

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#1E3A2F' } }}>
      {/* Signed in → the app. Signed out → auth. Router swaps automatically
          when the session changes, so sign-in/out needs no manual navigation. */}
      <Stack.Protected guard={!!session}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>
      <Stack.Protected guard={!session}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
    </Stack>
  )
}

export default function RootLayout() {
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
      <StatusBar style="light" />
      <RootNavigator fontsReady={fontsLoaded || !!fontError} />
    </AuthProvider>
  )
}
