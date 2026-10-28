import { describe, it, expect } from '@jest/globals'
import {
  compareVersions,
  mobileConfigSchema,
  historySchema,
  membershipSchema,
  recipeResponseSchema,
  visionSchema,
} from '@/lib/release/contracts'
export const configFixture = {
  schemaVersion: 1,
  maintenance: false,
  minimumVersion: '1.0.0',
  links: {
    privacy: 'https://example.com/privacy',
    terms: 'https://example.com/terms',
    support: 'https://example.com/support',
    deletion: 'https://example.com/delete',
  },
  ai: {
    provider: 'Test provider',
    consentVersion: 'v1',
    retention: { en: 'Test retention', tr: 'Test saklama' },
  },
  capabilities: {
    ai: true,
    localizedAi: true,
    privateRecipes: true,
    idempotency: true,
    billing: true,
    reports: true,
    consents: true,
    push: true,
    analytics: true,
  },
}
describe('release contracts', () => {
  it('accepts a complete config', () =>
    expect(
      mobileConfigSchema.parse(configFixture).capabilities.privateRecipes,
    ).toBe(true))
  it('rejects missing capability declarations', () =>
    expect(
      mobileConfigSchema.safeParse({
        ...configFixture,
        capabilities: { ai: true },
      }).success,
    ).toBe(false))
  it('rejects insecure legal links', () =>
    expect(
      mobileConfigSchema.safeParse({
        ...configFixture,
        links: {
          ...configFixture.links,
          privacy: 'http://example.com/privacy',
        },
      }).success,
    ).toBe(false))
  it('rejects unknown config versions', () =>
    expect(
      mobileConfigSchema.safeParse({ ...configFixture, schemaVersion: 2 })
        .success,
    ).toBe(false))
  it.each([
    ['1.0.0', '1.0.0', 0],
    ['1.10.0', '1.2.0', 1],
    ['1.0.0', '2.0.0', -1],
  ])('compares semantic numeric versions %s %s', (a, b, n) =>
    expect(compareVersions(a as string, b as string)).toBe(n),
  )
  it('rejects public saved recipes', () =>
    expect(
      historySchema.safeParse({
        recipes: [
          {
            id: '6bceba1d-d181-45cd-9783-2f566a06b47d',
            name: 'Soup',
            ingredients: ['Tomato'],
            instructions: 'Cook',
            macros: null,
            is_public: true,
            created_at: '2026-10-15',
          },
        ],
      }).success,
    ).toBe(false))
  it('accepts private saved recipes', () =>
    expect(
      historySchema.safeParse({
        recipes: [
          {
            id: '6bceba1d-d181-45cd-9783-2f566a06b47d',
            name: 'Soup',
            ingredients: ['Tomato'],
            instructions: 'Cook',
            macros: null,
            is_public: false,
            created_at: '2026-10-15',
          },
        ],
      }).success,
    ).toBe(true))
  it('bounds history to the documented 20', () =>
    expect(
      historySchema.safeParse({ recipes: Array(21).fill({}) }).success,
    ).toBe(false))
  it('rejects malformed meal/recipe ingredients', () =>
    expect(
      recipeResponseSchema.safeParse({
        recipe: 'text',
        structured: { name: 'Soup', ingredients: [null], instructions: 'Cook' },
        macros: null,
      }).success,
    ).toBe(false))
  it('keeps plain text recipe responses', () =>
    expect(
      recipeResponseSchema.safeParse({
        recipe: 'Plain response',
        structured: null,
        macros: null,
      }).success,
    ).toBe(true))
  it('rejects nonsensical nutrition', () =>
    expect(
      recipeResponseSchema.safeParse({
        recipe: 'x',
        structured: null,
        macros: { calories: -1, protein_g: 1, carbs_g: 2, fat_g: 1 },
      }).success,
    ).toBe(false))
  it('does not invent subscription quotas', () =>
    expect(
      membershipSchema.safeParse({ plan: 'premium', status: 'active' }).success,
    ).toBe(false))
  it('rejects unbounded vision output', () =>
    expect(
      visionSchema.safeParse({ ingredients: Array(101).fill('tomato') })
        .success,
    ).toBe(false))
})
