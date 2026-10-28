import { useRef, useState } from 'react'
import { router } from 'expo-router'
import {
  Button,
  Field,
  Notice,
  ScreenHeader,
  ScreenScroll,
} from '@/components/ui'
import { useAuth } from '@/lib/auth'
import { t, useLocale } from '@/lib/release/locale'
export default function ForgotPassword() {
  useLocale()
  const { resetPassword } = useAuth()
  const [email, setEmail] = useState(''),
    [busy, setBusy] = useState(false),
    [sent, setSent] = useState(false),
    [error, setError] = useState(false)
  const lock = useRef(false)
  async function submit() {
    if (lock.current) return
    lock.current = true
    setBusy(true)
    setError(false)
    try {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) throw new Error()
      await resetPassword(email.trim())
      setSent(true)
    } catch {
      setError(true)
    } finally {
      lock.current = false
      setBusy(false)
    }
  }
  return (
    <ScreenScroll contentClassName="gap-4 pb-8">
      <ScreenHeader
        title={t('Reset password')}
        description={t(
          'If an account exists, a recovery email will arrive. Check spam too. Wait 60 seconds before requesting another link.',
        )}
      />
      <Field
        label={t('Email')}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        editable={!busy}
      />
      {sent ? <Notice tone="success" title={t('Check your inbox')} /> : null}
      {error ? (
        <Notice
          title={t(
            'Email could not be sent. Check the address and wait 60 seconds before retrying.',
          )}
        />
      ) : null}
      <Button label={t('Send reset email')} loading={busy} onPress={submit} />
      <Button
        label={t('Go to sign in')}
        variant="ghost"
        onPress={() => router.replace('/login')}
      />
    </ScreenScroll>
  )
}
