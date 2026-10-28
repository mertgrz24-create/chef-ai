> **20 Ekim — picomatch kaynak mitigasyonu:** Kurulu7kopyaya hash denetimli yama; temiz kurulum ve150mobil/19bağımlılık/64backend testi geçti. npm audit0/0. Yeniden Snyk aynı tek yüksek advisory gösteriyor (28mobil/2backend yol); kaynak yaması katalog kapanışı değildir. Ignore/sürüm gizleme yok. [Güncel kanıt ve sınırlar](PICOMATCH_REMEDIATION_2026-10-20.md).

# Maintained dependency security patches

## Current result — 2026-10-16, Forge removal

Forge implementation code has been replaced by a scoped Expo adapter using Node crypto/OpenSSL. Authenticated Snyk CLI scans **including development dependencies are clean in mobile and backend**, and both npm audits report **0**. Existing tests pass: **97 mobile + 17 dependency + 42 backend**; both TypeScript and lint checks pass without lint warnings. See [final remediation and limitations](FORGE_REMOVAL_2026-10-16.md) for source provenance, raw scan evidence, the remaining Expo Jest recommendation, editor-refresh status and DAST/native limitations. Older residual-finding and authentication-blocker records below are historical and superseded.


## Current source status — 2026-10-16, Expo 58 migration

See [reviewed package replacements](PACKAGE_REPLACEMENTS_2026-10-16.md) for current versions, provenance and verification limits. Raw npm audit is **0**. Snyk now confirms **one high residual finding: node-forge / CVE-2026-85393**. Its advisory matches all versions despite the installed source mitigation; no fixed version is published. The earlier authentication blocker is superseded by the successful user rescan. See [confirmed finding](SNYK_FINDINGS.md) and [observed UI evidence](snyk-final-residual-2026-10-16.json).

The manifest now contains **one Forge RSA validation patch**. Braces/deepmerge use reviewed pinned replacements; Worklets uses official 0.13.0. Expo 58 removes image-size/decode-uri-component/query-string, so their obsolete compatibility patches and overrides were removed. Earlier 15/16-file patch counts, audit counts and native results below are historical. They do not describe or validate the new Expo 58 graph. Existing APKs were not updated; no build/deploy was performed.

## Historical review records

Reviewed 2026-10-15. These patches are source fixes with executable regression tests. They are **not upstream releases or a clean npm audit result**. Native release/security approval remains pending.

## Published fixes (npm overrides)

| Package | Old | New | Compatibility evidence |
|---|---|---|---|
| image-size | 1.2.1 | 2.0.4 | Metro Assets bridge uses named imageSize; real PNG test and platform export |
| decode-uri-component | 0.2.2 | 0.5.0 | ESM source converted mechanically to CommonJS for query-string 7; malformed URI + query-string tests |
| postcss-selector-parser | 6.1.4 | 7.1.6 | Selector fixture, Tailwind export |
| uuid | 7.0.3 | 11.1.1 | CommonJS v4 call retained; xcode project identifier test |
| Expo CLI → zod | 3.25.76 | 4.6.7 | Scoped override; actual DevTools/MCP schema tests, Expo compatibility and three-platform export |

Do not remove the two compatibility bridges while these overrides remain. Node versions before 22.13 are outside the app's Expo 57 support requirement.

## Unreleased upstream fixes / local patches

