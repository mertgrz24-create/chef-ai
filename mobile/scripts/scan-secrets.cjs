// Offline scan: no credentials or source are uploaded. Reports contain metadata only.
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { execFileSync, spawnSync } = require('node:child_process')
const argument = (name) => {
  const index = process.argv.indexOf(name)
  if (index < 0) return undefined
  const value = process.argv[index + 1]
  if (!value || value.startsWith('--')) throw new Error(`Missing value for ${name}`)
  return value
}
const root = execFileSync('git', ['rev-parse', '--show-toplevel'], {
  cwd: argument('--repo') || path.resolve(__dirname, '../..'), encoding: 'utf8',
}).trim()
const version = execFileSync('gitleaks', ['version'], { encoding: 'utf8' }).trim()
if (version !== '8.30.1') throw new Error('Use reviewed Gitleaks 8.30.1')
const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'chef-source-secrets-'))
const snapshot = path.join(temporary, 'source')
fs.mkdirSync(snapshot)
const configuration = path.join(temporary, 'default.toml')
fs.writeFileSync(configuration, '[extend]\nuseDefault = true\n')
try {
  const files = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '-z'], {
    cwd: root, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024,
  }).split('\0').filter(Boolean)
  let count = 0
  for (const relative of new Set(files)) {
    const source = path.resolve(root, relative)
    if (!source.startsWith(root + path.sep)) throw new Error('Invalid source path')
    if (!fs.existsSync(source) || !fs.lstatSync(source).isFile()) continue
    const destination = path.join(snapshot, relative)
    fs.mkdirSync(path.dirname(destination), { recursive: true })
    fs.copyFileSync(source, destination)
    count++
  }
  const scan = (kind, target, extra = []) => {
    const report = path.join(temporary, kind + '.json')
    const result = spawnSync('gitleaks', [kind, target, ...extra,
      '--config', configuration, '--gitleaks-ignore-path', path.join(temporary, 'no-ignores'),
      '--redact=100', '--ignore-gitleaks-allow', '--no-banner',
      '--report-format', 'json', '--report-path', report,
    ], { encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 })
    if (![0, 1].includes(result.status) || !fs.existsSync(report)) {
      throw new Error(`Gitleaks ${kind} did not complete (exit ${result.status}); no clearance`)
    }
    const findings = JSON.parse(fs.readFileSync(report, 'utf8'))
    if (!Array.isArray(findings) || (result.status === 1 && findings.length === 0)) {
      throw new Error(`Gitleaks ${kind} returned an invalid/failed result; no clearance`)
    }
    return findings.map((finding) => ({
      rule: finding.RuleID,
      file: kind === 'dir' ? path.relative(snapshot, finding.File) : finding.File,
      line: finding.StartLine,
      commit: finding.Commit || null,
    }))
  }
  const source = scan('dir', snapshot)
  const history = scan('git', root, ['--log-opts=--all --full-history'])
  const evidence = {
    scanner: 'gitleaks', version, observedAt: new Date().toISOString(),
    repository: path.basename(root),
    scope: 'Locally available Git refs, tracked and non-ignored untracked files. Ignored local environment files and native/build artifacts require separate inventory/inspection.',
    sourceFileCount: count, source, history,
  }
  const output = argument('--output')
  if (output) fs.writeFileSync(path.resolve(output), JSON.stringify(evidence, null, 2) + '\n')
  console.log(`Secrets scan: ${count} source files; ${source.length} source / ${history.length} history findings.`)
  if (source.length || history.length) process.exitCode = 1
} finally {
  fs.rmSync(temporary, { recursive: true, force: true })
}
