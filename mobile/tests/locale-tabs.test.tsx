import React from 'react'
import { Text } from 'react-native'
import { afterEach, expect, it, jest } from '@jest/globals'
import { act } from '@testing-library/react-native'
import { renderRouter } from 'expo-router/testing-library'

jest.mock('@/lib/release/storage', () => ({ readPreference: jest.fn(async () => null), writePreference: jest.fn(async () => undefined) }))
jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }))

import * as App from '@/app/(app)/_layout'
import { setLocale } from '@/lib/release/locale'

const routes = {
  '(app)/_layout': App,
  '(app)/index': () => <Text>Body</Text>,
  '(app)/pantry': () => <Text>Body</Text>,
  '(app)/scan': () => <Text>Body</Text>,
  '(app)/cook': () => <Text>Body</Text>,
  '(app)/profile': () => <Text>Body</Text>,
  '(app)/meal-plan': () => <Text>Body</Text>,
  '(app)/saved-recipes': () => <Text>Body</Text>,
  '(app)/premium': () => <Text>Body</Text>,
  '(app)/report': () => <Text>Body</Text>,
}

afterEach(async () => { await setLocale('en') })

it('re-labels the tab bar when the language changes while it is mounted', async () => {
  await setLocale('en')
  const ui = await renderRouter(routes, { initialUrl: '/' })
  expect(ui.getAllByText('Pantry').length).toBeGreaterThan(0)
  await act(async () => { await setLocale('tr') })
  expect(ui.queryByText('Pantry')).toBeNull()
  expect(ui.getAllByText('Kiler').length).toBeGreaterThan(0)
  await act(async () => { await setLocale('en') })
  expect(ui.getAllByText('Pantry').length).toBeGreaterThan(0)
  await ui.unmount()
})

it('localizes the Scan tab accessibility label', async () => {
  await setLocale('tr')
  const ui = await renderRouter(routes, { initialUrl: '/' })
  expect(ui.queryByLabelText('Scan ingredients with your camera')).toBeNull()
  await ui.unmount()
})
