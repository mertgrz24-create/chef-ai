// Explicit staging integration test: creates and removes only its own synthetic accounts.
const assert=require('node:assert/strict'),fs=require('node:fs'),{randomUUID,randomBytes}=require('node:crypto');
const {createClient}=require('@supabase/supabase-js');
const base='https://chef-ai-staging-nu.vercel.app',supa='https://vcyqtbzhfanbpclfhibv.supabase.co';
const anon='sb_publishable_V-Bl66ix0kROl-keYBheuA_5NChBjw_';
if(!process.env.CHEF_STAGING_SERVER_KEY_FILE || !process.env.CHEF_STAGING_VERCEL_DIR || !process.env.CHEF_STAGING_FOOD_FIXTURE || !process.env.CHEF_STAGING_AI_EVIDENCE) throw new Error('Explicit staging credentials, link, public food fixture and evidence paths required');
assert.equal(JSON.parse(fs.readFileSync(process.env.CHEF_STAGING_VERCEL_DIR+'/.vercel/project.json','utf8')).projectId,'prj_vWhn3DiZQH0XwiEAyZ4RKGA4SB2T');
const admin=createClient(supa,fs.readFileSync(process.env.CHEF_STAGING_SERVER_KEY_FILE,'utf8').trim(),{auth:{persistSession:false,autoRefreshToken:false}});
const users=[],checks=[];let token, evidence;
async function call(path,method='GET',body,locale='en',key=randomUUID()){
 const form=body instanceof FormData;
 const r=await fetch(base+path,{method,headers:{...(form?{}:{'Content-Type':'application/json'}),...(token?{Authorization:'Bearer '+token}:{}),'X-App-Locale':locale,'X-Unit-System':locale==='tr'?'metric':'imperial','Idempotency-Key':key},...(body?{body:form?body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(120000)});
 const data=await r.json(); if(!r.ok) console.log(JSON.stringify({path,status:r.status,code:typeof data.code==='string'?data.code:'request_failed'})); return {status:r.status,data};
}
async function check(name,fn){const start=Date.now();await fn();checks.push({name,durationMs:Date.now()-start});console.log('PASS '+name+' ('+(Date.now()-start)+' ms)')}
(async()=>{try{
 const cfg=await call('/api/mobile/config');assert.equal(cfg.status,200);assert.equal(cfg.data.capabilities.ai,true);assert.equal(cfg.data.capabilities.localizedAi,true);
 const email='live-'+randomUUID()+'@example.test',password=randomBytes(24).toString('base64url');
 const created=await admin.auth.admin.createUser({email,password,email_confirm:true});assert.equal(created.error,null);users.push(created.data.user.id);
 const client=createClient(supa,anon,{auth:{persistSession:false,autoRefreshToken:false}});const login=await client.auth.signInWithPassword({email,password});assert.equal(login.error,null);token=login.data.session.access_token;
 await check('AI rejects missing transfer consent',async()=>{const r=await call('/api/recipes','POST',{ingredients:['tomato','egg']});assert.equal(r.status,403);assert.equal(r.data.code,'consent_required')});
 await check('versioned AI transfer consent is stored',async()=>{const r=await call('/api/privacy/consents','POST',{scope:'ai',version:cfg.data.ai.consentVersion,accepted:true,locale:'en'});assert.equal(r.status,200);assert.equal(r.data.ok,true)});
 let recipe;const recipeKey=randomUUID(),ingredients={ingredients:['tomato','egg','olive oil']};
 await check('English recipe generated with a structured result',async()=>{const r=await call('/api/recipes','POST',ingredients,'en',recipeKey);assert.equal(r.status,200);assert.ok(r.data.structured?.name);assert.ok(r.data.structured.ingredients.length);assert.ok(r.data.resultId);recipe=r.data});
 await check('AI retry replays the same confirmed result',async()=>{const r=await call('/api/recipes','POST',ingredients,'en',recipeKey);assert.equal(r.status,200);assert.equal(r.data.resultId,recipe.resultId);assert.deepEqual(r.data,recipe)});
 let saved;const saveKey=randomUUID(),saveBody={...recipe.structured,macros:recipe.macros,is_public:false};
 await check('generated recipe saves privately',async()=>{const r=await call('/api/recipes/save','POST',saveBody,'en',saveKey);assert.equal(r.status,201);assert.equal(r.data.recipe.is_public,false);saved=r.data.recipe.id});
 await check('duplicate recipe save returns same record',async()=>{const r=await call('/api/recipes/save','POST',saveBody,'en',saveKey);assert.ok([200,201].includes(r.status));assert.equal(r.data.recipe.id,saved)});
 await check('recipe appears in saved history after fresh login',async()=>{const second=createClient(supa,anon,{auth:{persistSession:false,autoRefreshToken:false}});const signed=await second.auth.signInWithPassword({email,password});assert.equal(signed.error,null);token=signed.data.session.access_token;const r=await call('/api/recipes/history');assert.equal(r.status,200);assert.ok(r.data.recipes.some(v=>v.id===saved))});
 await check('recipe content report is confirmed by storage',async()=>{const r=await call('/api/content-reports','POST',{source:'recipe',resultId:recipe.resultId,category:0,details:'Synthetic staging acceptance check'});assert.equal(r.status,200);assert.equal(r.data.ok,true);const rows=await admin.from('mobile_content_reports').select('id').eq('user_id',created.data.user.id);assert.equal(rows.error,null);assert.equal(rows.data.length,1)});
 await check('Turkish metric recipe returns structured content',async()=>{const r=await call('/api/recipes','POST',{ingredients:['domates','yumurta','zeytinyağı']},'tr');assert.equal(r.status,200);assert.ok(r.data.structured?.instructions);assert.match(r.data.structured.instructions,/dakika|ekle|karıştır|pişir|tava|ısıt/i)});
 await check('public food photo uploads and identifies visible food',async()=>{const image=fs.readFileSync(process.env.CHEF_STAGING_FOOD_FIXTURE);const form=new FormData();form.set('image',new Blob([image],{type:'image/jpeg'}),'public-food-fixture.jpg');const r=await call('/api/vision','POST',form);assert.equal(r.status,200);assert.ok(Array.isArray(r.data.ingredients));assert.ok(r.data.ingredients.length>0);assert.match(r.data.ingredients.join(' '),/blueberr|coffee|scone|yaban mersini|kahve/i)});
 let plan;
 await check('weekly plan generates and persists seven days',async()=>{const r=await call('/api/meal-plan/generate','POST',{});assert.equal(r.status,201);assert.equal(r.data.plan.meals.length,7);plan=r.data.plan;const read=await call('/api/meal-plan');assert.equal(read.status,200);assert.equal(read.data.plan.id,plan.id)});
 await check('a planned dinner regenerates and persists',async()=>{const r=await call('/api/meal-plan/regenerate-day','PATCH',{day:'monday',meal:'dinner'});assert.equal(r.status,200);assert.equal(r.data.plan.id,plan.id);assert.equal(r.data.plan.meals.length,7)});
 await check('consent revocation immediately blocks further AI',async()=>{assert.equal((await call('/api/privacy/consents','POST',{scope:'ai',version:cfg.data.ai.consentVersion,accepted:false,locale:'en'})).status,200);const r=await call('/api/recipes','POST',ingredients);assert.equal(r.status,403);assert.equal(r.data.code,'consent_required')});
 evidence = {date:'2026-10-16',origin:base,model:'gemini-3.5-flash-lite',checks,status:'passed',fixtureSource:'https://storage.googleapis.com/generativeai-downloads/images/scones.jpg',limits:['Synthetic admin-confirmed account; real SMTP not tested','Public Google food photo tested; physical camera/gallery interaction still requires device test','Native UI, billing, push and production not validated']};
}finally{for(const id of users){const r=await admin.auth.admin.deleteUser(id);if(r.error)throw Error('Synthetic account cleanup failed')}console.log('Synthetic AI test accounts removed.')}
if(evidence) fs.writeFileSync(process.env.CHEF_STAGING_AI_EVIDENCE,JSON.stringify({...evidence,syntheticAccountCleanup:'passed'},null,2));})().catch(e=>{console.error('Staging AI check failed: '+e.message);process.exitCode=1});
