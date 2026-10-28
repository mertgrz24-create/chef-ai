import { useEffect, useRef, useState } from 'react'
import { Linking, Text, View } from 'react-native'
import { router } from 'expo-router'
import type { PurchasesPackage } from 'react-native-purchases'
import {
  Button,
  Card,
  Notice,
  ScreenHeader,
  ScreenScroll,
} from '@/components/ui'
import { LegalLinks } from '@/components/release/gates'
import { useRelease } from '@/lib/release/state'
import { useAuth } from '@/lib/auth'
import {
  billingAvailable,
  setupBilling,
  monthlyPackage,
  buyMonthly,
  restoreBilling,
  managementUrl,
} from '@/lib/release/billing'
import { t, useLocale } from '@/lib/release/locale'
export default function Premium() {
  useLocale()
  const { session } = useAuth()
  const { config, membership, refreshMembership, track, offline } = useRelease()
  const [pkg, setPackage] = useState<PurchasesPackage | null>(null),
    [busy, setBusy] = useState(false),
    [purchasePending, setPurchasePending] = useState(false),
    [message, setMessage] = useState<string | null>(null)
  const lock = useRef(false)
  const available = !!(
    config?.capabilities.billing &&
    billingAvailable() &&
    session
  )
  useEffect(() => {
    void track('paywall_opened')
    if (!config?.capabilities.billing || !session || !billingAvailable()) return
    let live = true
    void setupBilling(session.user.id)
      .then(monthlyPackage)
      .then((p) => {
        if (live) setPackage(p)
      })
      .catch(() => {
        if (live) setMessage('Purchases are not available yet.')
      })
    return () => {
      live = false
    }
  }, [config, session, track])
  async function action(kind: 'buy' | 'restore' | 'manage') {
    if (
      lock.current ||
      !available ||
      offline ||
      (kind === 'buy' && purchasePending)
    )
      return
    lock.current = true
    setBusy(true)
    setMessage(null)
    try {
      await setupBilling(session!.user.id)
      if (kind === 'manage') {
        const url = await managementUrl()
        if (
          !url ||
          !/^https:\/\/(apps\.apple\.com|play\.google\.com)\//.test(url)
        )
          throw new Error()
        await Linking.openURL(url)
        return
      }
      if (kind === 'buy') {
        if (!pkg || !membership?.premiumLimits) throw new Error()
        setPurchasePending(true)
        await buyMonthly(pkg)
      } else await restoreBilling()
      const status = await refreshMembership()
      setMessage(
        status?.plan === 'premium' && status.status === 'active'
          ? 'Premium is active.'
          : status?.plan === 'premium' && status.status === 'grace'
            ? 'Premium is in a billing grace period. Update your store payment method.'
            : status?.status === 'hold'
              ? 'Subscription payment is on hold. Manage your subscription in the store.'
              : status?.status === 'expired' ||
                  (kind === 'restore' &&
                    status?.plan === 'free' &&
                    status.status === 'active')
                ? 'No active subscription was found.'
                : 'Purchase received. Membership is syncing; do not buy again.',
      )
      if (kind === 'restore') await track('restore_completed')
    } catch (error) {
      if (
        error &&
        typeof error === 'object' &&
        'userCancelled' in error &&
        error.userCancelled
      ) {
        setPurchasePending(false)
        setMessage('Purchase cancelled.')
      } else if (
        error &&
        typeof error === 'object' &&
        'code' in error &&
        String(error.code) === '20'
      ) {
        // RevenueCat PURCHASES_ERROR_CODE.PAYMENT_PENDING_ERROR.
        setPurchasePending(true)
        setMessage('Payment is pending store approval. Do not buy again.')
      } else {
        setMessage(
          'Purchase could not be confirmed. Restore purchases or contact support before trying again.',
        )
        if (kind === 'restore') await track('restore_completed', 'failure')
      }
    } finally {
      lock.current = false
      setBusy(false)
    }
  }
  return (
    <ScreenScroll>
      <ScreenHeader
        title={t('Premium')}
        description={t('One monthly subscription. No free trial.')}
      />
      <Button
        variant="ghost"
        label={t('Back')}
        onPress={() => router.navigate('/profile')}
      />
      <Card>
        <Text className="font-display text-display-md text-pantry">
          {pkg
            ? `${pkg.product.priceString} / ${t('month')}`
            : t('Purchases are not available yet.')}
        </Text>
        <Text className="mt-3 font-sans text-body-sm text-secondary">
          {t(
            'Free includes 10 recipes per month. Premium limits are shown below when verified by the server.',
          )}
        </Text>
        {membership
          ? Object.entries(membership.quotas).map(([name, q]) => (
              <Text
                key={name}
                className="mt-2 font-sans text-body-sm text-secondary"
              >
                {t(name)}: {q.used} / {q.limit} ·{' '}
                {new Date(q.resetsAt).toLocaleDateString()}
              </Text>
            ))
          : null}
        {membership?.premiumLimits ? (
          <View className="mt-4">
            {Object.entries(membership.premiumLimits).map(([name, limit]) => (
              <Text
                key={name}
                className="font-sans-bold text-body-sm text-pantry"
              >
                Premium · {t(name)}: {limit} / {t('month')}
              </Text>
            ))}
          </View>
        ) : null}
        <Text className="mt-4 font-sans text-label text-muted">
          {t(
            'Renews automatically each month unless cancelled in your store account. Deleting your Chef-AI account does not cancel your subscription.',
          )}
        </Text>
      </Card>
      <View className="mt-5 gap-3">
        <Button
          label={t('Subscribe monthly')}
          disabled={
            purchasePending ||
            !available ||
            !pkg ||
            !membership?.premiumLimits ||
            offline ||
            membership?.plan === 'premium'
          }
          loading={busy}
          onPress={() => action('buy')}
        />
        <Button
          label={t('Restore purchases')}
          variant="ghost"
          disabled={!available || offline || busy}
          onPress={() => action('restore')}
        />
        <Button
          label={t('Manage subscription')}
          variant="ghost"
          disabled={!available || offline || busy}
          onPress={() => action('manage')}
        />
      </View>
      {message ? <Notice tone="info" title={t(message)} /> : null}
      <LegalLinks />
    </ScreenScroll>
  )
}
