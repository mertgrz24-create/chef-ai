import { useEffect } from 'react'
import { Tabs } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { registerPushToken } from '@/lib/notifications'

// The app's surfaces. Reaching this layout means the user is authenticated
// (the root guard gates it), so it's the right place to register for push.
export default function AppLayout() {
  useEffect(() => {
    registerPushToken()
  }, [])

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: '#1E3A2F' },
        tabBarActiveTintColor: '#CDF23E',
        tabBarInactiveTintColor: '#8fa093',
        tabBarStyle: {
          backgroundColor: '#14150E',
          borderTopColor: '#2E3125',
        },
        tabBarLabelStyle: {
          fontFamily: 'SpaceMono_400Regular',
          fontSize: 10,
          letterSpacing: 0.5,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Today',
          tabBarIcon: ({ color, size }) => <Ionicons name="today-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="pantry"
        options={{
          title: 'Pantry',
          tabBarIcon: ({ color, size }) => <Ionicons name="file-tray-full-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="scan"
        options={{
          title: 'Scan',
          tabBarIcon: ({ color, size }) => <Ionicons name="scan" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="cook"
        options={{
          title: 'Cook',
          tabBarIcon: ({ color, size }) => <Ionicons name="flame-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} />,
        }}
      />
      {/* Reached from the Today screen, not the tab bar. */}
      <Tabs.Screen name="meal-plan" options={{ href: null }} />
    </Tabs>
  )
}
