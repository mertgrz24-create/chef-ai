import React from 'react'
import { Text } from 'react-native'
import { beforeEach, expect, it, jest } from '@jest/globals'
import { renderRouter } from 'expo-router/testing-library'

const mockAuth = { session: null as null | { user: { id: string } }, initializing: false, initError: false, recovery: false, retryInit: jest.fn() }
const mockRelease = { preferences: { onboarded: true }, preferencesReady: true, preferenceError: false }
jest.mock('../src/global.css', () => ({}))
jest.mock('@/lib/auth', () => ({ AuthProvider: ({ children }: { children: React.ReactNode }) => children, useAuth: () => mockAuth }))
jest.mock('@/lib/release/state', () => ({ ReleaseProvider: ({ children }: { children: React.ReactNode }) => children, useRelease: () => mockRelease }))
jest.mock('@/lib/release/kitchen-data', () => ({ KitchenDataProvider: ({ children }: { children: React.ReactNode }) => children }))
jest.mock('@/components/release/ai-recovery', () => ({ AiRecoveryProvider: ({ children }: { children: React.ReactNode }) => children }))
jest.mock('@/components/release/runtime', () => ({ RuntimeGate: ({ children }: { children: React.ReactNode }) => children, PushLifecycle: () => null }))
jest.mock('@/components/release/gates', () => ({ Onboarding: () => null }))
jest.mock('@/lib/release/locale', () => ({ t: (value: string) => value, useLocale: () => undefined }))
jest.mock('@/lib/release/telemetry', () => ({ initTelemetry: jest.fn(), reportError: jest.fn() }))
jest.mock('expo-font', () => ({ useFonts: () => [true, null] }))
jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }))
jest.mock('expo-splash-screen', () => ({ preventAutoHideAsync: jest.fn(), hideAsync: jest.fn() }))
jest.mock('@/components/ui', () => ({ Button: () => null, Notice: () => null, ScreenScroll: ({ children }: { children: React.ReactNode }) => children, BusyState: () => null }))

import * as Root from '@/app/_layout'
import * as Auth from '@/app/(auth)/_layout'
import * as App from '@/app/(app)/_layout'

const routes = {
  _layout: Root,
  '(app)/_layout': App,
  '(app)/index': () => <Text>Private Today</Text>,
  '(app)/pantry': () => <Text>Private Pantry</Text>,
  '(app)/scan': () => <Text>Private Scan</Text>,
  '(app)/cook': () => <Text>Private Cook</Text>,
  '(app)/profile': () => <Text>Private Profile</Text>,
  '(app)/meal-plan': () => <Text>Private Plan</Text>,
  '(app)/saved-recipes': () => <Text>Private Recipes</Text>,
  '(app)/premium': () => <Text>Private Premium</Text>,
  '(app)/report': () => <Text>Private Report</Text>,
  '(auth)/_layout': Auth,
  '(auth)/login': () => <Text>Public Login</Text>,
  '(auth)/signup': () => <Text>Public Signup</Text>,
  '(auth)/forgot-password': () => <Text>Public Recovery Request</Text>,
  '(auth)/reset-password': () => <Text>Public Password Reset</Text>,
  'auth/callback': () => <Text>Auth Callback</Text>,
}

beforeEach(() => { mockAuth.session = null; mockAuth.recovery = false })

it('opens login on a signed-out cold launch at the root URL', async () => {
  const ui = await renderRouter(routes, { initialUrl: '/' })
  expect(await ui.findByText('Public Login')).toBeTruthy()
  expect(ui.queryByText('Private Today')).toBeNull()
  await ui.unmount()
})

it('keeps private deep links behind login', async () => {
  const ui = await renderRouter(routes, { initialUrl: '/pantry' })
  expect(await ui.findByText('Public Login')).toBeTruthy()
  expect(ui.queryByText('Private Pantry')).toBeNull()
  await ui.unmount()
})

it('opens Today for an authenticated cold launch', async () => {
  mockAuth.session = { user: { id: 'account-a' } }
  const ui = await renderRouter(routes, { initialUrl: '/' })
  expect(await ui.findByText('Private Today')).toBeTruthy()
  await ui.unmount()
})

it('keeps recovery at the password reset screen', async () => {
  mockAuth.session = { user: { id: 'account-a' } }; mockAuth.recovery = true
  const ui = await renderRouter(routes, { initialUrl: '/' })
  expect(await ui.findByText('Public Password Reset')).toBeTruthy()
  expect(ui.queryByText('Private Today')).toBeNull()
  await ui.unmount()
})
