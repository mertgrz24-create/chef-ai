import { useState } from 'react'
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Link } from 'expo-router'
import { Button, ErrorText, Field, Screen } from '@/components/ui'
import { useAuth } from '@/lib/auth'

export default function Signup() {
  const { signUp } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit() {
    setError(null)
    setNotice(null)
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    setLoading(true)
    try {
      const { needsConfirmation } = await signUp(email.trim(), password)
      if (needsConfirmation) {
        setNotice('Check your email to confirm your account, then sign in.')
        setLoading(false)
      }
      // If confirmation is off, a session lands and the guard routes to (app).
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not sign up.')
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
              Cook what you{'\n'}already have.
            </Text>
            <Text className="mb-8 mt-3 font-sans text-[15px] text-[#c3c8ba]">
              Create a free account to get started.
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
                placeholder="At least 6 characters"
                secureTextEntry
                autoComplete="new-password"
              />
              <ErrorText>{error}</ErrorText>
              {notice ? (
                <Text className="font-sans text-[13px] text-zest">{notice}</Text>
              ) : null}
              <View className="mt-2">
                <Button
                  label={loading ? 'CREATING…' : 'CREATE ACCOUNT'}
                  onPress={handleSubmit}
                  loading={loading}
                />
              </View>
            </View>

            <View className="mt-8 flex-row justify-center gap-1">
              <Text className="font-sans text-[14px] text-[#8fa093]">Already have one?</Text>
              <Link href="/login" className="font-sans text-[14px] text-zest">
                Sign in →
              </Link>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Screen>
  )
}
