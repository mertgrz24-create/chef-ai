# Mobile API release work — 2026-10-15

Only API/provider/security/migration code is changed; marketing page source is unchanged.

## Implemented / local evidence

- Private-only recipe saves with account-scoped key/hash, concurrent duplicate replay, 409 on payload mismatch. History returns at most 20 owned private recipes. Existing public rows are not silently changed.
- Versioned server consent and durable, bounded reports. Referenced results require ownership; null IDs support general reports. Reports are transactionally limited to 10/hour/user.
- Atomic AI reservations: 10 free recipes/month, separately configured scan/plan limits, one in-flight operation/account, 5 attempts/15min/user, configured global daily ceiling. Direct client credit/refund RPCs revoked. Profile Premium/counter fields protected against direct client edits.
- AI idempotency covers operation+account+payload+language+units, replays stored results and never calls a provider twice for the same completed request. Failed jobs refund only once via service-only completion. Failed attempts still count for rate/cost controls. Abandoned pending jobs remain charged; no unsafe automatic retry.
- Bounded body/image validation, runtime AI schema checks, actual provider HTTP timeout and no raw prompt/result logging. TR/EN and metric/imperial prompts honor headers, but real output quality still requires integration testing.
- Push register/unregister accepts both Expo formats, rejects cross-account ownership transfer, retains locale/timezone/opt-in. UTC cron uses each token's local 09:00 hour; claim-before-send prevents duplicate daily sends. Sends use generic messages without pantry content. Receipts distinguish provider acceptance from actual device delivery; dead tokens are removed.
- Cleanup endpoint deletes expired AI job content, reports under the operator-selected retention period, and old push records. Signed cron authorization is required. No production job was run.

## Staging rollout (operator required)

1. Back up DB and test restoration; apply the six 20261015 migrations in filename order (foundation, AI security, push delivery, RevenueCat, analytics, trigger hardening). All six were subsequently applied only on the isolated staging project; production remains untouched.
2. Confirm existing base tables/columns/policies match these migrations. Run SQL grants/RLS tests using anon, authenticated user A/user B and service_role. Inspect the profile trigger with existing signup/referral flows.
3. Configure truthful published legal/support/deletion URLs, consent version and provider retention text; select finite scan/plan caps, global attempt budget, report retention days and AI account/provider terms.
4. Keep MOBILE_AI_READY, MOBILE_LOCALIZED_AI_READY and MOBILE_PUSH_READY false until their real staging acceptance passes. Config probes storage and returns capability false without migrations; missing legal configuration is a 503, never fake success.
5. Verify private save/replay and second-device reads; consent revocation; AI concurrency/replay/refund/expired-job handling, localized outputs and daily cost cap.
6. The hourly push schedule requires a Vercel plan supporting hourly cron. Confirm the 100-token claim batch covers launch traffic; larger scale needs pagination/queue workers. Delivery has at-most-once send semantics: unknown network outcomes are not resent. A claimed batch interrupted by a crash may miss reminders. Validate this behavior with physical APNs/FCM devices and test token deletion, timezones/DST and receipts. Provider acceptance is not device delivery.
7. Daily cleanup means a 24-hour replay TTL may retain expired cached content until the next successful daily cleanup (normally up to 48 hours from creation). Monitor failures. Disclose actual provider and server retention; no legal text was invented here.
8. Real SMTP/redirects/AASA/assetlinks, RevenueCat service/product configuration and sandbox lifecycle verification, independent security review/DAST, signed native builds and user beta remain external gates. Billing is disabled by default; it requires server credentials, monthly product/entitlement IDs, finite Premium limits and explicit readiness. No Premium entitlement is inferred from profile fields.

The migrations and mocked route tests are not evidence that production DB/RLS, cost enforcement, push or AI works. Do not deploy blindly. Keep release-evidence pending until real results exist.

## RevenueCat / deletion / analytics additions

