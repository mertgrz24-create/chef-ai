const { test } = require('node:test')
const assert = require('node:assert/strict')
const { generateKeyPairSync } = require('node:crypto')
const { execFileSync } = require('node:child_process')
const path = require('node:path')

test('splash API 33 resource is versioned without losing the existing theme', () => {
  const { splitSplashStyles } = require('../plugins/with-android-compat.cjs')
  const theme = {
    $: { name: 'Theme.App.SplashScreen', parent: 'Theme.SplashScreen' },
    item: [
      { $: { name: 'windowSplashScreenBackground' }, _: '@color/splashscreen_background' },
      { $: { name: 'windowSplashScreenAnimatedIcon' }, _: '@drawable/splashscreen_logo' },
      { $: { name: 'postSplashScreenTheme' }, _: '@style/AppTheme' },
      { $: { name: 'android:windowSplashScreenBehavior' }, _: 'icon_preferred' },
    ],
  }
  const other = { $: { name: 'AppTheme', parent: 'Theme.AppCompat.DayNight.NoActionBar' } }
  const input = { resources: { style: [other, theme] } }
  const { base, api33 } = splitSplashStyles(input)
  assert.deepEqual(base.resources.style[0], other)
  assert.deepEqual(base.resources.style[1].item, theme.item.slice(0, 3))
  assert.deepEqual(api33.resources.style[0], theme)
  assert.equal(input.resources.style[1].item.length, 4)
  assert.throws(() => splitSplashStyles({ resources: {} }), /Expected Expo splash/)
})

test('camera stays optional without dropping other Android hardware declarations', () => {
  const { optionalCameraFeatures } = require('../plugins/with-android-compat.cjs')
  const other = { $: { 'android:name': 'android.hardware.touchscreen', 'android:required': 'false' } }
  const manifest = { 'uses-feature': [other, { $: { 'android:name': 'android.hardware.camera', 'android:required': 'true' } }] }
  optionalCameraFeatures(manifest)
  optionalCameraFeatures(manifest)
  assert.equal(manifest['uses-feature'].length, 4)
  assert.deepEqual(manifest['uses-feature'][0], other)
  for (const feature of manifest['uses-feature'].slice(1)) assert.equal(feature.$['android:required'], 'false')
})

test('Expo native locale resolver keeps iOS permission translations out of Android', async () => {
  const { createRequire } = require('node:module')
  const projectRoot = path.join(__dirname, '..')
  const expoRequire = createRequire(require.resolve('expo/package.json'))
  const pluginsRoot = path.dirname(expoRequire.resolve('@expo/config-plugins/package.json'))
  const { getResolvedLocalesAsync } = require(path.join(pluginsRoot, 'build/utils/locales.js'))
  const config = require('../app.json').expo
  const android = await getResolvedLocalesAsync(projectRoot, config.locales, 'android')
  const ios = await getResolvedLocalesAsync(projectRoot, config.locales, 'ios')
  for (const lang of ['tr', 'en']) {
    assert.deepEqual(android.localesMap[lang], {})
    for (const key of ['NSCameraUsageDescription', 'NSPhotoLibraryUsageDescription']) {
      assert.equal(typeof ios.localesMap[lang][key], 'string')
      assert.ok(ios.localesMap[lang][key].length > 20)
    }
  }
})

