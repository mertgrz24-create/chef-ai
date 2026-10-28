module.exports = {
  preset: 'jest-expo',
  testMatch: ['<rootDir>/tests/**/*.test.ts','<rootDir>/tests/**/*.test.tsx'],
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1' },
  clearMocks: true,
  collectCoverageFrom: ['src/lib/release/{request,contracts,callback,telemetry}.ts'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
}
