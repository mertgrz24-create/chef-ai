const {test} = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs'), path = require('node:path'), os = require('node:os')
const {spawnSync} = require('node:child_process')
const root = path.resolve(__dirname, '..')
test('environment template gate accepts scopes and rejects mixed/credential-bearing templates', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'chef-env-gate-'))
  try {
    for (const name of ['mobile','backend','scripts']) fs.mkdirSync(path.join(tmp,name))
    fs.copyFileSync(path.join(__dirname,'check-environment-templates.cjs'),path.join(tmp,'scripts/check-environment-templates.cjs'))
    const mobile = fs.readFileSync(path.join(root,'mobile/.env.example'),'utf8')
    const backend = fs.readFileSync(path.join(root,'backend/.env.example'),'utf8')
    function check(m,b) {
      fs.writeFileSync(path.join(tmp,'mobile/.env.example'),m)
      fs.writeFileSync(path.join(tmp,'backend/.env.example'),b)
      return spawnSync(process.execPath,[path.join(tmp,'scripts/check-environment-templates.cjs')],{encoding:'utf8'})
    }
    assert.equal(check(mobile,backend).status,0)
    for (const [m,b] of [
      [mobile+'\nGEMINI_API_KEY=\n',backend],
      [mobile.replace('EXPO_PUBLIC_SUPABASE_ANON_KEY=','EXPO_PUBLIC_SUPABASE_ANON_KEY=placeholder'),backend],
      [mobile,backend.replace('GEMINI_API_KEY=','GEMINI_API_KEY=placeholder')],
      [mobile,backend.replace('MOBILE_AI_READY=false','MOBILE_AI_READY=true')],
      [mobile.replace('EXPO_PUBLIC_APP_ENV=staging','EXPO_PUBLIC_APP_ENV=production'),backend],
      [mobile+'\nEXPO_PUBLIC_API_URL=\n',backend],
      [mobile,backend.replace('MOBILE_REPORT_RETENTION_DAYS=','REMOVED_FIELD=')],
    ]) assert.notEqual(check(m,b).status,0)
  } finally {fs.rmSync(tmp,{recursive:true,force:true})}
})
