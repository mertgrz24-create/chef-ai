> Güncel mimari: mobil `chef-ai/mobile/`, API ve sunucu `chef-ai/backend/`; aynı Git reposunda, bağımsız uygulamalar. Tanıtım ayrı `chef-ai-web` reposunda. Önceki üç repo ayrımı kayıtları tarihsel; `backend/docs/MONOREPO.md` geçerlidir.

**Staging verified2026-10-17:** Lifecycle v2, Pantry revision and hourly Supabase cleanup active;13 integration checks and4 real AI flows passed. [Rollout](STAGING_LIFECYCLE_ROLLOUT_2026-10-17.md). Production/native/store acceptance pending.

**Latest source checkpoint — 2026-10-17:** Approved AI lifecycle contracts are implemented locally; see the appended section and [lifecycle report](AI_LIFECYCLE_2026-10-17.md). Historical implementation checkpoints below do not prove current hosted migration support.

# Mobile release contracts · schema v1

Owner: chef-ai/backend. This document is an implementation handoff, not evidence that the backend supports these contracts. This task changes no server code or database schema.

All paths below are relative to EXPO_PUBLIC_API_URL. Authenticated paths require the verified Supabase bearer token. Cross-account ownership must be checked server-side. Every response is JSON; no user identifiers are accepted as authorization. Secrets never ship to the client.

## Public configuration — GET /api/mobile/config

Return the exact object validated by `src/lib/release/contracts.ts:mobileConfigSchema`:

- `schemaVersion: 1`, `maintenance: boolean`, `minimumVersion: "1.0.0"`.
- `links`: absolute HTTPS privacy, terms, support, deletion URLs. Pages must work without app installation or authentication.
- `ai`: actual provider name, consentVersion, and truthful `retention.en`/`retention.tr` disclosures covering the provider as well as Chef-AI.
- `capabilities`: explicit booleans for ai, localizedAi, privateRecipes, idempotency, billing, reports, consents, push, analytics.

Set a capability true only after server implementation and real integration verification. Mobile keeps new integrations unavailable for 404, malformed config, unsupported schema or network failure. Public config is not an entitlement and must not authorize premium operations. App blocks normal navigation during maintenance or below minimumVersion.

## Implementation checkpoint — 2026-10-15

The API code and six security migrations are now implemented in `/Users/mertgurbuz/chef-ai/backend`. Private save/history, config, consent/report, quota/idempotency, membership/webhook, push/receipts, deletion outbox and aggregate analytics source exists. This supersedes earlier statements that backend source was untouched. The six migrations have been applied only to isolated staging, and the protected staging Preview API passed 13 real Auth/API/PostgREST persistence/isolation checks plus three account deletion checks. Production, provider integrations, physical-device and store gates remain pending. Read `backend/lib/mobile/release-notes.md` for the exact evidence and limits.

## Shared request metadata / errors

Mobile sends `X-App-Locale: en|tr`, `X-Unit-System: metric|imperial`, `X-Client-Request-Id`. AI routes must honor language/units before localizedAi becomes true. Do not pretend to translate by changing UI headings.

Errors use HTTP status plus `{code: string}`; use `limit_reached` for 403 quota exhaustion. Generic authorization failures must not be interpreted as exhausted quota. Use 429 for temporary rate limits. Do not include secrets or raw provider errors. Existing successful pantry/recipe/meal-plan shapes remain validated; optional resultId links AI results with reports.

Idempotency uses `Idempotency-Key`, scoped to user + operation + payload. Replay the original response without another generation/charge/write. Reject key reuse with another payload. Safe GETs may be replayed by the client; mutation retries are never automatic.

## Membership — GET /api/billing/status

`{plan: free|premium, status: active|grace|hold|expired|syncing, expiresAt: ISO8601|null, quotas:{recipes,scans,plans}}`.

Purchases additionally require `premiumLimits:{recipes:integer>=11,scans:positive integer,plans:positive integer}` so paid benefits are shown before charging. Restore remains available without an offer or successful membership read.

Each quota is `{used: nonnegative integer, limit: nonnegative integer, resetsAt: ISO8601}`. Show actual plan limits; never use an unlimited claim for a capped plan. Monthly free recipes = 10. Premium amounts and regional store prices require owner approval/cost validation before sales.

RevenueCat App User ID is the Supabase user UUID. Verify webhook authorization, deduplicate event IDs, handle out-of-order events, refunds, expiration, billing retry/hold/grace, and reconcile authoritative status. Never accept client entitlement flags as authorization. Define non-transferable account ownership; conflicting restore must provide a support path instead of silently moving another user's purchase. Prevent duplicate subscriptions across stores/accounts where practical. Match actual store lifecycle and cancellations.

## Private recipe saving

- Existing `POST /api/recipes/save`: request includes structured recipe, macros and `is_public:false`, with Idempotency-Key. Response `{recipe:{id,name,ingredients,instructions,macros,is_public:false,created_at}}`.
- Existing `GET /api/recipes/history`: `{recipes:[...]}` latest 20 owned private recipes, never another user's records.
- The previous backend forced public writes. The local API now forces private writes with account-scoped idempotency; do not enable privateRecipes in a deployed environment before migrations and real persistence tests pass. Mobile rejects public history/save responses. Treat any already-public rows under an explicit migration/privacy decision, not a silent client conversion.
- Saving plaintext recipes is not synthesized. The UI offers saving only structured output.

## Consent — POST /api/privacy/consents

Request `{scope:"ai",version,accepted:boolean,locale}`. Response `{ok:true}` only after durable, user-scoped storage. Enforce consent version server-side on AI endpoints; local preference is a UX gate, not a security boundary. Define retention/deletion of audit evidence. Support revocation; do not require AI consent for Pantry. Mobile blocks local AI immediately upon revocation, even if server delivery fails.

