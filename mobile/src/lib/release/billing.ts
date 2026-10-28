import { Platform } from 'react-native'
import Constants from 'expo-constants'
import Purchases, { type PurchasesPackage } from 'react-native-purchases'
let user: string | null = null
let initialized = false
export function billingAvailable() {
  return (
    Platform.OS !== 'web' &&
    Constants.executionEnvironment !== 'storeClient' &&
    !!(Platform.OS === 'ios'
      ? process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY
      : process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY)
  )
}
let identityQueue: Promise<unknown> = Promise.resolve()
function serialize<T>(action: () => Promise<T>): Promise<T> {
  const next = identityQueue.then(action)
  identityQueue = next.catch(() => {})
  return next
}
export function setupBilling(userId: string) {
  return serialize(async () => {
    if (!billingAvailable()) throw new Error('billing_unavailable')
    if (user === userId) return
    if (!initialized) {
      Purchases.configure({
        apiKey: (Platform.OS === 'ios'
          ? process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY
          : process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY)!,
        appUserID: userId,
      })
      initialized = true
    } else await Purchases.logIn(userId)
    user = userId
  })
}
export function clearBilling() {
  return serialize(async () => {
    if (initialized && user) {
      await Purchases.logOut()
      user = null
    }
  })
}
export async function monthlyPackage(): Promise<PurchasesPackage | null> {
  const offering = (await Purchases.getOfferings()).current
  const pkg = offering?.monthly
  if (
    !pkg ||
    pkg.product.subscriptionPeriod !== 'P1M' ||
    pkg.product.introPrice ||
    pkg.product.defaultOption?.freePhase ||
    pkg.product.defaultOption?.introPhase
  )
    return null
  return pkg
}
export async function buyMonthly(pkg: PurchasesPackage) {
  const info = await Purchases.getCustomerInfo()
  if (
    Object.keys(info.entitlements.active).length ||
    info.activeSubscriptions.length
  )
    throw new Error('subscription_already_exists')
  return Purchases.purchasePackage(pkg)
}
export async function restoreBilling() {
  return Purchases.restorePurchases()
}
export async function managementUrl() {
  return (await Purchases.getCustomerInfo()).managementURL
}
