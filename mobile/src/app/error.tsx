import { useEffect } from 'react'
import type { ErrorBoundaryProps } from 'expo-router'
import { Button, Notice, ScreenScroll } from '@/components/ui'
import { reportError } from '@/lib/release/telemetry'
import { t } from '@/lib/release/locale'
export function ErrorBoundary({ retry }: ErrorBoundaryProps) {
  useEffect(() => {
    reportError('screen_error')
  }, [])
  return (
    <ScreenScroll>
      <Notice
        title={t('Something went wrong')}
        description={t(
          'Your account is safe. Restart this screen and try again.',
        )}
      />
      <Button
        label={t('Try again')}
        onPress={() => {
          void retry()
        }}
      />
    </ScreenScroll>
  )
}
export default function ErrorPage() {
  return (
    <ScreenScroll>
      <Notice title={t('Something went wrong')} />
    </ScreenScroll>
  )
}
