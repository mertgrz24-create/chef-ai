import React from 'react'
import { beforeEach, expect, it, jest } from '@jest/globals'
import { act, fireEvent, render, waitFor } from '@testing-library/react-native'
import { AppState, type AppStateStatus } from 'react-native'
const mockWake = jest.fn()
const mockReleaseWake = jest.fn()
let mockExitFocus: (() => void) | undefined
jest.mock('expo-keep-awake', () => ({ useKeepAwake: () => require('react').useEffect(() => { mockWake(); return () => mockReleaseWake() }, []) }))
jest.mock('expo-router', () => ({ useFocusEffect: (callback: () => void | (() => void)) => require('react').useEffect(() => { const cleanup = callback(); mockExitFocus = typeof cleanup === 'function' ? cleanup : undefined; return cleanup }, [callback]) }))

jest.mock('@/components/ui/button', () => {
  const { Pressable, Text } = require('react-native')
  return { Button: ({ label, onPress, disabled }: { label: string; onPress: () => void; disabled?: boolean }) => <Pressable accessibilityLabel={label} onPress={onPress} disabled={disabled}><Text>{label}</Text></Pressable> }
})
it('lets ingredients be checked independently while changing steps', async () => {
  const ui = await render(<CookingMode recipe={recipe} onClose={() => {}} />)
  const ingredient = ui.getByLabelText('Ingredient: tomato')
  expect(ingredient.props.accessibilityState.checked).toBe(false)
  await fireEvent.press(ingredient)
  await fireEvent.press(ui.getByLabelText('Next step'))
  expect(ui.getByLabelText('Ingredient: tomato').props.accessibilityState.checked).toBe(true)
  expect(ui.getByLabelText('Ingredient: salt').props.accessibilityState.checked).toBe(false)
  await ui.unmount()
})
jest.mock('@/components/ui/pressable-scale', () => {
  const { Pressable } = require('react-native')
  return { PressableScale: ({ children, ...props }: { children: React.ReactNode }) => <Pressable {...props}>{children}</Pressable> }
})
jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }))
jest.mock('@/components/release/recipe-shopping', () => ({ RecipeShopping: () => null }))
jest.mock('@/lib/release/kitchen-timer-native', () => {
  const { KitchenTimer } = jest.requireActual<typeof import('@/lib/release/kitchen-timer')>('@/lib/release/kitchen-timer')
  let saved: string | null = null
  return { kitchenTimer: new KitchenTimer({ now: Date.now, id: () => 'test', read: async () => saved, write: async (value: string | null) => { saved = value }, permission: async () => false, schedule: async () => {}, cancel: async () => {}, pending: async () => [] }) }
})
import { CookingMode } from '@/components/release/cooking-mode'
import { RecipeTicket } from '@/components/ui/recipe-ticket'
import { kitchenTimer } from '@/lib/release/kitchen-timer-native'
beforeEach(async () => { await kitchenTimer.stop() })
const recipe = { name: 'Soup', ingredients: ['tomato', 'salt'], instructions: '1. Chop tomato\n2. Simmer' }
it('shows one verified step at a time and lets the cook move back', async () => {
  const ui = await render(<CookingMode recipe={recipe} onClose={() => {}} />)
  expect(ui.getByText('Chop tomato')).toBeTruthy()
  expect(ui.queryByText('Simmer')).toBeNull()
  await fireEvent.press(ui.getByLabelText('Next step'))
  expect(ui.getByText('Simmer')).toBeTruthy()
  await fireEvent.press(ui.getByLabelText('Previous step'))
  expect(ui.getByText('Chop tomato')).toBeTruthy()
  await ui.unmount()
})
it('keeps the screen awake only while cooking mode is mounted', async () => {
  mockWake.mockClear()
  mockReleaseWake.mockClear()
  const ui = await render(<CookingMode recipe={recipe} onClose={() => {}} />)
  expect(mockWake).toHaveBeenCalled()
  await ui.unmount()
  expect(mockReleaseWake).toHaveBeenCalledTimes(1)
})
it('releases the screen wake lock when its screen loses focus', async () => {
  mockReleaseWake.mockClear()
  const ui = await render(<CookingMode recipe={recipe} onClose={() => {}} />)
  await act(async () => { mockExitFocus?.() })
  expect(mockReleaseWake).toHaveBeenCalledTimes(1)
  await ui.unmount()
})
it('opens and exits cooking mode from the recipe card', async () => {
  const ui = await render(<RecipeTicket recipe={recipe} />)
  await fireEvent.press(ui.getByLabelText('Start cooking'))
  expect(ui.getByText('Step 1 of 2')).toBeTruthy()
  await fireEvent.press(ui.getByLabelText('Close cooking mode'))
  expect(ui.getByLabelText('Start cooking')).toBeTruthy()
  await ui.unmount()
})
it('counts down from the selected duration and reports completion', async () => {
  jest.useFakeTimers()
  try {
    const ui = await render(<CookingMode recipe={recipe} onClose={() => {}} />)
    await fireEvent.changeText(ui.getByLabelText('Minutes'), '1')
    await fireEvent.press(ui.getByLabelText('Start timer'))
    await waitFor(() => expect(ui.getByText('01:00')).toBeTruthy())
    await act(async () => { jest.advanceTimersByTime(60_000) })
    expect(ui.getByText('Time is up.')).toBeTruthy()
    await ui.unmount()
  } finally { jest.useRealTimers() }
})
it('recalculates elapsed time on returning to the app', async () => {
  jest.useFakeTimers()
  let listener!: (status: AppStateStatus) => void
  const spy = jest.spyOn(AppState, 'addEventListener').mockImplementation((_event, fn) => { listener = fn; return { remove: jest.fn() } })
  try {
    const ui = await render(<CookingMode recipe={recipe} onClose={() => {}} />)
    await fireEvent.changeText(ui.getByLabelText('Minutes'), '1')
    await fireEvent.press(ui.getByLabelText('Start timer'))
    await waitFor(() => expect(ui.getByText('01:00')).toBeTruthy())
    jest.setSystemTime(Date.now() + 61_000)
    await act(async () => { listener('active') })
    expect(ui.getByText('Time is up.')).toBeTruthy()
    await ui.unmount()
  } finally { spy.mockRestore(); jest.useRealTimers() }
})
it('keeps a running timer when cooking mode closes', async () => {
  const appState = jest.spyOn(AppState, 'addEventListener').mockReturnValue({ remove: jest.fn() })
  const onClose = jest.fn()
  const ui = await render(<CookingMode recipe={recipe} onClose={onClose} />)
  await fireEvent.press(ui.getByLabelText('Start timer'))
  await waitFor(() => expect(ui.getByLabelText('Stop timer')).toBeTruthy())
  await fireEvent.press(ui.getByLabelText('Close cooking mode'))
  expect(onClose).toHaveBeenCalled()
  expect(kitchenTimer.snapshot().status).toBe('running')
  await ui.unmount()
  appState.mockRestore()
})
it('keeps unnumbered instructions intact', async () => {
  const instructions = 'Cook gently.\nAdd the salt.'
  const ui = await render(<CookingMode recipe={{ ...recipe, instructions }} onClose={() => {}} />)
  expect(ui.getByText(instructions)).toBeTruthy()
  expect(ui.getByText('Step 1 of 1')).toBeTruthy()
  await ui.unmount()
})
it('does not carry cooking progress into a different recipe', async () => {
  const ui = await render(<RecipeTicket recipe={recipe} />)
  await fireEvent.press(ui.getByLabelText('Start cooking'))
  await fireEvent.press(ui.getByLabelText('Next step'))
  await ui.rerender(<RecipeTicket recipe={{ ...recipe, name: 'Beans', instructions: '1. Soak\n2. Boil' }} />)
  expect(ui.getByLabelText('Start cooking')).toBeTruthy()
  await fireEvent.press(ui.getByLabelText('Start cooking'))
  expect(ui.getByText('Soak')).toBeTruthy()
  await ui.unmount()
})
