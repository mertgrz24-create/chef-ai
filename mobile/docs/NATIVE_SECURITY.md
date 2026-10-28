# Secrets and native verification — 2026-10-15–16

## Secrets checks completed locally

- Gitleaks 8.30.1 installed from Homebrew. Offline: no repository contents or discovered credentials uploaded.
- Mobile source and locally available Git history: zero findings. API source and locally available Git history: zero findings. Source includes tracked and non-ignored untracked files; history uses `--all --full-history`.
- Ignored environment files were separately scanned: five matches. Two are intentionally public Supabase `anon` JWTs; three are server-only credentials in the legacy root `.env.local`. No committed disclosure was found. Local environment file modes were restricted to `0600`; values were not printed. No credential rotation or remote secret-store review is claimed.
- 165 files in the previous three-platform JS export were compared with the local service-role, Gemini, Pexels and cron values: no literal matches. This is a bounded artifact check, not proof that all possible encoded secrets are absent.
- Temporary scan snapshots containing environment files were removed. Retained scanner reports redact credential values; repository evidence contains only filenames, rules, line/commit metadata and counts.
- Snyk Secrets enabled for Chef-AI, but the existing Snyk organization returns `disabled at Snyk`. No paid upgrade or trial started. Gitleaks provides the completed local secret-scanning evidence; Snyk Secrets is not reported as passed.
- New scanner regression tests: 2 passed. They prove detection of an untracked generated test key and a deleted committed test key, metadata-only output, and failure on an empty error result.

### Reproduce

```sh
node mobile/scripts/scan-secrets.cjs --output mobile/security/secrets-source-2026-10-15.json
node --test mobile/tests/secrets-scanner.node.cjs
```

The script requires reviewed Gitleaks 8.30.1. It forces built-in default rules, ignores no findings, disables inline allow comments, preserves no raw credential output and removes its temporary source snapshot. Ignored environment files, remote provider secrets and generated native binaries require the separate inventory/artifact checks above.

`.github/workflows/secrets.yml` installs the pinned Linux CLI with SHA256 verification, runs scanner regressions and scans full checked-out history. Workflow is prepared locally; no pushed commit or successful remote CI run is claimed.

## Native hardening

- Android backups disabled; overlay, microphone and broad photo/storage permissions blocked in config. Generated Android manifest reflects the restrictions. Final merged APK manifest still needs inspection.
- Unused iOS Face ID usage declaration removed through SecureStore's supported `faceIDPermission: false`. Camera/photo explanations retained; microphone declaration absent. Generated iOS ATS arbitrary loads are disabled.
- New session writes use `WHEN_UNLOCKED_THIS_DEVICE_ONLY`. Existing storage namespace and legacy reads are preserved. Unit test verifies the option on every manifest/chunk write.
- Expo 57 prebuild defaults to recreating native directories. Use `--no-clean` when preserving an installed Pods workspace. Native projects are generated/ignored; authoritative changes live in app config.

## iOS execution

CocoaPods installed successfully. **Xcode 26.6 / iOS SDK 26.5 ARM64 Release simulator build passed.** Xcode local simulator signing was required for Keychain access; the initial unsigned attempt correctly failed with a missing-entitlement error. A manually signed test was rejected at launch; Xcode's supported simulator signing resolved it. No OS security check was disabled and no plaintext storage fallback was added.

**10 actual native checks passed** on iPhone 17 / iOS 26.5 / Hermes: engine availability; RN→UI own `__proto__` preservation, no inherited attacker flags and normal data preservation; UI→RN equivalents; long Unicode keychain round trip; persistence across terminating/relaunching the app; and complete session removal. Evidence: `security/ios-native-runtime-2026-10-15.json`. Exact temporary probe reference: `security/ios-native-probe-source.txt` (copy into an isolated project root before bundling; not a production entry point).

The retained normal app was inspected separately: **222 files, 16 embedded privacy manifests**, ARM64 executable, Xcode 26+, expected permission declarations, ATS arbitrary loads disabled, four local server credential values absent, and the native test-probe marker absent. Evidence: `security/ios-artifact-2026-10-15.json`. The temporary probe was replaced with the normal native app; the login screen opens with no session-storage error. Its service-capability banner remains because local configuration still targets the API before the new mobile contracts have been deployed there. No credentials submitted or production writes performed.

