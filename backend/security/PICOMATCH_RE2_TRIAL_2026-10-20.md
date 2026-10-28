# Picomatch: independent non-backtracking experiment — 2026-10-20

## Decision: NOT PROMOTED; scanner finding remains open

The new experiment used **globrex 0.1.2 + RE2JS 2.8.8**, installed only in a
separate temporary directory with lifecycle scripts disabled. Neither package
was added to mobile/backend. Existing package/lock files and security patches
retain their pre-trial SHA-256 hashes. No build, deploy, remote migration,
staging/production mutation or real AI call occurred.

## Why line 49 still has a finding

`mobile/package.json:49` declares Tailwind 3.4.19. Fresh authenticated Snyk output
confirms this chain:

```text
tailwindcss@3.4.19 → chokidar@3.6.0 → anymatch@3.1.3 → picomatch@2.3.2
```

This is a transitive Picomatch finding associated with the direct dependency's
line, not a new Tailwind source-code vulnerability. The mobile project has 28
reported paths to the same advisory; fixing only this path cannot close all of
them. Backend has two paths. `fixedIn` remains empty; npm registry latest is
still Picomatch 4.0.7 at the time of this investigation.

No dependency was moved to devDependencies or renamed to hide the report. Local
source mitigation still does not change Snyk's version-based advisory result.

## Approach and sources

Unlike the previous Minimatch experiment, this candidate uses a non-backtracking
matching engine. Globrex translates globs to regex source; RE2JS compiles and
matches that source. The generated native RegExp objects are never used for
candidate input matching. Fixed scanner regexes still use native JS normally.
No Picomatch parser/matcher was copied into the candidate, and there is no native
RegExp matching fallback when RE2JS rejects syntax.

- [RE2JS design and API](https://github.com/le0pard/re2js): pure JS, DFA/NFA-based matching; no native addon/build required for this experiment.
- [Globrex source and supported globs](https://github.com/terkelg/globrex): independent glob-to-regex compiler, extended glob support.
- [Picomatch consumer API](https://github.com/micromatch/picomatch): substantially broader than a boolean match function.

The adapter imposes a 4096-character pattern bound and explicitly rejects
malformed POSIX class prefixes before Globrex. Source inspection found that
Globrex's POSIX class loop assumes a terminating colon. This precheck is only
an experimental guard, not a claim of complete compiler hardening. Linear input
matching does not prove bounded compile-time/memory behavior for every pattern.

## Isolated test results

The child-process hook replaced six Picomatch loads for the two real backend
tinyglobby consumers plus mobile Anymatch/Micromatch probes. It existed only in
short-lived test processes. Runtime node_modules were never edited.

| Check | Result |
|---|---|
| Backend fixture cases + dynamic classification + Next root discovery + mobile probes | 40/55 equivalent; 15 differences/errors |
| Eight repeated-extglob security probes, 1-second process bound | 8 completed, 0 timeouts |
| Malformed POSIX pattern probe | Explicit rejection, 0 timeouts |
| Existing patched baseline on all nine probes | Completed within bound |
| Mobile Anymatch normal include/exclude probe | Equivalent |
| Mobile Micromatch probe relevant to the Tailwind chain | Fails: missing `picomatch/lib/utils` private API |
| Real Next root-directory discovery fixture | Equivalent |

Remaining backend gaps, repeated across both consumers:

- Negative extglob requires lookahead that RE2JS rejects (`(?!...)`).
- Escaped literal star and nested brace matching differ.
- `noglobstar` and `nobrace` cases are explicitly rejected by this incomplete adapter.
- Parenthesized-name matching and escaped-star dynamic classification differ.

The 15 differences comprise seven cases across two backend consumers plus the
mobile Micromatch API failure. They are adapter/engine feasibility results, not
proof that implementing an adapter is impossible.

Probe patterns are `+(*)b`, `+(*a)`, `*(a*)b`, `+(a|aa)`, `+(ab|abab)`,
`+(a*|b)`, `+(+(a))b`, `+(a|[ab])` and malformed `[[:unfinished`.
One repeated glob matches in the candidate but is literalized by our current
mitigation; bounded completion is not semantic equivalence. Passing these
examples is not a universal ReDoS safety claim.

## Fresh checks on the unchanged application

- Mobile: **150 tests / 20 suites**, **19 dependency security tests**, lint and TypeScript passed.
- Backend: **64 security/regression tests**, lint and TypeScript passed.
- Both existing security patch integrity checks passed.
- npm audit: **mobile 0, backend 0**.
- Authenticated Snyk `test --dev`: **mobile 28 paths, backend 2 paths**, one common high advisory `SNYK-JS-PICOMATCH-21248802`.
- Separate candidate-only Snyk: **0 findings**, two dependencies. This is not a migrated application scan or a security certificate.
- HawkScan 6.6.0 / skills current, but API key and repository scan configuration unavailable: **DAST BLOCKED**, no DAST performed.

These regression tests ran against the current patched applications. They do not
assert a successful candidate migration. Database/native/build verification was
not run; staging/APK/production are unchanged. No ignore/suppression was added.

## Reproduction and next decision

```sh
trial_dir=$(mktemp -d /private/tmp/chef-re2-glob.XXXXXX)
npm install --prefix "$trial_dir" --ignore-scripts --no-audit --no-fund --save-exact globrex@0.1.2 re2js@2.8.8
CHEF_RE2_TRIAL_DIR="$trial_dir" node scripts/backend-re2-glob-trial.cjs
```

The helper writes `results.json` to the sandbox and cleans its synthetic fixture
directories. Its successful exit means the experiment completed, not that a
candidate passed. Read `verdict`, mismatches, and per-probe outcomes. The exact
candidate lock snapshot is preserved in the verification JSON.

This approach improves bounded matching on the tested attacks, but does not meet
the compatibility gate and cannot close line 49 safely. Keep the existing source
mitigation. Full closure still needs a verified fixed upstream package or a
separately validated replacement covering all consumer APIs and paths; this trial
does not establish either. Do not apply a global override from these results.

Evidence: `re2-glob-compatibility-2026-10-20.json`,
`re2-glob-verification-2026-10-20.json`, three `snyk-re2-trial-*.json` reports and
two `audit-re2-trial-*.json` reports in this directory.