test('all checked-in security patches are installed unchanged', () => {
  execFileSync(process.execPath, [
    path.join(__dirname, '../scripts/apply-security-patches.cjs'),
    '--check',
  ])
})
test('dependency graph resolves reviewed replacements and the fixed Worklets release', () => {
  const lock = require('../package-lock.json')
  const expected = {
    braces: ['@franciscosolis/braces', '3.1.1'],
    deepmerge: ['@stackline/deepmerge', '1.1.0'],
    'react-native-worklets': ['react-native-worklets', '0.13.0'],
    'node-forge': ['@chef-ai/expo-certificate-crypto', '1.0.0'],
    'uri-js': ['fast-uri', '4.2.2'],
    'test-exclude': ['test-exclude', '7.0.2'],
  }
  for (const [name, [canonical, version]] of Object.entries(expected)) {
    const copies = Object.entries(lock.packages).filter(([location]) => location.endsWith(`/node_modules/${name}`) || location === `node_modules/${name}`)
    assert.ok(copies.length > 0)
    for (const [location, metadata] of copies) {
      assert.equal(metadata.name ?? name, canonical)
      assert.equal(metadata.version, version)
      const installed = require(path.join(__dirname, '..', location, 'package.json'))
      assert.equal(installed.name, canonical)
      assert.equal(installed.version, version)
    }
  }
  for (const [location, metadata] of Object.entries(lock.packages)) {
    if (!location.endsWith('/node-forge')) continue
    assert.equal(metadata.resolved, 'file:vendor/chef-ai-expo-certificate-crypto-1.0.0.tgz')
    assert.ok(metadata.integrity?.startsWith('sha512-'))
  }
})
test('braces rejects nested patterns and ASTs before recursive stack exhaustion', () => {
  const braces = require('braces')
  const input = '{'.repeat(3000) + 'a,b' + '}'.repeat(3000)
  for (const method of ['parse', 'compile', 'expand', 'stringify'])
    assert.throws(() => braces[method](input), /max depth/)
  let ast = { type: 'text', value: 'a' }
  for (let i = 0; i < 10000; i++) ast = { type: 'root', nodes: [ast] }
  for (const method of ['compile', 'expand', 'stringify'])
    assert.throws(() => braces[method](ast), /max depth/)
  const cycle = { type: 'root', nodes: [] }
  cycle.nodes.push(cycle)
  assert.throws(() => braces.compile(cycle), /max depth/)
  assert.deepEqual(braces.expand('file-{a,b}-{1..3}'), [
    'file-a-1',
    'file-a-2',
    'file-a-3',
    'file-b-1',
    'file-b-2',
    'file-b-3',
  ])
  assert.equal(braces.compile('file-{a,b}'), 'file-(a|b)')
})
test('NYC YAML configuration loads with maintained js-yaml and without sprintf-js', async () => {
  const fs = require('node:fs')
  const os = require('node:os')
  const { createRequire } = require('node:module')
  const nycRequire = createRequire(require.resolve('@istanbuljs/load-nyc-config'))
  assert.equal(nycRequire('js-yaml/package.json').version, '4.3.2')
  const lock = require('../package-lock.json')
  assert.equal(Object.keys(lock.packages).some(key => /(?:^|\/)(sprintf-js|inflight)$/.test(key)), false)
  const Ajv = require('ajv')
  const validate = new Ajv().compile({ $ref: '#/definitions/Record%3Cstring%2CPerson%3E', definitions: { Person: { type: 'object', properties: { firstName: { type: 'string' } }, required: ['firstName'] }, 'Record<string,Person>': { type: 'object', additionalProperties: { $ref: '#/definitions/Person' } } } })
  assert.equal(validate({ joe: { firstName: 'Joe' } }), true)
  assert.equal(validate({ joe: { firstName: 42 } }), false)
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'chef-nyc-yaml-'))
  try {
    fs.writeFileSync(path.join(temporary, '.nycrc.yaml'), 'all: true\ninclude:\n  - "src/**/*.ts"\nreporter:\n  - text\n')
    const { loadNycConfig } = require('@istanbuljs/load-nyc-config')
    const config = await loadNycConfig({ cwd: temporary })
    assert.equal(config.all, true)
    assert.deepEqual(config.include, ['src/**/*.ts'])
    assert.deepEqual(config.reporter, ['text'])
    const yaml = nycRequire('js-yaml')
    assert.throws(() => yaml.load('value: !!js/function "function () {}"'))
  } finally { fs.rmSync(temporary, { recursive:true, force:true }) }
})
test('RSA rejects extra DigestAlgorithm elements while accepting valid SHA256 signatures', () => {
  const { createHash, privateEncrypt, constants } = require('node:crypto')
  const { AsnConvert } = require('@peculiar/asn1-schema')
  const { CertificationRequest } = require('@peculiar/asn1-csr')
  const asn1 = require('asn1js')
  const certificates = require('@expo/code-signing-certificates')
  const keyPair = generateKeyPairSync('rsa', { modulusLength: 1024, publicExponent: 3 })
  const csr = certificates.generateCSR(keyPair, 'signature-regression')
  assert.equal(csr.verify(), true)
  const pem = certificates.convertCSRToCSRPEM(csr)
  const parsed = AsnConvert.parse(Buffer.from(pem.replace(/-----[^-]+-----/g, '').replace(/\s/g, ''), 'base64'), CertificationRequest)
  const digest = createHash('sha256').update(Buffer.from(AsnConvert.serialize(parsed.certificationRequestInfo))).digest()
  const sequence = value => new asn1.Sequence({ value })
  const oid = () => new asn1.ObjectIdentifier({ value: '2.16.840.1.101.3.4.2.1' })
  const nullValue = () => new asn1.Null()
  const parameters = [
    [oid(), nullValue(), nullValue()],
    [oid(), nullValue(), sequence([])],
    [oid(), new asn1.Primitive({ idBlock: { tagClass: 1, tagNumber: 5 }, valueHex: Buffer.from('garbage') })],
    [oid(), new asn1.Constructed({ idBlock: { tagClass: 1, tagNumber: 5 }, value: [] })],
  ]
  for (const algorithm of parameters) {
    const digestInfo = Buffer.from(sequence([sequence(algorithm), new asn1.OctetString({ valueHex: digest })]).toBER(false))
    const encodedMessage = Buffer.concat([Buffer.from([0, 1]), Buffer.alloc(128 - digestInfo.length - 3, 0xff), Buffer.from([0]), digestInfo])
    parsed.signature = privateEncrypt({ key: keyPair.privateKey, padding: constants.RSA_NO_PADDING }, encodedMessage)
    const malformedCSR = Buffer.from(AsnConvert.serialize(parsed))
    // Exercise the actual replacement consumed by Expo; OpenSSL verifies the CSR.
    assert.equal(certificates.convertCSRPEMToCSR(malformedCSR).verify(), false)
  }
})
test('Expo signing certificates interoperate with Node crypto after the Forge replacement', () => {
  const { verify, X509Certificate } = require('node:crypto')
  const certificates = require('@expo/code-signing-certificates')
  const pem = generateKeyPairSync('rsa', {
    modulusLength: 2048,
    privateKeyEncoding: { type: 'pkcs1', format: 'pem' },
    publicKeyEncoding: { type: 'pkcs1', format: 'pem' },
  })
  const keyPair = certificates.convertKeyPairPEMToKeyPair({ privateKeyPEM: pem.privateKey, publicKeyPEM: pem.publicKey })
  const certificate = certificates.generateSelfSignedCodeSigningCertificate({
    keyPair,
    validityNotBefore: new Date(Date.now() - 60000),
    validityNotAfter: new Date(Date.now() + 60000),
    commonName: 'local-security-regression',
  })
  const restored = certificates.convertCertificatePEMToCertificate(certificates.convertCertificateToCertificatePEM(certificate))
  certificates.validateSelfSignedCertificate(restored, keyPair)
  const data = Buffer.from('Expo manifest signing regression')
  const signature = Buffer.from(certificates.signBufferRSASHA256AndVerify(keyPair.privateKey, restored, data), 'base64')
  assert.equal(verify('sha256', data, pem.publicKey, signature), true)
  assert.equal(verify('sha256', Buffer.from('altered'), pem.publicKey, signature), false)
  const nativeCertificate = new X509Certificate(certificates.convertCertificateToCertificatePEM(restored))
  assert.equal(nativeCertificate.verify(nativeCertificate.publicKey), true)
  const csr = certificates.generateCSR(keyPair, 'local-security-regression')
  assert.equal(csr.verify(), true)
  assert.equal(restored.verify(restored), true)
  const child = certificates.generateDevelopmentCertificateFromCSR(keyPair.privateKey, restored, csr, 'fixture-app', 'fixture-scope')
  assert.equal(restored.verify(child), true)
  assert.equal(new X509Certificate(certificates.convertCertificateToCertificatePEM(child)).verify(nativeCertificate.publicKey), true)
  assert.equal(child.getExtension(certificates.expoProjectInformationOID).value, 'fixture-app,fixture-scope')
  assert.equal(require('node-forge').pki.certificateFromPem(certificates.convertCertificateToCertificatePEM(restored)).subject.getField('CN').value, 'local-security-regression')
  const wrongPair = certificates.generateKeyPair()
  assert.throws(() => certificates.validateSelfSignedCertificate(restored, wrongPair), /does not match/)
  assert.throws(() => certificates.signBufferRSASHA256AndVerify(wrongPair.privateKey, restored, data), /not valid/)
  assert.throws(() => certificates.generateDevelopmentCertificateFromCSR(wrongPair.privateKey, restored, csr, 'fixture-app', 'fixture-scope'), /Issuer key mismatch/)
  const { AsnConvert } = require('@peculiar/asn1-schema')
  const { CertificationRequest } = require('@peculiar/asn1-csr')
  const csrBytes = Buffer.from(certificates.convertCSRToCSRPEM(csr).replace(/-----[^-]+-----/g, '').replace(/\s/g, ''), 'base64')
  const tampered = AsnConvert.parse(csrBytes, CertificationRequest)
  const signatureBytes = new Uint8Array(tampered.signature); signatureBytes[0] ^= 1
  tampered.signature = signatureBytes.buffer
  const tamperedCSR = certificates.convertCSRPEMToCSR(Buffer.from(AsnConvert.serialize(tampered)))
  assert.equal(tamperedCSR.verify(), false)
  assert.throws(() => certificates.generateDevelopmentCertificateFromCSR(keyPair.privateKey, restored, tamperedCSR, 'fixture-app', 'fixture-scope'), /CSR not self-signed/)
  assert.throws(() => certificates.convertCSRPEMToCSR(Buffer.concat([csrBytes, Buffer.from([0])])), /Noncanonical/)

})

