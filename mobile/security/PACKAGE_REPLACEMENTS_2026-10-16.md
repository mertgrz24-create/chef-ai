# Reviewed dependency replacements — 2026-10-16

## Current result — 2026-10-16, Forge removal

Forge implementation code has been replaced by a scoped Expo adapter using Node crypto/OpenSSL. Authenticated Snyk CLI scans **including development dependencies are clean in mobile and backend**, and both npm audits report **0**. Existing tests pass: **97 mobile + 17 dependency + 42 backend**; both TypeScript and lint checks pass without lint warnings. See [final remediation and limitations](FORGE_REMOVAL_2026-10-16.md) for source provenance, raw scan evidence, the remaining Expo Jest recommendation, editor-refresh status and DAST/native limitations. Older residual-finding and authentication-blocker records below are historical and superseded.


This source migration addresses the four remaining Snyk Open Source findings. It does not update installed native applications. No native build, deployment, OTA update or remote push is authorized by this task.

## Package selection and provenance

| Original | Replacement | Reason and provenance |
|---|---|---|
| braces 3.0.3 | npm alias `@franciscosolis/braces@3.1.1` | Published MIT fork with parse/compile/expand/stringify depth bounds. Canonical fork name and integrity remain in the lockfile. [Source](https://github.com/Im-Fran/braces). |
| deepmerge 4.3.1 | npm alias `@stackline/deepmerge@1.1.0` | Published MIT implementation that blocks `__proto__` in both merge directions while retaining the deepmerge API. CJS and ESM are covered. [Source](https://github.com/alexandroit/stackline-deepmerge). |
| node-forge 1.4.0 | Exact commit `ceba34402e329f0365134f23fe19898756527d65` from `Krysthyan/forge`, via HTTPS tarball | Unmerged upstream [PR #1152](https://github.com/digitalbazaar/forge/pull/1152) fixes nested DigestAlgorithm cardinality. Its own declared version is `1.4.1-0`; this is **not a released Digital Bazaar security fix**. No local version fabrication is used. The lockfile records the full commit URL and archive SHA-512. |
| react-native-worklets 0.10.1 | Official 0.13.0 | Contains the producer fix. Used with Expo 58.0.13, RN 0.88.0, React 19.3.0 and Reanimated 4.7.1, matching Expo 58's bundled module table. |

The Forge candidate `@andreeewill/node-forge@2.0.0` was rejected: comparing every `lib/*.js` file showed that it did not contain the required cardinality fix. For the selected PR source, the only runtime source difference relative to the previous installed Forge implementation is `lib/rsa.js`. The existing stricter canonical NULL-parameter validation remains a hash-checked postinstall patch, so malformed NULL and extra nested-element tests continue to apply.

Forks are third-party dependencies and the Forge commit is an unreleased source snapshot. Their scanner result must be accompanied by source review and regression evidence; an absence of registry advisories alone does not prove remediation. Keep the exact versions/commit until an upstream replacement is reviewed. No Snyk ignore, exclusion or severity downgrade is part of this change.

## Compatibility scope

Expo 57's core native adapter only accepts Worklets through 0.10.x. Upgrading Reanimated/Worklets alone would leave an incompatible native dependency graph. The source therefore moves to the coordinated Expo 58 package set. Expo 58 requires the v14 React Native Testing Library async APIs; its test renderer and Jest dependencies are updated together.

The checked-in app keeps `updates.enabled: false`. Existing Expo 57/React Native 0.86 APKs and Expo Go binaries must not load this new JavaScript graph. A future authorized native build and device tests are required before publishing. Previous iOS/Android binary evidence applies only to the old package graph.

## Verification

- Clean dependency installation completed; the remaining Forge patch was applied and its installed SHA-256 verified. A subsequent normal `npm install` exercised the idempotent postinstall successfully.
- Installed-dependency security regressions: **17/17 passed** during this migration, including valid/invalid RSA signatures, Expo certificate signing verified through Node crypto, braces bounds, CJS/ESM merge guards and Worklets clone helpers. These do not execute native Worklets.
- Final `npm run typecheck`, `npm run lint` and `npm ls --all --omit=optional`: **passed**. Expo's offline dependency check reports packages up to date using the installed SDK table; it warns that offline validation is less reliable than an online check.
- Fresh registry `npm audit`: **0 vulnerabilities**, including development dependencies. Raw report: [audit-package-replacements-2026-10-16.json](audit-package-replacements-2026-10-16.json).
- The Jest/RNTL tests were adapted to the SDK's asynchronous renderer APIs, but the complete application Jest suite has **not been run after the Expo 58 migration**. Earlier 97-test results belong to Expo 57 and are not evidence for this graph.
- **Snyk closure is not confirmed.** The extension's last completed source scan at 22:45 reported one Open Source issue and zero Code/IaC issues. Its visible panel retained two stale dependency versions. Attempts to obtain a fresh CLI JSON result failed with HTTP 401; the extension access token is expired. The remaining issue's identity was not available from that log. Reauthenticate and rescan before calling the Snyk task closed. No finding was ignored or hidden.
- HawkScan 6.6.0 preflight: CLI available, but no API key or initialized credentials. Authenticated DAST did not run.
- No application export, native build, OTA, deployment or push was performed. Existing installed APKs are unchanged. Independent cryptographic review and new native/device acceptance remain outstanding.

## Confirmed residual finding — 2026-10-16 follow-up

After the user unlocked the computer and rescanned, the authenticated Snyk UI reported **All scans are completed: 1 total / 0 new**, with **one high Open Source finding**, no Code/IaC findings, and Secrets disabled by the organization. This supersedes the earlier unknown residual/expired-session blocker. The remaining finding is **SNYK-JS-NODEFORGE-19635204 / CVE-2026-85393**, CVSS 8.7, on `node-forge@1.4.1-0`.

Both Expo CLI and Expo code-signing resolve to the same installed Forge copy. Its `rsa.js` contains the nested DigestAlgorithm cardinality guard and canonical NULL validation, and `apply-security-patches.cjs --check` passed. The earlier 17-dependency-test evidence covers this mitigation; no tests were rerun in this documentation-only follow-up.

The [Snyk advisory](https://security.snyk.io/vuln/SNYK-JS-NODEFORGE-19635204) matches **all versions (`*`)** and has no published fixed version. npm still reports `node-forge@1.4.0` as latest; Expo signing 0.0.7 still requires it. The selected [PR #1152](https://github.com/digitalbazaar/forge/pull/1152) remains open. Thus the source mitigation is present, but the Snyk dependency finding remains open. Do not describe this as a new unpatched source regression or claim a clean Snyk scan. No ignore, exclusion, renamed package or fabricated version was introduced. Closure requires a recognized fixed upstream release or removal of Forge through a reviewed compatible replacement of its consumers; scanner suppression would not be a code fix.

Observed evidence: [snyk-final-residual-2026-10-16.json](snyk-final-residual-2026-10-16.json). Independent cryptographic review/native acceptance remain pending. No build/deploy/push or APK change occurred.

