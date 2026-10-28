const { test, beforeEach } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs'),
  path = require('node:path'),
  Module = require('node:module'),
  ts = require('typescript')
const root = path.resolve(__dirname, '../..')
function load(file, mocks = {}, cache = new Map()) {
  const name = path.resolve(root, file.endsWith('.ts') ? file : `${file}.ts`)
  if (cache.has(name)) return cache.get(name).exports
  const loaded = { exports: {} }
  cache.set(name, loaded)
  const normal = Module.createRequire(name)
  const custom = (key) => {
    if (key in mocks) return mocks[key]
    if (key.startsWith('@/')) return load(key.slice(2), mocks, cache)
    if (key.startsWith('.'))
      return load(
        path.relative(root, path.resolve(path.dirname(name), key)),
        mocks,
        cache,
      )
    return normal(key)
  }
  const source = ts.transpileModule(fs.readFileSync(name, 'utf8'), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
    },
  }).outputText
  new Function('require', 'module', 'exports', source)(
    custom,
    loaded,
    loaded.exports,
  )
  return loaded.exports
}
const validBody = {
  name: 'Soup',
  ingredients: ['tomatoes'],
  instructions: 'Cook.',
  is_public: false,
}
const request = (value, key = 'request-key-123') =>
  new Request('https://api.example.test/api/recipes/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Idempotency-Key': key },
    body: JSON.stringify(value),
  })
function fixture({
  authenticated = true,
  existing = null,
  failure = false,
} = {}) {
  const inserts = []
  const db = {
    auth: {
      getUser: async () => ({
        data: {
          user: authenticated
            ? { id: '00000000-0000-4000-8000-000000000001' }
            : null,
        },
        error: null,
      }),
    },
    from: () => {
      let row
      const query = {
        select() {
          return query
        },
        eq() {
          return query
        },
        insert(data) {
          row = data
          inserts.push(data)
          return query
        },
        maybeSingle: async () => ({
          data: existing,
          error: failure ? { code: 'DB' } : null,
        }),
        single: async () => ({
          data: row
            ? {
                ...row,
                id: '00000000-0000-4000-8000-000000000002',
                created_at: new Date().toISOString(),
              }
            : null,
          error: failure ? { code: 'DB' } : null,
        }),
      }
      return query
    },
  }
  return {
    db,
    inserts,
    mocks: { '@/lib/supabase/api': { createApiClient: async () => db } },
  }
}
test('private save rejects unauthenticated callers', async () => {
  const f = fixture({ authenticated: false })
  const { POST } = load('app/api/recipes/save/route', f.mocks)
  assert.equal((await POST(request(validBody))).status, 401)
  assert.equal(f.inserts.length, 0)
})
test('private save rejects public publication and missing idempotency key', async () => {
  const f = fixture(),
    { POST } = load('app/api/recipes/save/route', f.mocks)
  assert.equal(
    (await POST(request({ ...validBody, is_public: true }))).status,
    422,
  )
  assert.equal((await POST(request(validBody, ''))).status, 400)
  assert.equal(f.inserts.length, 0)
})
test('private save commits false visibility and omits internal keys from response', async () => {
  const f = fixture(),
    { POST } = load('app/api/recipes/save/route', f.mocks)
  const response = await POST(request(validBody))
  assert.equal(response.status, 201)
  const body = await response.json()
  assert.equal(body.recipe.is_public, false)
  assert.equal(f.inserts[0].is_public, false)
  assert.equal(body.recipe.save_request_hash, undefined)
})
test('private save replays the same payload without duplicate insertion', async () => {
  const validation = load('lib/mobile/validation')
  const hash = validation.payloadHash({
    name: 'Soup',
    ingredients: ['tomatoes'],
    instructions: 'Cook.',
    macros: null,
  })
  const f = fixture({ existing: { ...validBody, save_request_hash: hash } }),
    { POST } = load('app/api/recipes/save/route', f.mocks)
  assert.equal((await POST(request(validBody))).status, 200)
  assert.equal(f.inserts.length, 0)
})
test('private save rejects changed payload with reused key', async () => {
  const f = fixture({
      existing: { ...validBody, save_request_hash: 'different' },
    }),
    { POST } = load('app/api/recipes/save/route', f.mocks)
  assert.equal((await POST(request(validBody))).status, 409)
  assert.equal(f.inserts.length, 0)
})
test('private save fails closed when migration/storage is missing', async () => {
  const f = fixture({ failure: true }),
    { POST } = load('app/api/recipes/save/route', f.mocks)
  assert.equal((await POST(request(validBody))).status, 503)
  assert.equal(f.inserts.length, 0)
})
test('bounded JSON parser rejects oversized and nonobject bodies', async () => {
  const { readJson } = load('lib/mobile/validation')
  await assert.rejects(
    readJson(request({ data: 'a'.repeat(100) }), 20),
    /body_too_large/,
  )
  await assert.rejects(readJson(request([])), /invalid_body/)
})
test('token and timezone validation accepts both Expo formats and rejects arbitrary input', () => {
  const v = load('lib/mobile/validation')
  assert.equal(v.validPushToken('ExpoPushToken[abcdefghijklmn]'), true)
  assert.equal(v.validPushToken('ExponentPushToken[abcdefghijklmn]'), true)
  assert.equal(v.validPushToken('https://evil.example'), false)
  assert.equal(v.validTimezone('Europe/Istanbul'), true)
  assert.equal(v.validTimezone('not/a/timezone'), false)
})
test('AI schema rejects arbitrary output, invalid macros and duplicate weekdays', () => {
  const v = load('lib/mobile/output')
  assert.equal(v.validRecipe(validBody), true)
  assert.equal(v.validRecipe({...validBody,servings:0}),false)
  assert.equal(v.validRecipe({...validBody,chefs_note:{unexpected:true}}),false)
  assert.equal(v.validMacros({calories:1,protein_g:1,carbs_g:1,fat_g:1,fiber_g:-1}),false)
  assert.equal(v.validRecipe({...validBody,macros:null},false),false)
  assert.equal(v.validRecipe({ ...validBody, ingredients: [{}] }), false)
  assert.equal(
    v.validRecipe({ ...validBody, macros: { calories: Infinity } }),
    false,
  )
  assert.equal(v.validScan(['a'.repeat(201)]), false)
  assert.equal(
    v.validMeals(
      Array.from({ length: 7 }, () => ({
        day: 'monday',
        breakfast: validBody,
        dinner: validBody,
      })),
    ),
    false,
  )
})
beforeEach(() => {
  process.env.MOBILE_AI_READY = 'true'
  process.env.MOBILE_AI_DAILY_ATTEMPT_LIMIT = '100'
  process.env.MOBILE_AI_CONSENT_VERSION = 'v1'
})
function aiFixture(job) {
  const f = fixture()
  f.mocks['./revenuecat'] = {
    verifiedMembership: async () => ({ plan: 'free', status: 'active' }),
  }
  const calls = []
  f.mocks['@/lib/supabase/admin'] = {
    createAdminClient: () => ({
      rpc: async (name, args) => {
        calls.push({ name, args })
        return { data: name === 'begin_mobile_ai_v2' ? job : name === 'complete_mobile_ai' ? {code:'completed',response:{...args.p_response,resultId:args.p_id},status:args.p_status} : true, error: null }
      },
    }),
  }
  return { ...f, calls, ai: load('lib/mobile/ai', f.mocks) }
}
test('AI guard reserves verified free quota and durably confirms result', async () => {
  const f = aiFixture({ code: 'started', id: 'job' })
  const result = await f.ai.withAi(
    request({ ingredients: ['a'] }),
    'recipes',
    async () =>
      Response.json({ recipe: 'text', structured: null, macros: null }),
  )
  assert.equal(result.status, 200)
  assert.equal(f.calls[0].args.p_limit, 10)
  assert.equal((await result.json()).resultId, 'job')
  assert.equal(f.calls[1].name, 'complete_mobile_ai')
})
test('AI guard replays without calling provider or consuming twice', async () => {
  const f = aiFixture({
    code: 'replay',
    response: { recipe: 'cached' },
    status: 200,
  })
  let called = false
  const result = await f.ai.withAi(request({}), 'recipes', async () => {
    called = true
    return Response.json({})
  })
  assert.equal((await result.json()).recipe, 'cached')
  assert.equal(called, false)
  assert.equal(f.calls.length, 1)
})
test('AI guard enforces consent and quota errors before provider', async () => {
  for (const [code, status] of [
    ['consent_required', 403],
    ['limit_reached', 403],
    ['operation_pending', 409],
    ['rate_limited', 429],
  ]) {
    const f = aiFixture({ code })
    let called = false
    const result = await f.ai.withAi(request({}), 'recipes', async () => {
      called = true
      return Response.json({})
    })
    assert.equal(result.status, status)
    assert.equal(called, false)
  }
})
test('AI guard never invents scan limits or enables untranslated Turkish', async () => {
  delete process.env.MOBILE_FREE_SCAN_LIMIT
  delete process.env.MOBILE_LOCALIZED_AI_READY
  const f = aiFixture({ code: 'started', id: 'job' })
  assert.equal(
    (await f.ai.withAi(request({}), 'scan', async () => Response.json({})))
      .status,
    503,
  )
  const req = request({})
  req.headers.set('X-App-Locale', 'tr')
  assert.equal(
    (await f.ai.withAi(req, 'recipes', async () => Response.json({}))).status,
    503,
  )
  assert.equal(f.calls.length, 0)
})
test('consent acknowledgment fails when durable storage fails', async () => {
  const f = fixture()
  let written = false
  f.mocks['@/lib/supabase/admin'] = {
    createAdminClient: () => ({
      from: () => ({
        upsert: async () => {
          written = true
          return { error: { code: 'DB' } }
        },
      }),
    }),
  }
  const { POST } = load('app/api/privacy/consents/route', f.mocks)
  const result = await POST(
    request({ scope: 'ai', version: 'v1', accepted: true, locale: 'tr' }),
  )
  assert.equal(result.status, 503)
  assert.equal(written, true)
})
test('consent rejects stale versions without writing', async () => {
  const f = fixture()
  let written = false
  f.mocks['@/lib/supabase/admin'] = {
    createAdminClient: () => {
      written = true
      return {}
    },
  }
  const { POST } = load('app/api/privacy/consents/route', f.mocks)
  assert.equal(
    (
      await POST(
        request({ scope: 'ai', version: 'old', accepted: true, locale: 'tr' }),
      )
    ).status,
    400,
  )
  assert.equal(written, false)
})
test('cron rejects missing/wrong authorization and accepts exact secret only', () => {
  process.env.CRON_SECRET = 'test-only-secret'
  const { cronAuthorized } = load('lib/mobile/cron')
  assert.equal(cronAuthorized(new Request('https://example.test')), false)
  assert.equal(
    cronAuthorized(
      new Request('https://example.test', {
        headers: { Authorization: 'Bearer wrong' },
      }),
    ),
    false,
  )
  assert.equal(
    cronAuthorized(
      new Request('https://example.test', {
        headers: { Authorization: 'Bearer test-only-secret' },
      }),
    ),
    true,
  )
  delete process.env.CRON_SECRET
})
test('image MIME claims require the matching binary header', () => {
  const { validImage } = load('lib/mobile/validation')
  assert.equal(validImage(Buffer.from([255, 216, 255]), 'image/jpeg'), true)
  assert.equal(validImage(Buffer.from('not an image'), 'image/jpeg'), false)
  assert.equal(
    validImage(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), 'image/png'),
    true,
  )
})

