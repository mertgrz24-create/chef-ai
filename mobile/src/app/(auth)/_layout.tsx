import { useLocale } from '@/lib/release/locale'
import { Stack } from 'expo-router'
import { colors } from '@/theme/tokens'
import { useAuth } from '@/lib/auth'

export const unstable_settings = { initialRouteName: 'login' }

export default function AuthLayout() {
  useLocale()
  const { recovery } = useAuth()
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.canvas },
        animation: 'fade',
      }}
    >
      <Stack.Protected guard={!recovery} redirectTo="/reset-password">
        <Stack.Screen name="login" />
        <Stack.Screen name="signup" />
        <Stack.Screen name="forgot-password" />
      </Stack.Protected>
      <Stack.Screen name="reset-password" />
    </Stack>
  )
}
