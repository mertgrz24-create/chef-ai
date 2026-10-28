const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { spawnSync } = require('node:child_process');
const { targets, runIsolated, validateInventory } = require('./picomatch-verification-worker.cjs');
const worker = path.join(__dirname, 'picomatch-verification-worker.cjs');
const verifier = path.join(__dirname, 'picomatch-independent-verification.cjs');
const options = { encoding: 'utf8', shell: false, timeout: 3000, killSignal: 'SIGKILL', maxBuffer: 65536, env: { LANG: 'C', TZ: 'UTC' } };

function sandbox(callback) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'chef-worker-test-'));
  try { return callback(directory); }
  finally { fs.rmSync(directory, { recursive: true, force: true }); }
}

function fixture(directory) {
  fs.mkdirSync(path.join(directory, 'scripts'));
  fs.copyFileSync(worker, path.join(directory, 'scripts', 'picomatch-verification-worker.cjs'));
  const entry = path.join(directory, 'mobile/node_modules/picomatch');
  fs.mkdirSync(path.join(entry, 'lib'), { recursive: true });
  fs.writeFileSync(path.join(entry, 'package.json'), '{"name":"picomatch"}');
  fs.writeFileSync(path.join(entry, 'lib/parse.js'), '// synthetic fixture');
  fs.writeFileSync(path.join(entry, 'index.js'), "require('node:fs').writeFileSync('loaded-marker','loaded'); module.exports=()=>()=>false;");
  return { entry, script: path.join(directory, 'scripts', 'picomatch-verification-worker.cjs') };
}

test('all eight fixed installed targets preserve the 432 independent oracle assertions', () => {
  assert.equal(targets.length, 8);
  let assertions = 0;
  for (const target of targets) {
    const result = runIsolated(target.id, 'oracle');
    assert.equal(result.error, undefined, target.id);
    assert.equal(result.status, 0, result.stderr);
    assertions += JSON.parse(result.stdout).assertions;
  }
  assert.equal(assertions, 432);
});

test('arbitrary paths, builtins and prototype-like IDs cannot load a marker module', () => sandbox(directory => {
  const modulePath = path.join(directory, 'marker.cjs');
  const marker = path.join(directory, 'loaded-marker');
  fs.writeFileSync(modulePath, "require('node:fs').writeFileSync('loaded-marker','loaded'); module.exports=()=>()=>false;");
  fs.symlinkSync(modulePath, path.join(directory, 'alias.cjs'));
  for (const id of [modulePath, './marker.cjs', '../marker.cjs', path.join(directory, 'alias.cjs'), 'node:fs', '__proto__', 'constructor', '$(touch loaded-marker)']) {
    const result = spawnSync(process.execPath, [worker, id, 'oracle'], { ...options, cwd: directory });
    assert.equal(result.status, 1);
    assert.equal(result.stdout, '');
    assert.match(result.stderr, /rejected target\/scenario/);
    assert.equal(fs.existsSync(marker), false);
    assert.throws(() => runIsolated(id, 'oracle'), /Unknown verification target/);
  }
}));

test('unknown scenarios and extra arguments are rejected before loading even an allowed target', () => sandbox(directory => {
  const { script } = fixture(directory);
  for (const args of [['mobile-root', 'arbitrary-pattern'], ['mobile-root', 'oracle', 'extra'], ['mobile-root']]) {
    const result = spawnSync(process.execPath, [script, ...args], { ...options, cwd: directory });
    assert.equal(result.status, 1);
    assert.equal(fs.existsSync(path.join(directory, 'loaded-marker')), false);
  }
  assert.throws(() => runIsolated('mobile-root', 'arbitrary-pattern'), /Unknown verification scenario/);
}));

test('the parent no longer exposes the legacy path-based worker entry point', () => {
  const result = spawnSync(process.execPath, [verifier, 'worker', 'node:fs', 'x', 'x'], options);
  assert.equal(result.status, 1);
  assert.equal(result.stdout, '');
  assert.match(result.stderr, /worker paths are not accepted/);
});

