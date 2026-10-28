import { describe, it, expect, jest, beforeEach } from '@jest/globals'
import React from 'react'
import { render, fireEvent, waitFor } from '@testing-library/react-native'
const mockBuy = jest.fn<() => Promise<unknown>>(),
  mockRestore = jest.fn<() => Promise<unknown>>(),
  mockRefresh = jest.fn<() => Promise<unknown>>(),
  mockPackage = jest.fn<() => Promise<unknown>>()
const mockTrack = jest.fn<() => Promise<void>>().mockResolvedValue()
const mockState = {
  config: { capabilities: { billing: true } },
  membership: {
    plan: 'free',
    premiumLimits: { recipes: 100, scans: 20, plans: 4 },
    quotas: {},
  },
  refreshMembership: mockRefresh,
  track: mockTrack,
  offline: false,
}
jest.mock('@/lib/release/state', () => ({ useRelease: () => mockState }))
jest.mock('@/lib/auth', () => ({
  useAuth: () => ({ session: { user: { id: 'fixture' } } }),
}))
jest.mock('expo-router', () => ({ router: { navigate: jest.fn() } }))
jest.mock('@/components/release/gates', () => ({ LegalLinks: () => null }))
jest.mock('@/lib/release/billing', () => ({
  billingAvailable: () => true,
  setupBilling: async () => {},
  monthlyPackage: () => mockPackage(),
  buyMonthly: () => mockBuy(),
  restoreBilling: () => mockRestore(),
  managementUrl: async () => null,
}))
jest.mock('@/components/ui', () => {
  const { View, Text, Pressable } = require('react-native')
  return {
    Card: ({ children }: { children: React.ReactNode }) => (
      <View>{children}</View>
    ),
    ScreenScroll: ({ children }: { children: React.ReactNode }) => (
      <View>{children}</View>
    ),
    ScreenHeader: () => null,
    Button: ({
      label,
      onPress,
      disabled,
      loading,
    }: {
      label: string
      onPress: () => void
      disabled?: boolean
      loading?: boolean
    }) => (
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: !!disabled || !!loading }}
        disabled={disabled || loading}
        onPress={onPress}
      >
        <Text>{label}</Text>
      </Pressable>
    ),
    Notice: ({ title }: { title: string }) => <Text>{title}</Text>,
  }
})
import Premium from '@/app/(app)/premium'
beforeEach(() => {
  mockBuy.mockReset()
  mockRestore.mockReset()
  mockRefresh.mockReset()
  mockPackage.mockReset()
  mockPackage.mockResolvedValue({ product: { priceString: '$9.99' } })
  mockRefresh.mockResolvedValue(null)
  mockState.config.capabilities.billing = true
  mockState.offline = false
  mockBuy.mockResolvedValue({})
  mockRestore.mockResolvedValue({})
})
describe('subscription lifecycle UI', () => {
  it('does not charge without server capability', async () => {
    mockState.config.capabilities.billing = false
    const screen = await render(<Premium />)
    expect(
      screen.getByRole('button', { name: 'Subscribe monthly' }).props
        .accessibilityState.disabled,
    ).toBe(true)
    expect(mockBuy).not.toHaveBeenCalled()
  })
  it('shows syncing without falsely granting premium', async () => {
    const screen = await render(<Premium />)
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: 'Subscribe monthly' }).props
          .accessibilityState.disabled,
      ).toBe(false),
    )
    await fireEvent.press(screen.getByText('Subscribe monthly'))
    await waitFor(() =>
      expect(
        screen.getByText(
          'Purchase received. Membership is syncing; do not buy again.',
        ),
      ).toBeTruthy(),
    )
    expect(mockBuy).toHaveBeenCalledTimes(1)
    expect(
      screen.getByRole('button', { name: 'Subscribe monthly' }).props
        .accessibilityState.disabled,
    ).toBe(true)
    await fireEvent.press(screen.getByText('Subscribe monthly'))
    expect(mockBuy).toHaveBeenCalledTimes(1)
  })
  it('handles user cancellation without claiming purchase success', async () => {
    mockBuy.mockRejectedValue({ userCancelled: true })
    const screen = await render(<Premium />)
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: 'Subscribe monthly' }).props
          .accessibilityState.disabled,
      ).toBe(false),
    )
    await fireEvent.press(screen.getByText('Subscribe monthly'))
    await waitFor(() =>
      expect(screen.getByText('Purchase cancelled.')).toBeTruthy(),
    )
  })
  it('blocks a new charge while store approval is pending', async () => {
    mockBuy.mockRejectedValue({ code: '20' })
    const screen = await render(<Premium />)
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: 'Subscribe monthly' }).props
          .accessibilityState.disabled,
      ).toBe(false),
    )
    await fireEvent.press(screen.getByText('Subscribe monthly'))
    await waitFor(() =>
      expect(
        screen.getByText(
          'Payment is pending store approval. Do not buy again.',
        ),
      ).toBeTruthy(),
    )
    expect(
      screen.getByRole('button', { name: 'Subscribe monthly' }).props
        .accessibilityState.disabled,
    ).toBe(true)
  })
  it('restores even when no offering is returned', async () => {
    mockPackage.mockResolvedValue(null)
    mockRefresh.mockResolvedValue({ plan: 'premium', status: 'active' })
    const screen = await render(<Premium />)
    await fireEvent.press(screen.getByText('Restore purchases'))
    await waitFor(() =>
      expect(screen.getByText('Premium is active.')).toBeTruthy(),
    )
    expect(mockRestore).toHaveBeenCalledTimes(1)
    expect(mockBuy).not.toHaveBeenCalled()
  })
})
