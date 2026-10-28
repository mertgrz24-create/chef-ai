import { describe, it, expect } from '@jest/globals'
import { scrubEvent } from '@/lib/release/telemetry'
import { t, setLocale } from '@/lib/release/locale'
describe('privacy and locale', () => {
  it('removes personal context and exception messages', () => {
    const safe = scrubEvent({
      type: 'error',
      user: { email: 'secret@example.com' },
      request: { headers: { Authorization: 'token' } },
      breadcrumbs: [{ message: 'tomatoes' }],
      extra: { photo: 'base64' },
      contexts: { x: 'secret' },
      exception: {
        values: [
          {
            type: 'Error',
            value: 'password=secret',
            stacktrace: { frames: [] },
          },
        ],
      },
    })
    expect(JSON.stringify(safe)).not.toMatch(
      /secret|tomatoes|base64|Authorization/,
    )
    expect(safe.type).toBe('error')
  })
  it('translates known UI strings but never user content', async () => {
    await setLocale('tr')
    expect(t('Save recipe')).toBe('Tarifi kaydet')
    expect(t('Your password')).toBe('Parolan')
    expect(t('A user’s original recipe name')).toBe(
      'A user’s original recipe name',
    )
    expect(t('%{count} selected', { count: 3 })).toBe('3 seçildi')
    await setLocale('en')
    expect(t('Save recipe')).toBe('Save recipe')
    expect(t('Your password')).toBe('Your password')
  })
})

it('drops unknown telemetry fields but preserves symbolication IDs and handled state', () => {
  const safe = scrubEvent({
    type: 'error', release: 'chef-ai@1.0.0',
    tags: { ingredient: 'private-food' }, attachments: [{ data: 'private-photo' }],
    threads: { values: [{ name: 'private-user' }] }, unknown_sdk_field: 'private-text',
    debug_meta: { images: [{ type:'sourcemap', debug_id:'12345678-1234-1234-1234-123456789abc', code_file:'app:///index.android.bundle?token=private-key', user:'private-user' }], extra:'private-text' },
    exception: { values: [{ type:'Error',value:'private-input',mechanism:{type:'generic',handled:false,data:'private-content'},stacktrace:{frames:[null,{filename:'file:///Users/private-user/source/index.js?secret=private-key',function:'safeFunction',lineno:12,instruction_addr:'0xabc'}]}}] },
  })
  expect(JSON.stringify(safe)).not.toMatch(/private-|unknown_sdk_field|attachments|tags|threads/)
  expect(safe.debug_meta.images[0].debug_id).toBe('12345678-1234-1234-1234-123456789abc')
  expect(safe.debug_meta.images[0].code_file).toBe('app:///index.android.bundle')
  expect(safe.exception.values[0].mechanism.handled).toBe(false)
})
it('handles malformed telemetry and bounds frame collections without throwing', () => {
  expect(() => scrubEvent({exception:{values:'malformed'},debug_meta:{images:null}})).not.toThrow()
  const safe = scrubEvent({exception:{values:[{stacktrace:{frames:Array(500).fill({lineno:1})}}]}})
  expect(safe.exception.values[0].stacktrace.frames).toHaveLength(200)
})
