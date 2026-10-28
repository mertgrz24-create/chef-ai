import { jest } from '@jest/globals'
jest.mock('expo-crypto', () => ({ randomUUID: () => 'test-request-uuid' }))
jest.mock('expo-localization', () => ({
  getLocales: () => [{ languageCode: 'en' }],
}))
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async () => null),
  setItemAsync: jest.fn(async () => {}),
  deleteItemAsync: jest.fn(async () => {}),
}))
jest.mock('@sentry/react-native', () => ({
  init: jest.fn(),
  captureException: jest.fn(),
}))
jest.mock('expo-constants', () => ({
  __esModule: true,
  default: {
    expoConfig: { version: '1.0.0' },
    executionEnvironment: 'storeClient',
  },
}))