test('Expo 58 graph no longer includes the retired URI and image-size dependencies', () => {
  const lock = require('../package-lock.json')
  assert.equal(Object.keys(lock.packages).some(location => /(?:^|\/)(decode-uri-component|query-string|image-size)$/.test(location)), false)
})
test('Metro parses real PNG assets without a compatibility patch', () => {
  const png = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j+1kAAAAASUVORK5CYII=',
    'base64',
  )
  const metro = require(
    path.join(__dirname, '../node_modules/metro/src/Assets.js'),
  )
  assert.equal(metro.getAssetSize('png', png, 'test.png').height, 1)
  assert.throws(() => metro.getAssetSize('png', Buffer.from('invalid'), 'test.png'), /Invalid png image asset/)
})
test('xcode keeps producing unique valid project identifiers with uuid 11', () => {
  const xcode = require('xcode'),
    project = xcode.project('/tmp/chef-security-regression.pbxproj')
  project.hash = { project: { objects: {} } }
  const id = project.generateUuid()
  assert.match(id, /^[A-F0-9]{24}$/)
  assert.notEqual(id, project.generateUuid())
})
test('selector parser keeps Tailwind nesting and attribute selectors compatible', () => {
  const parser = require('postcss-selector-parser')
  const input = '.group:hover > [data-state="open"]:not(.hidden)'
  assert.equal(parser().processSync(input), input)
})

