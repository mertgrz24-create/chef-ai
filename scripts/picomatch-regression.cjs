// Exercise every lockfile-resolved installed copy, never attacker-controlled targets.
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const { spawnSync } = require('node:child_process')

function verifyPicomatch(root) {
  const lock = JSON.parse(fs.readFileSync(path.join(root, 'package-lock.json'), 'utf8'))
  const copies = Object.keys(lock.packages).filter(name => name.endsWith('/picomatch'))
  assert.ok(copies.length > 0, 'Expected installed picomatch copies')
  for (const relative of copies) {
    const entry = path.join(root, relative)
    const script = `
      const assert=require('node:assert/strict'), pm=require(process.argv[1]);
      const attacks=['+(*)b','*(*)b','+(*a)','*(a*)b','+(?*a)','+(ab|abab)','*(abc|abcabc)', '+(a*|b)', '+(+(a))b', '+(a|aa)', '+(a|[ab])'];
      const inputs=['a'.repeat(96)+'!', 'ab'.repeat(60)+'!', 'abc'.repeat(50)+'!'];
      for(const glob of attacks) for(const options of [{}, {capture:true}, {fastpaths:false}, {maxExtglobRecursion:false}]) {
        const regex=pm.makeRe(glob,options);
        for(const input of inputs) assert.equal(regex.test(input),false,glob);
        if (!glob.startsWith('+(?')) assert.ok(regex.source.includes('\\\\+\\\\(')||regex.source.includes('\\\\*\\\\('), 'Risky repeat must be literalized: '+glob+' '+regex.source);
        if (!glob.startsWith('+(?')) assert.equal(pm.isMatch(glob,glob,options),true,glob+' literal '+JSON.stringify(options));
      }
      assert.equal(pm.isMatch('src/app/screen.tsx','**/*.{ts,tsx}'),true);
      assert.equal(pm.isMatch('src/app/screen.js','**/*.{ts,tsx}'),false);
      assert.equal(pm.isMatch('.env','*'),false);
      assert.equal(pm.isMatch('.env','*',{dot:true}),true);
      assert.equal(pm.isMatch('file.ts','!(*.js)'),true);
      assert.equal(pm.isMatch('file.js','!(*.js)'),false);
      assert.equal(pm.isMatch('abcdab','+(ab|cd)'),true);
      assert.equal(pm.isMatch('abc','+([abc])'),true);
      assert.equal(pm.isMatch('abab','*(ab)'),true);
      assert.equal(pm.isMatch('file.js','@(file|other).js'),true);
      assert.equal(typeof pm.scan('**/*.js').isGlob,'boolean');
      assert.ok(pm.parse('**/*.js').output);
      assert.equal(pm.makeRe('foo\\\\*bar').test('foo*bar'),true);
      assert.equal(pm.makeRe('foo\\\\*bar').test('fooxbar'),false);
      assert.equal(pm.isMatch('a*b','+(a\\\\*b)'),true);
      assert.equal(pm.isMatch('abab','+(ab)',{capture:true}),true);
      assert.ok(pm.makeRe('src/*.ts',{windows:true}).test('src/a.ts'));
    `
    const result = spawnSync(process.execPath, ['-e', script, entry], {
      encoding: 'utf8', timeout: 2000, maxBuffer: 128 * 1024,
    })
    assert.equal(result.error?.code, undefined, `${relative}: bounded matcher process ${result.error?.code}`)
    assert.equal(result.status, 0, `${relative}: ${result.stderr}`)
  }
  return copies
}
module.exports = { verifyPicomatch }

async function verifyGlobbing(root, area) {
  const { createRequire } = require('node:module')
  const local = createRequire(path.join(root, 'package.json'))
  const temporary = fs.mkdtempSync(path.join(require('node:os').tmpdir(), 'chef-glob-regression-'))
  try {
    fs.writeFileSync(path.join(temporary, 'screen.tsx'), '<View className="bg-green-900 p-4"/>')
    fs.writeFileSync(path.join(temporary, 'screen.test.tsx'), 'fixture')
    fs.writeFileSync(path.join(temporary, 'notes.txt'), 'fixture')
    if (area === 'mobile') {
      const mm = local('micromatch'), anymatch = local('anymatch')
      assert.deepEqual(mm(['src/screen.tsx', 'src/screen.test.tsx', 'notes.txt'], ['**/*.tsx', '!**/*.test.tsx']), ['src/screen.tsx'])
      assert.equal(anymatch('**/*.{ts,tsx}', 'src/screen.tsx'), true)
      assert.equal(anymatch(['**/*.tsx', '!**/*.test.tsx'], 'src/screen.test.tsx'), false)
      const files = []
      for await (const file of local('readdirp')(temporary, { fileFilter: ['*.tsx', '!*.test.tsx'] })) files.push(file.basename)
      assert.deepEqual(files, ['screen.tsx'])
      const result = await local('postcss')([local('tailwindcss')({
        content: [temporary + '/**/*.tsx'], corePlugins: { preflight: false },
      })]).process('@tailwind utilities;', { from: undefined })
      assert.ok(result.css.includes('.bg-green-900'))
      assert.ok(result.css.includes('.p-4'))
    } else {
      const matches = local('tinyglobby').globSync(['**/*.tsx', '!**/*.test.tsx'], { cwd: temporary })
      assert.deepEqual(matches, ['screen.tsx'])
      const pluginRequire = createRequire(local.resolve('@next/eslint-plugin-next/package.json'))
      const glob = pluginRequire('fast-glob')
      assert.deepEqual((await glob.glob(['**/*.tsx', '!**/*.test.tsx'], { cwd: temporary })).sort(), ['screen.tsx'])
    }
  } finally {
    fs.rmSync(temporary, { recursive: true, force: true })
  }
}
module.exports.verifyGlobbing = verifyGlobbing
