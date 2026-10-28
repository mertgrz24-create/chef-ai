import { useEffect, useState } from 'react'
import * as Linking from 'expo-linking'
import { router } from 'expo-router'
import { useAuth } from '@/lib/auth'
import { BusyState, Button, Notice, ScreenScroll } from '@/components/ui'
import { t, useLocale } from '@/lib/release/locale'
export default function Callback() {
  useLocale()
  const { handleCallback, recovery } = useAuth()
  const [error, setError] = useState(false)
  const url = Linking.useURL()
  useEffect(() => {
    if (!url) return
    let live = true
    void handleCallback(url)
      .then(() => {
        if (live) router.replace('/')
      })
      .catch(() => {
        if (live) setError(true)
      })
    return () => {
      live = false
    }
  }, [url, handleCallback])
  useEffect(() => {
    if (recovery) router.replace('/reset-password')
  }, [recovery])
  return (
    <ScreenScroll>
      {error ? (
        <>
          <Notice
            title={t('This link is invalid or expired. Request a new one.')}
          />
          <Button
            label={t('Go to sign in')}
            onPress={() => router.replace('/login')}
          />
        </>
      ) : (
        <BusyState label={t('Completing sign in…')} />
      )}
    </ScreenScroll>
  )
}