test('RevenueCat active/cancelled membership stays active until paid expiry; refunds expire immediately', () => {
  process.env.REVENUECAT_ENTITLEMENT_ID = 'premium'
  process.env.REVENUECAT_IOS_MONTHLY_PRODUCT = 'monthly'
  process.env.REVENUECAT_ANDROID_MONTHLY_PRODUCT = 'monthly-android'
  process.env.MOBILE_ENVIRONMENT = 'production'
  const { parseMembership } = load('lib/mobile/membership')
  const now = Date.now(),
    expires = new Date(now + 60000).toISOString()
  const raw = {
    request_date_ms: now,
    subscriber: {
      original_app_user_id: 'owner',
      entitlements: {
        premium: { product_identifier: 'monthly', expires_date: expires },
      },
      subscriptions: {
        monthly: {
          store: 'app_store',
          is_sandbox: false,
          ownership_type: 'PURCHASED',
          unsubscribe_detected_at: 'yesterday',
        },
      },
    },
  }
  assert.equal(parseMembership(raw, 'owner', now).plan, 'premium')
  raw.subscriber.subscriptions.monthly.refunded_at = new Date(now).toISOString()
  assert.equal(parseMembership(raw, 'owner', now).status, 'expired')
})
test('RevenueCat rejects account aliasing, sandbox production grants and unknown annual products', () => {
  const { parseMembership } = load('lib/mobile/membership'),
    now = Date.now()
  const raw = {
    request_date_ms: now,
    subscriber: {
      original_app_user_id: 'owner',
      entitlements: {
        premium: {
          product_identifier: 'monthly',
          expires_date: new Date(now + 60000).toISOString(),
        },
      },
      subscriptions: {
        monthly: {
          store: 'app_store',
          is_sandbox: true,
          ownership_type: 'PURCHASED',
        },
      },
    },
  }
  assert.throws(() => parseMembership(raw, 'other', now), /invalid_membership/)
  assert.throws(() => parseMembership(raw, 'owner', now), /ownership_conflict/)
  raw.subscriber.subscriptions.monthly.is_sandbox = false
  raw.subscriber.entitlements.premium.product_identifier = 'annual'
  assert.throws(() => parseMembership(raw, 'owner', now), /unsupported_product/)
})
test('RevenueCat distinguishes grace and expired billing hold', () => {
  const { parseMembership } = load('lib/mobile/membership'),
    now = Date.now()
  const raw = {
    request_date_ms: now,
    subscriber: {
      original_app_user_id: 'owner',
      entitlements: {
        premium: {
          product_identifier: 'monthly',
          expires_date: new Date(now - 60000).toISOString(),
          grace_period_expires_date: new Date(now + 60000).toISOString(),
        },
      },
      subscriptions: {
        monthly: {
          store: 'app_store',
          is_sandbox: false,
          ownership_type: 'PURCHASED',
          billing_issues_detected_at: 'yesterday',
        },
      },
    },
  }
  assert.equal(parseMembership(raw, 'owner', now).status, 'grace')
  raw.subscriber.entitlements.premium.grace_period_expires_date = null
  assert.equal(parseMembership(raw, 'owner', now).status, 'hold')
})
test('webhook HMAC covers exact bytes and fresh delivery timestamp', (t) => {
  const crypto = require('node:crypto')
  const auth = crypto.randomBytes(32).toString('hex')
  const signingKey = crypto.randomBytes(32).toString('hex')
  const previousAuth = process.env.REVENUECAT_WEBHOOK_AUTH
  const previousSigningKey = process.env.REVENUECAT_WEBHOOK_SIGNING_SECRET
  t.after(() => {
    if (previousAuth === undefined) delete process.env.REVENUECAT_WEBHOOK_AUTH
    else process.env.REVENUECAT_WEBHOOK_AUTH = previousAuth
    if (previousSigningKey === undefined) delete process.env.REVENUECAT_WEBHOOK_SIGNING_SECRET
    else process.env.REVENUECAT_WEBHOOK_SIGNING_SECRET = previousSigningKey
  })
  process.env.REVENUECAT_WEBHOOK_AUTH = auth
  process.env.REVENUECAT_WEBHOOK_SIGNING_SECRET = signingKey
  const { verifyWebhook } = load('lib/mobile/revenuecat', {
    '@/lib/supabase/admin': {},
  })
  const now = Date.now(),
    timestamp = String(Math.floor(now / 1000)),
    raw = Buffer.from('{"event":{"id":"test"}}'),
    sig = crypto
      .createHmac('sha256', signingKey)
      .update(`${timestamp}.`)
      .update(raw)
      .digest('hex'),
    header = `t=${timestamp},v1=${sig}`
  assert.equal(verifyWebhook(raw, header, auth, now), true)
  assert.equal(
    verifyWebhook(Buffer.from('{}'), header, auth, now),
    false,
  )
  assert.equal(verifyWebhook(raw, header, 'wrong', now), false)
  assert.equal(verifyWebhook(raw, header, auth, now + 301000), false)
})
test('analytics refuses user/content fields and never forwards identity', async () => {
  process.env.MOBILE_ANALYTICS_READY = 'true'
  process.env.MOBILE_APP_VERSION = '1.0.0'
  const f = fixture()
  let args
  f.mocks['@/lib/supabase/admin'] = {
    createAdminClient: () => ({
      rpc: async (_name, value) => {
        args = value
        return { data: true, error: null }
      },
    }),
  }
  const { POST } = load('app/api/mobile/analytics/route', f.mocks),
    event = {
      event: 'recipe_saved',
      version: '1.0.0',
      platform: 'ios',
      locale: 'tr',
      result: 'success',
    }
  assert.equal(
    (await POST(request({ ...event, email: 'no@example.test' }))).status,
    400,
  )
  assert.equal(args, undefined)
  assert.equal((await POST(request(event))).status, 200)
  assert.equal(
    Object.keys(args).some((k) => /user|email|content/.test(k)),
    false,
  )
})