Webhook processing requires the configured exact Authorization header plus HMAC-SHA256 over timestamp and raw JSON bytes, with a five-minute delivery timestamp window. Every event reconciles the authoritative GET /v1/subscribers response; no client or webhook event boolean directly grants rights. The SQL updater deduplicates event+user and only replaces a newer snapshot revision. Callers receive the actually committed snapshot, protecting against out-of-order concurrent reconciliation. Status reads and AI authorization reuse a verified snapshot for at most 60 seconds, rechecking at expiry.

The original App User ID must equal the Supabase UUID. Only the configured monthly Apple/Google products with PURCHASED ownership are accepted. Production refuses sandbox purchases, annual/unknown products, family sharing and cross-account alias transfers. Configure RevenueCat restore behavior to Keep with original App User ID. Conflicts require support. Validate cancellation/renewal/refund/grace/hold/restore/race scenarios with real sandbox accounts before enabling billing. A cancelled renewal remains active until its paid expiry; refund and expiration remove Premium.

Account deletion durably queues RevenueCat processor deletion before deleting the auth user; the queue survives cascading deletion. The cleanup worker submits provider deletion (asynchronous at RevenueCat), treats 404 as already deleted, and removes the outbox row only after provider acceptance. Store subscriptions require separate cancellation. Monitor unprocessed deletion jobs; never drop failed jobs to claim privacy completion.

Optional analytics stores only daily aggregate dimensions/counts. The server rejects extra fields; the aggregate RPC has no user-ID argument. Version must match the configured release version, so arbitrary client strings cannot create unlimited dimension rows. No revenue totals are computed from these events; RevenueCat is the purchase source.

Local evidence: 26 Node tests (API/mock/provider-signature/schema checks); six migrations and account/RLS/quota/refund/report/entitlement assertions executed on an isolated PostgreSQL 17 schema; two simultaneous sessions yielded exactly one AI reservation; push claims returned 100, then 1, then 0 duplicates for 101 fixture devices. The local schema is a deliberate minimal Supabase-like fixture, not the deployed schema. Marketing source was unchanged.

## Security dependency follow-up

Next.js and compatible transitive dependencies were updated (Next 16.4.1). The fresh baseline had 17 npm findings including one critical. Current raw npm audit has seven high findings, all propagating braces 3.0.3's unreleased advisory. The five hash-checked brace source patches mirror the mobile fix but are maintained independently in this repo, not through a filesystem dependency. The selector parser override is 7.1.6. `postinstall` applies the patch; `npm run test:security` checks integrity and adversarial behavior. Warnings are retained, not hidden. No `audit --force`, risk acceptance or fabricated package versions were used.

`npm run lint` passes with two existing UI hook warnings; TypeScript, 26 Node security tests and `npm run build` passed. The build used placeholder service configuration and did not call a real AI provider or mutate production. All six migrations and SQL assertions passed on local PostgreSQL 17; this is a minimal fixture schema, not real Supabase evidence. HawkScan could not run: CLI and HAWK_API_KEY are absent.

### Reproduce DB checks safely

Create a disposable **local Unix-socket** PostgreSQL database named `chef_release_test_<suffix>`. The bootstrap and security scripts refuse other database names or TCP connections. Do not use a real Supabase connection. Run `psql -X` with explicit `-h <local socket> -p <port> -d <test database> -v ON_ERROR_STOP=1` for `lib/mobile/test-schema.sql`, then each `supabase/migrations/2026101500*.sql` in sorted order, then `lib/mobile/database-security.sql`. Finally set CHEF_TEST_PGHOST, CHEF_TEST_PGPORT and CHEF_TEST_PGDATABASE to those same local values and run `node lib/mobile/database-concurrency.test.cjs`. The harness verifies the local-only configuration and tests simultaneous reservations plus the 101-device claim batch.

Production still needs real staging migrations/grants and integration tests, provider keys and ownership settings, real legal URLs/retention and caps, SMTP/deep links, actual device/receipt/payment tests, independent security review and beta evidence. Nothing was pushed or deployed.

## Connected Supabase inspection and staging — 2026-10-15

