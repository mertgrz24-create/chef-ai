> **20 Ekim — güncel kayıt:** Yerel çıktı incelemesi kullanıcı tarafından tamamlanmış kabul edildi. Picomatch: **UNRESOLVED — kısmi mitigasyon mevcut; incelenen uygulama yollarında sömürü gösterilmedi**. Bu, FIXED/risksiz veya risk kabul edildi anlamına gelmez. [Yerel çıktı raporu](../../backend/security/PICOMATCH_ARTIFACT_REVIEW_2026-10-20.md) · [Kanıt indeksi](../../backend/security/picomatch-artifact-evidence-2026-10-20/index.json). Sonraki yayın derlemesine ait açık kontroller aşağıdadır; önceki notlar tarihsel sonuçlardır.

> **20 Ekim — önceki güvenlik takibi:** Picomatch ReDoS kaynağı7kopyada yamalandı ve temiz kurulum/regresyonlar geçti. npm audit0/0; güncel Snyk aynı tek yüksek advisory ile açık. [Düzeltme ve kalan katalog engeli](../security/PICOMATCH_REMEDIATION_2026-10-20.md). Build/deploy yok.

> **20 Ekim güncellemesi:** [UI polish ve yeni Snyk sonucu](UI_POLISH_2026-10-20.md). UI kaynak turu tamamlandı. npm audit0/0; güncel Snyk tek ortak yüksek picomatch advisory gösteriyor (mobil28/backend2 bağımlılık yolu). Bu bulgu açık yayın engelidir. Yeni build/deploy yok.

> **Güncel durum — 19 Ekim 2026:** [RELEASE_BLOCKERS_2026-10-19.md](RELEASE_BLOCKERS_2026-10-19.md) geçerlidir. Aşağıdaki eski sayılar/ortam notları tarihsel kayıttır. Güncel npm audit mobil0/backend0; staging lifecycle ve saatlik temizlik aktif. Production/native/hesap kapıları hâlâ açık.

> Güncel mimari: mobil `chef-ai/mobile/`, API ve sunucu `chef-ai/backend/`; aynı Git reposunda, bağımsız uygulamalar. Tanıtım ayrı `chef-ai-web` reposunda. Önceki üç repo ayrımı kayıtları tarihsel; `backend/docs/MONOREPO.md` geçerlidir.

# Chef-AI release readiness

## 22 Ekim 2026 — simülatör önizleme kaydı

[Önizleme raporu ve beş ekranın yerel kanıtları](IOS_SIMULATOR_PREVIEW_2026-10-22.md): mevcut staging paketinde sentetik hesapla giriş ve Today/Pantry/Cook/Scan/Profile görüntüleme doğrulandı. Bu, uçtan uca üretim veya fiziksel cihaz kabulü değildir. Yeni build/deploy/tarama yapılmadı; makine tarafından okunan kapılar pending kalır.

- [ ] Aynı ekrandaki TR/EN metin karışıklığının nedenini incele ve dil tutarlılığını doğrula.
- [ ] Dolu tarif/öneri/Pantry ve Scan önizleme/sonuç geçişlerini doğrula; boş hesap görüntüsü bunları kapsamaz.
- [ ] Haftalık plan ekranını ve öğün detayını ayrıca görüntüleyip doğrula; bu önizlemede başarılı geçiş kanıtı yok.
- [ ] Reduced Motion, ekran okuyucu, performans ve fiziksel cihaz kontrollerini tamamla; önizlemeyi bu kontrollerin yerine sayma.

Picomatch **UNRESOLVED — kısmi mitigasyon mevcut; incelenen uygulama yollarında sömürü gösterilmedi** durumunda kalır. B/C kapanışı, önceki 17 timeout ve sonraki yayın derlemesi için açık kontroller değiştirilmedi.

## İlk yayın hazırlığı kaydı — tarihsel

Date: 2026-10-15 · Markets: Türkiye/US · Audience: adults · Languages: TR/EN