test('Next root directory globs use the maintained replacement without braces', () => {
  const fs = require('node:fs')
  const os = require('node:os')
  const { createRequire } = require('node:module')
  const pluginRequire = createRequire(require.resolve('@next/eslint-plugin-next/package.json'))
  const globEntry = pluginRequire.resolve('fast-glob')
  assert.match(fs.readFileSync(globEntry, 'utf8'), /globSync/)
  const lock = require('../../package-lock.json')
  assert.equal(Object.keys(lock.packages).some(key => /(?:^|\/)braces$/.test(key)), false)
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'chef-next-glob-'))
  try {
    for (const name of ['api-one','api-two','other']) fs.mkdirSync(path.join(temporary, name))
    fs.writeFileSync(path.join(temporary, 'api-file'), '')
    const { getRootDirs } = pluginRequire('./dist/utils/get-root-dirs')
    const expected = ['api-one','api-two'].map(name => path.join(temporary,name)).sort()
    const glob = path.join(temporary, 'api-*')
    const context = rootDir => ({cwd:temporary, settings:{ next: rootDir === undefined ? {} : {rootDir} }})
    const normalize = paths => paths.map(p => p.replace(/\/$/,'')).sort()
    assert.deepEqual(normalize(getRootDirs(context(glob))), expected)
    const relative = path.relative(process.cwd(), glob)
    assert.deepEqual(normalize(getRootDirs(context(relative))), expected.map(p => path.relative(process.cwd(), p)).sort())
    assert.deepEqual(normalize(getRootDirs(context([glob]))), expected)
    assert.deepEqual(getRootDirs(context()), [temporary])
    assert.deepEqual(getRootDirs(context(path.join(temporary,'missing-*'))), [])
  } finally { fs.rmSync(temporary, {recursive:true, force:true}) }
})

test('membership reconciliation returns committed newer state rather than an older upstream snapshot', async () => {
  process.env.MOBILE_BILLING_READY = 'true'
  process.env.MOBILE_ENVIRONMENT = 'production'
  process.env.REVENUECAT_SECRET_KEY = 'sk_fixture'
  process.env.MOBILE_PREMIUM_RECIPE_LIMIT = '100'
  process.env.MOBILE_PREMIUM_SCAN_LIMIT = '20'
  process.env.MOBILE_PREMIUM_PLAN_LIMIT = '4'
  const now = Date.now(),
    raw = {
      request_date_ms: now,
      subscriber: {
        original_app_user_id: 'owner',
        entitlements: {
          premium: {
            product_identifier: 'monthly',
            expires_date: new Date(now + 60000).toISOString(),
          },
        },
        subscriptions: {
          monthly: {
            store: 'app_store',
            is_sandbox: false,
            ownership_type: 'PURCHASED',
          },
        },
      },
    }
  const previous = global.fetch
  global.fetch = async () => Response.json(raw)
  try {
    const { reconcileMembership } = load('lib/mobile/revenuecat', {
      '@/lib/supabase/admin': {
        createAdminClient: () => ({
          rpc: async () => ({
            data: {
              plan: 'free',
              status: 'expired',
              expiresAt: null,
              revision: now + 1,
            },
            error: null,
          }),
        }),
      },
    })
    assert.equal(
      (await reconcileMembership('owner', 'fixture-event')).plan,
      'free',
    )
  } finally {
    global.fetch = previous
    process.env.MOBILE_BILLING_READY = 'false'
  }
})
function cleanupFixture(auth) {
  const removed = []
  const db = {
    rpc: async name => {removed.push(name);return {data:{ok:true},error:null}},
    auth: { admin: { getUserById: async () => auth } },
    from: (name) => {
      const q = {
        select: () => q,
        limit: async () => ({
          data: [{ user_id: 'fixture-user' }],
          error: null,
        }),
        delete: () => {
          removed.push(name)
          return q
        },
        eq: () => q,
        lt: async () => ({ error: null }),
      }
      return q
    },
  }
  return {
    removed,
    mocks: { '@/lib/supabase/admin': { createAdminClient: () => db } },
  }
}
test('processor deletion waits for confirmed auth absence and still cleans expired AI content', async () => {
  process.env.CRON_SECRET = 'fixture-cron'
  process.env.MOBILE_REPORT_RETENTION_DAYS = '30'
  process.env.REVENUECAT_SECRET_KEY = 'sk_fixture'
  const f = cleanupFixture({
      data: { user: { id: 'fixture-user' } },
      error: null,
    }),
    previous = global.fetch
  let calls = 0
  global.fetch = async () => {
    calls++
    return Response.json({})
  }
  try {
    const { GET } = load('app/api/mobile/maintenance/route', f.mocks)
    assert.equal(
      (
        await GET(
          new Request('https://example.test', {
            headers: { Authorization: 'Bearer fixture-cron' },
          }),
        )
      ).status,
      200,
    )
    assert.equal(calls, 0)
    assert.ok(f.removed.includes('cleanup_mobile_ai'))
    assert.equal(f.removed.includes('mobile_processor_deletions'), false)
  } finally {
    global.fetch = previous
  }
})
test('processor cleanup preserves outbox on uncertain auth lookup without blocking content expiry', async () => {
  const f = cleanupFixture({ data: { user: null }, error: { status: 503 } }),
    previous = global.fetch
  let calls = 0
  global.fetch = async () => {
    calls++
    return Response.json({})
  }
  try {
    const { GET } = load('app/api/mobile/maintenance/route', f.mocks)
    assert.equal(
      (
        await GET(
          new Request('https://example.test', {
            headers: { Authorization: 'Bearer fixture-cron' },
          }),
        )
      ).status,
      503,
    )
    assert.equal(calls, 0)
    assert.ok(f.removed.includes('cleanup_mobile_ai'))
    assert.equal(f.removed.includes('mobile_processor_deletions'), false)
  } finally {
    global.fetch = previous
  }
})

test('database diagnostics exclude messages, details, hints and free text', () => {
 const { databaseFailure } = load('lib/mobile/logging.ts')
 assert.deepEqual(databaseFailure({code:'23505',message:'private@example.test',details:'secret',hint:'token'}), {code:'23505'})
 assert.deepEqual(databaseFailure({code:'PGRST301'}), {code:'PGRST301'})
 assert.deepEqual(databaseFailure({code:'private@example.test'}), {code:'database_error'})
 assert.deepEqual(databaseFailure(new Error('personal content')), {code:'database_error'})
})

test('staging notice is unavailable in production or a different database', async () => {
  const oldEnv = process.env.MOBILE_ENVIRONMENT
  const oldUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  try {
    const { GET } = load('app/api/mobile/staging-info/route')
    process.env.MOBILE_ENVIRONMENT = 'production'
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://vcyqtbzhfanbpclfhibv.supabase.co'
    assert.equal((await GET()).status, 404)
    process.env.MOBILE_ENVIRONMENT = 'staging'
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://other-project.supabase.co'
    assert.equal((await GET()).status, 404)
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://vcyqtbzhfanbpclfhibv.supabase.co'
    const response = await GET()
    assert.equal(response.status, 200)
    assert.equal(response.headers.get('cache-control'), 'no-store')
    assert.match(response.headers.get('x-robots-tag'), /noindex/)
    const text = await response.text()
    assert.match(text, /not a production privacy policy/)
    assert.match(text, /Purchases, push and usage analytics are disabled/)
  } finally {
    for (const [key, value] of [['MOBILE_ENVIRONMENT', oldEnv], ['NEXT_PUBLIC_SUPABASE_URL', oldUrl]]) {
      if (value === undefined) delete process.env[key]
      else process.env[key] = value
    }
  }
})