test('production validator rejects private service credentials in public variables', () => {
  const fakeJWT = [
    'e30',
    Buffer.from(JSON.stringify({ role: 'service_role' })).toString('base64url'),
    'fixture',
  ].join('.')
  try {
    execFileSync(
      process.execPath,
      [path.join(__dirname, '../scripts/validate-release.cjs'), '--production'],
      {
        env: {
          ...process.env,
          EXPO_PUBLIC_SUPABASE_ANON_KEY: fakeJWT,
          EXPO_PUBLIC_REVENUECAT_IOS_KEY: 'sk_fixture',
        },
        stdio: 'pipe',
      },
    )
    assert.fail('production validation unexpectedly passed')
  } catch (error) {
    const output = String(error.stderr)
    assert.match(output, /JWT must have the anon role/)
    assert.match(output, /RevenueCat server secret cannot be bundled/)
  }
})

test('deepmerge blocks proto poisoning for null, null-prototype, own-key and array targets', async () => {
  const { pathToFileURL } = require('node:url')
  const esm = await import(pathToFileURL(path.join(path.dirname(require.resolve('deepmerge')), 'index.js')).href)
  const variants = [require('deepmerge'), esm.default]
  const payload = () => JSON.parse('{"__proto__":{"isAdmin":true}}')
  for (const merge of variants) {
    const results = [
      merge(Object.create(null), payload()),
      merge(null, payload()),
      merge(payload(), {}),
      merge({ session: null }, { session: payload() }).session,
      merge([], [payload()])[0],
    ]
    for (const result of results) {
      assert.equal(result.isAdmin, undefined)
      assert.equal(Object.getPrototypeOf(result), Object.prototype)
      assert.equal(Object.hasOwn(result, '__proto__'), false)
    }
    assert.deepEqual(merge({ a: { b: 1 }, list: [1] }, { a: { c: 2 }, list: [2] }), { a: { b: 1, c: 2 }, list: [1, 2] })
    const symbol = Symbol('ordinary')
    assert.equal(merge({}, { [symbol]: 3 })[symbol], 3)
    assert.deepEqual(merge.all([{ plugins: ['one'] }, { plugins: ['two'] }]), { plugins: ['one', 'two'] })
    assert.deepEqual(merge({ values: [1] }, { values: [2] }, { arrayMerge: (_, source) => source }), { values: [2] })
  }
  assert.equal({}.isAdmin, undefined)
})

