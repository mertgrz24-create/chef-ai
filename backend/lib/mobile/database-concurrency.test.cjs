const assert = require('node:assert/strict'),
  { spawn, execFileSync } = require('node:child_process')
const host = process.env.CHEF_TEST_PGHOST,
  port = process.env.CHEF_TEST_PGPORT,
  db = process.env.CHEF_TEST_PGDATABASE
if (
  !host ||
  !/^\/(?:private\/)?tmp\//.test(host) ||
  !/^\d{4,5}$/.test(port ?? '') ||
  !/^chef_release_test_[a-z0-9_]+$/.test(db ?? '')
)
  throw new Error(
    'Explicit disposable local database/socket configuration required',
  )
const args = [
  '-X',
  '-h',
  host,
  '-p',
  port,
  '-d',
  db,
  '-v',
  'ON_ERROR_STOP=1',
  '-At',
  '-c',
]
const call = (sql) =>
    execFileSync('psql', [...args, sql], { encoding: 'utf8' }),
  u = '00000000-0000-4000-8000-000000000001'
async function run() {
  call(
    `INSERT INTO mobile_consents VALUES('${u}','ai','v1',true,'en',now()) ON CONFLICT(user_id,scope) DO UPDATE SET accepted=true`,
  )
  let first = ''
  const a = spawn('psql', [
    ...args,
    `BEGIN;SELECT begin_mobile_ai_v2('${u}','recipes','concurrency-1','hash',10,100,'v1');SELECT pg_sleep(1);COMMIT;`,
  ])
  a.stdout.on('data', (b) => {
    first += b
  })
  let errors = ''
  a.stderr.on('data', (b) => {
    errors += b
  })
  const complete = new Promise((resolve, reject) => {
    a.on('error', reject)
    a.on('close', (code) =>
      code === 0 ? resolve() : reject(new Error(errors)),
    )
  })
  await new Promise((resolve) => setTimeout(resolve, 200))
  const second = call(
    `SELECT begin_mobile_ai_v2('${u}','scan','concurrency-2','hash',10,100,'v1')`,
  )
  await complete
  assert.match(first, /started/)
  assert.match(second, /operation_pending/)
  call(
    `DELETE FROM mobile_ai_jobs WHERE user_id='${u}';DELETE FROM mobile_ai_usage WHERE user_id='${u}';DELETE FROM mobile_consents WHERE user_id='${u}';`,
  )
  const zone = call(
    'SELECT name FROM pg_timezone_names WHERE extract(hour FROM now() AT TIME ZONE name)=9 ORDER BY name LIMIT 1',
  ).trim()
  call(
    `INSERT INTO pantry(user_id,name,expiry_date)VALUES('${u}','fixture',((now() AT TIME ZONE '${zone}')::date+1));INSERT INTO push_tokens(user_id,token,locale,time_zone,enabled)SELECT '${u}','ExpoPushToken[test-token-'||g||']','en','${zone}',true FROM generate_series(1,101)g;`,
  )
  assert.deepEqual(
    Array.from({ length: 3 }, () =>
      call('SELECT count(*) FROM claim_mobile_expiry_push()').trim(),
    ),
    ['100', '1', '0'],
  )
  call(
    `DELETE FROM push_tokens WHERE user_id='${u}';DELETE FROM pantry WHERE user_id='${u}';`,
  )
  console.log('SQL concurrency + 101-device deduplication passed.')
}
run().catch((error) => {
  console.error(error.message)
  process.exitCode = 1
})
