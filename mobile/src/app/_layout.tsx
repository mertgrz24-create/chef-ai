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

SplashScreen.preventAutoHideAsync()

export default function RootLayout() {
  // The "Mise en Place" type system: display / body / kitchen-ticket mono.
  const [fontsLoaded, fontError] = useFonts({
    BricolageGrotesque_600SemiBold,
    BricolageGrotesque_700Bold,
    InstrumentSans_400Regular,
    InstrumentSans_600SemiBold,
    SpaceMono_400Regular,
    SpaceMono_700Bold,
  })

  useEffect(() => {
    // Hide the splash on failure too — a missing font should degrade to a
    // system face, not trap the user on a splash screen forever.
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync()
    }
  }, [fontsLoaded, fontError])

  if (!fontsLoaded && !fontError) {
    return null
  }

  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }} />
    </>
  )
}
