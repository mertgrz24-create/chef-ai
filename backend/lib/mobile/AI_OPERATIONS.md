# Staging AI operations

**Latest staging checkpoint2026-10-17:** Lifecycle/Pantry and matching backend are now deployed to isolated staging. Supabase hourly cleanup active;4 real AI jobs/4 calls and13 integration checks passed. See mobile/docs/STAGING_LIFECYCLE_ROLLOUT_2026-10-17.md. Production/mobile builds unchanged; earlier source-only checkpoints are historical.

**Current source policy — 2026-10-17:** Approved lifecycle/dispatch implementation supersedes the historical observation-only gap below. See `mobile/docs/AI_LIFECYCLE_2026-10-17.md` from the monorepo root. Source/local fixtures only; hosted staging has NOT been migrated or redeployed.

## Configuration

- Separate staging origin: https://chef-ai-staging-nu.vercel.app
- Separate Supabase: `vcyqtbzhfanbpclfhibv`.
- Server-only `GEMINI_MODEL=gemini-3.5-flash-lite`; same Google Gemini provider and owner-supplied key. No mobile secret or billing activation.
- `GEMINI_RETRY_503=true` is effective only with `MOBILE_ENVIRONMENT=staging`. Default is false; production behavior does not acquire retries implicitly.
- An operation makes at most two provider calls: one initial call, then one additional call only on a definite HTTP 503. Wait 2–3 seconds with jitter; both calls share 110 seconds. If insufficient budget remains, return the original failure. No retry on network uncertainty, timeout, 402, 429, invalid output or another failure from the second call.
- Both calls belong to one existing reserved AI operation. App data writes occur after a successful generation; the durable idempotency record is completed once. Client mutation retries remain explicit and replay the existing request key.
- The current daily limit counts **application operations**, not exact provider calls. One operation can make two calls when this staging recovery option is enabled. The account-deletion/job-cleanup reset defect was fixed in staging with mobile_ai_durable_daily_cap. Production migration remains pending. This anonymous daily operation counter is not an exact provider token/spend ledger.
- Four structured generators request JSON MIME output; empty text is an error. Vision retains its ingredient-list format and can legitimately return an empty list for a non-food image.

## Repeatable integration check

Run `lib/mobile/staging-ai-acceptance.cjs` in the API repo with explicit variables:

- `CHEF_STAGING_SERVER_KEY_FILE`: private mode-0600 local staging service key file.
- `CHEF_STAGING_VERCEL_DIR`: isolated directory linked to the exact staging Vercel project; the script checks its project ID.
- `CHEF_STAGING_FOOD_FIXTURE`: non-personal public Google food sample downloaded from https://storage.googleapis.com/generativeai-downloads/images/scones.jpg.
- `CHEF_STAGING_AI_EVIDENCE`: destination for content-free result metadata.

The check creates its own synthetic confirmed account, verifies consent gating, English/Turkish recipes, idempotent private save and replay, new-login history, content-report storage, real food-image upload, seven-day plan/readback, one-meal regeneration and revocation. Its account is deleted in `finally`; passing evidence is emitted only after cleanup. It does not send email or touch an existing tester's account. Changing JSON object property order after Postgres JSONB storage is valid; replay comparison uses deep equality.

## Recovery and limitations

Google may still return capacity errors. Fixed safe provider error codes remain available when the bounded recovery is exhausted. Do not manufacture content or mark a failed attempt successful. If provider availability or spend safety is unacceptable, set staging `MOBILE_AI_READY=false` and `MOBILE_LOCALIZED_AI_READY=false` and redeploy the staging API. Preserve consent and data read access. Never disable authentication or quota checks to diagnose AI.

No APK/IPA/AAB or native workflow is needed for this server update. Force-close and reopen the existing staging app so it fetches the current capability configuration. Physical camera/gallery UX and native rendering remain separate device acceptance tasks.

