// No provider credentials: exercise migrations and restore only in disposable local databases.
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { execFileSync } = require('node:child_process')
const { randomBytes } = require('node:crypto')
const root = path.resolve(__dirname, '../..')
const host = process.env.CHEF_TEST_PGHOST
const port = process.env.CHEF_TEST_PGPORT
if (!host || !/^\/(?:private\/)?tmp\/chef[\w/-]*$/.test(host) || host.split('/').includes('..') || !/^\d{4,5}$/.test(port ?? '')) {
  throw new Error('Explicit private /tmp/chef* Unix socket and local port required; no remote database allowed')
}
const suffix = Date.now() + '_' + randomBytes(4).toString('hex')
const source = 'chef_release_test_' + suffix
const restored = source + '_restore'
const created = []
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'chef-db-rehearsal-'))
fs.chmodSync(temp, 0o700)
const backup = path.join(temp, 'synthetic.dump')
const connection = ['-h', host, '-p', port]
const run = (tool, args, env) => execFileSync(tool, args, {
  cwd: root, env: env ?? process.env, encoding: 'utf8', maxBuffer: 8 * 1024 * 1024,
})
const sql = (db, query) => run('psql', ['-X', ...connection, '-d', db, '-v', 'ON_ERROR_STOP=1', '-Atc', query]).trim()
const file = (db, relative) => run('psql', ['-X', ...connection, '-d', db, '-v', 'ON_ERROR_STOP=1', '-f', path.join(root, relative)])
const checks = []
let evidence
try {
  if (sql('postgres', 'SELECT inet_server_addr() IS NULL') !== 't') throw new Error('Unix-only local server required')
  for (const db of [source, restored]) { run('createdb', [...connection, db]); created.push(db) }
  file(source, 'lib/mobile/test-schema.sql')
  const migrations = fs.readdirSync(path.join(root, 'supabase/migrations')).filter(n => /^202610\d+_.+\.sql$/.test(n)).sort()
  if (migrations.length < 7) throw new Error('Expected complete release migration chain')
  for (const migration of migrations) file(source, 'supabase/migrations/' + migration)
  checks.push('Fresh synthetic schema and entire release migration chain')
  file(source, 'lib/mobile/database-security.sql')
  file(source, 'lib/mobile/durable-daily-cap.test.sql')
  file(source, 'lib/mobile/pantry-revision.test.sql')
  file(source, 'lib/mobile/shopping-items.test.sql')
  file(source, 'lib/mobile/ai-lifecycle.test.sql')
  checks.push('Roles, RLS, quota, cascade and durable-cap SQL assertions')
  run(process.execPath, ['lib/mobile/database-concurrency.test.cjs'], {
    ...process.env, CHEF_TEST_PGDATABASE: source,
  })
  run(process.execPath, ['lib/mobile/ai-lifecycle-concurrency.test.cjs'], {...process.env,CHEF_TEST_PGDATABASE:source})
  checks.push('Real concurrent dispatch permits, success/failure settlement, late plan fencing and deletion/metrics isolation')
  run(process.execPath, ['lib/mobile/pantry-concurrency.test.cjs'], {...process.env, CHEF_TEST_PGDATABASE:source})
  checks.push('Concurrent reservation and 101-device push deduplication')
  checks.push('Pantry parallel route/SQL200+409, persisted reread and content isolation')
  sql(source, "INSERT INTO public.pantry(user_id,name,expiry_date) VALUES('00000000-0000-4000-8000-000000000001','synthetic-restore-sentinel','2099-01-01')")
  run('pg_dump', [...connection, '-Fc', '--no-owner', '-f', backup, source])
  fs.chmodSync(backup, 0o600)
  run('pg_restore', [...connection, '--exit-on-error', '--no-owner', '-d', restored, backup])
  if (sql(restored, "SELECT count(*) FROM pantry WHERE name='synthetic-restore-sentinel'") !== '1') throw new Error('Restored sentinel missing')
  checks.push('Custom-format backup and restore including synthetic sentinel')
  file(restored, 'lib/mobile/database-security.sql')
  file(restored, 'lib/mobile/durable-daily-cap.test.sql')
  file(restored, 'lib/mobile/pantry-revision.test.sql')
  file(restored, 'lib/mobile/shopping-items.test.sql')
  file(restored, 'lib/mobile/ai-lifecycle.test.sql')
  checks.push('AI lifecycle: dispatch counting, five-minute deadline, original-month refund, atomic writes, retention and account ownership')
  checks.push('Restored database preserves role/RLS/function/cascade guarantees')
  evidence = {
    observedAt: new Date().toISOString(), scope: 'Disposable local fixture only; not production or staging backup',
    migrations, checks, passed: true, providerCalls: 0, build: false, deployment: false,
    productionRestoreVerified: false,
  }
} finally {
  let cleanupError
  for (const db of created.reverse()) {
    try { run('dropdb', [...connection, '--force', db]) } catch { cleanupError = true }
  }
  fs.rmSync(temp, { recursive: true, force: true })
  if (cleanupError) throw new Error('Disposable local database cleanup failed; inspect chef_release_test_* databases')
}

if (process.env.CHEF_DATABASE_EVIDENCE) fs.writeFileSync(process.env.CHEF_DATABASE_EVIDENCE, JSON.stringify(evidence, null, 2) + "\n")
console.log("Database verification: " + checks.length + " checks passed across " + evidence.migrations.length + " migrations; restore verified and disposable databases cleaned.")
