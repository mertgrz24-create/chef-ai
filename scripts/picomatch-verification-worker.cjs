// Only reviewed, installed targets and fixed synthetic scenarios may execute.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const targets = Object.freeze([
  { id: 'mobile-anymatch', area: 'mobile', relative: 'node_modules/anymatch/node_modules/picomatch',
    load: () => require('../mobile/node_modules/anymatch/node_modules/picomatch/index.js') },
  { id: 'mobile-jest-util', area: 'mobile', relative: 'node_modules/jest-util/node_modules/picomatch',
    load: () => require('../mobile/node_modules/jest-util/node_modules/picomatch/index.js') },
  { id: 'mobile-micromatch', area: 'mobile', relative: 'node_modules/micromatch/node_modules/picomatch',
    load: () => require('../mobile/node_modules/micromatch/node_modules/picomatch/index.js') },
  { id: 'mobile-root', area: 'mobile', relative: 'node_modules/picomatch',
    load: () => require('../mobile/node_modules/picomatch/index.js') },
  { id: 'mobile-readdirp', area: 'mobile', relative: 'node_modules/readdirp/node_modules/picomatch',
    load: () => require('../mobile/node_modules/readdirp/node_modules/picomatch/index.js') },
  { id: 'backend-fast-glob', area: 'backend', relative: 'node_modules/fast-glob/node_modules/picomatch',
    load: () => require('../backend/node_modules/fast-glob/node_modules/picomatch/index.js') },
  { id: 'backend-tinyglobby', area: 'backend', relative: 'node_modules/tinyglobby/node_modules/picomatch',
    load: () => require('../backend/node_modules/tinyglobby/node_modules/picomatch/index.js') },
  { id: 'backend-next-vendor', area: 'backend', relative: 'node_modules/next/dist/compiled/picomatch', vendored: true,
    load: () => require('../backend/node_modules/next/dist/compiled/picomatch/index.js') },
].map(Object.freeze));
const scenarios = Object.freeze([
  { id: 'previous-single-repeated-wildcard', pattern: '+(*a)', input: 'a'.repeat(96) + '!' },
  { id: 'adjacent-plus-runs', pattern: '+(a)'.repeat(8) + 'b', input: 'a'.repeat(96) + '!' },
  { id: 'adjacent-star-runs', pattern: '*(ab)'.repeat(8) + 'c', input: 'ab'.repeat(64) + '!' },
].map(Object.freeze));

function selectTarget(id) {
  const target = targets.find(item => item.id === id);
  if (!target) throw Error('Unknown verification target; paths are not accepted.');
  return target;
}

function selectScenario(id) {
  const scenario = scenarios.find(item => item.id === id);
  if (id !== 'oracle' && !scenario) throw Error('Unknown verification scenario.');
  return scenario;
}

function requireWithin(base, file) {
  const relative = path.relative(base, file);
  if (relative === '..' || relative.startsWith('..' + path.sep) || path.isAbsolute(relative)) {
    throw Error('Verification target escapes its installation root.');
  }
}

function inspectTarget(id) {
  const target = selectTarget(id);
  const installation = fs.realpathSync(path.join(root, target.area, 'node_modules'));
  requireWithin(fs.realpathSync(path.join(root, target.area)), installation);
  const entry = path.join(root, target.area, target.relative);
  const actual = fs.realpathSync(entry);
  requireWithin(installation, actual);
  for (const relative of ['index.js', 'package.json', ...(target.vendored ? [] : ['lib/parse.js'])]) {
    requireWithin(actual, fs.realpathSync(path.join(entry, relative)));
  }
  return { id: target.id, area: target.area, relative: target.relative, entry, vendored: Boolean(target.vendored) };
}

function validateInventory(area, packages) {
  const expected = targets.filter(target => target.area === area && !target.vendored).map(target => target.relative).sort();
  const actual = Object.keys(packages).filter(name => name.endsWith('/picomatch')).sort();
  if (!expected.length || JSON.stringify(expected) !== JSON.stringify(actual)) {
    throw Error('Picomatch inventory changed; review the fixed target list before running.');
  }
}

function runIsolated(id, scenario) {
  selectTarget(id);
  selectScenario(scenario);
  return spawnSync(process.execPath, [
    '--max-old-space-size=128', path.join(__dirname, 'picomatch-verification-worker.cjs'), id, scenario,
  ], {
    cwd: root, encoding: 'utf8', shell: false, killSignal: 'SIGKILL',
    timeout: scenario === 'oracle' ? 2000 : 1000, maxBuffer: 65536,
    // Do not inherit NODE_OPTIONS, NODE_PATH, credentials or preload hooks.
    env: { LANG: 'C', TZ: 'UTC' },
  });
}

function main(args) {
  if (args.length !== 2) throw Error('Expected a fixed target ID and scenario ID.');
  const [id, scenarioId] = args;
  const target = selectTarget(id);
  const scenario = selectScenario(scenarioId);
  inspectTarget(id);
  const pm = target.load();
  if (scenarioId === 'oracle') {
    let assertions = 0;
    // Independent language oracle, preserved from the previous verifier.
    for (let k = 1; k <= 3; k++) for (let count = 0; count <= 8; count++) {
      const matcher = pm('+(a)'.repeat(k) + 'b');
      for (const suffix of ['b', '!']) {
        assert.equal(matcher('a'.repeat(count) + suffix), suffix === 'b' && count >= k);
        assertions++;
      }
    }
    console.log(JSON.stringify({ assertions }));
  } else {
    const started = performance.now();
    let matcher;
    try { matcher = pm(scenario.pattern); }
    catch (error) {
      // Fail-closed rejection by the vendored Next patch is a safe outcome, not a worker failure.
      if (!/^Chef-AI: unsafe repeated extglob pattern rejected/.test(error?.message ?? '')) throw error;
      console.log(JSON.stringify({ rejected: true, elapsedMs: performance.now() - started }));
      return;
    }
    process.stderr.write('MATCH_STARTED\n');
    console.log(JSON.stringify({ result: matcher(scenario.input), elapsedMs: performance.now() - started }));
  }
}

module.exports = { targets, scenarios, inspectTarget, validateInventory, runIsolated };
if (require.main === module) {
  try { main(process.argv.slice(2)); }
  catch {
    // Never echo arbitrary arguments, source contents or module-loader stacks.
    console.error('Verification worker rejected target/scenario or could not complete its checks.');
    process.exitCode = 1;
  }
}