test('Gemini model is explicit server configuration and preserves the existing default', async () => {
  const previous = process.env.GEMINI_MODEL
  try {
    for (const selected of [undefined, 'gemini-3.5-flash']) {
      if (selected) process.env.GEMINI_MODEL = selected
      else delete process.env.GEMINI_MODEL
      let model, mime
      const { generateRecipeWithGemini } = load('lib/ai/gemini', {
        '@/lib/mobile/provider-usage':{dispatchProviderCall:work=>work()},
        '@google/generative-ai': { GoogleGenerativeAI: class {
          getGenerativeModel(config) {
            model = config.model
            mime = config.generationConfig.responseMimeType
            return { generateContent: async () => ({ response: {
              text: () => JSON.stringify({ name: 'Test', ingredients: ['1 tomato'], instructions: 'Cook.' }),
              usageMetadata: {},
            } }) }
          }
        } },
      })
      await generateRecipeWithGemini(['tomato'])
      assert.equal(model, selected || 'gemini-2.5-pro')
      assert.equal(mime, 'application/json')
    }
  } finally {
    if (previous === undefined) delete process.env.GEMINI_MODEL
    else process.env.GEMINI_MODEL = previous
  }
})

test('staging provider diagnostics never include exception messages or URLs', () => {
  const old = process.env.MOBILE_ENVIRONMENT, oldModel = process.env.GEMINI_MODEL
  const warn = console.warn, lines = []
  console.warn = (line) => lines.push(line)
  try {
    const { providerFailure } = load('lib/mobile/diagnostics')
    process.env.MOBILE_ENVIRONMENT = 'staging'
    process.env.GEMINI_MODEL = 'gemini-3.1-flash-lite'
    providerFailure('recipe', {status:503, message:'private-content-and-token', url:'https://private.test/?key=secret'})
    assert.deepEqual(JSON.parse(lines[0]), {event:'staging_provider_failure', operation:'recipe', reason:'unclassified', status:503, model:'gemini-3.1-flash-lite'})
    assert.ok(!lines[0].includes('private'))
    process.env.MOBILE_ENVIRONMENT = 'production'
    providerFailure('recipe', new Error('private'))
    assert.equal(lines.length, 1)
  } finally {
    console.warn = warn
    for (const [key, value] of [['MOBILE_ENVIRONMENT', old], ['GEMINI_MODEL', oldModel]]) {
      if (value === undefined) delete process.env[key]
      else process.env[key] = value
    }
  }
})


test('provider errors expose fixed categories without keys or content', async () => {
  const { providerError } = load('lib/mobile/provider-error')
  for (const [status, code, http] of [[503,'ai_provider_busy',503],[429,'ai_provider_quota',503],[402,'ai_provider_quota',503],[403,'ai_provider_configuration',503],[404,'ai_provider_configuration',503],[418,'generation_failed',502]]) {
    const response = providerError({status, message:'secret prompt', url:'https://private.test/?key=secret'})
    assert.equal(response.status, http)
    assert.deepEqual(await response.json(), {code})
  }
  const error = new Error('secret prompt'); error.name = 'AbortError'
  assert.equal((await providerError(error).json()).code, 'ai_provider_timeout')
})

test('account deletion authenticates, refuses storage failures and only deletes the caller', async () => {
  const oldKey = process.env.REVENUECAT_SECRET_KEY
  delete process.env.REVENUECAT_SECRET_KEY
  try {
    for (const scenario of ['unauthenticated','membership_failure','queue_failure','delete_failure','success']) {
      const deleted = [], queued = []
      const query = {
        select: () => query, eq: () => query,
        maybeSingle: async () => ({data: scenario === 'queue_failure' ? {user_id:'caller'} : null, error: scenario === 'membership_failure' ? {} : null}),
        upsert: async (row) => { queued.push(row); return {error: scenario === 'queue_failure' ? {} : null} },
      }
      const { DELETE } = load('app/api/account/route', {
        '@/lib/supabase/api': {createApiClient: async () => ({auth:{getUser:async () => ({data:{user:scenario === 'unauthenticated' ? null : {id:'caller'}},error:null})}})},
        '@/lib/supabase/admin': {createAdminClient: () => ({from:() => query,auth:{admin:{deleteUser:async (id) => {deleted.push(id);return {error:scenario === 'delete_failure' ? {code:'fixture_failure'} : null}}}}})},
      })
      const original = console.error; console.error = () => {}
      let response
      try { response = await DELETE() } finally { console.error = original }
      assert.equal(response.status, {unauthenticated:401,membership_failure:503,queue_failure:503,delete_failure:500,success:200}[scenario])
      assert.deepEqual(deleted, ['success','delete_failure'].includes(scenario) ? ['caller'] : [])
      if (scenario === 'success') assert.deepEqual(await response.json(), {ok:true})
      if (scenario === 'queue_failure') assert.equal(queued[0].user_id, 'caller')
    }
  } finally { if(oldKey === undefined) delete process.env.REVENUECAT_SECRET_KEY; else process.env.REVENUECAT_SECRET_KEY=oldKey }
})


test('AI guard preserves only approved provider error codes and stores the failure once', async () => {
  for (const code of ['ai_provider_busy', 'ai_provider_quota', 'ai_provider_timeout', 'private arbitrary string']) {
    const f = aiFixture({code:'started',id:'job'})
    let count = 0
    const response = await f.ai.withAi(request({}), 'recipes', async () => {
      count++; return Response.json({code, error:'private content'}, {status:503})
    })
    const expected = code.startsWith('ai_provider_') ? code : 'generation_failed'
    assert.equal(count, 1)
    if(code==='ai_provider_timeout'){assert.equal(response.status,409);assert.equal(f.calls.length,1);continue}
    assert.equal(response.status, 503)
    assert.deepEqual(await response.json(), {code:expected,resultId:'job'})
    assert.equal(f.calls[1].args.p_response.code, expected)
  }
})

test('prepared auth templates retain Supabase verified redirects and do not interpolate user content', () => {
  for (const name of ['confirmation','recovery']) {
    const html = fs.readFileSync(path.join(root,'supabase/email-templates',name+'.html'),'utf8')
    assert.match(html, /href="{{ \.ConfirmationURL }}"/)
    assert.match(html, /Chef-AI/)
    assert.doesNotMatch(html, /<script|<img|\.Data|\.SiteURL|access_token|refresh_token/)
  }
})

test('Gemini rejects empty recipe output instead of confirming an empty success', async () => {
  const { generateRecipeWithGemini } = load('lib/ai/gemini', {
        '@/lib/mobile/provider-usage':{dispatchProviderCall:work=>work()},
    '@google/generative-ai': {GoogleGenerativeAI: class {
      getGenerativeModel() { return {generateContent: async () => ({response:{text:()=>'', usageMetadata:{}}})} }
    }},
  })
  await assert.rejects(generateRecipeWithGemini(['tomato']), /invalid_ai_output/)
})

test('Gemini rejects malformed and schema-invalid output instead of returning raw text as a recipe', async () => {
  let output
  const { generateRecipeWithGemini } = load('lib/ai/gemini', {
        '@/lib/mobile/provider-usage':{dispatchProviderCall:work=>work()},
    '@google/generative-ai': { GoogleGenerativeAI: class {
      getGenerativeModel() { return { generateContent: async () => ({ response: { text: () => output, usageMetadata: {} } }) } }
    } },
  })
  for (const invalid of [
    'This is not a recipe', '{}', 'null', '[]',
    JSON.stringify({ ...validBody, ingredients: { length: 1 } }),
    JSON.stringify({ ...validBody, instructions: '' }),
    JSON.stringify({ ...validBody, macros: { calories: -1 } }),
    JSON.stringify({ ...validBody, name: 'x'.repeat(201) }),
  ]) {
    output = invalid
    await assert.rejects(generateRecipeWithGemini(['tomato']), /invalid_ai_output/)
  }
  for (const valid of [JSON.stringify(validBody), '```json\n' + JSON.stringify(validBody) + '\n```']) {
    output = valid
    const result = await generateRecipeWithGemini(['tomato'])
    assert.equal(result.structured.name, validBody.name)
    assert.match(result.text, /Soup/)
  }
})


