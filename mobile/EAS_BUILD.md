# Chef-AI — Build ve mağaza yayını

> Durum: Mobil yayın hazırlığı kodu mevcut; uygulama henüz mağazaya gönderilebilir durumda değil.
> Ana kontrol listesi: [docs/RELEASE_READINESS.md](docs/RELEASE_READINESS.md)
> Sunucu bağımlılıkları: [docs/BACKEND_CONTRACTS.md](docs/BACKEND_CONTRACTS.md)
> Kanıtlar: [docs/release-evidence.json](docs/release-evidence.json)

## 1. Hesaplar ve kimlik

Yayıncı bireysel/şirket kararını ver; Apple Developer, Google Play, Expo/EAS, RevenueCat ve Sentry hesaplarını kur/doğrula. Sözleşme, ödeme, vergi/banka bilgileri hesap sahibi tarafından tamamlanır. İlk mağaza kaydından önce com.chefai.app bundle/package kimliğinin sahipliğini ve uygunluğunu doğrula. Gerçek EAS projectId, Apple Team/ASC IDs ve Google servis hesabını yapılandır; REPLACE değerleriyle submission yapma.

## 2. Ortamlar

Node 22.13+ kullan. `npm ci`, `npm run check`, `npx expo install --check`, `npx expo-doctor` ve `npm audit --audit-level=high` çalıştır. `.env.example` alanlarını ilgili EAS development/preview/production ortamlarına ekle. Preview ayrı staging API/Supabase kullanmalıdır. Bu repo mobile/ ve backend/ dizinlerini birlikte içerir; Expo/EAS ve native komutları yalnız mobile/ dizininden çalıştırılır. Backend ayrı sunucu uygulamasıdır; sunucu anahtarları mobile/root ortamına veya mobil pakete eklenmez. Geçmiş next16-upgrade merge talimatları geçerli değildir.

Auth HTTPS origin için backend sahibi /auth/callback ile AASA ve Android assetlinks dosyalarını servis etmelidir. Supabase allowlist ve e-posta şablonlarını eşleştir. Cross-device kurtarma için token_hash şablonlarını doğrula; PKCE linkleri üretildiği cihazdaki verifier'a ihtiyaç duyar.

## 3. Development / preview

`eas build --profile development --platform ios` simülatör build'idir. Fiziksel cihaz için `--profile development-device` kullan. Preview Android APK ve iOS internal build gerçek cihaz QA içindir; gerçek IAP için mağaza test ortamı gereklidir. Expo Go başarılı görüntülenmesi native release QA yerine geçmez.

## 4. Production kapısı

`npm run release:check` tüm gerekli ortamları ve gerçek kanıt kayıtlarını ister. EAS production post-install aynı kontrolü çalıştırır. Kanıtları gerçek test URL/log/build referansları, doğrulayan kişi ve tarihle doldur. Pending bir girdiyi yalnızca build geçsin diye verified yapma.

Production OTA kapalıdır. Gizlilik manifestlerini derlenen IPA'dan ve Android izin/16KB/Billing sürümünü gerçek AAB'den kontrol et. Sentry source map upload için özel build token'ı kullan. Native binary içine AI/service-role/cron/webhook sırrı girmez.

## 5. Test ve submission

Önce TestFlight ve Play internal/closed QA. Yeni kişisel Play hesabı için 12 kişi/14 gün şartı uygulanabiliyorsa tamamla ve production erişimine başvur. Mağaza form ve görselleri release adayıyla eşleştir. Ayda 10 ücretsiz tarif + doğrulanmış kotalı aylık Premium ürününü kur; bölgesel fiyatları sahibi onaylasın.

Bütün yayın kapıları geçtikten sonra `eas build --profile production --platform all`. Apple/Google submission alanlarını gerçek değerlerle doldur. İlk Android upload'ın manuel gerekebileceğini EAS Submit rehberinden doğrula. `eas submit` mağaza incelemesi veya production release ile aynı şey değildir. İlk yayın manuel tutulur; son gönderim öncesinde somut build/test/metadata paketi gözden geçirilir.

## 6. Operasyon

Backend kota/RLS, private recipes, raporlar, RevenueCat webhooks, SMTP, push unregister/cron/receipts ve yedekleme doğrulanmadan yayın yok. Push CRON_SECRET ve AI kredisi yalnızca backend hesabında tutulur. Sentry gerçek release crash'i, satın alma/restore ve test hesabı silme senaryoları tamamlanır. Gerçek kullanıcı testi ve olay müdahale/dağıtımı durdurma planı ana rehberde bulunur.


## 20 Ekim 2026 — Onaylı staging test paketleri

Yeni Android ARM64 APK ve iOS ARM64 simülatör paketi hazırlandı; iPhone17/iOS26.5 üzerinde normal uygulama açıldı. Detay, gerçek derleme/JS tekrar paketleme yöntemi, source commit/hash ve açık kapılar: [NATIVE_TEST_PACKAGES_2026-10-20.md](docs/NATIVE_TEST_PACKAGES_2026-10-20.md). Bunlar mağaza/production release onayı değildir. APK ve iOS archive yerel artifacts/build-2026-10-20/ altında tutulur. Eski Expo57 generated native klasörleri güncel kaynak için kullanılmaz; çalışan paket Expo58/RN0.88 native temelini kullanır.
