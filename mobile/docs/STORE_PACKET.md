# Store packet — drafts, not submitted

Markets TR/US; adult-oriented Food & Drink app; no ads/social/community sharing/health integrations. Ratings and health declarations must follow actual content/features rather than being inferred from the product audience. No medical, guaranteed food safety or allergy-free claims.

## TR draft

Ad: Chef-AI
Kısa açıklama: Elindeki malzemelerle yemek planla ve tarif keşfet.
Açıklama taslağı: Kilerini düzenle, seçtiğin fotoğraftaki malzemeleri kontrol et ve elindekilerle yemek hazırla. Tariflerini özel olarak kaydet ve haftalık menünü planla. AI sonuçları ile besin değerleri tahminidir. Ücretsiz plan ayda 10 tarif içerir; aylık Premium hakları ve yerel fiyat satın alma ekranında gösterilir.

## EN draft

Name: Chef-AI
Short description: Plan meals and discover recipes from what you already have.
Description draft: Organize your pantry, review ingredients from a photo you choose, and cook with what you have. Save recipes privately and plan your weekly menu. AI results and nutrition values are estimates. Free includes 10 recipes per month; monthly Premium limits and localized prices are shown before purchase.

**Do not publish these claims until each feature is live and verified.** No “unlimited” claim or fake premium price. Recipe saving is currently gated on backend privacy changes. No contact email/domain is invented; owner must supply them.

## Required owner/package inputs

Publisher legal name/type/address/contact, app ownership, support/privacy/terms/deletion URLs, App Store/Play IDs, product SKUs and entitlement, Turkish/US prices, support operator, review account and exact steps, account deletion scope/retention, actual data flows and SDK declarations, export-encryption assessment, age/health/content questionnaires, required-reason/native manifests, licensed final icon/splash/screenshots. Use current store screenshot specs; remove Expo developer tools overlays and real personal data. Include login + all core features and paywall in review instructions; no hidden bypass.

## Data / SDK inventory

|Component|Actual purpose/data to verify|Retention/controls to verify|
|---|---|---|
|Supabase Auth/SecureStore|Email/account + tokens; password only to auth provider|Provider region/DPA, session rotation/deletion, backup exclusions|
|Chef-AI API/Vercel|Pantry, recipes, meal plan, auth transport, request categories|Auth/IP/request logs; no raw content logs; deletion and backups|
|Gemini server integration|Selected images/ingredient text and generated result|Paid/unpaid terms, provider logging/cross-border handling; no “never retained” promise|
|Expo Notifications/APNs/FCM|Device push token, platform, chosen language/timezone|Opt-in, unregister, token retirement, payload minimization|
|RevenueCat/store billing|Pseudonymous Supabase UUID + purchase/entitlement data|Provider privacy/retention, identity ownership, account deletion vs financial legal records|
|Sentry|Redacted crash categories, stack frames, app/build/platform; no replay|Actual SDK/network identifiers, retention and scrub test; no claim of zero collected data|
|Optional first-party analytics|Allowlisted event/version/platform/locale/result; bearer transport|Opt-in, aggregate without user link, no disk queue or content|
|ImagePicker/Manipulator|Explicit selected/taken photo, normalized temporary JPEG|No broad photo/audio access; normalized files deleted after analysis|

App Privacy/Data Safety values must be derived from actual release binaries + backend/provider practices, not this table alone. No tracking SDK is planned; do not add an ATT prompt unless actual tracking is introduced and reviewed. KVKK/legal notices and cross-border arrangements need the real operator/provider details. Data subject requests require a functional contact/process.