test('staging retries only a definite provider 503 once within the shared budget', async () => {
  const oldEnv=process.env.MOBILE_ENVIRONMENT, oldRetry=process.env.GEMINI_RETRY_503
  const { recoverProvider503 }=load('lib/ai/transient')
  try {
    process.env.MOBILE_ENVIRONMENT='staging';process.env.GEMINI_RETRY_503='true'
    let time=0, calls=0;const budgets=[]
    const timing={now:()=>time,random:()=>0,wait:async(ms)=>{time+=ms}}
    const result=await recoverProvider503(async(timeout)=>{budgets.push(timeout);calls++;time+=1000;if(calls===1)throw {status:503};return 'confirmed'},timing)
    assert.equal(result,'confirmed');assert.equal(calls,2);assert.deepEqual(budgets,[110000,107000])
    calls=0
    await assert.rejects(recoverProvider503(async()=>{calls++;throw {status:503}},timing))
    assert.equal(calls,2)
    for(const error of [{status:429},{status:402},{status:500},new Error('network'),Object.assign(new Error('timeout'),{name:'AbortError'})]){
      calls=0;await assert.rejects(recoverProvider503(async()=>{calls++;throw error},timing));assert.equal(calls,1)
    }
    calls=0;time=0
    await assert.rejects(recoverProvider503(async()=>{calls++;time+=105000;throw {status:503}},timing));assert.equal(calls,1)
    process.env.MOBILE_ENVIRONMENT='production';calls=0
    await assert.rejects(recoverProvider503(async()=>{calls++;throw {status:503}},timing));assert.equal(calls,1)
  } finally {
    for(const [key,value] of [['MOBILE_ENVIRONMENT',oldEnv],['GEMINI_RETRY_503',oldRetry]]){
      if(value===undefined)delete process.env[key];else process.env[key]=value
    }
  }
})


test('weekly menu distinguishes absent data from database failures without leaking diagnostics', async () => {
  const plan = {id:'fixture-plan',meals:[]}
  for (const [result,status] of [
    [{data:null,error:null},404],
    [{data:null,error:{code:'08006',message:'sensitive diagnostics'}},500],
    [{data:null,error:{code:'PGRST116',details:'sensitive diagnostics'}},500],
    [{data:plan,error:null},200],
  ]) {
    const filters=[]
    const query={select(){return this},eq(...args){filters.push(args);return this},maybeSingle:async()=>result}
    const route=load('app/api/meal-plan/route', {
      '@/lib/supabase/api':{createApiClient:async()=>({
        auth:{getUser:async()=>({data:{user:{id:'caller'}},error:null})},from:()=>query,
      })},
    })
    const response=await route.GET()
    assert.equal(response.status,status)
    assert.deepEqual(filters[0],['user_id','caller'])
    const body=await response.json()
    assert.doesNotMatch(JSON.stringify(body),/sensitive diagnostics/)
    if(status===200)assert.deepEqual(body,{plan})
  }
  const route=load('app/api/meal-plan/route',{
    '@/lib/supabase/api':{createApiClient:async()=>({
      auth:{getUser:async()=>({data:{user:null},error:null})},
      from:()=>{throw new Error('unauthenticated database access')},
    })},
  })
  assert.equal((await route.GET()).status,401)
})


test('legacy JSON writes reject oversized and nonobject bodies before database mutation', async () => {
  for (const [file,method] of [['pantry','POST'],['profile','PUT'],['referral','POST'],['meals-eaten','POST']]) {
    for (const body of ['null','[]',JSON.stringify({value:'x'.repeat(65000)})]) {
      let touched=false
      const route=load('app/api/'+file+'/route',{
        '@/lib/supabase/api':{createApiClient:async()=>({
          auth:{getUser:async()=>({data:{user:{id:'caller'}},error:null})},
          from:()=>{touched=true;throw new Error('unexpected write')},
          rpc:()=>{touched=true;throw new Error('unexpected RPC')},
        })},
      })
      const response=await route[method](new Request('https://example.test/api/'+file,{method,body}))
      assert.equal(response.status,400);assert.equal(touched,false)
    }
  }
})
test('pantry validates real dates and bounds ingredient/quantity fields', async()=>{
  const route=load('app/api/pantry/route',{
    '@/lib/supabase/api':{createApiClient:async()=>({
      auth:{getUser:async()=>({data:{user:{id:'caller'}},error:null})},
      from:()=>{throw new Error('invalid input reached storage')},
    })},
  })
  for(const body of [
    {name:'Tomato',expiry_date:'2026-02-30'},
    {name:'x'.repeat(201),expiry_date:'2026-10-16'},
    {name:'Tomato',expiry_date:'2026-10-16',quantity:'x'.repeat(101)},
    {name:'Tomato',expiry_date:'2026-10-16',quantity:123},
  ])assert.equal((await route.POST(request(body))).status,400)
  const {validCalendarDate}=load('lib/mobile/validation')
  assert.equal(validCalendarDate('2028-02-29'),true)
  assert.equal(validCalendarDate('2026-02-29'),false)
})
test('profile rejects unbounded goals and diet text before any update',async()=>{
  const route=load('app/api/profile/route',{
    '@/lib/supabase/api':{createApiClient:async()=>({
      auth:{getUser:async()=>({data:{user:{id:'caller'}},error:null})},
      from:()=>{throw new Error('invalid profile reached storage')},
    })},
  })
  for(const body of ['{"daily_calorie_goal":1e999}',JSON.stringify({diet_type:'x'.repeat(2001)}),JSON.stringify({water_goal_l:100001}),JSON.stringify({water_goal_l:100}),JSON.stringify({water_goal_l:0.01}),JSON.stringify({protein_goal_g:1.5})])
    assert.equal((await route.PUT(new Request('https://example.test/api/profile',{method:'PUT',body}))).status,400)
})
test('maintenance misconfiguration fails before deleting anything',async()=>{
  const before=process.env.MOBILE_REPORT_RETENTION_DAYS;delete process.env.MOBILE_REPORT_RETENTION_DAYS
  try{
    const route=load('app/api/mobile/maintenance/route',{
      '@/lib/mobile/cron':{cronAuthorized:()=>true},
      '@/lib/supabase/admin':{createAdminClient:()=>{throw new Error('storage accessed before config validation')}},
    })
    const response=await route.GET(new Request('https://example.test/api/mobile/maintenance'))
    assert.equal(response.status,503)
    assert.deepEqual(await response.json(),{code:'retention_configuration_required'})
  }finally{if(before===undefined)delete process.env.MOBILE_REPORT_RETENTION_DAYS;else process.env.MOBILE_REPORT_RETENTION_DAYS=before}
})

