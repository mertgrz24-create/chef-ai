> Güncel mimari: mobil `chef-ai/mobile/`, API ve sunucu `chef-ai/backend/`; aynı Git reposunda, bağımsız uygulamalar. Tanıtım ayrı `chef-ai-web` reposunda. Önceki üç repo ayrımı kayıtları tarihsel; `backend/docs/MONOREPO.md` geçerlidir.

# Security review — 2026-10-15

**Release blocked. This is a limited client review, not a security certification.**

## Changes and checks

- Session tokens use chunked SecureStore on native, with a manifest committed only after all chunks are written. Unicode chunks stay below 2 KB. Legacy sessions remain readable.
- API transport requires HTTPS outside local development, validates known response schemas, bounds timeouts, limits read retries and never automatically replays writes. A shared auth refresh avoids concurrent refresh races. Responses from a previous account are rejected.
- AI transfer requires separate explicit, versioned consent acknowledged by the server. Unknown server capabilities disable new integrations. Private recipe responses must explicitly declare `is_public: false`.
- Native Sentry is configured without default PII, replay or content logs. Error scrubbing and optional analytics allowlist have automated checks. No personal content cache/offline write queue was added.
- Production build validation requires evidence for every release gate. OTA is disabled. CI runs dependency audit at high severity and must fail until findings are resolved.

## Dependency findings — updated after remediation

Published fixes and source patches are documented in [../security/README.md](../security/README.md). Latest raw audit recheck: **61 warnings (56 high/5 moderate)**, down from the fresh baseline of 75 (55 high/20 moderate). All three remaining root advisories have local source mitigations and passing regression tests. npm still flags the original package versions; no warning was suppressed. The security gate remains pending.

### Historical baseline (before this remediation)

After compatible `npm audit fix` and Expo alignment, npm audit reported **74 dependency findings: 54 high, 20 moderate, 0 critical** (including transitive paths and meta vulnerabilities; this is not 74 independently demonstrated runtime exploits).

Root advisories include braces, node-forge, image-size, uuid, decode-uri-component, postcss-selector-parser and sprintf-js. Several paths belong to bundling/development/test tooling. Production exploitability has not been established or dismissed. Toolchain findings still require resolution because builds process input and dependencies.

The package manager proposed incompatible major changes/downgrades for several fixes (including Expo 44 and React Native 0.88). Those were not applied blindly to an Expo 57 app. No exclusions, severity downgrades or `audit --force` were used. A compatible upstream patch/validated dependency replacement or SDK migration is still required. Run `npm audit --json` in `mobile/` to regenerate the full advisory graph; do not accept this count as permanently current.

## DAST / backend / native gaps

The initial HawkScan preflight failed because the CLI/key were absent. HawkScan 6.6.0 was subsequently installed at `/Users/mertgurbuz/.local/bin/hawk` with the official manifest SHA256 verified; version/config/skills preflight now passes. StackHawk browser authentication is pending. The v6+ CLI preflight requirement is satisfied; a usable authorized account is still required. **No DAST scan, fix verification or clean-scan result exists.** Use an authorized staging environment and service configuration before running it; the production API was not scanned or mutated.

The mobile repository cannot prove backend RLS, billing webhook validation, AI quota enforcement, data retention/deletion, report moderation, backups or key security. See BACKEND_CONTRACTS.md. Real signed iOS/Android binaries, required-reason privacy manifests and SDK transitive disclosures still need review. APK/AAB 16 KB compatibility and store billing lifecycle have not been verified.

## Next security gate evidence

1. Resolve the dependency graph and attach the new audit result.
2. Run MASVS review plus authorized staging DAST with authenticated coverage; remediate and rescan.
3. Verify account isolation, deletion, consent withdrawal and entitlement ownership on real backend/test accounts.
4. Inspect release binaries, permissions, logs, Sentry payloads and symbolication.
5. Record reviewer, date and actual evidence in release-evidence.json; do not mark security verified from mocked tests.

## Authorized API follow-up

`chef-ai-web` dependencies were updated within their declared compatible ranges (including Next 16.4.1). Its initial scan had 17 findings (1 critical/13 high/3 moderate); its current raw audit has 7 high, no critical/moderate findings. Those seven entries all propagate the locally patched braces advisory. Source fixes also revoke legacy client quota/refund RPCs and protect Premium profile fields; local PostgreSQL tests cover role isolation and reservation races. Staging grants/RLS and 16 real HTTP checks (including deletion) passed on the isolated backend. Authenticated DAST, production verification and native security review remain pending. No production data was changed.

## Connected-service follow-up

The Supabase plugin is connected. Rechecking the staging advisor returned the same intentionally authenticated apply_referral definer warning and nine informational entries for service-only tables without client policies. These are recorded for review; no broad client grants or allow policies were added to silence the advisor.

Registry versions rechecked on 2026-10-15: braces 3.0.3, node-forge 1.4.0 and sprintf-js 1.1.3 remain latest, so the hash-checked local mitigations remain in place. All nine installed-dependency security checks passed again. A fresh raw audit is kept alongside the patch evidence; warnings remain visible.

Supabase changelog was reviewed, including the October 12 CBC TLS cipher deprecation for November 10 at the earliest. A direct TLS 1.3 handshake to the staging project succeeded with certificate verification and TLS_AES_256_GCM_SHA384. This is desktop transport evidence; minimum-supported iOS/Android device checks remain pending. Reference: https://supabase.com/changelog/cbc-tls-ciphers-deprecated .

Latest registry recheck reports 61 warnings (56 high/5 moderate), compared with the earlier 59 (54 high/5 moderate). The two added names are nativewind and react-native-css-interop; both are parent propagation of existing advisories, with no new root advisory. The root URLs remain GHSA-vfj7-8cjw-p6xm, GHSA-86w9-cpqp-85rv and GHSA-hp3w-g68c-fv3c. Raw report: ../security/audit-recheck-2026-10-15.json. The earlier after-report is retained as historical evidence. API recheck remains seven high, all braces propagation. No downgrade, exclusion or risk acceptance was added.

