// Experimental only. Never imported by the backend or installed as an override.
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '../backend');
if (!process.env.CHEF_RE2_TRIAL_DIR) throw new Error('Set CHEF_RE2_TRIAL_DIR to a separate sandbox containing pinned globrex/re2js');
const sandbox = fs.realpathSync(process.env.CHEF_RE2_TRIAL_DIR);
const repository = fs.realpathSync(path.resolve(__dirname, '..'));
if (sandbox === repository || sandbox.startsWith(repository + path.sep)) throw new Error('Sandbox must be outside the repository');
for (const [name, version] of [['globrex', '0.1.2'], ['re2js', '2.8.8']]) {
  if (JSON.parse(fs.readFileSync(path.join(sandbox, 'node_modules', name, 'package.json'), 'utf8')).version !== version) throw new Error('Unexpected candidate version: ' + name);
}
const globrex = require(path.join(sandbox, 'node_modules/globrex'));
const { RE2JS } = require(path.join(sandbox, 'node_modules/re2js'));
const local = Module.createRequire(path.join(root, 'package.json'));
function parts(pattern) {
  const out = []; let start = 0, depth = 0, escaped = false;
  for (let i = 0; i < pattern.length; i++) {
    const c = pattern[i];
    if (escaped) { escaped = false; continue; }
    if (c === '\\') { escaped = true; continue; }
    if ('[{('.includes(c)) depth++;
    if (']})'.includes(c)) depth--;
    if (c === '/' && depth === 0) { out.push(pattern.slice(start, i)); start = i + 1; }
  }
  out.push(pattern.slice(start)); return out;
}
// Deliberately isolated experiment; unsupported syntax fails, never uses native
// RegExp matching as a fallback. globrex builds RegExp objects only for .source.
function candidate(patterns, options = {}) {
  const array = Array.isArray(patterns) ? patterns : [patterns];
  const expanded = array.flatMap(p => !options.noglobstar && p.endsWith('/**') ? [p, p.slice(0, -3)] : [p]);
  const compiled = expanded.map(pattern => {
    if (pattern.length > 4096) throw new Error('Trial pattern limit exceeded');
    if (pattern.includes('[:') && !pattern.includes(':]')) throw new Error('Malformed POSIX class rejected before globrex');
    if (options.nobrace && pattern.includes('{')) throw new Error('Trial adapter does not implement nobrace');
    if (options.noglobstar && pattern.includes('**')) throw new Error('Trial adapter does not implement noglobstar');
    const source = globrex(pattern, { extended: !options.noextglob, globstar: true, strict: true }).regex.source;
    const regex = RE2JS.compile(source, options.nocase ? RE2JS.CASE_INSENSITIVE : 0);
    return { pattern, regex };
  });
  return input => compiled.some(({ pattern, regex }) => {
    // Conservative partial dot handling is intentionally not full Picomatch parity.
    if (!options.dot && input.split('/').some(p => p.startsWith('.') && !pattern.split('/').includes(p))) return false;
    return regex.matches(input);
  });
}
candidate.scan = pattern => ({
  isGlob: /[*?{}[\]()]/.test(pattern),
  negated: pattern.startsWith('!') && !pattern.startsWith('!('),
  parts: parts(pattern),
});
const cases = [
  ['typescript', ['**/*.ts']],
  ['exclude', ['**/*.ts', '!**/*.test.ts']],
  ['ignore-option', ['**/*.ts'], { ignore: ['**/*.test.ts'] }],
  ['brace', ['**/*.{ts,tsx}']],
  ['dot-off', ['**/*']],
  ['dot-on', ['**/*'], { dot: true }],
  ['case-insensitive', ['**/*.TS'], { caseSensitiveMatch: false }],
  ['extglob', ['src/@(a|b).ts']],
  ['extglob-off', ['src/@(a|b).ts'], { extglob: false }],
  ['negated-extglob', ['src/!(*.test).ts']],
  ['literal-star', ['src/a\\*.ts']],
  ['bracket', ['src/[ab].ts']],
  ['nested-brace', ['{src/{a,b},test/c}.ts']],
  ['globstar-off', ['**/*.ts'], { globstar: false }],
  ['brace-off', ['src/{a,b}.ts'], { braceExpansion: false }],
  ['directories', ['packages/*'], { onlyDirectories: true }],
  ['absolute-directories', ['packages/*'], { onlyDirectories: true, absolute: true }],
  ['deep', ['**/*'], { deep: 1 }],
  ['empty', []],
  ['negative-only', ['!**/*.test.ts']],
  ['literal-parentheses', ['src/(a).ts']],
];
if (process.argv[2] === 'worker') {
  const mode = process.argv[3]; let intercepted = 0;
  const mobileRoot = path.resolve(root, '../mobile');
  if (mode === 'candidate') {
    const original = Module._load;
    Module._load = function(request, parent, isMain) {
      const owned = parent && [root, mobileRoot].some(dir => parent.filename.startsWith(dir + '/node_modules/'));
      if (owned && request.startsWith('picomatch/')) throw new Error('Unsupported private Picomatch API: ' + request);
      if (request === 'picomatch' && owned) {
        intercepted++; return candidate;
      }
      return original.apply(this, arguments);
    };
  }
  const fixture = fs.mkdtempSync(path.join(sandbox, 'fixture-'));
  const files = ['src/a.ts','src/b.ts','src/a.test.ts','src/x.tsx','src/.hidden.ts','src/(a).ts','src/a*.ts','src/UPPER.TS','src/deep/c.ts','test/c.ts','.config/a.ts','notes.txt','packages/one/package.json','packages/two/package.json'];
  const normalize = result => result.map(p => p.replace(fixture, '<fixture>')).sort();
  (async () => {
    try {
      for (const file of files) { fs.mkdirSync(path.dirname(path.join(fixture, file)), { recursive: true }); fs.writeFileSync(path.join(fixture, file), 'synthetic'); }
      const output = { mode, checks: {}, intercepted: 0 };
      const pluginRequire = Module.createRequire(local.resolve('@next/eslint-plugin-next/package.json'));
      for (const [name, globber] of [['tinyglobby', local('tinyglobby')], ['next-alias', pluginRequire('fast-glob')]]) {
        for (const [label, patterns, options = {}] of cases) {
          const key = name + '/' + label;
          try {
            const opts = { cwd: fixture, ...options };
            const sync = normalize(globber.globSync(patterns, opts));
            const asyncResult = normalize(await globber.glob(patterns, opts));
            output.checks[key] = { sync, async: asyncResult };
          } catch (e) { output.checks[key] = { error: e.message }; }
        }
        for (const pattern of ['src/(a).ts','src/{a,b}.ts','src/+(a','src/\\*.ts','src/*.ts'])
          output.checks[name + '/dynamic:' + pattern] = globber.isDynamicPattern(pattern);
      }
      const getRootDirs = pluginRequire('./dist/utils/get-root-dirs.js').getRootDirs;
      output.checks['next-root-dirs'] = normalize(getRootDirs({ cwd: fixture, settings: { next: { rootDir: fixture + '/packages/*' } } }));
      const mobile = Module.createRequire(path.join(mobileRoot, 'package.json'));
      for (const [label, check] of [
        ['mobile-anymatch', () => mobile('anymatch')(['**/*.tsx', '!**/*.test.tsx'], 'src/screen.tsx')],
        ['mobile-micromatch-api', () => mobile('micromatch')(['src/screen.tsx', 'src/screen.test.tsx'], ['**/*.tsx', '!**/*.test.tsx'])],
      ]) {
        try { output.checks[label] = check(); } catch (e) { output.checks[label] = { error: e.message }; }
      }
      output.intercepted = intercepted;
      process.stdout.write(JSON.stringify(output));
    } finally { fs.rmSync(fixture, { recursive: true, force: true }); }
  })().catch(e => { console.error(e); process.exitCode = 1; });
} else if (process.argv[2] === 'attack') {
  const factory = process.argv[4] === 'baseline' ? require(path.join(root, 'node_modules/fast-glob/node_modules/picomatch')) : candidate;
  const matcher = factory(process.argv[3]);
  const input = process.argv[3].includes('ab|') ? 'ab'.repeat(60) + '!' : 'a'.repeat(96) + '!';
  process.stdout.write(JSON.stringify(matcher(input)));
} else {
  const runs = {};
  for (const mode of ['baseline', 'candidate']) {
    const child = spawnSync(process.execPath, [__filename, 'worker', mode], { encoding: 'utf8', timeout: 10000 });
    if (child.status !== 0) throw new Error(mode + ': ' + child.stderr + ' ' + child.error);
    runs[mode] = JSON.parse(child.stdout);
  }
  const comparisons = Object.entries(runs.baseline.checks).map(([key, value]) => ({ key, equal: JSON.stringify(value) === JSON.stringify(runs.candidate.checks[key]), baseline: value, candidate: runs.candidate.checks[key] }));
  const attacks = ['+(*)b', '+(*a)', '*(a*)b', '+(a|aa)', '+(ab|abab)', '+(a*|b)', '+(+(a))b', '+(a|[ab])', '[[:unfinished'].map(pattern => {
    const outcomes = {};
    for (const mode of ['baseline', 'candidate']) {
      const child = spawnSync(process.execPath, [__filename, 'attack', pattern, mode], { encoding: 'utf8', timeout: 1000 });
      outcomes[mode] = { completedWithinBudget: !child.error, status: child.status, outcome: child.error?.code === 'ETIMEDOUT' ? 'TIMEOUT' : child.status === 0 ? 'MATCH_COMPLETED' : 'REJECTED', error: child.error?.code, result: child.stdout, rejection: child.status === 0 ? undefined : child.stderr.split('\n').find(line => line.startsWith('Error:')) };
    }
    return { pattern, ...outcomes };
  });
  const report = { candidate: 'globrex@0.1.2 + re2js@2.8.8', productionChanged: false, candidateLoads: runs.candidate.intercepted, comparisons: comparisons.length, equivalent: comparisons.filter(r => r.equal).length, mismatches: comparisons.filter(r => !r.equal), attacks, verdict: 'NOT_PROMOTED', limitations: 'Strict non-backtracking matcher trial; unsupported syntax produces explicit errors. No native matcher fallback, no Picomatch code copied. Scan/dot/options/private APIs are not fully compatible.' };
  fs.writeFileSync(path.join(sandbox, 'results.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ ...report, mismatches: report.mismatches.map(item => item.key) }, null, 2));
}
