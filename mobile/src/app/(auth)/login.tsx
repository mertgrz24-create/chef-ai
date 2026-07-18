import { useState } from 'react'
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Link } from 'expo-router'
import { Button, ErrorText, Field, Screen } from '@/components/ui'
import { useAuth } from '@/lib/auth'

export default function Login() {
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit() {
    setError(null)
    setLoading(true)
    try {
      await signIn(email.trim(), password)
      // The root layout's guard swaps to (app) once the session lands.
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not sign in.')
      setLoading(false)
    }
  }

  return (
    <Screen>
      <SafeAreaView className="flex-1">
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView contentContainerClassName="flex-grow justify-center px-6">
            <Text className="font-mono text-[11px] tracking-[2px] text-zest">CHEF-AI</Text>
            <Text className="mt-3 font-display text-[32px] leading-[36px] text-chalk">
              Welcome back.
            </Text>
            <Text className="mb-8 mt-3 font-sans text-[15px] text-[#c3c8ba]">
              Sign in to see what&apos;s for dinner.
            </Text>

            <View className="gap-4">
              <Field
                label="Email"
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
              />
              <Field
                label="Password"
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                secureTextEntry
                autoComplete="current-password"
              />
              <ErrorText>{error}</ErrorText>
              <View className="mt-2">
                <Button label={loading ? 'SIGNING IN…' : 'SIGN IN'} onPress={handleSubmit} loading={loading} />
              </View>
            </View>

            <View className="mt-8 flex-row justify-center gap-1">
              <Text className="font-sans text-[14px] text-[#8fa093]">New here?</Text>
              <Link href="/signup" className="font-sans text-[14px] text-zest">
                Create an account →
              </Link>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Screen>
  )
}
