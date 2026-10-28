// Source-only reachability inventory plus pure Next image-validator instrumentation.
// Does not start a server, compile a bundle, read dotenv files or contact services.
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const assert = require('node:assert/strict');
const { pathToFileURL } = require('node:url');
const root = path.resolve(__dirname, '..');
const ts = require(path.join(root, 'backend/node_modules/typescript'));
const matcherPackages = new Set(['picomatch','micromatch','anymatch','readdirp','tinyglobby','fast-glob','tailwindcss','chokidar']);
function filesIn(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => e.isDirectory() ? filesIn(path.join(dir, e.name)) : [path.join(dir, e.name)]);
}
function imports(file) {
  const source = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true);
  const literals = [], dynamic = [];
  function visit(node) {
    if (ts.isImportDeclaration(node) && !node.importClause?.isTypeOnly) literals.push(node.moduleSpecifier.text);
    if (ts.isExportDeclaration(node) && !node.isTypeOnly && node.moduleSpecifier) literals.push(node.moduleSpecifier.text);
    if (ts.isCallExpression(node) && (node.expression.kind === ts.SyntaxKind.ImportKeyword || (ts.isIdentifier(node.expression) && node.expression.text === 'require'))) {
      if (node.arguments.length === 1 && ts.isStringLiteralLike(node.arguments[0])) literals.push(node.arguments[0].text);
      else dynamic.push(source.getLineAndCharacterOfPosition(node.getStart()).line + 1);
    }
    ts.forEachChild(node, visit);
  }
  visit(source); return { literals, dynamic };
}
function resolveLocal(file, spec, area) {
  const target = spec.startsWith('@/') ? path.join(root, area, area === 'mobile' ? 'src' : '', spec.slice(2)) : path.resolve(path.dirname(file), spec);
  return [target, ...['.ts','.tsx','.js','.cjs','.mjs','.json','/index.ts','/index.tsx','/index.js'].map(ext => target + ext)].find(p => fs.existsSync(p) && fs.statSync(p).isFile());
}
function localGraph(area, entries) {
  const queue = [...entries], seen = new Set(), external = new Set(), unresolved = [], dynamic = [], sinks = [];
  while (queue.length) {
    const file = queue.pop(); if (seen.has(file) || !/\.(?:tsx?|[cm]?js)$/.test(file)) continue;
    seen.add(file);
    const refs = imports(file);
    for (const line of refs.dynamic) dynamic.push({ file: path.relative(root, file), line });
    for (const spec of refs.literals) {
      if (typeof spec !== 'string') continue;
      if (spec.startsWith('.') || spec.startsWith('@/')) {
        const resolved = resolveLocal(file, spec, area);
        if (resolved) queue.push(resolved);
        else unresolved.push({ file: path.relative(root, file), spec });
      } else {
        external.add(spec);
        if (matcherPackages.has(spec.split('/')[0])) sinks.push({ file: path.relative(root, file), spec });
      }
    }
  }
  return { entryCount: entries.length, visitedLocalFiles: [...seen].map(p => path.relative(root,p)).sort(), externalImports: [...external].sort(), matcherImports: sinks, nonliteralLoads: dynamic, unresolved };
}
function nativewindGraph() {
  const mobile = path.join(root,'mobile'), local = Module.createRequire(path.join(mobile,'package.json'));
  const queue = [local.resolve('nativewind'), local.resolve('nativewind/jsx-runtime')], seen = new Set(), external = new Set(), gaps = [], matcherImports = [];
  const owned = p => ['nativewind','react-native-css-interop'].some(name => p.startsWith(path.join(mobile,'node_modules',name)+path.sep));
  while (queue.length) {
    const file = queue.pop(); if (seen.has(file) || !/\.[cm]?js$/.test(file)) continue;
    seen.add(file);
    for (const spec of imports(file).literals) {
      if (matcherPackages.has(spec.split('/')[0])) matcherImports.push({ file: path.relative(root,file), spec });
      try { const resolved = Module.createRequire(file).resolve(spec); if (owned(resolved)) queue.push(resolved); else external.add(spec); }
      catch { gaps.push({ file: path.relative(root,file), spec }); }
    }
  }
  return { visitedFiles: [...seen].map(p => path.relative(root,p)).sort(), externalLeaves: [...external].sort(), matcherImports, gaps,
    limit: 'Node literal resolution within NativeWind/CSS interop only, not a Metro release bundle or all package transitives.' };
}
(async () => {
  const backendRoutes = filesIn(path.join(root,'backend/app/api')).filter(p => /\/route\.ts$/.test(p));
  const mobileRoutes = filesIn(path.join(root,'mobile/src/app')).filter(p => /\.[jt]sx?$/.test(p));
  const patternsSeen = [], originalLoad = Module._load;
  // No network allowed in this validator experiment.
  global.fetch = () => { throw Error('Network forbidden in source review'); };
  for (const name of ['node:http','node:https']) {
    const client = require(name); client.request = client.get = () => { throw Error('Network forbidden in source review'); };
  }
  Module._load = function(spec, parent, isMain) {
    const value = originalLoad.apply(this, arguments);
    if (spec === 'next/dist/compiled/picomatch') return new Proxy(value, { get(target, key) {
      if (key === 'makeRe') return (...args) => { patternsSeen.push(args[0]); return target.makeRe(...args); };
      return target[key];
    } });
    return value;
  };
  let image;
  try {
    const configure = (await import(pathToFileURL(path.join(root,'backend/next.config.mjs')).href)).default;
    const config = configure('phase-production-server');
    assert.deepEqual(config.images.remotePatterns, [{ protocol: 'https', hostname: 'images.pexels.com' }]);
    const local = Module.createRequire(path.join(root,'backend/package.json'));
    const { hasRemoteMatch } = local('next/dist/shared/lib/match-remote-pattern');
    const { hasLocalMatch } = local('next/dist/shared/lib/match-local-pattern');
    for (const value of ['+(*a)', '+(a)'.repeat(8)+'b', '*(ab)'.repeat(8)+'c', 'a'.repeat(2000)]) {
      assert.equal(hasRemoteMatch([],config.images.remotePatterns,new URL('https://images.pexels.com/'+value)),true);
      assert.equal(hasRemoteMatch([],config.images.remotePatterns,new URL('https://evil.example.test/'+value)),false);
      assert.equal(hasLocalMatch(undefined, '/'+value),true);
    }
    assert.ok(patternsSeen.length > 0);
    assert.deepEqual([...new Set(patternsSeen)].sort(), ['**','images.pexels.com']);
    image = { pureValidatorCalls: 12, observedCompilePatterns: [...new Set(patternsSeen)], passed: true,
      interpretation: 'Attacker-controlled URL is matching input, not pattern; patterns come from current static next.config. No HTTP endpoint or image download exercised.' };
  } finally { Module._load = originalLoad; }
  const result = { recordedAt: new Date().toISOString(), backend: localGraph('backend',backendRoutes), mobile: localGraph('mobile',mobileRoutes), nativewindRuntime: nativewindGraph(), nextImage: image,
    limitations: ['External packages are graph leaves except the separately inspected NativeWind/CSS interop closure and Next image validator.', 'No full taint analysis, automatic code generation, dynamic Metro resolution, release binary or deployed environment verification.', 'Absence of literal matcher imports alone is not proof of universal unreachability.'] };
  if (process.env.CHEF_REACHABILITY_EVIDENCE) fs.writeFileSync(process.env.CHEF_REACHABILITY_EVIDENCE, JSON.stringify(result,null,2)+'\n');
  console.log(JSON.stringify({ backendEntries: result.backend.entryCount, backendLocalFiles: result.backend.visitedLocalFiles.length, mobileEntries: result.mobile.entryCount, mobileLocalFiles: result.mobile.visitedLocalFiles.length, directMatcherImports: result.backend.matcherImports.length + result.mobile.matcherImports.length, nativewindFiles: result.nativewindRuntime.visitedFiles.length, nativewindMatcherImports: result.nativewindRuntime.matcherImports, nextImage: image }));
})().catch(error => { console.error(error.message); process.exitCode = 1; });