HawkScan runtime provenance: official manifest https://download.stackhawk.com/hawkdocs/hawk.manifest.json ; Darwin arm64 6.6.0 SHA256 af3c9e64987110b5bdb8cb83036013ba5b38f0d8a0a8ea1f26b8199d4ba17c0a. Version/config help/skills status checks passed. Device-flow browser login was initiated; no new StackHawk account, paid plan or trial was created. Backend source inventory records 28 API paths/31 methods in backend/lib/mobile/dast-surface.json. Inventory is not a scan specification or coverage evidence. No DAST run has occurred yet.

## User-selected scanner change

The user declined the paid StackHawk path and selected Snyk as the alternative. The pending HawkScan device-flow process was cancelled; no account, trial or paid plan was created. Do not restart HawkScan authentication automatically. The installed binary is unused.

Use Snyk Free for Open Source dependency checks and Snyk Code static analysis within the account's actual limits. Running-API testing requires the separate Snyk API & Web product; its public product page advertises a Free monthly single-app scan. Confirm the actual account entitlement and remaining quota before starting a scan, including whether fix/rescan fits the free allowance. Do not activate a trial, upgrade, credits or overage. CLI Open Source/Code results alone do not satisfy the authenticated DAST gate. The user subsequently supplied a completed VS Code Snyk scan; its follow-up is recorded below.

References verified 2026-10-15: https://snyk.io/plans/ ; https://snyk.io/product/dast-api-web/ ; https://docs.snyk.io/developer-tools/snyk-cli/scan-and-maintain-projects-using-the-cli/snyk-cli-for-open-source .

## VS Code Snyk screenshot follow-up

The user’s scan identified five Open Source findings and two Code findings. Zod’s old Expo CLI copy was replaced using a scoped 4.6.7 override. Deepmerge and Worklets received six additional hash-checked source patches; Worklets follows the producer’s fix while retaining the Reanimated-supported 0.10.x ABI. Existing braces/node-forge fixes were retained. The test mock token is generated at runtime. `Password: 'Parola'` is a translation label, a documented false positive; no actual password is stored there.

Clean installation, lint, TypeScript, 64 Jest tests, 12 installed-dependency regressions, Expo compatibility and three-platform exports passed. Deepmerge’s original-source exploit was reproduced before validating the patch. Native JSI helper syntax compilation passed; complete native build/runtime and independent review remain pending.

Actual VS Code Open Source rescan: **4 findings (2 high/2 medium)**; Zod is absent. First Code scan timed out; one retry completed with **1 medium** finding, the documented translation-label false positive. The mock-token finding is gone. Combined successful rescan: **5 total**, down from 7. Original package versions remain flagged for local patches. Fresh npm audit: **59 (54 high/5 moderate)** in ../security/audit-snyk-followup-2026-10-15.json; its database does not include all Snyk findings. Secrets scanning is disabled in the extension, so no Secrets clearance is claimed. No suppression or risk acceptance was added. See ../security/SNYK_FINDINGS.md. Security release remains blocked.

Additional Worklets native check: the entire installed patched `Serializable.cpp` passed C++20 `-DNDEBUG -fsyntax-only` with the installed RN/Worklets headers. Debug compilation could not complete because the CocoaPods dependency `glog/logging.h` is absent. This does not verify a linked iOS/Android binary or native runtime behavior.

## Secrets and actual iOS native evidence

Local source/history Secrets checks are complete using offline Gitleaks 8.30.1. Zero mobile/API source/history findings; ignored environment inventory has five explained matches (public anon keys and local server credentials). Local file modes are 0600. Snyk Secrets is enabled in the project but unavailable at the organization; no paid service/trial created. Source/history reports retain metadata only. Four server credential values were absent from the inspected normal iOS app.

Actual Xcode-signed ARM64 Release simulator compilation and 10 Hermes/Worklets/native Keychain checks passed. The native Worklets patch was exercised across both runtime directions. Unicode session storage persisted across process restart and was removed. The normal app's 222 files and 16 privacy manifests passed artifact inspection; probe code is absent. Initial unsigned missing-entitlement failure was resolved by proper Xcode simulator packaging, not by weakening session storage. Generated Android permissions were reviewed; actual APK/AAB/device verification is blocked by this Mac's space/tooling constraint. See NATIVE_SECURITY.md.

65 application tests, 12 dependency regressions, 2 scanner regressions and 4 ELF parser tests passed. Native/keychain options and config were hardened. Hosted native/secrets workflows are prepared and SHA-pinned, not remotely executed. Global security release gate remains pending for Android/physical artifacts, maintained-patch independent review and authenticated DAST.


## Repository ownership update — 2026-10-16

The active API, migrations, server dotenv and operational documents now live in `chef-ai/backend/`. `chef-ai-web` is marketing only. Earlier results describe their original context; repository relocation is not a new deployment, build, DAST scan or release approval. Existing hosted staging URL and installed APK remain unchanged. See backend `docs/REPOSITORY_SPLIT.md`.


## Güncel engel kontrolü — 16 Ekim 2026

Aktif sıralı liste: [RELEASE_BLOCKERS_2026-10-16.md](RELEASE_BLOCKERS_2026-10-16.md). Hesap silmede günlük AI sayacının azalması staging migration ile düzeltildi; production değil. Mobil raw audit56 yüksek / 5 orta, backend7 yüksek; yamalar regresyonda doğrulandı, audit/bağımsız inceleme/DAST kapısı açık. Yeni build/deploy/push yok.
