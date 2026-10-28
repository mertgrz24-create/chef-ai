# Backend Picomatch replacement compatibility trial — 2026-10-20

## Decision: REJECTED / NOT PROMOTED

The isolated `minimatch@10.2.6` experiment does **not** qualify as a safe,
compatible replacement. Runtime backend dependencies, lockfiles and existing
security patches remain unchanged. No build, deploy, remote migration, live AI
call or production operation was performed.

## What was exercised

- Candidate dependencies installed only in a separate private temporary directory,
  using `--ignore-scripts`; nothing installed in mobile/backend.
- A short-lived child process intercepted `require('picomatch')` only for backend
  node_modules consumers. Four loads were intercepted. The actual installed
  `tinyglobby@0.2.16` and the Next ESLint `fast-glob` alias to
  `tinyglobby@0.2.17` ran against a synthetic file tree.
- An experimental adapter mapped matcher options and a minimal `scan` result to
  Minimatch. Its scanner is deliberately incomplete, not a production API shim.
  One refinement handled the differing terminal `/**` behavior. An initial broad
  adapter produced 27/53 equivalent comparisons; the refined version produced
  45/53. Neither version was installed in the backend.
- 21 fixture cases per consumer compared both sync and async outputs: extensions,
  excludes, ignore options, braces, hidden files, case folding, extglobs, escapes,
  bracket classes, directories/absolute paths, depth, empty patterns and negative
  patterns. Ten additional dynamic-pattern checks and one real Next root-directory
  discovery check make **53 comparisons**, with duplicate coverage across consumers.

## Results

| Check | Result |
|---|---|
| Refined candidate vs patched current matcher | 45 equivalent / 8 different |
| Remaining differences | Hidden-file handling in negative extglobs, parenthesized names, dynamic classification of parenthesized and unfinished patterns; repeated across both consumers |
| Real Next root-directory discovery | Equivalent for the synthetic fixture |
| Bounded security probes, 1 second per child | Candidate 5/5 timeouts; patched baseline 0/5 timeouts |
| Current backend security/regression tests | 64 passed, 0 failed |
| Current backend lint / TypeScript | PASS / PASS |
| Current backend security patch hashes | PASS |
| Current backend npm audit | 0 findings |
| Fresh current backend Snyk `test --dev` | OPEN: one unique high advisory, two dependency paths |
| Separate candidate-only Snyk `test --dev` | 0 findings across three dependencies; not a migrated backend scan |
| HawkScan DAST | BLOCKED: API key / repository scan configuration unavailable |

Attack patterns: `+(*)b`, `+(*a)`, `*(a*)b`, `+(a|aa)`, `+(ab|abab)`.
Inputs were synthetic nonmatches, 96 `a` characters plus `!`, or 60 `ab` pairs
plus `!` for the last case. Each process was killed after 1000 ms. All five
patched baseline matchers returned false within that bound. These probes are
bounded failure evidence, not a comprehensive complexity proof or a new CVE claim.

**A clean candidate dependency scan does not establish runtime safety.** In this
experiment it coexists with five measured timeouts and eight compatibility gaps.
It must not be used to close the backend Picomatch finding.

## Preserved controls and limitations

The mobile/backend package and lock files and both patch manifests match their
pre-trial SHA-256 hashes. Existing Next glob compatibility and both backend
Picomatch source mitigations remain enabled. No ignore, suppression, version
relabeling, fork substitution or risk acceptance was added.

The 64 backend tests ran against the **current patched backend**, not a successfully
migrated candidate. Mobile tests/scans, database/native verification, actual build
integration, Windows/macOS cross-platform parity and arbitrary glob compatibility
were not run in this trial. The candidate is rejected before those promotion gates.
Staging and production were not contacted or changed.

Recommendation: retain the current mitigation. A future replacement needs both
compatible consumer behavior and bounded matching for the known cases; this
Minimatch adapter does not satisfy either gate. Snyk remains a release blocker.

## Reproduction

From the repository root, create a fresh temporary directory outside the repo:

```sh
trial_dir=$(mktemp -d /private/tmp/chef-backend-glob-trial.XXXXXX)
npm install --prefix "$trial_dir" --ignore-scripts --no-audit --no-fund --save-exact minimatch@10.2.6
CHEF_GLOB_TRIAL_DIR="$trial_dir" node scripts/backend-glob-compatibility-trial.cjs
```

The helper never installs packages or modifies backend consumers. It writes
`results.json` inside the supplied sandbox; child fixture trees are removed in
`finally`. The helper exits successfully when the experiment completes, even if
the candidate is rejected: inspect `verdict`, mismatches and timeout outcomes.
Existing backend node_modules and applied security patches are required.

Run existing controls from `backend/`: `npm run test:security`, `npm run lint`,
`npm run typecheck`, `npm audit --json`,
`node lib/mobile/apply-dependency-patches.cjs --check`, `snyk test --dev --json`.
Snyk exit 1 here means the documented finding was detected, not a passed scan.

Evidence in this directory:

- `picomatch-compatibility-trial-2026-10-20.json`: full comparisons/probes.
- `picomatch-trial-verification-2026-10-20.json`: gates, preserved hashes and exact candidate dependency versions/integrities.
- `snyk-picomatch-trial-2026-10-20.json`: fresh actual backend scan.
- `snyk-minimatch-sandbox-2026-10-20.json`: separate candidate dependency scan.
- `audit-picomatch-trial-2026-10-20.json`: fresh actual backend npm audit.