test('new, missing and traversal-shaped lockfile targets fail inventory validation', () => {
  for (const area of ['mobile', 'backend']) {
    const packages = JSON.parse(fs.readFileSync(path.join(__dirname, '..', area, 'package-lock.json'), 'utf8')).packages;
    assert.doesNotThrow(() => validateInventory(area, packages));
    assert.throws(() => validateInventory(area, { ...packages, 'node_modules/new-parent/node_modules/picomatch': {} }), /inventory changed/);
    assert.throws(() => validateInventory(area, { ...packages, '../../outside/picomatch': {} }), /inventory changed/);
    const missing = { ...packages };
    delete missing[targets.find(target => target.area === area).relative];
    assert.throws(() => validateInventory(area, missing), /inventory changed/);
  }
});

test('target-directory symlinks cannot escape to a similarly named sibling installation', () => sandbox(directory => {
  const { entry, script } = fixture(directory);
  const outside = path.join(directory, 'mobile/node_modules-sibling');
  fs.renameSync(entry, outside);
  fs.symlinkSync(outside, entry);
  const result = spawnSync(process.execPath, [script, 'mobile-root', 'oracle'], { ...options, cwd: directory });
  assert.equal(result.status, 1);
  assert.equal(fs.existsSync(path.join(directory, 'loaded-marker')), false);
}));

test('symlinked entry files and entire installations cannot escape the expected roots', () => {
  for (const escape of ['entry', 'installation']) sandbox(directory => {
    const { entry, script } = fixture(directory);
    if (escape === 'entry') {
      const outside = path.join(directory, 'outside.cjs');
      fs.renameSync(path.join(entry, 'index.js'), outside);
      fs.symlinkSync(outside, path.join(entry, 'index.js'));
    } else {
      const installation = path.join(directory, 'mobile/node_modules');
      const outside = path.join(directory, 'outside-installation');
      fs.renameSync(installation, outside);
      fs.symlinkSync(outside, installation);
    }
    const result = spawnSync(process.execPath, [script, 'mobile-root', 'oracle'], { ...options, cwd: directory });
    assert.equal(result.status, 1);
    assert.equal(fs.existsSync(path.join(directory, 'loaded-marker')), false);
  });
});

test('the worker does not inherit NODE_OPTIONS preloads from its parent', () => sandbox(directory => {
  const modulePath = path.join(directory, 'preload.cjs');
  const marker = path.join(directory, 'loaded-marker');
  fs.writeFileSync(modulePath, `require('node:fs').writeFileSync(${JSON.stringify(marker)},'loaded');`);
  const previous = process.env.NODE_OPTIONS;
  try {
    process.env.NODE_OPTIONS = '--require=' + modulePath;
    const result = runIsolated('mobile-root', 'oracle');
    assert.equal(result.status, 0, result.stderr);
    assert.equal(JSON.parse(result.stdout).assertions, 54);
    assert.equal(fs.existsSync(marker), false);
  } finally {
    if (previous === undefined) delete process.env.NODE_OPTIONS;
    else process.env.NODE_OPTIONS = previous;
  }
}));

test('the vendored Next copy rejects the adjacent-group probe at compile time without hanging', () => {
  const result = runIsolated('backend-next-vendor', 'adjacent-plus-runs');
  assert.equal(result.error, undefined);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(JSON.parse(result.stdout).rejected, true);
  assert.doesNotMatch(result.stderr, /MATCH_STARTED/);
});

test('patched lockfile copies finish the adjacent-group probes inside the budget', () => {
  for (const id of ['mobile-root', 'mobile-micromatch', 'backend-fast-glob', 'backend-tinyglobby']) {
    for (const scenario of ['adjacent-plus-runs', 'adjacent-star-runs']) {
      const result = runIsolated(id, scenario);
      assert.equal(result.error, undefined, `${id}/${scenario}`);
      assert.equal(result.status, 0, `${id}/${scenario}: ${result.stderr}`);
    }
  }
});