The existing chef-ai project was resumed and reached ACTIVE_HEALTHY. Schema-only catalog inspection confirmed six application tables with RLS enabled; no production application rows were read. The advisor reported mutable signup function search_path, unnecessary trigger function EXECUTE grants, authenticated legacy credit/refund RPCs and disabled leaked-password protection. Migration 006 pins signup/profile trigger search_path and removes unnecessary client EXECUTE grants without replacing existing function bodies. The authenticated apply_referral definer function is intentional and remains subject to review; it cannot grant Premium. Local signup-trigger, role/RLS and concurrency regression checks passed.

The user authorized a separate staging project in mertgrz24's Org. The connector's get_cost failed (tool not returned by upstream tools/list). The authenticated dashboard supplied the supported alternative: Free organization, a second Free Nano project, same ap-south-1 region. chef-ai-staging ref is vcyqtbzhfanbpclfhibv. Automatically exposing new tables was disabled and automatic RLS enabled. No paid plan was selected. The empty-only staging bootstrap in staging-baseline.sql reconstructs base schema without production rows; it is not a migration for an existing production database. Its policies intentionally omit anonymous public recipe reads. Production schema/data remains unchanged.

Staging database provisioning does not establish a staging API deployment, provider/SMTP configuration, real user auth flows, device persistence, AI, payment or push readiness. Keep those gates pending.

### Actual staging SQL result

The empty base schema and all six hardening migrations were applied successfully to vcyqtbzhfanbpclfhibv. A single transaction created synthetic auth/profile fixtures and checked signup, revoked trigger/credit/refund EXECUTE privileges, profile Premium protection, private/cross-account recipe RLS, direct push-write denial, consent, monthly quota, request replay/hash conflicts, single refund, report limits, membership event ordering and aggregate analytics. Result: staging_role_rls_quota_membership_checks_passed. The transaction rolled back; follow-up counts for auth users, profiles, recipes and AI jobs were all zero. The test initially exposed an auth.users column-order fixture mismatch, which was fixed by naming id/email explicitly; no failed fixture records remained.

The post-migration security advisor reports one warning for the intentionally authenticated apply_referral definer function and nine informational RLS-with-no-policy entries for service-only tables. Those tables revoke all anon/authenticated table privileges; an allow policy must not be added just to silence the advisor. See https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy and https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable . This is not a clean DAST or independent security approval.

Database staging is verified at the SQL layer. A separately configured staging API, actual PostgREST/auth sessions, SMTP links, localized AI output, RevenueCat sandbox, push receipts and signed mobile builds remain unverified. No production credentials were copied into staging and no production user content was copied.

### Real auth / local API with remote staging

13 HTTP integration checks passed against the actual source in an isolated local Next server connected exclusively to the remote staging Supabase project. Two synthetic email-confirmed accounts were created through admin Auth and signed in through the real Auth API. Checks covered unauthenticated denial, private save and duplicate replay, conflict, public-save refusal, API/PostgREST isolation, direct Premium/refund denial, pantry persistence and second-client sign-in reads, and disabled AI returning 503. Accounts were deleted; follow-up auth/profile/recipe/pantry counts were zero. The harness first corrected two test assumptions (public-save returns 422; second-client sign-out must be local scope). These were harness fixes, not silent API fallbacks.

Reproduction: run the isolated local API on 127.0.0.1:3407 with only staging credentials; supply a mode-0600 staging server-key file through CHEF_STAGING_SERVER_KEY_FILE and run node lib/mobile/staging-http-integration.cjs. No OTP, real mailbox/SMTP, user onboarding confirmation, mobile second physical device, AI provider, payment or push is covered.

A separate chef-ai-staging Vercel project was created in mertgrz24s-projects. Only the temporary staging copy is linked to it; the main repo's production Vercel link remains unchanged. Preview environment configuration/deployment is tracked separately and must not be assumed from project creation.

## Vercel staging follow-up

The Preview deployment dpl_3q6C6v3rUDwK46aCbTW2T6ejTs2p reached READY with target null (Preview), the separate staging project ID and an empty cron list verified through deployment metadata. Thirteen real HTTP integration checks and three additional authenticated account-deletion/isolation/session-rejection checks passed on that deployed API. Fixture records were removed; processor deletion, store cancellation and SMTP are separate unverified integrations.