## Reports — POST /api/content-reports

Request `{source:recipe|meal-plan|scan,resultId:string|null,category:0|1|2|3,details?:string}`. Category order: unsafe advice, offensive content, incorrect result, other. Details max 1000 characters. `{ok:true}` confirms storage. Permit null resultId for legacy output, route it as a general report. Do not automatically attach photos, diet details or full generated text. Define authenticated rate limits, ownership validation, retention, operational review and response ownership. User reports must inform content filtering.

## Push

`POST /api/push/register`: `{token,platform,locale,timeZone,enabled:true}` -> `{ok:true}`.
`POST /api/push/unregister`: `{token}` -> `{ok:true}` after device-user binding removal. Support both actual Expo token formats. Do not transfer token ownership through an insecure client upsert.

Mobile detaches before normal sign-out; if detach fails, sign-out reports failure rather than leaving former-user alerts active. Account deletion must cascade token records. Cron must accept the HTTP GET sent by Vercel, verify CRON_SECRET, schedule per user's timezone/preferences, deduplicate, respect channel `expiry-alerts`, process push tickets/receipts and retire DeviceNotRegistered tokens. Notification data `{screen:"pantry"}` is the only supported navigation payload. No arbitrary URL navigation.

## Optional analytics — POST /api/mobile/analytics

`{event,version,platform,locale,result:success|failure}` -> `{ok:true}`. Event allowlist lives in `state.tsx`. No email, user ID, device advertising identifier, content, free text or persistent event queue. The bearer is transport authentication, so ingress/auth logs must be minimized and the server must aggregate without retaining a user link. Product analytics require explicit optional preference; crashes and RevenueCat purchases have separate purposes/disclosures.

## Operational handoff

Production SMTP + sender-domain DNS; allowed auth redirects; PKCE callback or OTP token_hash links for cross-device recovery; AASA and Android assetlinks tied to actual signing certificates; deletion/privacy/support pages; RLS and grants audit (including direct RPC refunds and client-supplied credit limits); bounded AI cost/concurrency; provider account/data terms; storage deletion; database backup and restore; operational alerting and support. Do not mark these verified using local fixture tests.


## Repository ownership update — 2026-10-16

The active API, migrations, server dotenv and operational documents now live in `chef-ai/backend/`. `chef-ai-web` is marketing only. Earlier results describe their original context; repository relocation is not a new deployment, build, DAST scan or release approval. Existing hosted staging URL and installed APK remain unchanged. See backend `docs/REPOSITORY_SPLIT.md`.


## Güncel engel kontrolü — 16 Ekim 2026

Aktif sıralı liste: [RELEASE_BLOCKERS_2026-10-16.md](RELEASE_BLOCKERS_2026-10-16.md). Hesap silmede günlük AI sayacının azalması staging migration ile düzeltildi; production değil. Mobil raw audit56 yüksek / 5 orta, backend7 yüksek; yamalar regresyonda doğrulandı, audit/bağımsız inceleme/DAST kapısı açık. Yeni build/deploy/push yok.


## Pantry revision contract — 2026-10-17 (source/local tests only)

GET /api/pantry now selects revision. Before the new migration is applied, read-only missing-column fallback preserves add/remove/list access; mobile treats revision as optional and disables editing when absent. POST/DELETE keep their existing contract.

PATCH /api/pantry/:id requires auth, an owned UUID and JSON `{name, quantity: string|null, expiry_date: YYYY-MM-DD, expectedRevision: integer}`. Unknown fields rejected; name trimmed/nonempty<=200, quantity<=100. Atomic update filters id+user_id+revision; trigger increments revision. Success200 returns the confirmed public item including revision=expectedRevision+1. Conflict409 `{code: "revision_conflict"}`; foreign/missing404; unavailable schema503. No automatic mutation retry. Reload for a conflict preserves the draft and requires another explicit save.

Migration20261017000100_pantry_revision.sql was tested only against disposable local PostgreSQL, including parallel real route requests200/409. It has NOT been applied to staging/production. Current source evidence: APP_REUSE_ROUND_2026-10-17.md.


## AI lifecycle v2 — source/local only, 2026-10-17

GET /api/mobile/ai-status?operation=recipes|modify|scan|plan|regenerate requires verified auth and the existing Idempotency-Key header. It never dispatches AI. JSON: `{state:"pending",deadlineAt:ISO}`; `{state:"completed",status:200..599,response:object}`; `{state:"not_found"}` or `{state:"expired"}`. No-store. Owner is taken from auth, never from client input. Missing/malformed keys400, unauthenticated401, unavailable migration503. Result access ends24h after settlement independently of cleanup.

Unknown provider execution returns409 operation_pending; client reads the existing job, never blindly retries generation. Terminal failures include server-confirmed creditReturned:true. Missing/unreachable status is NOT proof of refund. Old keys are protected30d after settlement, after which key reuse protection ends. Mobile uses fresh random keys for new explicit operations.

Billing status reconciles expired owner jobs before reading quota. Application writes for plan/regenerate/modify are atomic with complete_mobile_ai; no expired job can write late or consume refunded rights. Existing successful HTTP result shapes stay compatible.

New lifecycle migration and begin_mobile_ai_v2 are required together with the matching backend. No silent fallback to old guard. Legacy begin_mobile_ai refuses new jobs to prevent unmetered dispatch during a future rollout. This migration/rollout has NOT been performed remotely. Hourly cleanup is a prepared handoff, not an active remote scheduler.
