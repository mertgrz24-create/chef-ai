import { describe, it, expect, jest, beforeEach } from '@jest/globals'
import React from 'react'
import { render, fireEvent, waitFor } from '@testing-library/react-native'
const mockAccept = jest.fn<() => Promise<void>>()
const mockState = {
  config: null as unknown,
  aiAllowed: false,
  offline: false,
  acceptAi: mockAccept,
}
jest.mock('@/lib/release/state', () => ({ useRelease: () => mockState }))
jest.mock('@/components/ui', () => {
  const { View, Text, Pressable } = require('react-native')
  return {
    Card: ({ children }: { children: React.ReactNode }) => (
      <View>{children}</View>
    ),
    Button: ({ label, onPress }: { label: string; onPress: () => void }) => (
      <Pressable accessibilityRole="button" onPress={onPress}>
        <Text>{label}</Text>
      </Pressable>
    ),
    Notice: ({ title }: { title: string }) => <Text>{title}</Text>,
  }
})
import { AiGate, LegalLinks } from '@/components/release/gates'
beforeEach(() => {
  mockState.config = null
  mockState.aiAllowed = false
  mockState.offline = false
  mockAccept.mockReset()
})
describe('AI transfer gate', () => {
  it('does not submit consent or expose allow when configuration is absent', async () => {
    const screen = await render(<AiGate />)
    expect(screen.queryByText('Allow AI data transfer')).toBeNull()
    expect(mockAccept).not.toHaveBeenCalled()
  })
  it('requires explicit consent action', async () => {
    mockState.config = {
      capabilities: { ai: true, consents: true, reports: true },
      ai: {
        provider: 'Test',
        consentVersion: '1',
        retention: { en: 'Retention', tr: 'Saklama' },
      },
    }
    mockAccept.mockResolvedValue()
    const screen = await render(<AiGate />)
    expect(mockAccept).not.toHaveBeenCalled()
    await fireEvent.press(screen.getByText('Allow AI data transfer'))
    await waitFor(() => expect(mockAccept).toHaveBeenCalledTimes(1))
  })
  it('does not claim consent success on failure', async () => {
    mockState.config = {
      capabilities: { ai: true, consents: true, reports: true },
      ai: { provider: 'Test', retention: { en: 'Retention' } },
    }
    mockAccept.mockRejectedValue(new Error())
    const screen = await render(<AiGate />)
    await fireEvent.press(screen.getByText('Allow AI data transfer'))
    await waitFor(() =>
      expect(
        screen.getByText('Permission could not be saved. Please try again.'),
      ).toBeTruthy(),
    )
  })
  it('does not request consent again while permission is current', async () => {
    mockState.aiAllowed = true
    const screen = await render(<AiGate />)
    expect(screen.queryByText('Before using AI')).toBeNull()
  })
})


describe('shared legal links', () => {
  it('has privacy, terms and support without an account deletion link', async () => {
    const screen = await render(<LegalLinks />)
    expect(screen.getByText('Privacy policy')).toBeTruthy()
    expect(screen.getByText('Terms of use')).toBeTruthy()
    expect(screen.getByText('Support')).toBeTruthy()
    expect(screen.queryByText('Account deletion')).toBeNull()
    expect(screen.queryByText('Delete account')).toBeNull()
  })
})
