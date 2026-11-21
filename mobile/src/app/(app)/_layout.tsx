import { t, useLocale } from '@/lib/release/locale'
import { Tabs } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { colors } from '@/theme/tokens'

// The app's surfaces. Reaching this layout means the user is authenticated
// (the root guard gates it), so it's the right place to register for push.
export default function AppLayout() {
  useLocale()
  const insets = useSafeAreaInsets()

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.canvas },
        tabBarActiveTintColor: colors.pantry,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.panel,
          borderTopColor: colors.line,
          height: 64 + insets.bottom,
          paddingTop: 6,
          paddingBottom: Math.max(insets.bottom, 6),
        },
        tabBarHideOnKeyboard: true,
        tabBarLabelPosition: 'below-icon',
        tabBarLabelStyle: {
          fontFamily: 'InstrumentSans_600SemiBold',
          fontSize: 12,
          lineHeight: 16,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('Today'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="today-outline" size={size} style={{ color }} />
          ),
        }}
      />
      <Tabs.Screen
        name="pantry"
        options={{
          title: t('Pantry'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="file-tray-full-outline" size={size} style={{ color }} />
          ),
        }}
      />
      <Tabs.Screen
        name="scan"
        options={{
          title: t('Scan'),
          tabBarAccessibilityLabel: t('Scan ingredients with your camera'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="scan" size={size} style={{ color }} />
          ),
        }}
      />
      <Tabs.Screen
        name="cook"
        options={{
          title: t('Cook'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="flame-outline" size={size} style={{ color }} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('Profile'),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} style={{ color }} />
          ),
        }}
      />
      {/* Reached from the Today screen, not the tab bar. */}
      <Tabs.Screen name="meal-plan" options={{ href: null }} />
      <Tabs.Screen name="shopping-list" options={{ href: null }} />
      <Tabs.Screen name="saved-recipes" options={{ href: null }} />
      <Tabs.Screen name="premium" options={{ href: null }} />
      <Tabs.Screen name="report" options={{ href: null }} />
    </Tabs>
  )
}
