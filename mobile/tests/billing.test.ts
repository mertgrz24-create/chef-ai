import { beforeEach, it, expect, jest } from '@jest/globals'
const mockOffer = jest.fn<() => Promise<unknown>>(),
  mockInfo = jest.fn<() => Promise<unknown>>(),
  mockPurchase = jest.fn<() => Promise<unknown>>()
jest.mock('expo-constants', () => ({
  __esModule: true,
  default: { executionEnvironment: 'standalone' },
}))
jest.mock('react-native-purchases', () => ({
  __esModule: true,
  default: {
    configure: jest.fn(),
    logIn: async () => {},
    logOut: async () => {},
    getOfferings: () => mockOffer(),
    getCustomerInfo: () => mockInfo(),
    purchasePackage: () => mockPurchase(),
  },
}))
import { monthlyPackage, buyMonthly, setupBilling } from '@/lib/release/billing'
beforeEach(() => {
  process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY = 'fixture'
  mockOffer.mockReset()
  mockInfo.mockReset()
  mockPurchase.mockReset()
})
it('only offers an actual monthly product with no introductory/trial phases', async () => {
  await setupBilling('fixture')
  for (const product of [
    { subscriptionPeriod: 'P1Y' },
    { subscriptionPeriod: 'P1M', introPrice: {} },
    { subscriptionPeriod: 'P1M', defaultOption: { freePhase: {} } },
    { subscriptionPeriod: 'P1M', defaultOption: { introPhase: {} } },
  ]) {
    mockOffer.mockResolvedValue({ current: { monthly: { product } } })
    expect(await monthlyPackage()).toBeNull()
  }
  mockOffer.mockResolvedValue({
    current: {
      monthly: { product: { subscriptionPeriod: 'P1M', introPrice: null } },
    },
  })
  expect(await monthlyPackage()).not.toBeNull()
})
it('never starts a second purchase when store customer info already has a subscription', async () => {
  mockInfo.mockResolvedValue({
    entitlements: { active: {} },
    activeSubscriptions: ['monthly'],
  })
  await expect(buyMonthly({} as never)).rejects.toThrow(
    'subscription_already_exists',
  )
  expect(mockPurchase).not.toHaveBeenCalled()
})