| Advisory | Package | Source fix | Regression |
|---|---|---|---|
| [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm) | braces 3.0.3 | Bound parse nesting to 64; iterative AST depth/cycle/node guard before compile, expand and stringify | 3,000 nested braces below the input-length limit; deep/cyclic direct ASTs; ordinary expansion |
| [GHSA-86w9-cpqp-85rv](https://github.com/advisories/GHSA-86w9-cpqp-85rv) | node-forge 1.4.0 | Enforce DigestAlgorithm sequence element count (OID plus at most one parameter) and canonical empty primitive NULL parameters | RSA/e=3 malformed DigestInfo with extra NULL/sequence and nonempty/constructed NULL parameters; valid SHA256 still verifies |
| [GHSA-hp3w-g68c-fv3c](https://github.com/advisories/GHSA-hp3w-g68c-fv3c) | sprintf-js 1.0.3 | Reject width >10,000 and precision >100 before conversion/allocation | Billion-character width/precision; ordinary formatting |

The malformed RSA signature was accepted by the original installed package and rejected after patching. No released fixed version exists for these three advisories as of this review. Independent review of the local cryptographic patch and authenticated backend/native assessment are still required before the security release gate is verified.

## Snyk follow-up patches

- **deepmerge 4.3.1:** reject `__proto__` in both target-copy and source-merge loops in source, CJS and UMD. Null/null-prototype/own-key targets previously bypassed the existing inherited-property guard and could poison the returned object’s prototype. Regression tests exercise the installed runtime variants, nested objects and arrays. No fixed release is published. Reference: [Snyk advisory](https://security.snyk.io/package/npm/deepmerge/4.3.1), [upstream proposed fix #274](https://github.com/TehShrike/deepmerge/pull/274) (closed, unmerged).
- **react-native-worklets 0.10.1:** backport producer commit [c2e9c026](https://github.com/software-mansion/react-native-reanimated/commit/c2e9c026d7b4c1d74362a0a92c38acd0e0452f98). TS and distributed JS cloning use null-prototype dictionaries; native deserialization defines `__proto__` as an own data property rather than invoking its setter. Current Reanimated 4.5.1 explicitly supports Worklets 0.10.x; the Snyk fixed versions 0.12.2/0.13.0 cannot be substituted blindly. Installed JS helper regressions and a syntax compile against actual React Native JSI headers passed. **Full native build and on-device serialization regression remain pending. Existing Expo Go/native binaries do not contain this C++ patch.** Reference: [Snyk advisory](https://security.snyk.io/vuln/SNYK-JS-REACTNATIVEWORKLETS-20158615).

The manifest now protects 16 files. These are maintained mitigations, not released vendor versions or an independent security approval. See [SNYK_FINDINGS.md](SNYK_FINDINGS.md) for the screenshot-to-remediation matrix.

## Lifecycle and integrity

`npm ci` / `npm install` invokes `scripts/apply-security-patches.cjs` in postinstall. `security/patches.json` records exact before/after SHA256 values and deltas. All files are validated before any mutation. Already-applied patches are idempotent. Unknown dependency content fails installation; review changes instead of refreshing hashes blindly.

`npm run test:security` checks installed hashes and runs the regression suite against the **actual Node dependency graph**, independently of Jest mocks. `npm run check` and CI include it. Installing with `--ignore-scripts` requires explicitly running the patch installer before any builds; patch integrity tests will otherwise fail. Production validation checks patch integrity too.

## Audit reporting

Raw npm audit examines package identities/versions, not installed source edits. Versions remain truthful. The 2026-10-15 baseline was 75 (55 high/20 moderate); after published upgrades, raw npm audit reports 59 (54 high/5 moderate). All remaining root advisories are the three locally patched packages above; other listed entries are propagation through parents. These 59 warnings are retained, not hidden, downgraded or marked risk accepted. CI's original `npm audit --audit-level=high` still fails. Attach the local mitigation tests alongside the raw audit and keep release security pending until upstream fixes/review and external checks are complete.

To retire a patch: adopt a published fix, review advisory coverage, remove only the matching delta, regenerate lockfile with a clean install, rerun security/app tests, compatibility checks and platform/native builds, then compare a fresh audit report. Never bump a package version merely to silence the scanner.

### Later same-day recheck

The fresh registry audit is in audit-recheck-2026-10-15.json: **61 warnings (56 high/5 moderate)**. Nativewind and react-native-css-interop are now also listed as parent propagation; the three root advisories and installed source hashes are unchanged. Nine real-dependency tests passed again. Keep audit-after.json (59 warnings) as the earlier snapshot; do not mistake changes in propagated warning counts for additional root fixes or new independent exploits.

### Latest Snyk follow-up audit

`audit-snyk-followup-2026-10-15.json` reports **59 warnings (54 high/5 moderate)**. Its roots remain braces/node-forge/sprintf-js; Snyk additionally identifies deepmerge and Worklets. Different databases and changing parent propagation produce different counts. Neither scanner result overrides the other. No ignore, severity downgrade, forged version or risk acceptance was added.

Additional Worklets native check: the entire installed patched `Serializable.cpp` passed C++20 `-DNDEBUG -fsyntax-only` with the installed RN/Worklets headers. Debug compilation could not complete because the CocoaPods dependency `glog/logging.h` is absent. This does not verify a linked iOS/Android binary or native runtime behavior.

### Actual iOS native follow-up

The Worklets patch subsequently passed actual ARM64 Release simulator compilation and RN→UI/UI→RN Hermes runtime checks. Native Keychain Unicode persistence, restart and removal also passed. Evidence: ios-native-runtime-2026-10-15.json. The normal app artifact has no probe code or local server credential values. Android and physical/distribution verification remain pending. This supersedes the earlier iOS-helper-only limitation, while retaining the independent review gate.


## Son yerel kapanış — 16 Ekim 2026

Güncel kaynak/kontrol ve açık kapılar: [ENGINEERING_CLOSEOUT_2026-10-16.md](../docs/ENGINEERING_CLOSEOUT_2026-10-16.md). 97 mobil, 15 dependency, 41 API, 3 secrets/şablon ve 4 artifact-denetleyici testi geçti; 7 migration ile sentetik geri yükleme provası geçti. En son raw audit mobil53 yüksek/5 orta, backend7 yüksek; güvenlik kapısı kapanmadı. Yeni build/deploy yok. Yalnız kullanıcıdan beklenenler OWNER_ACTIONS.md içinde.


## Daha sonraki güvenlik düzeltmesi — 16 Ekim 2026

[Son bağımlılık düzeltmesi](../docs/DEPENDENCY_REMEDIATION_2026-10-16.md): backend raw audit **0**; mobil **54 yüksek / 0 orta**. Orta uyarıların kaynağı sprintf-js ve eski YAML zinciri kaldırıldı. Yeni yüksek üst kayıt mevcut RevenueCat paketinin react-native üzerinden listelenmesi; yeni kök advisory değil. Kalan kökler braces/node-forge, yamaları testli; bağımsız inceleme/upstream/native kapıları açık. İki temiz kurulum,97 Jest + 15 bağımlılık + 42 backend testi, TS/lint/Expo geçti. Backend tek glob uyumluluk yaması, mobil15 dosya yaması var. Yeni build/deploy yok.