Vercel marks a new project's first deployment Production even when Preview is requested. The first API attempt failed because the original cron configuration was used and Hobby rejects hourly schedules. No upgrade was performed. A secret-free static staging placeholder initialized only the new staging project's production slot; it serves no app API. The subsequent API deployment correctly uses Preview variables. The existing chef-ai project was never deployed or changed. Keep this distinction when reviewing Vercel's Production label.

For repeat staging deployments, export source without .env*, .git, .next or production .vercel linkage. Link the temporary export only to chef-ai-staging. Copy lib/mobile/vercel.staging.json to the exported root vercel.json; --local-config alone did not prevent the original root cron config from being picked up. Never overwrite the real production vercel.json for staging. Keep production secrets out of the export. Preview uses staging-only Supabase variables, a sensitive server key, false readiness flags, no cron and noindex headers. Do not remove deployment protection to test it. Vercel curl can use account-scoped protection bypass; this CLI version incorrectly forwarded --scope to curl, so tests used the correctly linked staging working directory instead.

Legacy API database logs now pass through databaseFailure: only bounded SQLSTATE/PGRST codes are emitted; message/details/hints and arbitrary RPC status text are excluded. A privacy regression was added (27 Node tests now pass), lint has zero errors/two existing UI warnings and TypeScript passes. The final log-privacy deploy (dpl_2FvuGduCJFq9iT2kUiHUtUmdE9c5) reached READY as Preview; all 13 API and three deletion checks passed again on that exact build. HawkScan preflight still fails because CLI/key are absent; no DAST approval is claimed.

The user deferred publisher identity, support email and legal domain. No invented legal values were configured. AI, RevenueCat, push, analytics, SMTP, native/device/store/beta and production rollout gates remain pending.

### Final staging delivery

Latest protected Preview: https://chef-ai-staging-ediir63l3-mertgrz24s-projects.vercel.app . Source is an exported working-tree snapshot, not a new committed/pushed revision. Latest deployment ID: dpl_2FvuGduCJFq9iT2kUiHUtUmdE9c5. Production chef-ai remains unchanged.

Remote test repro: supply CHEF_STAGING_SERVER_KEY_FILE (private mode-0600 file, staging only) and CHEF_STAGING_VERCEL_DIR (temporary directory linked to the staging project). Run staging-preview-integration.cjs and staging-preview-deletion.cjs from lib/mobile. They refuse a different linked project. The latter confirms fixture inserts before deleting, verifies the caller's own data cascade despite a different user ID in the body, preserves the other account and rejects the deleted session. Final follow-up auth/profile/recipe/pantry/AI-job/processor-outbox counts were all zero. Test accounts were admin-confirmed; this does not verify real inbox verification or SMTP.

The temporary local server was stopped and temporary server-key/payload files were removed after checks. Keys remain only in the authorized staging service configuration. No paid upgrade, production migration, production API deployment or store submission occurred.

## Subsequent connected-service security follow-up

Supabase staging advisor recheck is unchanged. Latest mobile registry audit is 61 entries (56 high/5 moderate): two additional parent names propagate the same three patched root advisories. API audit remains seven high from braces. No warning was hidden or risk accepted. Nine installed-dependency regression tests passed again. Staging TLS 1.3/certificate verification passed; this is desktop transport evidence, not native matrix evidence.

HawkScan 6.6.0 is installed at /Users/mertgurbuz/.local/bin/hawk with manifest SHA256 verified; version/config/skills preflight passes. Browser device-flow authentication is pending; no scan/paid plan/trial was started. dast-surface.json captures 28 API paths/31 methods for later code-derived scan coverage checks; it is not itself a runnable spec or proof of coverage. Production/native security gates stay pending.

User scanner preference: use Snyk Free instead of StackHawk. Pending HawkScan browser authentication was cancelled; no account/trial/paid plan created. Do not restart it automatically. Snyk Open Source/Code cover dependency/static analysis; authenticated dynamic testing needs the separate API & Web product, with actual Free entitlement/quota/rescan allowance verified before use. No Snyk scan or paid upgrade has been performed. Security gate stays pending.

## 16 October: public staging origin for Android

