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
export default function ResetPassword() {
  useLocale()
  const { recovery, updatePassword } = useAuth()
  const [password, setPassword] = useState(''),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(false)
  const lock = useRef(false)
  async function submit() {
    if (lock.current || !recovery) return
    lock.current = true
    setBusy(true)
    try {
      await updatePassword(password)
      router.replace('/')
    } catch {
      setError(true)
    } finally {
      lock.current = false
      setBusy(false)
    }
  }
  return (
    <ScreenScroll contentClassName="gap-4 pb-8">
      <ScreenHeader title={t('New password')} />
      {!recovery ? (
        <Notice
          title={t(
            'This recovery link is invalid or expired. Request a new one.',
          )}
        />
      ) : (
        <>
          <Field
            label={t('New password')}
            hint={t('At least 8 characters.')}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="new-password"
            editable={!busy}
          />
          <Button
            label={t('Update password')}
            onPress={submit}
            disabled={password.length < 8}
            loading={busy}
          />
        </>
      )}
      {error ? (
        <Notice
          title={t(
            'Password could not be changed. Request a new link or try again.',
          )}
        />
      ) : null}
    </ScreenScroll>
  )
}
