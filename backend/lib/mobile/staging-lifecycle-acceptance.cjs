// Explicit authorized staging only. Max four real jobs / eight existing SDK attempts.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path')
const {randomUUID,randomBytes}=require('node:crypto')
const {createClient}=require('@supabase/supabase-js')
const base='https://chef-ai-staging-nu.vercel.app',supa='https://vcyqtbzhfanbpclfhibv.supabase.co'
const directory=process.env.CHEF_STAGING_ACCEPTANCE_DIR
if(!directory||!/^\/private\/tmp\/chef-staging-rollout-[\w-]+$/.test(directory)||process.env.CHEF_AUTHORIZE_FOUR_REAL_AI_JOBS!=='yes')throw Error('Explicit isolated staging authorization and private evidence directory required')
const linked=JSON.parse(fs.readFileSync(path.join(directory,'backend/.vercel/project.json'),'utf8'))
assert.equal(linked.projectId,'prj_vWhn3DiZQH0XwiEAyZ4RKGA4SB2T')
const source=fs.readFileSync(path.resolve(__dirname,'../../.env.local'),'utf8')
const env=key=>{const match=source.match(new RegExp('^'+key+'=(.*)$','m'));if(!match)return null;try{return JSON.parse(match[1])}catch{return match[1]}}
assert.equal(env('NEXT_PUBLIC_SUPABASE_URL'),supa);assert.equal(env('MOBILE_ENVIRONMENT'),'staging')
const options={auth:{persistSession:false,autoRefreshToken:false}}
const admin=createClient(supa,fs.readFileSync(path.join(directory,'staging-server.key'),'utf8').trim(),options)
const accounts=[],checks=[],realJobs=[];let generated=0,current='initialization',cfg
function safeCode(error){return typeof error?.code==='string'&&/^[a-z0-9_]{1,60}$/i.test(error.code)?error.code:error?.name??'failure'}
async function call(route,token,method='GET',body,key=randomUUID(),locale='en'){
 const form=body instanceof FormData
 const response=await fetch(base+route,{method,headers:{...(form?{}:{'Content-Type':'application/json'}),...(token?{Authorization:'Bearer '+token}:{}),'X-App-Locale':locale,'X-Unit-System':locale==='tr'?'metric':'imperial','Idempotency-Key':key},...(body!==undefined?{body:form?body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(125000)})
 return {status:response.status,data:await response.json()}
}
async function check(name,work){current=name;const started=Date.now();try{const result=await work();checks.push({name,passed:true,durationMs:Date.now()-started});console.log('PASS '+name);return result}catch(error){checks.push({name,passed:false,category:safeCode(error),durationMs:Date.now()-started});console.log('FAIL '+name+' ('+safeCode(error)+')');return null}}
async function ai(operation,route,account,method,body,locale='en'){
 assert.ok(++generated<=4,'Four-job budget exceeded')
 const key=randomUUID(),started=Date.now();let result=await call(route,account.token,method,body,key,locale)
 while(result.status===409&&result.data.code==='operation_pending'&&Date.now()-started<300000){
  await new Promise(resolve=>setTimeout(resolve,3000))
  const read=await call('/api/mobile/ai-status?operation='+operation,account.token,'GET',undefined,key)
  if(read.data.state==='completed'){result={status:read.data.status,data:read.data.response};break}
 }
 if(result.data.resultId)realJobs.push(result.data.resultId)
 if(result.status>=300){const failure=Error('AI failed');failure.code=result.data.code;throw failure}
 return {...result,key,body,operation,route,locale}
}
function recipe(value){assert.ok(value&&typeof value.name==='string'&&Array.isArray(value.ingredients)&&value.ingredients.length&&typeof value.instructions==='string')}
async function run(){
 try {
  cfg=(await call('/api/mobile/config')).data
  assert.equal(cfg.capabilities.ai,true);assert.equal(cfg.capabilities.localizedAi,true)
  assert.equal(cfg.capabilities.billing,false);assert.equal(cfg.capabilities.push,false)
  for(let index=0;index<2;index++){
   const email='lifecycle-'+randomUUID()+'@example.test',password=randomBytes(32).toString('base64url')
   const created=await admin.auth.admin.createUser({email,password,email_confirm:true});assert.equal(created.error,null)
   const entry={id:created.data.user.id,email,password};accounts.push(entry)
   const client=createClient(supa,env('NEXT_PUBLIC_SUPABASE_ANON_KEY'),options)
   const login=await client.auth.signInWithPassword({email,password});assert.equal(login.error,null);entry.token=login.data.session.access_token
  }
  const [a,b]=accounts
  await check('unauthenticated status is denied',async()=>assert.equal((await call('/api/mobile/ai-status?operation=recipes',null)).status,401))
  await check('missing consent blocks AI without provider work',async()=>{const result=await call('/api/recipes',a.token,'POST',{ingredients:['tomato']});assert.equal(result.status,403);assert.equal(result.data.code,'consent_required')})
  for(const account of accounts){const result=await call('/api/privacy/consents',account.token,'POST',{scope:'ai',version:cfg.ai.consentVersion,accepted:true,locale:'en'});assert.equal(result.status,200)}
  let pantry
  await check('pantry create and revision readback',async()=>{const result=await call('/api/pantry',a.token,'POST',{name:'Synthetic tomato',quantity:'1',expiry_date:'2099-01-01'});assert.equal(result.status,201);pantry=(await call('/api/pantry',a.token)).data.items.find(row=>row.id===result.data.item.id);assert.equal(pantry.revision,0)})
  await check('parallel same-revision HTTP edits give200 and409',async()=>{
   assert.ok(pantry);const responses=await Promise.all(['2','3'].map(quantity=>call('/api/pantry/'+pantry.id,a.token,'PATCH',{name:'Synthetic tomato',quantity,expiry_date:'2099-01-01',expectedRevision:0})))
   assert.deepEqual(responses.map(r=>r.status).sort(),[200,409]);const read=(await call('/api/pantry',a.token)).data.items.find(row=>row.id===pantry.id);assert.equal(read.revision,1)
  })
  await check('other account cannot edit or read pantry',async()=>{
   assert.equal((await call('/api/pantry/'+pantry.id,b.token,'PATCH',{name:'Foreign',quantity:null,expiry_date:'2099-01-01',expectedRevision:1})).status,404)
   assert.equal((await call('/api/pantry',b.token)).data.items.length,0)
  })
  const generatedRecipe=await check('real Turkish metric recipe and durable result',async()=>{
   const result=await ai('recipes','/api/recipes',a,'POST',{ingredients:['domates','yumurta','zeytinyağı']},'tr');recipe(result.data.structured);assert.match(result.data.structured.instructions,/dakika|pişir|karıştır|ekle|[ğüşöçı]/i);return result
  })
  if(generatedRecipe){
   await check('status recovery and idempotent replay do not regenerate',async()=>{
    const saved=await call('/api/mobile/ai-status?operation=recipes',a.token,'GET',undefined,generatedRecipe.key)
    assert.equal(saved.data.state,'completed');assert.deepEqual(saved.data.response,generatedRecipe.data)
    const replay=await call('/api/recipes',a.token,'POST',generatedRecipe.body,generatedRecipe.key,'tr');assert.deepEqual(replay.data,generatedRecipe.data)
   })
   await check('explicit private save persists across fresh login without duplicates',async()=>{
    const key=randomUUID(),body={...generatedRecipe.data.structured,macros:generatedRecipe.data.macros,is_public:false}
    const first=await call('/api/recipes/save',a.token,'POST',body,key),second=await call('/api/recipes/save',a.token,'POST',body,key)
    assert.equal(first.status,201);assert.equal(first.data.recipe.id,second.data.recipe.id);assert.equal(first.data.recipe.is_public,false)
    const client=createClient(supa,env('NEXT_PUBLIC_SUPABASE_ANON_KEY'),options),login=await client.auth.signInWithPassword({email:a.email,password:a.password});assert.equal(login.error,null)
    assert.ok((await call('/api/recipes/history',login.data.session.access_token)).data.recipes.some(row=>row.id===first.data.recipe.id))
    assert.equal((await call('/api/recipes/history',b.token)).data.recipes.length,0)
   })
  }
  await check('real public food photo analysis',async()=>{
   const form=new FormData(),image=fs.readFileSync(path.join(directory,'public-food.jpg'));form.set('image',new Blob([image],{type:'image/jpeg'}),'public-food.jpg')
   const result=await ai('scan','/api/vision',a,'POST',form);assert.ok(Array.isArray(result.data.ingredients)&&result.data.ingredients.length)
  })
  const plan=await check('real weekly plan atomically persists seven days',async()=>{
   const result=await ai('plan','/api/meal-plan/generate',a,'POST',{});assert.equal(result.status,201);assert.equal(result.data.plan.meals.length,7)
   const read=await call('/api/meal-plan',a.token);assert.equal(read.data.plan.id,result.data.plan.id);assert.deepEqual(read.data.plan.meals,result.data.plan.meals)
   assert.equal((await call('/api/meal-plan',b.token)).status,404);return result.data.plan
  })
  if(plan)await check('real single-meal renewal keeps other meals and plan identity',async()=>{
   const result=await ai('regenerate','/api/meal-plan/regenerate-day',a,'PATCH',{day:'monday',meal:'dinner'})
   assert.equal(result.data.plan.id,plan.id);assert.equal(result.data.plan.meals.length,7)
   for(const old of plan.meals){const next=result.data.plan.meals.find(row=>row.day===old.day);assert.deepEqual(next.breakfast,old.breakfast);if(old.day!=='monday')assert.deepEqual(next.dinner,old.dinner)}
  })
  await check('one user credit per successful logical operation',async()=>{
   const result=await call('/api/billing/status',a.token);assert.equal(result.status,200)
   if(generatedRecipe)assert.equal(result.data.quotas.recipes.used,1)
   if(plan&&checks.find(row=>row.name.startsWith('real single-meal'))?.passed)assert.equal(result.data.quotas.plans.used,2)
  })
  await check('synthetic five-minute expiry returns credit once and fences late plan writes',async()=>{
   const key=randomUUID(),quota=(await call('/api/billing/status',b.token)).data.quotas.plans
   const started=await admin.rpc('begin_mobile_ai_v2',{p_user:b.id,p_operation:'plan',p_key:key,p_hash:'synthetic-lifecycle',p_limit:quota.limit,p_global:Number(env('MOBILE_AI_DAILY_ATTEMPT_LIMIT')),p_consent:cfg.ai.consentVersion});assert.equal(started.error,null);assert.equal(started.data.code,'started')
   assert.equal((await admin.from('mobile_ai_jobs').update({deadline_at:new Date(Date.now()-1000).toISOString()}).eq('id',started.data.id).eq('user_id',b.id)).error,null)
   const status=await call('/api/mobile/ai-status?operation=plan',b.token,'GET',undefined,key);assert.equal(status.data.response.creditReturned,true)
   const late=await admin.rpc('complete_mobile_ai',{p_id:started.data.id,p_user:b.id,p_response:{plan:{week_start_date:'2099-01-05',meals:[]}},p_status:200});assert.equal(late.data.code,'not_pending')
   assert.equal((await call('/api/billing/status',b.token)).data.quotas.plans.used,0)
   assert.equal((await call('/api/mobile/ai-status?operation=plan',a.token,'GET',undefined,key)).data.state,'not_found')
  })
  fs.writeFileSync(path.join(directory,'proof-ready.json'),JSON.stringify({accounts:accounts.map(a=>a.id),realJobs,realJobsStarted:generated,checks}),{mode:0o600})
  console.log('PROOF_READY: bounded provider metadata inspection before own account cleanup')
  const deadline=Date.now()+180000
  while(!fs.existsSync(path.join(directory,'release-proof'))&&Date.now()<deadline)await new Promise(resolve=>setTimeout(resolve,1000))
 }finally{
  const cleanup=[]
  for(const account of accounts){
   let httpDeleted=false
   if(account.token){try{httpDeleted=(await call('/api/account',account.token,'DELETE')).status===200}catch{}}
   const missing=await admin.auth.admin.getUserById(account.id)
   if(missing.data.user){const removed=await admin.auth.admin.deleteUser(account.id);assert.equal(removed.error,null)}
   cleanup.push({accountDeletionApiPassed:httpDeleted,removed:true})
  }
  fs.writeFileSync(path.join(directory,'acceptance.json'),JSON.stringify({observedAt:new Date().toISOString(),origin:base,supabaseProjectRef:'vcyqtbzhfanbpclfhibv',checks,realJobsStarted:generated,maxProviderCalls:8,cleanup,status:checks.length&&checks.every(c=>c.passed)?'passed':'incomplete',productionChanged:false,newMobileBuild:false},null,2))
  console.log('Own synthetic accounts cleaned; evidence written.')
 }
}
run().catch(error=>{console.error('Staging acceptance stopped at '+current+' ('+safeCode(error)+')');process.exitCode=1})
