import React from 'react'
import { expect, it, jest } from '@jest/globals'
import { fireEvent, render, waitFor } from '@testing-library/react-native'
const mockApi = jest.fn<(...args: unknown[]) => Promise<unknown>>()
jest.mock('@/lib/api', () => ({ apiFetch: (...args: unknown[]) => mockApi(...args) }))
jest.mock('@/lib/auth', () => ({ useAuth: () => ({ session: { user: { id: 'owner' } } }) }))
jest.mock('@/lib/release/state', () => ({ useRelease: () => ({ offline: false }) }))
jest.mock('expo-router', () => ({ router: { navigate: jest.fn() } }))
jest.mock('@/components/ui/button', () => {
  const { Pressable, Text } = require('react-native')
  return { Button: ({ label, onPress, disabled }: { label: string; onPress: () => void; disabled?: boolean }) => <Pressable accessibilityLabel={label} onPress={onPress} disabled={disabled}><Text>{label}</Text></Pressable> }
})
jest.mock('@/components/ui/pressable-scale', () => {
  const { Pressable } = require('react-native')
  return { PressableScale: ({ children, ...props }: { children: React.ReactNode }) => <Pressable {...props}>{children}</Pressable> }
})
import { RecipeShopping } from '@/components/release/recipe-shopping'
it('adds only ingredients explicitly selected from the recipe', async () => {
  mockApi.mockResolvedValue({ items: [{ id: '00000000-0000-4000-8000-000000000001', name: '2 eggs', checked: false, revision: 0, created_at: '' }] })
  const ui = await render(<RecipeShopping ingredients={['2 eggs', 'salt']} />)
  await fireEvent.press(ui.getByLabelText('Choose ingredients for shopping'))
  await fireEvent.press(ui.getByLabelText('Select 2 eggs'))
  await fireEvent.press(ui.getByLabelText('Add selected ingredients'))
  await waitFor(() => expect(ui.getByText('Ingredients added to your shopping list.')).toBeTruthy())
  expect(JSON.parse((mockApi.mock.calls[0][1] as { body: string }).body)).toEqual({ names: ['2 eggs'] })
  await ui.unmount()
})
