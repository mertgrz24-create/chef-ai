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
const seedRecipe=await admin.from('recipes').insert({user_id:a.id,name:'Deletion fixture',ingredients:[],instructions:'Test only.',is_public:false}).select('id');assert.equal(seedRecipe.error,null);assert.equal(seedRecipe.data.length,1);
const seedPantry=await admin.from('pantry').insert({user_id:a.id,name:'Deletion fixture',expiry_date:'2026-12-01'}).select('id');assert.equal(seedPantry.error,null);assert.equal(seedPantry.data.length,1);
await check('account deletion requires authentication',async()=>assert.equal((await call('/api/account',null,'DELETE')).status,401));
await check('account deletion uses authenticated identity and cascades own content',async()=>{
 const r=await call('/api/account',a.token,'DELETE',{user_id:b.id});assert.equal(r.status,200);assert.equal(r.data.ok,true);
 const gone=await admin.auth.admin.getUserById(a.id);assert.ok(gone.error);assert.equal(gone.error.status,404);
 const retained=await admin.auth.admin.getUserById(b.id);assert.equal(retained.error,null);assert.equal(retained.data.user.id,b.id);
 for(const table of ['profiles','recipes','pantry']){const key=table==='profiles'?'id':'user_id';const result=await admin.from(table).select(key).eq(key,a.id);assert.equal(result.error,null);assert.equal(result.data.length,0);}
});
await check('deleted account session is rejected',async()=>assert.equal((await call('/api/recipes/history',a.token)).status,401));
console.log(`Deployed Preview account deletion: ${passed} checks passed`);
}finally{for(const id of created){const {error}=await admin.auth.admin.deleteUser(id);if(error && error.status!==404)throw new Error('Staging fixture cleanup failed');}console.log('Synthetic auth accounts deleted; cascades remove fixture data.');}})().catch(e=>{console.error('Integration failed: '+e.message);process.exitCode=1;});
