// Explicit isolated staging only; creates and deletes synthetic accounts.
const assert = require('node:assert/strict');
const {randomUUID,randomBytes} = require('node:crypto');
const fs = require('node:fs');
const {createClient} = require('@supabase/supabase-js');
const url='https://vcyqtbzhfanbpclfhibv.supabase.co';
const anon='sb_publishable_V-Bl66ix0kROl-keYBheuA_5NChBjw_';
if(!process.env.CHEF_STAGING_SERVER_KEY_FILE || !process.env.CHEF_STAGING_VERCEL_DIR) throw new Error('Explicit staging key file and staging-linked directory required');
const linked=JSON.parse(fs.readFileSync(process.env.CHEF_STAGING_VERCEL_DIR+'/.vercel/project.json','utf8'));
assert.equal(linked.projectId,'prj_vWhn3DiZQH0XwiEAyZ4RKGA4SB2T','Refuse non-staging Vercel linkage');
const key=fs.readFileSync(process.env.CHEF_STAGING_SERVER_KEY_FILE,'utf8').trim();
const options={auth:{persistSession:false,autoRefreshToken:false}};
const admin=createClient(url,key,options); const created=[]; let passed=0;
async function call(path,token,method='GET',body,key){
 const {execFileSync}=require('node:child_process');
 const headerFile='/private/tmp/chef-staging-http-headers-'+randomUUID();
 const headers=['Content-Type: application/json',...(token?[`Authorization: Bearer ${token}`]:[]),...(key?[`Idempotency-Key: ${key}`]:[])];
 fs.writeFileSync(headerFile,headers.join('\n'),{mode:0o600});
 try {
  const args=['curl',path,'--deployment','https://chef-ai-staging-ediir63l3-mertgrz24s-projects.vercel.app','--','--silent','--show-error','--max-time','60','--header','@'+headerFile,'--request',method,'--write-out','\n%{http_code}'];
  if(body)args.push('--data',JSON.stringify(body));
  const out=execFileSync('vercel',args,{cwd:process.env.CHEF_STAGING_VERCEL_DIR,encoding:'utf8',stdio:['ignore','pipe','pipe']});
  const split=out.lastIndexOf('\n');return {status:Number(out.slice(split+1)),data:JSON.parse(out.slice(0,split))};
 } finally {fs.unlinkSync(headerFile);}
}
async function check(name,fn){await fn();passed++;console.log('PASS '+name);}
(async()=>{try{
const accounts=[];
for(let i=0;i<2;i++){const email=`release-${randomUUID()}@example.test`,password=randomBytes(32).toString('base64url');const {data,error}=await admin.auth.admin.createUser({email,password,email_confirm:true});if(error)throw new Error('Fixture creation: '+error.code);created.push(data.user.id);const client=createClient(url,anon,options);const signed=await client.auth.signInWithPassword({email,password});if(signed.error)throw new Error('Staging login: '+signed.error.code);accounts.push({id:data.user.id,email,password,client,token:signed.data.session.access_token});}
const [a,b]=accounts;
await check('unauthenticated API access denied',async()=>assert.equal((await call('/api/recipes/history')).status,401));
const body={name:'Staging test soup',ingredients:['test ingredient'],instructions:'Test only.',is_public:false},idKey=randomUUID();let saved;
await check('private recipe confirmed by real database',async()=>{const r=await call('/api/recipes/save',a.token,'POST',body,idKey);assert.equal(r.status,201);assert.equal(r.data.recipe.is_public,false);assert.equal(r.data.recipe.user_id,a.id);saved=r.data.recipe.id;});
await check('duplicate save returns same record',async()=>{const r=await call('/api/recipes/save',a.token,'POST',body,idKey);assert.ok([200,201].includes(r.status));assert.equal(r.data.recipe.id,saved);});
await check('changed payload with same key is rejected',async()=>assert.equal((await call('/api/recipes/save',a.token,'POST',{...body,name:'changed'},idKey)).status,409));
await check('public save rejected',async()=>assert.equal((await call('/api/recipes/save',a.token,'POST',{...body,is_public:true},randomUUID())).status,422));
await check('other account cannot read private recipe through API',async()=>{const r=await call('/api/recipes/history',b.token);assert.equal(r.status,200);assert.equal(r.data.recipes.length,0);});
await check('other account cannot read private recipe through PostgREST',async()=>{const r=await b.client.from('recipes').select('id').eq('id',saved);assert.equal(r.error,null);assert.equal(r.data.length,0);});
await check('client cannot change Premium',async()=>{const r=await a.client.from('profiles').update({is_premium:true}).eq('id',a.id);assert.ok(r.error);});
await check('client cannot call legacy refund RPC',async()=>assert.ok((await a.client.rpc('refund_recipe_credit')).error));
let pantryId;
await check('pantry insert confirmed',async()=>{const r=await call('/api/pantry',a.token,'POST',{name:'Staging fixture',expiry_date:'2026-12-01',quantity:'1'});assert.equal(r.status,201);pantryId=r.data.item.id;});
await check('another account pantry remains empty',async()=>{const r=await call('/api/pantry',b.token);assert.equal(r.status,200);assert.equal(r.data.items.length,0);});
await check('new client login restores private recipe and pantry',async()=>{const next=createClient(url,anon,options);const login=await next.auth.signInWithPassword({email:a.email,password:a.password});assert.equal(login.error,null);const token=login.data.session.access_token;assert.ok((await call('/api/recipes/history',token)).data.recipes.some(r=>r.id===saved));assert.ok((await call('/api/pantry',token)).data.items.some(r=>r.id===pantryId));await next.auth.signOut({scope:'local'});});
await check('AI remains disabled without production provider configuration',async()=>assert.equal((await call('/api/recipes',a.token,'POST',{ingredients:['test']},randomUUID())).status,503));
console.log(`Deployed Preview HTTP integration: ${passed} checks passed`);
}finally{for(const id of created){const {error}=await admin.auth.admin.deleteUser(id);if(error)throw new Error('Staging fixture cleanup failed');}console.log('Synthetic auth accounts deleted; cascades remove fixture data.');}})().catch(e=>{console.error('Integration failed: '+e.message);process.exitCode=1;});