Artifacts are ignored under `mobile/artifacts/ios-simulator/` (normal app and dSYM). This is a simulator validation build with a distinct `com.chefai.securitycheck` identifier, **not a signed distribution IPA**. The SDK inventory records installed pod specifications and six distinct privacy manifest contents; it does not replace App Privacy/Data Safety reconciliation.

Reproduce normal artifact inspection after retaining the app at that fixed location:

```sh
python3 mobile/scripts/check-ios-artifact.py
```

The inspector deliberately accepts no arbitrary app, output or executable paths. The Android inspector likewise uses the fixed project APK location and literal `aapt2`/`zipalign` commands; CI puts the reviewed SDK build-tools directory on PATH. Initial scanner warnings about arbitrary CLI paths were fixed, not ignored.

## Android native execution

The Mac has no Java/Android SDK and the user cannot free more disk space. Builds therefore run on the existing private GitHub repository's standard Ubuntu runner. Authenticated billing UI confirmed 436 / 2,000 included minutes used before starting, 0 / 0.5 GB storage, an account-wide $0 Actions budget with hard stop enabled, and no valid payment method. Billing settings were not changed. Workflow timeout is 45 minutes; artifacts are retained one day. Ubuntu is pinned to 24.04 to avoid the announced moving-label migration.

An isolated source snapshot is on `codex/android-native-validation-20261016`. Local main, index and user WIP were preserved. Only the Android workflow was included in this diagnostic branch; other prepared CI workflows have not run remotely. Repository staging variables contain a public Supabase publishable key and the protected staging Preview URL. This establishes build configuration, not reachable native API integration.

**A real ARM64 Release APK was compiled and inspected in run 38816907980:** target API 36, backup disabled, not debuggable, forbidden broad permissions absent, 26 native libraries with valid ELF alignment and SDK `zipalign` 16 KB verification passed. Evidence: `security/android-artifact-2026-10-16.json`. The earlier APK additionally had 1,376 decompressed files compared against four known local server credential values: zero literal matches, and no native probe marker. See `security/android-apk-offline-2026-10-16.json`. These are bounded inspections, not proof that unknown/encoded credentials can never exist.

Full lint exposed actual release configuration errors. EN/TR native permission metadata is now scoped to iOS; Expo's API 33 splash attribute is moved into `values-v33` while keeping the full original theme; camera/autofocus/any-camera hardware is declared optional. Authoritative fixes are the locale JSON files and `plugins/with-android-compat.cjs`, not manual edits in ignored native folders. Actual regenerated Android XML and real Expo locale resolution were checked locally. No lint suppression/baseline or increased minimum Android version was used.

AGP 8.12's K2 UAST engine crashed on Worklets' applied Kotlin build scripts (Google issue 430991549). Full lint uses the supported K1 analysis frontend; Kotlin application compilation remains unchanged. No lint rules were disabled by this work. The previous full app lint report contained 2 errors and 52 warnings; both errors are addressed in source and the follow-up full lint succeeded. Warning classification is retained in `security/android-lint-review-2026-10-16.json`; source-manifest storage-removal entries do not appear as permissions in the actual merged APK. Generated icon format/resource warnings and large-screen/orientation compatibility debt remain visible.

**Latest run passed:** https://github.com/mertgrz24/chef-ai/actions/runs/38822859339 (commit 3313a6477a71f6b71f3af369371375067d35f8ac). Release assembly, full Android lint, APK manifest/ELF/SDK zipalign checks and evidence upload all succeeded. All attempts and their actual outcomes are recorded in `security/android-ci-2026-10-16.json`. No Play upload, final signed AAB, physical-device execution, other ABI verification or Android runtime Worklets/Keystore proof is claimed.

Local checks after the configuration fixes: lint/TypeScript, 65 app tests, 15 dependency/configuration regressions and the existing 4 ELF parser tests. Synthetic parser tests do not establish actual artifact compatibility; the real APK checks above do.

## Gates still requiring evidence

- Physical iOS device behavior, final distribution signing/IPA and provider integration. Simulator runtime and artifact checks above are complete.
- Android physical runtime, final AAB/all ABI compatibility and real device matrix. ARM64 compilation, full lint and APK checks are complete.
- Independent review of maintained cryptographic/dependency patches; source mitigations do not erase Snyk/npm version warnings.
- Authenticated running-API DAST; Open Source/Code/Gitleaks scans do not satisfy it.
- Actual production provider/account configuration, SMTP callbacks, RevenueCat sandbox, Sentry symbolication, push delivery, legal/store details and beta remain separate release gates.

