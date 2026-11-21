import React from 'react'
import { beforeEach, expect, it, jest } from '@jest/globals'
import { fireEvent, render, waitFor } from '@testing-library/react-native'

const mockApi = jest.fn<(...args: unknown[]) => Promise<unknown>>()
let mockOwner = 'owner'
jest.mock('@/lib/api', () => ({ apiFetch: (...args: unknown[]) => mockApi(...args) }))
jest.mock('@/lib/auth', () => ({ useAuth: () => ({ session: { user: { id: mockOwner } } }) }))
jest.mock('@/lib/release/state', () => ({ useRelease: () => ({ offline: false }) }))
jest.mock('expo-router', () => ({ router: { navigate: jest.fn() }, useFocusEffect: (callback: () => void) => require('react').useEffect(callback, [callback]) }))
jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }))
jest.mock('@/components/ui', () => {
  const { View, Text, Pressable, TextInput } = require('react-native')
  const Container = ({ children }: { children: React.ReactNode }) => <View>{children}</View>
  return { ScreenScroll: Container, ScreenHeader: ({ title }: { title: string }) => <Text>{title}</Text>,
    Button: ({ label, onPress, disabled }: { label: string; onPress: () => void; disabled?: boolean }) => <Pressable accessibilityLabel={label} disabled={disabled} onPress={onPress}><Text>{label}</Text></Pressable>,
    Field: ({ label, ...props }: { label: string }) => <TextInput accessibilityLabel={label} {...props} />,
    Notice: ({ title, action }: { title: string; action?: { label: string; onPress: () => void } }) => <View><Text>{title}</Text>{action ? <Pressable accessibilityLabel={action.label} onPress={action.onPress}><Text>{action.label}</Text></Pressable> : null}</View>, LoadingRows: () => null,
    PressableScale: ({ children, ...props }: { children: React.ReactNode }) => <Pressable {...props}>{children}</Pressable> }
})
it('lets the user select a weekly meal ingredient before adding it', async () => {
  mockApi.mockImplementation(async (path, options) => {
    if (path === '/api/meal-plan') return { plan: { meals: [{ day: 'monday', breakfast: { name: 'Eggs', ingredients: ['2 eggs'] }, dinner: { name: 'Soup', ingredients: ['2 eggs'] } }] } }
    if ((options as { method?: string }).method === 'POST') return { items: [{ id: 'id', name: '2 eggs', checked: false, revision: 0, created_at: '' }] }
    return { items: [] }
  })
  const ui = await render(<ShoppingList />)
  await waitFor(() => expect(ui.getByText('Your shopping list is empty.')).toBeTruthy())
  await fireEvent.press(ui.getByLabelText('Choose from weekly menu'))
  await waitFor(() => expect(ui.getByLabelText('Select 2 eggs from Eggs')).toBeTruthy())
  expect(ui.getByLabelText('Select 2 eggs from Soup')).toBeTruthy()
  await fireEvent.press(ui.getByLabelText('Select 2 eggs from Eggs'))
  await fireEvent.press(ui.getByLabelText('Add selected ingredients'))
  await waitFor(() => expect(mockApi.mock.calls.some(([path]) => path === '/api/shopping-items/batch')).toBe(true))
  const call = mockApi.mock.calls.find(([path]) => path === '/api/shopping-items/batch')!
  expect(JSON.parse((call[1] as { body: string }).body)).toEqual({ names: ['2 eggs'] })
  await ui.unmount()
})
import ShoppingList from '@/app/(app)/shopping-list'

beforeEach(() => { mockApi.mockReset(); mockOwner = 'owner' })
it('keeps a new entry until the server confirms and then displays it', async () => {
  let finish!: (value: unknown) => void
  mockApi.mockImplementation(async (_path, options) => (options as { method?: string }).method === 'POST' ? await new Promise(resolve => { finish = resolve }) : { items: [] })
  const ui = await render(<ShoppingList />)
  await waitFor(() => expect(ui.getByText('Your shopping list is empty.')).toBeTruthy())
  await fireEvent.changeText(ui.getByLabelText('Item'), 'milk')
  await fireEvent.press(ui.getByLabelText('Add item'))
  expect(ui.getByLabelText('Item').props.value).toBe('milk')
  finish({ item: { id: 'id', name: 'milk', checked: false, revision: 0, created_at: '2026-11-10T00:00:00Z' } })
  await waitFor(() => expect(ui.getByText('milk')).toBeTruthy())
  expect(ui.getByLabelText('Item').props.value).toBe('')
  await ui.unmount()
})
it('preserves the entry and prevents a duplicate write until refresh after an uncertain failure', async () => {
  mockApi.mockImplementation(async (_path, options) => {
    if ((options as { method?: string }).method === 'POST') throw Error('timeout')
    return { items: [] }
  })
  const ui = await render(<ShoppingList />)
  await waitFor(() => expect(ui.getByText('Your shopping list is empty.')).toBeTruthy())
  await fireEvent.changeText(ui.getByLabelText('Item'), 'milk')
  await fireEvent.press(ui.getByLabelText('Add item'))
  await waitFor(() => expect(ui.getByText('Change could not be confirmed. Refresh the list before trying again.')).toBeTruthy())
  expect(ui.getByLabelText('Item').props.value).toBe('milk')
  await fireEvent.press(ui.getByLabelText('Add item'))
  expect(mockApi.mock.calls.filter(([, options]) => (options as { method?: string }).method === 'POST')).toHaveLength(1)
  await fireEvent.press(ui.getByLabelText('Refresh list'))
  await waitFor(() => expect(ui.queryByText('Change could not be confirmed. Refresh the list before trying again.')).toBeNull())
  expect(ui.getByLabelText('Item').props.value).toBe('milk')
  await ui.unmount()
})
it('does not display the previous account’s list or delayed write after an account switch', async () => {
  let finish!: (value: unknown) => void
  mockApi.mockImplementation(async (_path, options) => {
    const request = options as { method?: string; expectedUserId?: string }
    if (request.method === 'POST') return await new Promise(resolve => { finish = resolve })
    return { items: request.expectedUserId === 'owner' ? [{ id: 'old', name: 'private item', checked: false, revision: 0, created_at: '' }] : [] }
  })
  const ui = await render(<ShoppingList />)
  await waitFor(() => expect(ui.getByText('private item')).toBeTruthy())
  await fireEvent.changeText(ui.getByLabelText('Item'), 'old draft')
  await fireEvent.press(ui.getByLabelText('Add item'))
  mockOwner = 'other'
  await ui.rerender(<ShoppingList />)
  expect(ui.queryByText('private item')).toBeNull()
  expect(ui.getByLabelText('Item').props.value).toBe('')
  finish({ item: { id: 'old2', name: 'old draft', checked: false, revision: 0, created_at: '' } })
  await waitFor(() => expect(mockApi.mock.calls.some(([, options]) => (options as { expectedUserId?: string }).expectedUserId === 'other')).toBe(true))
  expect(ui.queryByText('old draft')).toBeNull()
  await ui.unmount()
})
