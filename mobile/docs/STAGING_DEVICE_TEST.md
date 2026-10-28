# Android staging device test — 16 October 2026

## Environment

- API: https://chef-ai-staging-nu.vercel.app
- Supabase: `vcyqtbzhfanbpclfhibv` (separate staging database).
- APK build: https://github.com/mertgrz24/chef-ai/actions/runs/38905484217 (passed; downloaded and checked).
- Existing downloaded APK from run 38822859339 uses a protected Preview URL and must be replaced for API testing.
- The stable API is the Production target **of the separate `chef-ai-staging` Vercel project**. This does not deploy the customer production API or production database.
- Preview deployments remain protected. No bypass credential is embedded in the app.

Downloaded APK: `~/Downloads/Chef-AI-Staging-2026-10-16.apk`. Archive SHA-256 matched GitHub; APK ZIP integrity, stable API URL and absence of the inspected known server secret values were verified.

AI is enabled after the 16 October recovery update: 13 hosted acceptance checks passed with gemini-3.5-flash-lite, including EN/TR recipes, public food-photo analysis, weekly plan/readback and meal regeneration. See [AI recovery report](AI_RECOVERY_2026-10-16.md). This is API evidence; perform the device tasks below in the existing APK after fully closing and reopening it.

## Login

A dedicated synthetic, admin-confirmed staging account was created for this device test. Its email and random password are in the local private file `~/Downloads/Chef-AI-Staging-Giris.txt`; credentials are intentionally excluded from repository evidence and logs. Do not use production credentials. Deleting this test account makes those login details unusable.

This account bypasses email delivery for test setup only. Email confirmation remains enabled for ordinary signups. Custom SMTP is not configured. The user now reports receiving and using the verification email on Android (Supabase-branded). This is user-reported evidence; branded delivery, non-team recipients and real recovery inbox delivery remain unverified. Exact `chefai://auth/callback` is allowlisted in staging, with explicit user approval; no wildcard redirects were added. Admin-generated signup and recovery token exchanges were separately verified without sending mail.

## Tasks

1. Install the new successful APK and sign in with the test account.
2. Complete onboarding. Select Turkish/metric and English/imperial in Profile.
3. Add a synthetic pantry item, close/reopen, sign out/in and confirm persistence.
4. Inspect the AI transfer disclosure before consenting. Use synthetic ingredient text and a non-personal food photo only.
5. Generate a recipe, save it once, retry save, and reopen it from saved recipes. Unsaved results are not automatically published.
6. Create a weekly plan, open a meal, regenerate one meal and reopen the plan.
7. Submit a test content report, revoke AI consent and confirm generation is blocked.
8. Toggle connectivity and camera permission; confirm errors preserve input. Restore connectivity and use explicit retry.
9. Check large fonts, Android Back, keyboard, rotation behavior and screen edges on the actual device.
10. Perform account deletion last. Do not expect the same credentials to work afterwards.

## Limits

- Billing/restore and push remain unavailable pending real RevenueCat/store/EAS configuration. No real payments.
- Optional product analytics remains off. Native Sentry/provider delivery is not established by API checks.
- Staging information URLs explicitly identify an internal test; they do not satisfy production legal/store requirements. Publisher/domain/support details remain deferred by the user.
- AI results are estimates; no allergy, spoilage or medical guarantee. Exact provider retention is not verified, and scheduled staging cleanup is not enabled. Use synthetic data only.
- Source mitigations and HTTP checks do not close independent patch review, DAST, final IPA/AAB or release gates.
- Check the dated staging access evidence for current AI acceptance and APK status; do not infer success from configuration flags alone.

## Device feedback source changes (no new build)

See [session report](DEVICE_FEEDBACK_2026-10-16.md). The shared account-deletion web link has been removed from source. The sole deletion action remains the red button at the bottom of Profile with native confirmation. The previously installed APK still contains the old web link; opening its long staging notice does not delete an account. Mobile UI changes and prepared email templates remain unapplied to the installed APK/email provider. The subsequent AI recovery session deployed server error handling, JSON generation and bounded staging-only 503 recovery; AI is now enabled. No new APK was built.


## Kamera ve haftalık menü kaynak düzeltmeleri — 16 Ekim 2026

İzin/Settings/picker recovery, önizleme onayı, geç yanıt/iptal, offline-first ve TR tek öğün yenileme düzeltildi.95 Jest + 15 güvenlik regresyonu, TypeScript/lint geçti. Yeni build/deploy yok; mevcut APK bu kaynak değişikliklerini içermez. Fiziksel kamera/izin/Android activity ve final UI kabulü açık. Ayrıntı: [CAMERA_MENU_FIXES_2026-10-16.md](CAMERA_MENU_FIXES_2026-10-16.md). Backend404/DB hata ayrımının kaynak düzeltmesi ve regresyonu da hazır; yeni deploy yapılmadığı için hosted sürüme yansımadı.
