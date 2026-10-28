// Actual route responses backed by disposable PostgreSQL, not a remote Supabase project.
const fs=require('node:fs'),path=require('node:path'),Module=require('node:module'),ts=require('typescript'),assert=require('node:assert/strict'),{execFileSync,execFile}=require('node:child_process'),{promisify}=require('node:util')
const execute=promisify(execFile),host=process.env.CHEF_TEST_PGHOST,port=process.env.CHEF_TEST_PGPORT,db=process.env.CHEF_TEST_PGDATABASE
if(!host||!/^\/(?:private\/)?tmp\/chef[\w/-]*$/.test(host)||!/^\d{4,5}$/.test(port??'')||!/^chef_release_test_[a-z0-9_]+$/.test(db??''))throw Error('Disposable Unix-only database required')
const args=['-X','-qAt','-h',host,'-p',port,'-d',db,'-v','ON_ERROR_STOP=1','-c'],root=path.resolve(__dirname,'../..')
const owner='00000000-0000-4000-8000-000000000001',id='00000000-0000-4000-8000-000000000099'
const quote=value=>"'"+String(value).replace(/'/g,"''")+"'"
const sql=query=>execFileSync('psql',[...args,query],{encoding:'utf8'}).trim()
const client={auth:{getUser:async()=>({data:{user:{id:owner}},error:null})},from:()=>{
 const filters={},q={eq(k,v){filters[k]=v;return q},select(){return q},update(patch){q.patch=patch;return q},maybeSingle:async()=>{
  const where=Object.entries(filters).map(([key,value])=>key+'='+quote(value)).join(' AND ')
  const query=q.patch?'UPDATE pantry SET '+Object.entries(q.patch).map(([k,v])=>k+'='+(v===null?'NULL':quote(v))).join(',')+' WHERE '+where+' RETURNING *':'SELECT * FROM pantry WHERE '+where
  const result=await execute('psql',[...args,`BEGIN;SET LOCAL ROLE authenticated;SET LOCAL request.jwt.claim.sub=${quote(owner)};WITH matched AS (${query}) SELECT COALESCE(json_agg(matched),'[]'::json) FROM matched;COMMIT;`],{encoding:'utf8'})
  return {data:JSON.parse(result.stdout.trim())[0]??null,error:null}
 }};return q
}}
function load(relative){
 const name=path.join(root,relative+'.ts'),normal=Module.createRequire(name),mod={exports:{}}
 const custom=key=>key==='@/lib/supabase/api'?{createApiClient:async()=>client}:key.startsWith('@/')?load(key.slice(2)):normal(key)
 const code=ts.transpileModule(fs.readFileSync(name,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText
 new Function('require','module','exports',code)(custom,mod,mod.exports);return mod.exports
}
async function run(){
 sql(`INSERT INTO pantry(id,user_id,name,quantity,expiry_date)VALUES(${quote(id)},${quote(owner)},'before','1','2099-01-01')`)
 try{
  const {PATCH}=load('app/api/pantry/[id]/route')
  const request=name=>new Request('https://fixture.invalid/api/pantry/'+id,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({name,quantity:'2',expiry_date:'2099-01-02',expectedRevision:0})})
  const responses=await Promise.all(['first','second'].map(name=>PATCH(request(name),{params:Promise.resolve({id})})))
  assert.deepEqual(responses.map(r=>r.status).sort(),[200,409])
  assert.equal((await responses.find(r=>r.status===409).json()).code,'revision_conflict')
  assert.equal(sql(`SELECT revision FROM pantry WHERE id=${quote(id)}`),'1')
  assert.equal(sql(`SELECT quantity FROM pantry WHERE id=${quote(id)}`),'2')
  console.log('Pantry: actual parallel route/SQL responses200+409; second-client reread persisted revision1.')
 }finally{sql(`DELETE FROM pantry WHERE id=${quote(id)}`)}
}
run().catch(error=>{console.error(error.message);process.exitCode=1})