test('maintained PostCSS pipeline preserves recipe styles without the legacy glob dependency', async () => {
  const fs = require('node:fs')
  const postcss = require('postcss')
  const tailwind = require('@tailwindcss/postcss')
  const root = path.resolve(__dirname, '../..')
  const from = path.join(root, 'app/globals.css')
  const result = await postcss([tailwind({ base: root })]).process(fs.readFileSync(from,'utf8'), { from })
  assert.doesNotMatch(result.css, /@tailwind\b/)
  const rules = []
  result.root.walkRules(rule => rules.push(rule))
  const declaration = (selector, property) => {
    const rule = rules.find(rule => rule.selector === selector)
    assert.ok(rule, `Missing style ${selector}`)
    return rule.nodes.find(node => node.prop === property)?.value
  }
  assert.equal(declaration('.flex','display'), 'flex')
  assert.ok(declaration('.p-6','padding'))
  assert.ok(declaration('.shadow-xs','box-shadow'))
  assert.equal(declaration('.shrink-0','flex-shrink'), '0')
  assert.equal(declaration('.bg-\\[var\\(--bg\\)\\]','background-color'), 'var(--bg)')
  assert.equal(declaration('.text-\\[var\\(--text-primary\\)\\]','color'), 'var(--text-primary)')
  assert.match(result.css, /--brand:\s*#1e3a2f/i)
  assert.match(result.css, /--accent:\s*#cdf23e/i)
  assert.match(result.css, /:focus-visible/)
  const reset = rules.find(rule => rule.selector === '*,\n*::before,\n*::after')
  assert.ok(reset)
  assert.equal(reset.parent.name, 'layer')
  assert.equal(reset.parent.params, 'base')
})

function pantryFixture(owner='owner') {
  const rows=[{id:'00000000-0000-4000-8000-000000000001',user_id:'owner',name:'tomato',quantity:'2',expiry_date:'2099-01-01',created_at:'',revision:0}]
  const db={auth:{getUser:async()=>({data:{user:owner?{id:owner}:null},error:null})},from:()=>{
    const filters={},q={eq(key,value){filters[key]=value;return q},select(){return q},update(patch){q.patch=patch;return q},maybeSingle:async()=>{
      const row=rows.find(r=>Object.entries(filters).every(([k,v])=>r[k]===v))
      if(row&&q.patch)Object.assign(row,q.patch,{revision:row.revision+1})
      return {data:row?{...row}:null,error:null}
    }};return q
  }}
  return {rows,mocks:{'@/lib/supabase/api':{createApiClient:async()=>db}}}
}
const pantryBody={name:'updated tomato',quantity:null,expiry_date:'2099-02-01',expectedRevision:0}
const pantryParams={params:Promise.resolve({id:'00000000-0000-4000-8000-000000000001'})}
test('D: concurrent PATCH with the same revision returns one 200 and one 409',async()=>{
  const f=pantryFixture(),{PATCH}=load('app/api/pantry/[id]/route',f.mocks)
  const responses=await Promise.all([PATCH(request(pantryBody),pantryParams),PATCH(request({...pantryBody,name:'other'}),pantryParams)])
  assert.deepEqual(responses.map(r=>r.status).sort(),[200,409])
  assert.equal((await responses.find(r=>r.status===409).json()).code,'revision_conflict')
  assert.equal(f.rows[0].revision,1)
})
test('D: PATCH rejects cross-user access, unauthenticated callers and invalid fields',async()=>{
  for(const [owner,status] of [['other',404],['',401]]){
    const f=pantryFixture(owner),{PATCH}=load('app/api/pantry/[id]/route',f.mocks)
    assert.equal((await PATCH(request(pantryBody),pantryParams)).status,status)
    assert.equal(f.rows[0].revision,0)
  }
  const f=pantryFixture(),{PATCH}=load('app/api/pantry/[id]/route',f.mocks)
  for(const patch of [{name:''},{quantity:'a'.repeat(101)},{expiry_date:'2026-02-30'},{expectedRevision:-1},{user_id:'other'}])
    assert.equal((await PATCH(request({...pantryBody,...patch}),pantryParams)).status,400)
  assert.equal(f.rows[0].revision,0)
})

test('F observation: both existing 503 attempts are measured; no added retry or content logging',async()=>{
  const logs=[],usage=load('lib/mobile/provider-usage'),{recoverProvider503}=load('lib/ai/transient')
  process.env.MOBILE_ENVIRONMENT='staging';process.env.GEMINI_RETRY_503='true'
  let calls=0,time=0
  const clock=()=>time
  const result=await usage.observeProviderOperation('00000000-0000-4000-8000-000000000001','recipes',()=>recoverProvider503(()=>usage.measureProviderCall(async()=>{
    calls++;time+=10
    if(calls===1)throw Object.assign(new Error('private prompt/key'),{status:503})
    return {response:{usageMetadata:{promptTokenCount:100,candidatesTokenCount:20,thoughtsTokenCount:5,cachedContentTokenCount:30,totalTokenCount:125},private:'private-photo'}}
  },'gemini-fixture',record=>logs.push(record),clock),{now:clock,random:()=>0,wait:async ms=>{time+=ms}}))
  assert.equal(calls,2);assert.equal(logs.filter(r=>r.phase==='started').length,2)
  assert.equal(logs.filter(r=>r.phase==='finished').length,2)
  assert.deepEqual(logs.filter(r=>r.phase==='started').map(r=>r.attempt),[1,2])
  assert.equal(logs.at(-1).totalTokens,125);assert.equal(logs.at(-1).inputTokens,100)
  assert.equal(logs.at(-1).estimatedCharge,null);assert.equal(logs[1].inputTokens,null)
  assert.ok(result.response);assert.doesNotMatch(JSON.stringify(logs),/private/)
})
test('F observation: missing metadata stays unknown and observer failure cannot retry or fail a successful call',async()=>{
  const {measureProviderCall}=load('lib/mobile/provider-usage'),logs=[]
  let calls=0
  const result=await measureProviderCall(async()=>{calls++;return {response:{}}},'gemini-fixture',r=>logs.push(r))
  assert.ok(result.response);assert.equal(calls,1);assert.equal(logs.at(-1).inputTokens,null)
  await measureProviderCall(async()=>{calls++;return 'ok'},'gemini-fixture',()=>{throw Error('sink offline')})
  assert.equal(calls,2)
})

test('F observation covers all five existing Gemini entry points without network',async()=>{
  let calls=0
  const logs=[]
  const fake={GoogleGenerativeAI:class{getGenerativeModel(){return {generateContent:async()=>{calls++;return {response:{text:()=>JSON.stringify({name:'fixture',ingredients:['tomato'],instructions:'Cook.'}),usageMetadata:{promptTokenCount:4,candidatesTokenCount:2,totalTokenCount:6}}}}}}}}
  const usage=load('lib/mobile/provider-usage')
  const gemini=load('lib/ai/gemini',{'@google/generative-ai':fake,'@/lib/mobile/provider-usage':{dispatchProviderCall:(work,model)=>usage.measureProviderCall(work,model,record=>logs.push(record))}})
  await Promise.allSettled([
    gemini.generateRecipeWithGemini(['tomato']),gemini.generateWeeklyMealPlan(),gemini.generateSingleMeal('monday','breakfast'),
    gemini.modifyRecipe({name:'fixture',ingredients:['tomato'],instructions:'Cook.'},'fixture'),gemini.analyzeIngredients('fixture-bytes','image/jpeg')
  ])
  assert.equal(calls,5);assert.equal(logs.filter(r=>r.phase==='finished').length,5)
})

test('E lifecycle preserves existing two-dispatch retry and one user reservation',async()=>{
  const f=aiFixture({code:'started',id:'job'}),{recoverProvider503}=load('lib/ai/transient')
  process.env.MOBILE_ENVIRONMENT='staging';process.env.GEMINI_RETRY_503='true'
  let sdkCalls=0,clock=0
  const response=await f.ai.withAi(request({ingredients:['fixture']}),'recipes',async()=>{
    await recoverProvider503(async()=>{sdkCalls++;if(sdkCalls===1)throw {status:503};return 'ok'}, {now:()=>clock,wait:async ms=>{clock+=ms},random:()=>0})
    return Response.json({recipe:'fixture'})
  })
  assert.equal(response.status,200)
  assert.equal(sdkCalls,2)
  assert.equal(f.calls.filter(call=>call.name==='begin_mobile_ai_v2').length,1)
  // Documents the unresolved acceptance gap. Do not silently redefine approved counters.
})

test('F operational summary deduplicates log transport repeats and preserves unknown costs/tokens',()=>{
  const {summarize}=require('./summarize-provider-usage.cjs'),base={event:'ai_provider_attempt',jobId:'00000000-0000-4000-8000-000000000001',operation:'recipes',requestedModel:'gemini-fixture',attempt:1}
  const finished={...base,phase:'finished',outcome:'response',inputTokens:12,outputTokens:3,totalTokens:15,private:'never expose'}
  const summary=summarize([{...base,phase:'started'},finished,finished,{...base,attempt:2,phase:'started'}])
  assert.equal(summary.groups[0].observedAttempts,2)
  assert.deepEqual(summary.groups[0].tokens.inputTokens,{knownTotal:12,unknownAttempts:1})
  assert.deepEqual(summary.groups[0].tokens.thinkingTokens,{knownTotal:null,unknownAttempts:2})
  assert.equal(summary.groups[0].estimatedCharge,null);assert.equal(summary.groups[0].billedCharge,null)
  assert.doesNotMatch(JSON.stringify(summary),/never expose|private/)
})

test('operational summary CLI accepts JSONL data and preserves normal, malformed and empty summaries',()=>{
  const {spawnSync}=require('node:child_process')
  const cli=path.join(__dirname,'summarize-provider-usage.cjs')
  const record={event:'ai_provider_attempt',jobId:'00000000-0000-4000-8000-000000000001',operation:'recipes',requestedModel:'gemini-fixture',attempt:1,phase:'finished',inputTokens:12,private:'never expose'}
  const input=[JSON.stringify(record),JSON.stringify(record),'not JSON','',JSON.stringify({...record,attempt:2,inputTokens:null})].join('\r\n')
  const result=spawnSync(process.execPath,[cli],{input,encoding:'utf8',timeout:2000,shell:false})
  assert.equal(result.status,0,result.stderr)
  const summary=JSON.parse(result.stdout)
  assert.equal(summary.malformedLines,1)
  assert.equal(summary.groups[0].observedAttempts,2)
  assert.deepEqual(summary.groups[0].tokens.inputTokens,{knownTotal:12,unknownAttempts:1})
  assert.equal(summary.groups[0].estimatedCharge,null)
  assert.doesNotMatch(result.stdout,/never expose|private/)
  const empty=spawnSync(process.execPath,[cli],{input:'',encoding:'utf8',timeout:2000,shell:false})
  assert.equal(empty.status,0)
  assert.deepEqual(JSON.parse(empty.stdout).groups,[])
  assert.equal(JSON.parse(empty.stdout).malformedLines,0)
})

test('operational summary CLI rejects all path arguments, including traversal and symlinks',()=>{
  const {spawnSync}=require('node:child_process')
  const temp=fs.mkdtempSync(path.join(require('node:os').tmpdir(),'chef-summary-'))
  try{
    fs.mkdirSync(path.join(temp,'reports'));fs.mkdirSync(path.join(temp,'reports-sibling'))
    const file=path.join(temp,'reports-sibling','metadata.jsonl')
    fs.writeFileSync(file,JSON.stringify({event:'ai_provider_attempt',phase:'started',jobId:'00000000-0000-4000-8000-000000000001',attempt:1})+'\n')
    fs.symlinkSync(file,path.join(temp,'reports','alias.jsonl'))
    for(const argument of [file,'../reports-sibling/metadata.jsonl','alias.jsonl','missing.jsonl','--file']){
      const result=spawnSync(process.execPath,[path.join(__dirname,'summarize-provider-usage.cjs'),argument],{
        cwd:path.join(temp,'reports'),input:'',encoding:'utf8',timeout:2000,shell:false,
      })
      assert.equal(result.status,1)
      assert.equal(result.stdout,'')
      assert.match(result.stderr,/File arguments are not accepted/)
      assert.doesNotMatch(result.stderr,/ENOENT|EACCES|ai_provider_attempt/)
    }
  }finally{fs.rmSync(temp,{recursive:true,force:true})}
})


test('F observer cannot turn unreadable SDK metadata into a failed provider response',async()=>{
  const {measureProviderCall}=load('lib/mobile/provider-usage'),records=[]
  const response={get usageMetadata(){throw Error('metadata unavailable')}}
  const result={response}
  assert.equal(await measureProviderCall(async()=>result,'gemini-fixture',record=>records.push(record)),result)
  assert.equal(records.at(-1).outcome,'response')
  assert.equal(records.at(-1).inputTokens,null)
})

test('E each existing SDK dispatch claims a general attempt, retries consume two attempts but one user credit',async()=>{
  const f=aiFixture({code:'started',id:'00000000-0000-4000-8000-000000000001'}),cache=new Map()
  process.env.MOBILE_ENVIRONMENT='staging';process.env.GEMINI_RETRY_503='true'
  let sdkCalls=0
  f.mocks['@google/generative-ai']={GoogleGenerativeAI:class{getGenerativeModel(){return {generateContent:async()=>{
    sdkCalls++;if(sdkCalls===1)throw {status:503}
    return {response:{text:()=>JSON.stringify({name:'Fixture',ingredients:['tomato'],instructions:'Cook.'}),usageMetadata:{promptTokenCount:4,candidatesTokenCount:2,totalTokenCount:6}}}
  }}}}}
  const real=load('lib/ai/transient')
  f.mocks['./transient']={recoverProvider503:work=>real.recoverProvider503(work,{now:()=>0,wait:async()=>{},random:()=>0})}
  const ai=load('lib/mobile/ai',f.mocks,cache),gemini=load('lib/ai/gemini',f.mocks,cache)
  const response=await ai.withAi(request({}),'recipes',async()=>Response.json(await gemini.generateRecipeWithGemini(['tomato'])))
  assert.equal(response.status,200);assert.equal(sdkCalls,2)
  assert.equal(f.calls.filter(c=>c.name==='begin_mobile_ai_v2').length,1)
  assert.deepEqual(f.calls.filter(c=>c.name==='claim_mobile_ai_attempt').map(c=>c.args.p_attempt),[1,2])
  assert.equal(f.calls.filter(c=>c.name==='record_mobile_ai_attempt').length,2)
  assert.equal(f.calls.filter(c=>c.name==='complete_mobile_ai').length,1)
})

test('E an unconfirmed/denied dispatch permission never calls or retries the SDK',async()=>{
  const f=aiFixture({code:'started',id:'00000000-0000-4000-8000-000000000001'}),cache=new Map()
  let sdkCalls=0
  const previous=f.mocks['@/lib/supabase/admin'].createAdminClient()
  f.mocks['@/lib/supabase/admin']={createAdminClient:()=>({rpc:async(name,args)=>name==='claim_mobile_ai_attempt'?{data:false,error:null}:previous.rpc(name,args)})}
  f.mocks['@google/generative-ai']={GoogleGenerativeAI:class{getGenerativeModel(){return {generateContent:async()=>{sdkCalls++;throw Error('must not dispatch')}}}}}
  const ai=load('lib/mobile/ai',f.mocks,cache),gemini=load('lib/ai/gemini',f.mocks,cache)
  const response=await ai.withAi(request({}),'recipes',async()=>Response.json(await gemini.generateRecipeWithGemini(['tomato'])))
  assert.equal(response.status,503);assert.equal(sdkCalls,0)
})

test('E status recovery uses authenticated owner and cannot dispatch AI',async()=>{
  for(const authenticated of [true,false]) {
    const f=fixture({authenticated}),calls=[]
    f.mocks['@/lib/supabase/admin']={createAdminClient:()=>({rpc:async(name,args)=>{calls.push({name,args});return {data:{state:'completed',status:200,response:{recipe:'fixture'}},error:null}}})}
    const {GET}=load('app/api/mobile/ai-status/route',f.mocks)
    const response=await GET(new Request('https://example.test/api/mobile/ai-status?operation=recipes',{headers:{'Idempotency-Key':require('node:crypto').randomUUID()}}))
    assert.equal(response.status,authenticated?200:401)
    if(authenticated){assert.equal(calls[0].name,'mobile_ai_status');assert.equal(calls[0].args.p_user,'00000000-0000-4000-8000-000000000001');assert.equal(response.headers.get('Cache-Control'),'no-store')}
    else assert.equal(calls.length,0)
  }
})

test('E status recovery rejects missing keys/invalid operations and unavailable migration',async()=>{
  const f=fixture();let calls=0
  f.mocks['@/lib/supabase/admin']={createAdminClient:()=>({rpc:async()=>{calls++;return {data:null,error:{code:'PGRST202'}}}})}
  const {GET}=load('app/api/mobile/ai-status/route',f.mocks)
  assert.equal((await GET(new Request('https://example.test/api/mobile/ai-status?operation=recipes'))).status,400)
  assert.equal((await GET(new Request('https://example.test/api/mobile/ai-status?operation=unapproved',{headers:{'Idempotency-Key':require('node:crypto').randomUUID()}}))).status,400)
  assert.equal(calls,0)
  assert.equal((await GET(new Request('https://example.test/api/mobile/ai-status?operation=recipes',{headers:{'Idempotency-Key':require('node:crypto').randomUUID()}}))).status,503)
})

test('E quota reads reconcile expired jobs before reporting remaining rights, without AI',async()=>{
  process.env.MOBILE_FREE_SCAN_LIMIT='3';process.env.MOBILE_FREE_PLAN_LIMIT='2'
  const f=fixture(),steps=[]
  f.mocks['@/lib/mobile/revenuecat']={verifiedMembership:async()=>({plan:'free',status:'active',expiresAt:null})}
  f.mocks['@/lib/supabase/admin']={createAdminClient:()=>({
    rpc:async(name,args)=>{steps.push(name);assert.equal(args.p_user,'00000000-0000-4000-8000-000000000001');return {data:null,error:null}},
    from:name=>{steps.push(name);const q={select:()=>q,eq:()=>q,then:resolve=>resolve({data:[{kind:'recipes',used:0}],error:null})};return q},
  })}
  const {GET}=load('app/api/billing/status/route',f.mocks)
  const response=await GET()
  assert.equal(response.status,200)
  assert.deepEqual(steps,['reconcile_mobile_ai_user','mobile_ai_usage'])
  assert.equal((await response.json()).quotas.recipes.used,0)
})

test('E provider timeout/network uncertainty stays pending until reconciliation, never immediate refund',async()=>{
  for(const code of ['ai_provider_timeout','ai_provider_uncertain']) {
    const f=aiFixture({code:'started',id:'job'})
    const response=await f.ai.withAi(request({}),'recipes',async()=>Response.json({code},{status:504}))
    assert.equal(response.status,409);assert.deepEqual(await response.json(),{code:'operation_pending'})
    assert.equal(f.calls.filter(c=>c.name==='complete_mobile_ai').length,0)
  }
})

test('E existing 503 retry cannot dispatch a second SDK call when its permit is denied',async()=>{
  const f=aiFixture({code:'started',id:'00000000-0000-4000-8000-000000000001'}),cache=new Map()
  process.env.MOBILE_ENVIRONMENT='staging';process.env.GEMINI_RETRY_503='true'
  let sdkCalls=0,claims=0
  const original=f.mocks['@/lib/supabase/admin'].createAdminClient()
  f.mocks['@/lib/supabase/admin']={createAdminClient:()=>({rpc:async(name,args)=>{
    if(name==='claim_mobile_ai_attempt'){claims++;if(args.p_attempt===2)return {data:false,error:null}}
    return original.rpc(name,args)
  }})}
  f.mocks['@google/generative-ai']={GoogleGenerativeAI:class{getGenerativeModel(){return {generateContent:async()=>{sdkCalls++;throw {status:503}}}}}}
  const real=load('lib/ai/transient')
  f.mocks['./transient']={recoverProvider503:work=>real.recoverProvider503(work,{now:()=>0,wait:async()=>{},random:()=>0})}
  const ai=load('lib/mobile/ai',f.mocks,cache),gemini=load('lib/ai/gemini',f.mocks,cache)
  const response=await ai.withAi(request({}),'recipes',async()=>Response.json(await gemini.generateRecipeWithGemini(['fixture'])))
  assert.equal(response.status,503);assert.equal(sdkCalls,1);assert.equal(claims,2)
})

test('E failed durable token metadata write does not retry or discard a successful provider response',async()=>{
  const {observeProviderOperation,measureProviderCall}=load('lib/mobile/provider-usage')
  let calls=0,claims=0,metadata=0
  const result=await observeProviderOperation('00000000-0000-4000-8000-000000000001','recipes',()=>measureProviderCall(async()=>{calls++;return {response:{usageMetadata:{promptTokenCount:4}}}},'gemini-fixture',()=>{}),{
    beforeCall:async()=>{claims++},afterCall:async()=>{metadata++;throw Error('storage unavailable')},
  })
  assert.equal(calls,1);assert.equal(claims,1);assert.equal(metadata,1);assert.equal(result.response.usageMetadata.promptTokenCount,4)
})


test('E shared production dispatch boundary refuses calls outside the quota guard',async()=>{
  const {dispatchProviderCall}=load('lib/mobile/provider-usage');let called=0
  await assert.rejects(dispatchProviderCall(async()=>{called++;return {}},'gemini-fixture'),/dispatch_not_authorized/)
  assert.equal(called,0)
})


test('E a malformed handler response cannot be settled as a successful usage',async()=>{
  const f=aiFixture({code:'started',id:'job'})
  const response=await f.ai.withAi(request({}),'recipes',async()=>Response.json('invalid object'))
  assert.equal(response.status,502)
  assert.equal(f.calls.at(-1).args.p_status,502)
  assert.equal(f.calls.at(-1).args.p_response.code,'invalid_ai_output')
})

test('UI reuse reads remain available at zero rights with AI enabled: no dispatch or quota write', async () => {
  const savedFlag = process.env.MOBILE_AI_READY
  process.env.MOBILE_AI_READY = 'true'
  let dispatches = 0, sdkCalls = 0, mutations = 0
  const before = { recipes: 10, scans: 10, plans: 3 }
  const usage = { ...before }, filters = []
  const provider = load('lib/mobile/provider-usage')
  const tables = {
    pantry: [{ id: 'ingredient-a', name: 'tomato', revision: 1 }],
    recipes: [{ ...validBody, id: 'recipe-a', is_public: false }],
    meal_plans: { id: 'plan-a', meals: [] },
  }
  const forbiddenWrite = () => { mutations++; throw Error('Read-only reuse must not mutate rights') }
  const db = {
    auth: { getUser: async () => ({ data: { user: { id: 'owner-a' } }, error: null }) },
    rpc: forbiddenWrite,
    from(table) {
      assert.ok(table in tables, 'Unexpected table ' + table)
      const result = () => ({ data: tables[table], error: null })
      const query = {
        select() { return query },
        eq(column, value) { filters.push({ table, column, value }); return query },
        order() { return query }, limit() { return query },
        insert: forbiddenWrite, update: forbiddenWrite, delete: forbiddenWrite,
        single: async () => result(), maybeSingle: async () => result(),
        then(resolve, reject) { return Promise.resolve(result()).then(resolve, reject) },
      }
      return query
    },
  }
  const mocks = {
    '@/lib/supabase/api': { createApiClient: async () => db },
    '@/lib/mobile/provider-usage': { ...provider, dispatchProviderCall: async (...args) => { dispatches++; return provider.dispatchProviderCall(...args) } },
    '@google/generative-ai': { GoogleGenerativeAI: class { getGenerativeModel() { return { generateContent: async () => { sdkCalls++; throw Error('Provider forbidden') } } } } },
    '@anthropic-ai/sdk': class { messages = { create: async () => { sdkCalls++; throw Error('Provider forbidden') } } },
  }
  try {
    for (const route of ['app/api/pantry/route', 'app/api/recipes/history/route', 'app/api/meal-plan/route']) {
      const response = await load(route, mocks).GET()
      assert.equal(response.status, 200)
    }
    assert.equal(dispatches, 0)
    assert.equal(sdkCalls, 0)
    assert.equal(mutations, 0)
    assert.deepEqual(usage, before)
    for (const table of Object.keys(tables)) assert.ok(filters.some(f => f.table === table && f.column === 'user_id' && f.value === 'owner-a'))
    assert.ok(filters.some(f => f.table === 'recipes' && f.column === 'is_public' && f.value === false))
  } finally {
    if (savedFlag === undefined) delete process.env.MOBILE_AI_READY
    else process.env.MOBILE_AI_READY = savedFlag
  }
})

test('every backend picomatch copy rejects bounded ReDoS cases without changing glob APIs', () => {
  require('../../../scripts/picomatch-regression.cjs').verifyPicomatch(root)
})
test('patched backend glob copies keep tinyglobby and the existing Next ESLint adapter working', async () => {
  await require('../../../scripts/picomatch-regression.cjs').verifyGlobbing(root, 'backend')
})
