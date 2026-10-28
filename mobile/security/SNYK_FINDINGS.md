> **20 Ekim — picomatch kaynak mitigasyonu:** Kurulu7kopyaya hash denetimli yama; temiz kurulum ve150mobil/19bağımlılık/64backend testi geçti. npm audit0/0. Yeniden Snyk aynı tek yüksek advisory gösteriyor (28mobil/2backend yol); kaynak yaması katalog kapanışı değildir. Ignore/sürüm gizleme yok. [Güncel kanıt ve sınırlar](PICOMATCH_REMEDIATION_2026-10-20.md).

> **Latest scan — 2026-10-20:** Fresh authenticated `snyk test --dev` reports one shared high advisory, SNYK-JS-PICOMATCH-21248802 / CVE-2026-112366:28mobile paths (picomatch2.3.2),2backend paths (4.0.4). Both fixedIn arrays are empty. npm audit remains0/0. No package/lock/suppression change. See [UI polish report](../docs/UI_POLISH_2026-10-20.md) and raw snyk-ui-polish-2026-10-20.json in each package security directory. Older clean results below are historical.

# VS Code Snyk findings — 2026-10-15

## Current result — 2026-10-16, Forge removal

Forge implementation code has been replaced by a scoped Expo adapter using Node crypto/OpenSSL. Authenticated Snyk CLI scans **including development dependencies are clean in mobile and backend**, and both npm audits report **0**. Existing tests pass: **97 mobile + 17 dependency + 42 backend**; both TypeScript and lint checks pass without lint warnings. See [final remediation and limitations](FORGE_REMOVAL_2026-10-16.md) for source provenance, raw scan evidence, the remaining Expo Jest recommendation, editor-refresh status and DAST/native limitations. Older residual-finding and authentication-blocker records below are historical and superseded.


## Confirmed residual finding — 2026-10-16 follow-up

After the user unlocked the computer and rescanned, the authenticated Snyk UI reported **All scans are completed: 1 total / 0 new**, with **one high Open Source finding**, no Code/IaC findings, and Secrets disabled by the organization. This supersedes the earlier unknown residual/expired-session blocker. The remaining finding is **SNYK-JS-NODEFORGE-19635204 / CVE-2026-85393**, CVSS 8.7, on `node-forge@1.4.1-0`.

Both Expo CLI and Expo code-signing resolve to the same installed Forge copy. Its `rsa.js` contains the nested DigestAlgorithm cardinality guard and canonical NULL validation, and `apply-security-patches.cjs --check` passed. The earlier 17-dependency-test evidence covers this mitigation; no tests were rerun in this documentation-only follow-up.

