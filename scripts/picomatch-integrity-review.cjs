// Tamper/missing-file checks in disposable copies; installed dependencies are read only.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),{spawnSync}=require('node:child_process'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),results=[];
for(const area of ['mobile','backend']){
 const script=area==='mobile'?'scripts/apply-security-patches.cjs':'lib/mobile/apply-dependency-patches.cjs';
 const manifest=area==='mobile'?'security/patches.json':'lib/mobile/dependency-patches.json';
 const fixture=fs.mkdtempSync(path.join(os.tmpdir(),'chef-integrity-audit-'));
 try {
  for(const relative of [script,manifest]){const target=path.join(fixture,relative);fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(path.join(root,area,relative),target)}
  const patches=JSON.parse(fs.readFileSync(path.join(root,area,manifest))).patches;
  for(const patch of patches){const target=path.join(fixture,'node_modules',patch.path);fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(path.join(root,area,'node_modules',patch.path),target)}
  const run=(args=[])=>spawnSync(process.execPath,[path.join(fixture,script),...args],{encoding:'utf8',timeout:2000});
  assert.equal(run(['--check']).status,0);
  const target=path.join(fixture,'node_modules',patches.find(x=>x.path.includes('picomatch/')).path);
  const original=fs.readFileSync(target);
  fs.appendFileSync(target,'\n// synthetic integrity drift\n');
  const badCheck=run(['--check']),badInstall=run();
  assert.equal(badCheck.error,undefined);assert.equal(badCheck.status,1);assert.match(badCheck.stderr,/Security patch missing or changed/);
  assert.equal(badInstall.error,undefined);assert.equal(badInstall.status,1);assert.match(badInstall.stderr,/Dependency changed; review security patch/);
  fs.writeFileSync(target,original);assert.equal(run(['--check']).status,0);
  fs.unlinkSync(target);const missing=run(['--check']);assert.equal(missing.error,undefined);assert.equal(missing.status,1);assert.match(missing.stderr,/Security patch missing or changed/);
  results.push({area,checks:5,passed:5,installedFilesUntouched:true});
 } finally {fs.rmSync(fixture,{recursive:true,force:true})}
}
if(process.env.CHEF_INTEGRITY_EVIDENCE) fs.writeFileSync(process.env.CHEF_INTEGRITY_EVIDENCE,JSON.stringify(results,null,2)+'\n');console.log(JSON.stringify(results));
