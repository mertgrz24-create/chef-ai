const assert=require('node:assert/strict')
const {execFileSync,execFile}=require('node:child_process')
const {promisify}=require('node:util')
const {randomUUID}=require('node:crypto')
const host=process.env.CHEF_TEST_PGHOST,port=process.env.CHEF_TEST_PGPORT,db=process.env.CHEF_TEST_PGDATABASE
if(!host||!/^\/(?:private\/)?tmp\/chef[\w/-]*$/.test(host)||host.split('/').includes('..')||!/^\d{4,5}$/.test(port??'')||!/^chef_release_test_[a-z0-9_]+$/.test(db??''))throw Error('Disposable local Unix database only')
const args=['-X','-h',host,'-p',port,'-d',db,'-v','ON_ERROR_STOP=1','-Atc']
const sql=query=>execFileSync('psql',[...args,query],{encoding:'utf8'}).trim()
const parallel=query=>promisify(execFile)('psql',[...args,query],{encoding:'utf8'}).then(r=>r.stdout.trim())
const user=randomUUID()
async function run(){
 try {
  sql(`DELETE FROM public.mobile_ai_daily_attempts;INSERT INTO auth.users(id,email) VALUES('${user}','lifecycle-race@example.test');INSERT INTO mobile_consents VALUES('${user}','ai','race',true,'en',now())`)
  const job=JSON.parse(sql(`SELECT begin_mobile_ai_v2('${user}','recipes','race-success','hash',10,1,'race')`))
  assert.equal(job.code,'started')
  const claims=await Promise.all([1,2].map(()=>parallel(`SELECT claim_mobile_ai_attempt('${job.id}','${user}',1,'gemini-fixture')`)))
  assert.deepEqual(claims.sort(),['f','t'])
  assert.equal(sql('SELECT sum(attempts) FROM mobile_ai_daily_attempts'),'1')
  assert.equal(sql(`SELECT claim_mobile_ai_attempt('${job.id}','${user}',2,'gemini-fixture')`),'f')
  const settlements=await Promise.all([200,500].map(status=>parallel(`SELECT complete_mobile_ai('${job.id}','${user}','{"recipe":"fixture"}',${status})`).then(JSON.parse)))
  assert.deepEqual(settlements.map(r=>r.code).sort(),['completed','not_pending'])
  const winner=settlements.find(r=>r.code==='completed')
  assert.equal(sql(`SELECT used FROM mobile_ai_usage WHERE user_id='${user}' AND kind='recipes'`),winner.status===200?'1':'0')
  // Deadline always wins over a late plan write, whichever reconciler gets the lock.
  const late=JSON.parse(sql(`SELECT begin_mobile_ai_v2('${user}','plan','late-race','hash',10,100,'race')`))
  assert.equal(late.code,'started')
  sql(`UPDATE mobile_ai_jobs SET deadline_at=clock_timestamp()-interval '1 second' WHERE id='${late.id}'`)
  const responses=await Promise.all([
   parallel(`SELECT mobile_ai_status('${user}','plan','late-race')`).then(JSON.parse),
   parallel(`SELECT complete_mobile_ai('${late.id}','${user}','{"plan":{"week_start_date":"2099-01-05","meals":[]}}',200)`).then(JSON.parse),
  ])
  assert.equal(responses[0].response.creditReturned,true);assert.equal(responses[1].code,'not_pending')
  assert.equal(sql(`SELECT used FROM mobile_ai_usage WHERE user_id='${user}' AND kind='plans'`),'0')
  assert.equal(sql(`SELECT count(*) FROM meal_plans WHERE user_id='${user}'`),'0')
  sql(`DELETE FROM auth.users WHERE id='${user}'`)
  assert.equal(sql(`SELECT count(*) FROM mobile_ai_provider_attempts WHERE job_id='${job.id}'`),'0')
  assert.equal(sql('SELECT sum(attempts) FROM mobile_ai_daily_attempts'),'1')
  console.log('AI concurrency: one dispatch permit, one settlement, deadline fence and account deletion/global-cap isolation passed.')
 } finally {sql(`DELETE FROM auth.users WHERE id='${user}'`)}
}
run().catch(error=>{console.error(error);process.exitCode=1})