The [Snyk advisory](https://security.snyk.io/vuln/SNYK-JS-NODEFORGE-19635204) matches **all versions (`*`)** and has no published fixed version. npm still reports `node-forge@1.4.0` as latest; Expo signing 0.0.7 still requires it. The selected [PR #1152](https://github.com/digitalbazaar/forge/pull/1152) remains open. Thus the source mitigation is present, but the Snyk dependency finding remains open. Do not describe this as a new unpatched source regression or claim a clean Snyk scan. No ignore, exclusion, renamed package or fabricated version was introduced. Closure requires a recognized fixed upstream release or removal of Forge through a reviewed compatible replacement of its consumers; scanner suppression would not be a code fix.

Observed evidence: [snyk-final-residual-2026-10-16.json](snyk-final-residual-2026-10-16.json). Independent cryptographic review/native acceptance remain pending. No build/deploy/push or APK change occurred.


## 2026-10-16: remaining dependency remediation (current)

The source now uses pinned patched braces/deepmerge replacements, an immutable Forge PR source plus a hash-checked RSA validation patch, and official Worklets 0.13.0 with the coordinated Expo 58 graph. Details and third-party/unreleased-source provenance: [PACKAGE_REPLACEMENTS_2026-10-16.md](PACKAGE_REPLACEMENTS_2026-10-16.md).

Registry npm audit is **0**; 17 dependency regressions, final TypeScript/lint and npm dependency-tree checks passed. Full application Jest and native/device acceptance have not run on Expo 58. Existing APKs, hosted services and production data are unchanged.

**Do not claim zero Snyk findings yet.** The extension log's last completed scan at 22:45 on 2026-10-16 reports one OSS issue and zero Code/IaC issues. The UI retained old versions; the precise residual issue was not available in the log. Two direct CLI attempts returned HTTP 401, including one using the extension's expired OAuth access token in process memory. No token was printed or committed. Reauthentication and a successful final rescan are required. No ignore/exclusion/version fabrication was added. HawkScan remains unavailable without initialized credentials.

## 2026-10-16: six-finding follow-up (earlier)

The authenticated VS Code Snyk extension initially showed **6 findings**: four Open Source findings in `mobile/package.json`, a hardcoded test secret in `backend/lib/mobile/security.test.cjs`, and a password-label false positive in `mobile/src/lib/release/messages.ts`.

- The webhook test now generates both its authorization value and HMAC signing key with `crypto.randomBytes(32)` on every run. The verifier and signature use the same generated key. A test cleanup restores the previous environment values.
- The authentication form uses the existing `Your password` / `Parolan` translation. The redundant `Password: 'Parola'` entry was removed; no real user credential was present. The locale regression covers the displayed label in Turkish and English.
- Rescan was initiated through the existing Snyk extension. Its UI reported **All scans are completed**, **4 total / 0 new**, **Code Security: No open issues found**, and **Open Source: 4 issues (2 high, 2 medium)**. IaC had no findings; Secrets remained disabled by the Snyk organization. These counts are manually observed UI results, not a native Snyk JSON export.

The four dependency findings remain open in Snyk. Existing source mitigations were verified; no dependency version, ignore policy, or severity was changed:

| Dependency | Current evidence and remaining blocker |
|---|---|
| braces 3.0.3 | Installed depth/cycle guards pass malicious-pattern and AST regressions. npm still publishes 3.0.3 as latest; [advisory](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) has no patched release. Snyk's Tailwind 4 suggestion removes only some paths; its React Native/Metro and Expo/Metro paths have no remediation advice. |
| node-forge 1.4.0 | Installed RSA validation patch rejects malformed DigestAlgorithm parameters and accepts valid SHA256 signatures. npm latest remains 1.4.0; [advisory](https://github.com/advisories/GHSA-86w9-cpqp-85rv) has no patched release. |
| deepmerge 4.3.1 | Installed CJS/UMD guards pass null-target, own-key, nested-object and array prototype-pollution regressions. npm latest remains 4.3.1; [Snyk](https://security.snyk.io/package/npm/deepmerge/4.3.1) states no fixed version. |
| react-native-worklets 0.10.1 | Existing source/distributed-JS cloning mitigation passes, and native source patch hashes match the manifest. [Snyk's fixed versions](https://security.snyk.io/vuln/SNYK-JS-REACTNATIVEWORKLETS-20158615) start at 0.12.2 / 0.13.0. Installed Expo 57 specifies Worklets 0.10.1 + Reanimated 4.5.1; installed Reanimated supports only Worklets 0.10.x. npm has Reanimated 4.7.1 with Worklets 0.13.x, but changing this native pair requires a separate Expo/native compatibility migration and new native validation. The no-build instruction remains in force. |

Validation: backend security 42/42, mobile dependency security 15/15, locale/privacy 4/4, and both TypeScript checks passed. The lockfile contains one copy of each of the four packages; all 15 maintained patch files passed the integrity check. These tests demonstrate the covered mitigations, not independent security approval or closure of the four Snyk advisories.

HawkScan preflight: CLI 6.6.0 is present, but neither `HAWK_API_KEY` nor `~/.hawk/hawk.properties` is configured. No DAST scan ran and no account was created. No build, deployment, push, or APK replacement was performed.

The sections below preserve earlier observations chronologically.

User-provided baseline: 5 Open Source findings (3 high/2 medium), 2 Code findings (1 medium/1 low). IaC had no findings; Secrets was disabled. This is a different database/counting model from npm audit.

## Remediation matrix

| Baseline finding | Change | Evidence / remaining limitation |
|---|---|---|
| braces 3.0.3, uncontrolled recursion (high) | Existing hash-checked nesting/AST depth, cycle and node-count limits retained | Installed dependency adversarial/normal-input tests pass. Original version remains flagged. Independent review/upstream retirement pending. |
| node-forge 1.4.0, invalid signature verification (high) | Existing strict DigestAlgorithm cardinality and canonical NULL check retained | Actual RSA/e=3 malformed signature regressions and valid SHA256 pass. Original version remains flagged; independent cryptographic review pending. |
| zod 3.25.76, resource allocation (high) | Scoped `@expo/cli` override to 4.6.7; removes nested v3 copy | Real CLI DevTools/MCP schemas, clean install, Expo compatibility and all-platform export pass. Extension Open Source rescan no longer reports Zod. |
| deepmerge 4.3.1, prototype pollution (medium) | Reject `__proto__` in both copy/merge loops; source and CJS/UMD patched | Original CJS source reconstructed from manifest reproduces returned-object prototype poisoning; patched code blocks it. Null/own-key/nested/array regression tests pass. No released fix; original version remains flagged. |
| Worklets 0.10.1, prototype pollution (medium) | Backport producer TS/JS null-prototype dictionaries and C++ safe own-property definition | Actual installed clone helpers tested; helper compiles with installed RN JSI headers. **Actual iOS ARM64 Release build and Hermes serialization tests subsequently passed; Android/physical distribution checks remain pending.** Existing Expo Go binaries cannot validate/include the C++ patch. Snyk fixed release is incompatible with current Reanimated 4.5.1 (supports Worklets 0.10.x). Original version remains flagged. |
| messages.ts, hardcoded password (medium) | Documented as false positive: `Password: 'Parola'` is an English-to-Turkish UI label | No stored credential/auth value. Kept readable; no obfuscation, ignore or risk acceptance. |
| api.test.ts, hardcoded token (low) | Generate mock session token with Node `randomUUID()` | Test-only value; 64 application tests pass. |

Source/advisory links and exact patch lifecycle: [README.md](README.md), [patches.json](patches.json). Worklets producer commit: https://github.com/software-mansion/react-native-reanimated/commit/c2e9c026d7b4c1d74362a0a92c38acd0e0452f98 . Zod fixed range: https://security.snyk.io/vuln/SNYK-JS-ZOD-20510278 .

## Verification

- Clean `npm ci --no-audit`: success; all 16 patch files applied and integrity verified.
- `npm run test:security`: 12/12 real-dependency regressions pass (Worklets helper test stubs the recursive serialization boundary; it is not a native runtime test).
- Jest: 11 suites / 64 tests pass; Expo lint and TypeScript pass.
- `npx expo install --check`: dependencies up to date.
- `npx expo export --platform all`: iOS, Android and web exports pass. Export is not a signed native build. CLI printed a forced-exit warning after successful export; exit code 0.
- Native C++ helper: `xcrun clang++ -std=c++20 -fsyntax-only -I node_modules/react-native/ReactCommon/jsi` passed on the extracted installed helper. This checks the JSI API/types, not the complete Worklets translation unit or runtime behavior.
- Fresh raw npm audit: **59 (54 high/5 moderate)**, preserved in `audit-snyk-followup-2026-10-15.json`. Three npm root advisories remain visible; Snyk has additional deepmerge/Worklets advisories.

## Actual extension rescan

Rescan initiated in the existing authenticated VS Code extension (organization `mertgrz24`); no account, paid plan or trial created. Open Source finished: **4 findings, 2 high/2 medium** (braces, node-forge, deepmerge, Worklets). Zod no longer listed. First Code rescan failed while retrieving its result: `Request to Snyk API timeout`. One retry completed successfully: **5 total = 4 Open Source (2 high/2 medium) + 1 Code (medium)**. The only Code finding is messages.ts line 170, `Password: 'Parola'` (UI label, false positive). The test-token finding is gone. IaC has no findings; Secrets remains disabled. The successful retry supersedes the failed run; it does not establish that source-patched dependencies are independently approved.

No finding has been ignored, downgraded or marked risk accepted. Scanner results cannot verify installed source patches by version number. **Security release gate remains pending**, including independent review, native verification, Secrets scan and authenticated running-API DAST. Snyk Open Source/Code does not replace DAST.

### Additional native compilation evidence

The **entire installed patched** `Common/cpp/worklets/SharedItems/Serializable.cpp` passed:

```sh
xcrun clang++ -std=c++20 -fsyntax-only -DNDEBUG \
  -I node_modules/react-native/ReactCommon/jsi \
  -I node_modules/react-native/ReactCommon \
  -I node_modules/react-native/ReactCommon/callinvoker \
  -I node_modules/react-native-worklets/Common/cpp \
  node_modules/react-native-worklets/Common/cpp/worklets/SharedItems/Serializable.cpp
```

This supplements the isolated helper type check; it does not link a native application or execute serialization. Debug compilation without `-DNDEBUG` stopped because CocoaPods header `glog/logging.h` is not installed. Do not treat that as a successful debug build or modify vendor assertions to bypass it.

Observed UI results are transcribed in snyk-rescan-2026-10-15.json (not a native Snyk JSON export). Screenshot: `/Users/mertgurbuz/.codex/visualizations/2026/10/15/01a1406a-ce7c-70e0-9375-747fd6972719/snyk-rescan-2026-10-15.png`.

## Native follow-up

See ios-native-runtime-2026-10-15.json: actual iOS native Worklets serialization in both directions and Keychain restart/removal passed (10 checks). See ios-artifact-2026-10-15.json: normal compiled app inspection passed with no probe marker/server credential values. Gitleaks source/history scans completed with zero source/history findings; ignored environment inventory was reviewed separately. Snyk Secrets was enabled but is unavailable at the organization. Android execution remains blocked; CI workflow prepared only. Native proof does not retire version warnings or replace independent cryptographic/DAST review.
