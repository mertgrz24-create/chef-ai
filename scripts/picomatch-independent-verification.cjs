// Read-only audit tool: bounded synthetic probes, no dependency patching or network.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { targets, scenarios, inspectTarget, validateInventory, runIsolated } = require('./picomatch-verification-worker.cjs');
const root = path.resolve(__dirname, '..');
const hash = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
if (process.argv.length !== 2) {
  console.error('This verifier accepts no arguments; worker paths are not accepted.');
  process.exitCode = 1;
} else {
  const copies = [];
  for (const area of ['mobile', 'backend']) {
    const dir = path.join(root, area);
    const lock = JSON.parse(fs.readFileSync(path.join(dir, 'package-lock.json'), 'utf8'));
    validateInventory(area, lock.packages);
    const manifestPath = area === 'mobile' ? 'security/patches.json' : 'lib/mobile/dependency-patches.json';
    const manifest = JSON.parse(fs.readFileSync(path.join(dir, manifestPath), 'utf8'));
    for (const target of targets.filter(item => item.area === area && !item.vendored)) {
      const { relative, entry } = inspectTarget(target.id);
      const parserPath = relative.replace(/^node_modules\//, '') + '/lib/parse.js';
      const patch = manifest.patches.find(p => p.path === parserPath);
      const actualHash = hash(path.join(entry, 'lib/parse.js'));
      copies.push({ id: target.id, area, relative, entry, version: JSON.parse(fs.readFileSync(path.join(entry, 'package.json'), 'utf8')).version,
        patched: Boolean(patch && actualHash === patch.afterHash), parserSha256: actualHash });
    }
  }
  const vendor = inspectTarget('backend-next-vendor');
  copies.push({ ...vendor,
    version: 'vendored version not declared', patched: false, parserSha256: hash(path.join(vendor.entry, 'index.js')) });
  const results = copies.map(copy => {
    const oracle = runIsolated(copy.id, 'oracle');
    const probes = scenarios.map(test => {
      const child = runIsolated(copy.id, test.id);
      return { name: test.id, pattern: test.pattern, inputLength: test.input.length,
        outcome: child.error?.code === 'ETIMEDOUT' ? 'TIMEOUT' : child.status === 0 ? (JSON.parse(child.stdout).rejected ? 'REJECTED' : 'COMPLETED') : 'ERROR',
        status: child.status, signal: child.signal, error: child.error?.code, matchingStarted: child.stderr?.includes('MATCH_STARTED') ?? false,
        result: child.status === 0 ? JSON.parse(child.stdout) : undefined };
    });
    const publicCopy = { ...copy };
    delete publicCopy.entry;
    return { ...publicCopy, oracle: { passed: oracle.status === 0 && !oracle.error,
      assertions: oracle.status === 0 ? JSON.parse(oracle.stdout).assertions : 0 }, probes };
  });
  const evidence = { recordedAt: new Date().toISOString(), node: process.version, method: 'Separate closed-form semantic oracle and bounded adjacent-group probes; not an external human audit',
    budgetMs: 1000, verdict: 'INCOMPLETE_MITIGATION_RELEASE_BLOCK', results,
    summary: { lockfileCopies: copies.length - 1, extraVendoredCopies: 1,
      passingOracleAssertions: results.reduce((sum, row) => sum + row.oracle.assertions, 0),
      totalProbes: results.reduce((sum, row) => sum + row.probes.length, 0),
      timeouts: results.reduce((sum, row) => sum + row.probes.filter(p => p.outcome === 'TIMEOUT').length, 0) },
    limits: 'Synthetic local Node tests. No deployed service, production/native artifact, remote exploitable HTTP path, universal matcher complexity or external review certification established.' };
  const failed = evidence.summary.timeouts > 0 || results.some(row => !row.oracle.passed || row.probes.some(probe => probe.outcome === 'ERROR'));
  evidence.verdict = failed ? 'INCOMPLETE_MITIGATION_RELEASE_BLOCK' : 'BOUNDED_PROBES_PASS_NOT_FULL_CERTIFICATION';
  if (process.env.CHEF_REVIEW_EVIDENCE) fs.writeFileSync(process.env.CHEF_REVIEW_EVIDENCE, JSON.stringify(evidence, null, 2) + '\n');
  console.log(JSON.stringify(evidence.summary));
  // An audit can run successfully while finding real failures. Nonzero signals the gate.
  process.exitCode = failed ? 2 : 0;
}