## Review and CI status

`adversarial-reviewer` review of the scanner found an error-to-clean ambiguity and implicit project config/ignore trust. The wrapper now fails on an empty error result, forces default rules with no ignore file, validates required arguments, produces metadata only, and has real-scanner regression evidence. This is agent review of tooling, not an independent cryptographic audit.

CI actions are pinned to commit SHAs resolved from their official repositories on the review date. YAML parses locally. Android workflow passed on the isolated validation branch (run 38822859339); other CI workflows remain local. Final artifact upload succeeded, but local download timed out. The retained local APK/report belongs to run 38816907980; final-run check success is independently established by CI logs. GitHub annotations about deprecated action runtimes remain maintenance work.

## Next release work, in order

1. Complete Android/iOS physical-device and final signed IPA/AAB/all-ABI checks. Remote Android ARM64 native validation is complete; no local Android SDK installation was needed.
2. Obtain independent review of maintained patches and authenticated staging DAST evidence. Keep raw Snyk/npm warnings visible.
3. Give the native staging client a reachable API target implementing the documented mobile contracts. The protected Vercel Preview and the existing production API must not be treated as a verified mobile staging endpoint. Validate before enabling AI, billing, push or analytics.
4. Coordinate backup/restore evidence and production API/migration deployment only after validation. Current production API/schema changes have not been deployed by this work.
5. Complete SMTP/callbacks, RevenueCat products/webhooks and sandbox, Sentry symbolication, physical push delivery, legal/store details and beta. Publisher/domain/support details remain deferred by the user.

Final source/history scanner reports and native artifact records are under `mobile/security/`. Overall security and release gates remain pending; local subchecks above are complete within their stated scope.

### Hosted Android fallback status

Initial billing API calls returned 404 and an earlier browser load failed. A later authenticated UI check established the free quota and enforced $0 budget described above; the user authorized running only within free capacity. No plan, payment method, spending limit or repository visibility was changed. The diagnostic branch has been pushed and actual remote runs are recorded, replacing the historical no-run status. Release and overall security gates remain pending.

Snyk API/Web preparation: official product supports a free option, but actual account entitlement is not yet established. The user completed existing-account login in Safari. Authenticated usage shows 12/200 private manifest tests, 0/300 IaC and 0/100 Code tests. These are not DAST quotas. Snyk API & Web SSO reached `account-not-accessible`; no DAST entitlement was established. No subscription/trial or DAST scan was started. Before native staging device installs, give staging a reachable API and review distinct application identifiers/callback schemes; validation APKs are not a production replacement.

## 16 October follow-up: reachable Android staging API

The stable origin `https://chef-ai-staging-nu.vercel.app` now reaches the separate staging API without a Vercel login or bypass key. Protected Preview URLs remain protected. Actual password login, pantry/private-recipe persistence, isolation and deletion passed 16 direct HTTP checks; 6 signup/recovery token/redirect checks passed separately without sending mail. The dedicated Android account is synthetic and admin-confirmed; SMTP is still not configured.

Android run 38905484217 passed with the stable API URL; the older run 38822859339 APK points at protected Preview and must be replaced for API testing. See `STAGING_DEVICE_TEST.md` and `security/staging-device-access-2026-10-16.json` for artifact status and exact limits.

New user-provided Gemini key passed local model/short generation checks and a local structured recipe. Hosted recipe attempts continued to return provider 503 across models and iad1/bom1. AI/localized-AI flags were disabled pending real hosted acceptance; this is not a completed recipe/scan/plan test. Billing, push, real mailbox delivery and physical native acceptance remain open. Staging information links explicitly do not replace production legal documents. Customer production and production schema were not deployed.


### 16 October — AI service recovery (server only)

No new native build or artifact. Existing staging APK origin is unchanged. Thirteen real hosted checks now passed for EN/TR recipe, public food-photo scan, weekly plan/readback/regeneration, private persistence and consent lifecycle. AI flags verified enabled. See `AI_RECOVERY_2026-10-16.md`; actual camera/gallery and physical native acceptance remain pending. Backend deployment: `dpl_GovLsMia88j1dCSkmUS2zpVTgMJ5`, model `gemini-3.5-flash-lite`. Earlier provider failures remain historical evidence.