Sources: [Google error handling](https://ai.google.dev/gemini-api/docs/troubleshooting), [available models](https://ai.google.dev/gemini-api/docs/models), [structured outputs](https://ai.google.dev/gemini-api/docs/structured-output).


## 16 Ekim 2026 — repo ayrımı

Bu belgenin aktif sahibi artık `chef-ai-backend`. Önceki test/deployment kayıtları tarihsel kanıttır. Mevcut staging adresi korundu; bu taşıma yeni build, deployment veya tüm yayın kapılarının tamamlanması değildir. Detay: `docs/REPOSITORY_SPLIT.md`.


## Güncel kaynak konumu

Backend artık chef-ai reposunun `backend/` dizinidir. Önceki ayrı-repo kayıtları tarihsel kalır. Yeni build/deploy yok; güncel rehber `backend/docs/MONOREPO.md`.


## Durable daily reservations — 2026-10-16

Staging now counts reservations in mobile_ai_daily_attempts (UTC day + count, no user/content). Replay/denied reservations do not increment it; failure/refund/account deletion/job cleanup do not decrement it. Cutover backfills only surviving historical jobs. Migration applied only to staging; five real staging checks plus disposable local SQL lifecycle/concurrency checks passed. No AI provider call, native/backend build or deployment. Production/budget/token-cost verification remains open. See mobile/docs/RELEASE_BLOCKERS_2026-10-16.md from the repository root.


## Yerel kapanış — 16 Ekim 2026

Sınırlı JSON/tarih/sayısal alan doğrulaması ve temizlik ayarlarında fail-closed kontrolü eklendi. 41 API regresyonu geçti. `npm run test:database` açıkça belirtilen özel yerel PostgreSQL socket ile yedi migration, concurrency ve sentetik backup/restore doğrular; uzak DB kabul etmez. CI aynı provayı içerir; uzaktan çalıştırılmadı. Gerçek production backup/deploy değildir. Ayrıntı: [Mühendislik kapanışı](../../../mobile/docs/ENGINEERING_CLOSEOUT_2026-10-16.md).


## Observation-only source update — 2026-10-17

Every Gemini generateContent dispatch now records allowlisted started/finished metadata within the existing retry callback. No retries, model, time budget, reservation/refund or cleanup changes. Missing usage/price/invoice fields remain null. Observer failures cannot fail/retry provider work. No prompts, responses, photos or identity are logged.

Local JSONL inspection: `node lib/mobile/summarize-provider-usage.cjs < metadata.jsonl` (or pipe JSONL to stdin). The shell opens the operator-selected file; the tool accepts data only and rejects all file/path arguments before reading input. It does not fetch logs or call AI. It deduplicates job+attempt transport repeats; reports unknown attempts separately from known token subtotals. Estimated/actual charges remain unknown. Logs are not a durable billing ledger; retention/completeness is unverified. The exported `summarize(records)` interface is unchanged.

**Open acceptance gap:** fake-SDK regression confirms two existing staging503 calls cause only one daily operation reservation. Observation covers both, but the global cap does not count each dispatch. Numerical limits and reservation SQL were preserved. Separate E policy approval is required before changing lock/settlement/timeout/status/cleanup or general-attempt enforcement. See `mobile/docs/APP_REUSE_ROUND_2026-10-17.md` from the monorepo root. No real provider calls/build/deploy/remote migration in this round.


## Approved lifecycle/dispatch v2 — 2026-10-17

Source now uses begin_mobile_ai_v2 for one user reservation and claim_mobile_ai_attempt BEFORE every SDK dispatch. Shared production dispatch rejects absent guard context. Existing503 retry requires another global permit, with no added retry or numerical cap change. Permission-ack uncertainty fails closed; permission counts may conservatively exceed actual dispatch after process loss and are not provider charges. Missing metadata/price remains unknown.

Provider timeout/network uncertainty remains pending; definitive failures return one user credit. Server deadline5min fences all late commits. Plan/modified-recipe writes and final job/credit settlement share a SQL transaction. Owner status/quota/start/finish reconcile expired jobs; no always-running background process assumed. Response24h, tombstone30d, content-free attempts90d; hourly maintenance uses cleanup_mobile_ai. Cron handoff: maintenance-schedule.example.json (inactive). Existing hosted staging cron-disabled configuration unchanged.

Future rollout requires AI disabled/drained, the new migration and matching backend, verified free/eligible hourly scheduler, hosting maxDuration120 support and real integration/device acceptance. Legacy guard is deliberately blocked after migration; do not roll out only half the source/SQL pair. No such remote operation occurred in this round. Canonical local evidence: mobile/docs/AI_LIFECYCLE_2026-10-17.md.