Separate staging project stable origin: https://chef-ai-staging-nu.vercel.app. No Vercel session or bypass credential is required at this origin; Preview protection is retained. Staging DB remains vcyqtbzhfanbpclfhibv, functions bom1. Only this staging project uses its Vercel Production target; customer production and production schema are unchanged. Direct HTTP integration/deletion checks (16) and admin-generated signup/recovery token checks (6) passed. Actual SMTP is not configured and no real mailbox delivery is claimed. The dedicated Android login account is synthetic and admin-confirmed; its credentials are not stored in source.

GEMINI_MODEL is explicit server configuration, preserving the existing default outside staging. The user-provided new key passed local model and generation checks, including a structured recipe with gemini-3.1-flash-lite; hosted recipe attempts returned provider 503 across tested models/regions. AI/localized-AI are disabled pending hosted acceptance. Other service flags remain disabled. Category-only staging diagnostics exclude exception messages, URLs and content. API security tests:30; TypeScript passed; lint has 0 errors and 4 existing warnings. Source/history Secrets scans:0 findings.

The staging-info route is restricted to this staging DB/environment and explicitly is not a production legal policy. Do not mark legal/store gates complete. Android artifact run38905484217 uses the stable origin; physical device acceptance remains user work. Global daily AI attempt counting currently relies on deletable per-user job rows; production cost-control review must consider deletion/recreation rather than assuming a durable cost ledger.


## 16 October 2026 — Device feedback source-only correction

- The user saw a long browser page from the shared account-deletion information link. Mobile source now removes that link everywhere; the native red Profile action remains. No confirmed server deletion regression was established.
- Staging auth/profile/pantry/recipe deletion cascade verified with synthetic data and rollback. Account route regressions cover identity and storage/deletion failure cases. No real user deletion or schema mutation.
- Five AI handlers now return fixed provider busy/quota/configuration/timeout codes; the idempotency wrapper preserves an allowlist only. No raw provider details or automatic AI retries. Last hosted provider result remains 503 and AI remains disabled; source classification is not availability remediation.
- Prepared bilingual Chef-AI auth templates: `supabase/email-templates/README.md`. User reports verification delivery/verification working on Android with Supabase sender. Branded SMTP still requires the owner's domain/From and credentials; templates are not installed.
- 34 API security tests and TypeScript passed; lint 0 errors/4 pre-existing warnings. Source and available history Gitleaks: 128 files, zero findings.
- User explicitly requested no new build. No native build, backend deployment, live AI enablement or production change performed this session.


## 16 October — Hosted AI recovery accepted

The subsequent AI recovery session supersedes the earlier AI-disabled current status: staging model `gemini-3.5-flash-lite`, deployment `dpl_GovLsMia88j1dCSkmUS2zpVTgMJ5` in bom1; stable origin unchanged. Public configuration verifies AI/localizedAI enabled and billing/push/analytics disabled. No new native build or customer-production change.

13 hosted acceptance checks passed: consent rejection/store/revoke, EN/TR recipe generation, replay, private save/duplicate/fresh-login history, report storage, public food-photo upload/detection, 7-day plan/readback and meal regeneration. Own synthetic account cleanup passed. Earlier high-demand 503s remain recorded; no infinite availability guarantee is made.

Four structured generators request JSON output and reject empty text. `GEMINI_RETRY_503=true` applies only in staging: one additional call only after explicit provider503, 2–3s jitter, shared110s; no network/timeout/quota retry. Application-operation daily quota can permit two provider calls per operation; persistent cost-ledger deletion weakness remains open for production. See `AI_OPERATIONS.md` for the repeatable test and limitations. API36 tests/typecheck passed; lint0 errors/4 existing warnings. Physical camera/gallery/native UI and other release gates remain pending.


## 16 October — Local environment isolation (not deployed)

Local mobile now uses the existing hosted staging API and staging public Supabase key. Legacy mobile-root production credentials were archived outside automatic dotenv lookup. API `.env.local` targets staging only; server keys remain empty because safe browser transfer did not complete. The local API development-server guard deliberately refuses startup until matching staging keys are supplied; this is not a completed local API integration. Mobile development against hosted staging works independently. New `env:check` scripts and template defaults document this separation. No new build, deployment, native workflow or production mutation. Existing hosted AI acceptance remains unchanged.