**State: implementation and automated checks only; production release blocked.** No store submission, production release, actual payment or user beta was performed. Separate staging Supabase/Vercel resources were subsequently created, and synthetic-account deletion was verified there. Backend API work was subsequently authorized and implemented locally in `chef-ai-web`; six migrations were applied only on isolated staging and a separate staging Preview API was deployed; production remains unchanged. Existing cream/green/lime branding is preserved.

Local results: [LOCAL_VERIFICATION.md](LOCAL_VERIFICATION.md). Open security findings: [SECURITY_REVIEW.md](SECURITY_REVIEW.md).

## Evidence matrix (the 20-item checklist)

| # | Item | Mobile implementation | Required external/native evidence |
|---|---|---|---|
|1|Permissions|Contextual camera/push; broad media/audio blocked|Inspect IPA/AAB, denied/permanent denial/Settings|
|2|Privacy policy|Pre-login and Profile links from validated config|Published truthful TR/EN pages, URL checks|
|3|Account deletion|Confirmation, subscription warning, immediate local UI cleanup after server ack|Test-user deletion/cascades, store web link|
|4|Data security|SecureStore, HTTPS, redaction, account-keyed providers, schema validation|MASVS review, dependency remediation, RLS/security assessment; [Picomatch açık kontrolleri](#picomatch--sonraki-onaylı-yayın-derlemesinde-açık-kontroller)|
|5|Signup/login|Bounded session restore, safe messages, operation locks|Real SMTP/auth, two-account isolation|
|6|Verification|Callback and resend, 60s client resend limit|Expired/used/cold/warm/cross-device links|
|7|Password recovery|Request + recovery-only password update|Real emails, redirect/template setup|
|8|Onboarding|Three steps, adult affirmation, account-keyed persistence|Adult-targeting/legal review, reinstall behavior|
|9|Core flow|Pantry/Scan/Cook/save/menu integration|Release-build end-to-end without fixture adapters|
|10|Persistence|Server-backed pantry/menu/private-history adapter|Close/reopen, second device; private save server fix|
|11|Subscriptions|RevenueCat monthly offering + verified server quotas|Store products/prices, webhook/reconcile, sandbox lifecycle|
|12|Restore|Profile/paywall entry + RevenueCat restore|Reinstall/device/account conflict/refund tests|
|13|Loading|Bounded request timeout, states and safe read retries|Slow native network, background/foreground|
|14|Empty|Pantry/menu/scan/history empty states|All locales and font sizes|
|15|Errors|Schema/HTTP/network errors, global boundary, support category|Native crash + symbolicated Sentry event|
|16|Connectivity|NetInfo banner, retained loaded data, no write replay|Airplane mode/reconnect/network handoff|
|17|Notifications|Contextual opt-in, token lifecycle, allowlisted tap|Physical iOS/Android APNs/FCM + receipts|
|18|Analytics/crash|Optional allowlisted sink, Sentry scrub, RC revenue source|Actual service keys, privacy declarations, event inspection|
|19|Devices|Responsive shared components and a11y labels|Minimum/current OS, small/large, VoiceOver/TalkBack, 16KB|
|20|User beta|Task protocol documented below|Real recruited testers and results|

`release-evidence.json` is intentionally pending. Only a person/automation holding real evidence may add evidence reference, verifiedBy and verifiedAt and set verified. `npm run release:check` / EAS production post-install fails when any gate is pending or required build variables are missing. This is a release block, not approval theater.

## Picomatch — sonraki onaylı yayın derlemesinde açık kontroller

**Durum: UNRESOLVED — kısmi mitigasyon mevcut; incelenen uygulama yollarında sömürü gösterilmedi.** Önceki 24 saldırı denemesindeki **17 timeout** geçerlidir. B/C düzeltmeleri korunur; onların kapanışı Picomatch'i kapatmaz.

Tamamlanan yerel inceleme: [rapor](../../backend/security/PICOMATCH_ARTIFACT_REVIEW_2026-10-20.md) ve kaynak/çıktı hashlerini içeren [kanıt indeksi](../../backend/security/picomatch-artifact-evidence-2026-10-20/index.json). iOS/Android JavaScript export ve Next Webpack yerel build kanıtıdır. Varsayılan Turbopack denemesi BLOCKED kaldı. Bunlar final native paket, canlı deployment veya yayın kabulü değildir.

- [ ] **Gerçek derleme yöntemi:** Bir sonraki ayrıca onaylı yayın derlemesinin gerçek komutunu, araç/derleyici sürümlerini, ortamını ve çıktı kimliklerini kaydet; yerel incelemede kullanılan yöntemle karşılaştır.
- [ ] **Gerekirse Turbopack çıktı incelemesi:** Yayın derlemesi Turbopack kullanıyorsa onun gerçek çıktı/bağımlılık izlerini incele. Webpack sonucu yerine geçirilmez. Kullanılmıyorsa gerçek derleme kaydıyla gerekçeli “uygulanmaz” değerlendirmesi yapılır; şimdiden kapanmış sayılmaz.
- [ ] **Kaynak ve ayar karşılaştırması:** İzlenmeyen/commit edilmemiş dosyaları kapsayan kaynak manifestini, lockfile/paket/yama hashlerini ve ilgili Metro/Next/görüntü/ortam ayarlarını mevcut kanıtla karşılaştır. Sentetik ortam farklarını ve değişen yolların gerektirdiği doğrulamayı kaydet; HEAD tek başına yeterli değildir.
- [ ] **Final native paket ve cihaz kontrolleri:** Gerçek final iOS/Android paketleri, Hermes/native içerik ve mevcut yayın listesindeki cihaz kontrollerini ilgili artifact kimlikleriyle tamamla. JavaScript export bu kapıyı kapatmaz.

Bu maddelerin hiçbiri bu kayıt güncellemesiyle verified yapılmadı; makine tarafından okunan yayın kapıları pending kalır. Yeni yama/paket/fork denemesi, genel tarama, build, deploy, ücretli işlem veya risk kabulü için onay verilmiş değildir.

## Environments / credentials

- `development`: local API only on localhost/127.0.0.1/Android emulator host, or HTTPS.
- `preview`: EAS preview environment, **separate staging API and Supabase**, never inherited production defaults.
- `production`: production EAS environment; HTTPS URLs and all release evidence required.
- App config reads EXPO_PUBLIC_EAS_PROJECT_ID and EXPO_PUBLIC_AUTH_ORIGIN; associations must be served by the actual domain owner. Do not invent domain/account IDs.
- Public values: API/Supabase URL/anon key, Sentry DSN, RevenueCat platform SDK keys. Private: AI/service-role/webhook/SMTP/cron keys never in EXPO_PUBLIC or binary. SENTRY_AUTH_TOKEN is build-only.
- Sentry source maps configured through Metro and Expo plugin. Test a real release crash and verify symbolication; no development-only test-crash button ships.
- Manage credentials with EAS/store secret storage. Back up upload keys and recovery access in the owner's password manager. Keep 2FA/account recovery and least-privilege CI tokens. No secrets in PR logs/artifacts.
- Production OTA disabled. Native/JS fixes initially use new store builds. Never claim installed native binaries can be remotely rolled back.

## Test / build commands

From `mobile`: `npm ci`, `npm run check`, `npm run test:ci`, `npx expo install --check`, `npx expo-doctor`, `npm audit --audit-level=high`.

`npx expo export --platform all` only proves bundle creation; it is not a signed IPA/AAB, native 16KB verification or actual-device test. Use `eas build --profile development-device` for physical devices; simulator profile is separate. Preview uses staging; production requires release checks. Upload Android AAB, not preview APK. Run secret/dependency checks in CI. Native a11y targets: >=44pt iOS and >=48dp Android.

## Manual native acceptance

Test iOS minimum/current and Android minimum/API36, low-memory Android and 16KB environment, small/large screens and large fonts. Perform denied/permanent-denied permissions, keyboard, background during upload/generation, slow/offline/captive network, image rotation/HEIC/large/corrupt image, callback cold/warm/used/expired/wrong host, app reinstall/upgrade, timezone/DST, language/units switches and two-user sign-out/relogin.

Use sandbox Apple/Google accounts for purchase, pending, cancellation, renewal, restore, grace/hold, expiration, refund, cross-store/account conflicts and delayed backend sync. A provider SDK entitlement must not unlock AI on the server. Account deletion is distinct from store subscription cancellation.

## User beta protocol

Recruit >=12 adult testers, >=3 from Türkiye and >=3 from US, with >=3 real iOS and >=3 Android users. Obtain voluntary participation; no real paid purchases required. Tasks: signup+verify, onboarding, manual ingredient, Scan, Cook, save privately, kill/reopen and retrieve recipe, menu, sandbox purchase/restore, notification and support discovery. Record task success without assistance, blockers, device/OS and crash reference; do not collect credentials/photos in the report. Critical tasks need >=90% unassisted success and zero data loss/account mix-up/entitlement errors after fixes/retest. If a new personal Play account is used, additionally meet 12 continuously opted-in testers for >=14 days and apply for production access. Research tasks do not replace that requirement.

## Store preparation / legal owner inputs

Publisher type is unresolved. Owner must create/verify Apple/Google/Expo/RevenueCat/Sentry accounts; organization verification/D-U-N-S if applicable; accept terms and complete tax/bank forms personally. Confirm app identifiers before first upload. Set monthly product/entitlement and regional prices only after quotas/costs approval. No trial/annual/ads/external checkout in v1.

Prepare TR/EN actual release screenshots, descriptions, category, icons, reviewer credentials/instructions, privacy/support/deletion URLs, App Privacy/Data Safety (including SDK/backend processing), AI reporting, health/nutrition declaration, accurate target audience/content rating, encryption assessment and native privacy manifests/required-reason SDK evidence. Do not infer “no data collected” from photos not being stored by Chef-AI. Validate Google provider terms, paid/unpaid data processing and KVKK transfers with the actual operator. The adult affirmation does not by itself prove legal compliance.

## Release / incident runbook

Manual first release only after all four gates: mobile, integration, store and release verified. TestFlight + Play internal/closed first. Do not mistake phased **updates** for first-release control. Record commit, dependency lock, build IDs, environment, signing owner, source map release and review submission.

Monitor fatal/auth/purchase/report failures. Immediate stop for account isolation/data security/charge entitlement defects. Initial investigation threshold: crash-free <99.5% after >=100 sessions, or API 5xx >2% over 15 minutes with >=100 requests. At low traffic investigate individual critical errors. Stop distribution, use server feature shutdown when implemented, preserve sanitized evidence, notify operator via approved channels, and ship a fix build. Never auto-send messages to customers or external teams.

## Authoritative references (reviewed 2026-10-15)

- Apple review: https://developer.apple.com/app-store/review/guidelines/
- Apple current SDK/age requirements: https://developer.apple.com/news/upcoming-requirements/
- Apple deletion: https://developer.apple.com/support/offering-account-deletion-in-your-app/
- Apple privacy: https://developer.apple.com/app-store/app-privacy-details/
- Google target API: https://developer.android.com/google/play/requirements/target-sdk
- Google billing versions: https://developer.android.com/google/play/billing/deprecation-faq
- Google 16KB: https://developer.android.com/guide/practices/page-sizes
- Google AI reporting: https://support.google.com/googleplay/android-developer/answer/13985936?hl=en
- Google deletion: https://support.google.com/googleplay/android-developer/answer/13327111?hl=en
- Google photo permissions: https://support.google.com/googleplay/android-developer/answer/14115180?hl=en
- Google Data safety: https://support.google.com/googleplay/android-developer/answer/10787469?hl=en
- Google testing: https://support.google.com/googleplay/android-developer/answer/14151465?hl=en
- Expo SDK57: https://docs.expo.dev/versions/v57.0.0/
- Expo Sentry: https://docs.expo.dev/guides/using-sentry/
- RevenueCat Expo: https://www.revenuecat.com/docs/getting-started/installation/expo
- Supabase auth: https://supabase.com/docs/guides/auth/quickstarts/react-native
- Gemini age/data terms: https://ai.google.dev/gemini-api/terms
- OWASP MASVS: https://mas.owasp.org/MASVS/


## Repository ownership update — 2026-10-16

The active API, migrations, server dotenv and operational documents now live in `chef-ai/backend/`. `chef-ai-web` is marketing only. Earlier results describe their original context; repository relocation is not a new deployment, build, DAST scan or release approval. Existing hosted staging URL and installed APK remain unchanged. See backend `docs/REPOSITORY_SPLIT.md`.


## Güncel engel kontrolü — 16 Ekim 2026

Aktif sıralı liste: [RELEASE_BLOCKERS_2026-10-16.md](RELEASE_BLOCKERS_2026-10-16.md). Hesap silmede günlük AI sayacının azalması staging migration ile düzeltildi; production değil. Mobil raw audit56 yüksek / 5 orta, backend7 yüksek; yamalar regresyonda doğrulandı, audit/bağımsız inceleme/DAST kapısı açık. Yeni build/deploy/push yok.


## Kamera ve haftalık menü kaynak düzeltmeleri — 16 Ekim 2026

İzin/Settings/picker recovery, önizleme onayı, geç yanıt/iptal, offline-first ve TR tek öğün yenileme düzeltildi.95 Jest + 15 güvenlik regresyonu, TypeScript/lint geçti. Yeni build/deploy yok; mevcut APK bu kaynak değişikliklerini içermez. Fiziksel kamera/izin/Android activity ve final UI kabulü açık. Ayrıntı: [CAMERA_MENU_FIXES_2026-10-16.md](CAMERA_MENU_FIXES_2026-10-16.md). Backend404/DB hata ayrımının kaynak düzeltmesi ve regresyonu da hazır; yeni deploy yapılmadığı için hosted sürüme yansımadı.


## Son yerel kapanış — 16 Ekim 2026

Güncel kaynak/kontrol ve açık kapılar: [ENGINEERING_CLOSEOUT_2026-10-16.md](ENGINEERING_CLOSEOUT_2026-10-16.md). 97 mobil, 15 dependency, 41 API, 3 secrets/şablon ve 4 artifact-denetleyici testi geçti; 7 migration ile sentetik geri yükleme provası geçti. En son raw audit mobil53 yüksek/5 orta, backend7 yüksek; güvenlik kapısı kapanmadı. Yeni build/deploy yok. Yalnız kullanıcıdan beklenenler OWNER_ACTIONS.md içinde.


## Daha sonraki güvenlik düzeltmesi — 16 Ekim 2026

[Son bağımlılık düzeltmesi](DEPENDENCY_REMEDIATION_2026-10-16.md): backend raw audit **0**; mobil **54 yüksek / 0 orta**. Orta uyarıların kaynağı sprintf-js ve eski YAML zinciri kaldırıldı. Yeni yüksek üst kayıt mevcut RevenueCat paketinin react-native üzerinden listelenmesi; yeni kök advisory değil. Kalan kökler braces/node-forge, yamaları testli; bağımsız inceleme/upstream/native kapıları açık. İki temiz kurulum,97 Jest + 15 bağımlılık + 42 backend testi, TS/lint/Expo geçti. Backend tek glob uyumluluk yaması, mobil15 dosya yaması var. Yeni build/deploy yok.