test('Worklets source and distributed JS preserve proto keys as data without changing prototypes', () => {
  const fs = require('node:fs')
  const ts = require('typescript')
  for (const relative of ['src/memory/serializable.native.ts', 'lib/module/memory/serializable.native.js']) {
    const source = fs.readFileSync(path.join(__dirname, '../node_modules/react-native-worklets', relative), 'utf8')
    const file = ts.createSourceFile(relative, source, ts.ScriptTarget.Latest, true)
    const declaration = file.statements.find(node => ts.isFunctionDeclaration(node) && node.name?.text === 'cloneObjectProperties')
    assert.ok(declaration)
    const compiled = ts.transpileModule(declaration.getText(file), { compilerOptions: { target: ts.ScriptTarget.ES2020 } }).outputText
    let clone
    const serialize = (value, persist, depth) => Array.isArray(value) ? value.map(v => serialize(v, persist, depth + 1)) : value && typeof value === 'object' ? clone(value, persist, depth + 1) : value
    for (const dev of [false, true]) {
    clone = new Function('createSerializable', '__DEV__', 'withPathSegment', compiled + '\nreturn cloneObjectProperties;')(serialize, dev, (_path, run) => run())
    const value = JSON.parse('{"a":{"__proto__":{"isAdmin":true}},"__proto__":{"polluted":true},"normal":42}')
    const result = clone(value, false, 0)
    assert.equal(Object.getPrototypeOf(result), null)
    assert.equal(Object.getPrototypeOf(result.a), null)
    assert.equal(Object.hasOwn(result, '__proto__'), true)
    assert.equal(Object.hasOwn(result.a, '__proto__'), true)
    assert.equal(result.polluted, undefined)
    assert.equal(result.a.isAdmin, undefined)
    assert.equal(result.normal, 42)
    assert.equal({}.polluted, undefined)
    }
    assert.match(source, /const toAdapt[^=]*= Object\.create\(null\)/)
  }
})

test('Expo CLI uses fixed Zod 4 and its real DevTools/MCP schemas still validate', () => {
  const { createRequire } = require('node:module')
  const fs = require('node:fs')
  const expoRequire = createRequire(require.resolve('expo/package.json'))
  const cli = path.dirname(expoRequire.resolve('@expo/cli/package.json'))
  const cliRequire = createRequire(path.join(cli, 'package.json'))
  const version = JSON.parse(fs.readFileSync(cliRequire.resolve('zod/package.json'), 'utf8')).version
  assert.equal(version, '4.6.7')
  const { PluginSchema, DevToolsPluginOutputSchema } = require(path.join(cli, 'build/src/start/server/DevToolsPlugin.schema.js'))
  const plugin = { packageName: 'fixture-plugin', packageRoot: '/tmp/fixture', cliExtensions: { description: 'test', entryPoint: 'index.js', commands: [{ name: 'inspect', title: 'Inspect', environments: ['cli', 'mcp'], parameters: [{ name: 'count', type: 'number' }] }] } }
  assert.equal(PluginSchema.safeParse(plugin).success, true)
  assert.equal(DevToolsPluginOutputSchema.safeParse([{ type: 'text', text: 'ok', level: 'info' }]).success, true)
  assert.equal(DevToolsPluginOutputSchema.safeParse([{ type: 'unknown' }]).success, false)
  const { createMCPDevToolsExtensionSchema } = require(path.join(cli, 'build/src/start/server/createMCPDevToolsExtensionSchema.js'))
  const schema = createMCPDevToolsExtensionSchema(plugin)
  assert.equal(schema.safeParse({ command: 'inspect', count: 2 }).success, true)
  assert.equal(schema.safeParse({ command: 'inspect', count: 'invalid' }).success, false)
  assert.equal(schema.safeParse({ command: 'inspect', unexpected: true }).success, false)
})

test('every installed picomatch copy rejects bounded ReDoS cases and preserves common glob APIs', () => {
  require('../../scripts/picomatch-regression.cjs').verifyPicomatch(path.resolve(__dirname, '..'))
})
test('patched glob consumers keep Tailwind content discovery, micromatch and readdirp working', async () => {
  await require('../../scripts/picomatch-regression.cjs').verifyGlobbing(path.resolve(__dirname, '..'), 'mobile')
})