## 16 October — Independent local API now verified

Supersedes the earlier local-server-key blocker: both existing staging server credentials are now in ignored `.env.local` (0600), read from the authenticated existing provider accounts without new key/account creation or production credential reuse. Local `env:check`, actual Supabase readiness probes and Gemini configured-model access passed. Local AI/localized flags enabled; billing/push/analytics/cron remain disabled.

Next development API is listening only on `127.0.0.1:3000`. It calls staging Supabase and Google directly, without proxying the hosted Vercel API. 13 AI integration checks and 3 deletion/isolation checks passed against this loopback origin; all own synthetic accounts removed. Includes EN/TR generation, private save/replay/history/report, real public food-photo analysis, seven-day plan/readback/regeneration and consent revocation. No existing tester account touched.

No native/release build or backend deployment. Mobile defaults and installed APK still use hosted staging; LAN/physical-phone-to-local connectivity not enabled. Other release gates unchanged. Local guide/evidence are maintained in the mobile repo; no filesystem dependency between applications is introduced.


## 16 Ekim 2026 — repo ayrımı

Bu belgenin aktif sahibi artık `chef-ai-backend`. Önceki test/deployment kayıtları tarihsel kanıttır. Mevcut staging adresi korundu; bu taşıma yeni build, deployment veya tüm yayın kapılarının tamamlanması değildir. Detay: `docs/REPOSITORY_SPLIT.md`.


## Güncel kaynak konumu

Backend artık chef-ai reposunun `backend/` dizinidir. Önceki ayrı-repo kayıtları tarihsel kalır. Yeni build/deploy yok; güncel rehber `backend/docs/MONOREPO.md`.


## Yerel kapanış — 16 Ekim 2026

Sınırlı JSON/tarih/sayısal alan doğrulaması ve temizlik ayarlarında fail-closed kontrolü eklendi. 41 API regresyonu geçti. `npm run test:database` açıkça belirtilen özel yerel PostgreSQL socket ile yedi migration, concurrency ve sentetik backup/restore doğrular; uzak DB kabul etmez. CI aynı provayı içerir; uzaktan çalıştırılmadı. Gerçek production backup/deploy değildir. Ayrıntı: [Mühendislik kapanışı](../../../mobile/docs/ENGINEERING_CLOSEOUT_2026-10-16.md).


## Bağımlılık güvenliği son güncelleme — 16 Ekim 2026

Backend braces zinciri kaldırıldı: Tailwind/PostCSS4.3.3 ve Next root-glob için scoped tinyglobby0.2.17 + hash kontrollü absolute-path uyumluluk düzeltmesi. Temiz npm ci ve42 test, TypeScript/lint geçti; tam raw audit0. Build/deploy yapılmadı. Public recipe son görsel kabulü açık. Ayrıntı: [Güvenlik düzeltmesi](../../../mobile/docs/DEPENDENCY_REMEDIATION_2026-10-16.md).


## 17 Ekim 2026 — Onaylı AI yaşam döngüsü, yalnız yerel kaynak

5 dakika deadline/fence, tek kullanıcı rezervasyonu ve iade, UTC orijinal ay, atomik plan/tarif yazması ve 24 saat/30 gün/90 gün saklama uygulandı. Her Gemini dispatch'i genel limitten ayrı atomik izin ister; mevcut staging retry korunur, yeni retry/model/limit yok. Durum ve kota okumaları gecikmiş işleri sonuçlandırır. Saatlik cron yalnız etkin olmayan örnek tanım olarak hazırlandı.61 backend,134mobil+17bağımlılık,9migration/8grup yerel SQL/restore geçti. Uzak migration/build/deploy/gerçek AI yok. Kanonik rapor: mobile/docs/AI_LIFECYCLE_2026-10-17.md. Önceki kaynak engeli yerelde kapalı; hosted staging ve yayın kapıları henüz doğrulanmış değil.
