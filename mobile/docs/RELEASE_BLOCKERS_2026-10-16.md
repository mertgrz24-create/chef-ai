> **Güncel durum — 19 Ekim 2026:** [RELEASE_BLOCKERS_2026-10-19.md](RELEASE_BLOCKERS_2026-10-19.md) geçerlidir. Aşağıdaki eski sayılar/ortam notları tarihsel kayıttır. Güncel npm audit mobil0/backend0; staging lifecycle ve saatlik temizlik aktif. Production/native/hesap kapıları hâlâ açık.

# Güncel yayın engelleri — 16 Ekim 2026

**Durum: yayın hazır değil.** Mobil ve backend aynı `chef-ai` reposunda (`mobile/`, `backend/`), tanıtım ayrı `chef-ai-web` reposunda. Bu turda build, backend deploy, remote push veya ücretli servis etkinleştirme yok. Yalnız mevcut staging veritabanına geriye uyumlu migration uygulandı; production değişmedi.

## Bu tur kapatılan teknik açık

### Hesap silerek günlük AI sayacını azaltma — staging'de kapalı

Önceki global limit `mobile_ai_jobs` satırlarını sayıyordu. Hesap silme cascade'i ve süreli sonuç temizliği bu satırları kaldırdığından günlük sayaç azalabiliyordu.

`backend/supabase/migrations/20261016000100_mobile_ai_durable_daily_cap.sql` artık yalnız UTC günü ve sayı tutan `mobile_ai_daily_attempts` tablosunu kullanır. Kullanıcı ID'si, fotoğraf, malzeme, e-posta veya tarif saklamaz. Rezervasyon ve sayaç aynı transaction/advisory lock içinde artar. İzin/kota reddi ve replay sayılmaz; başarısız üretim aylık kullanıcı kotasından iade edilse de global günlük rezervasyon iade edilmez. Hesap silme ve job cleanup bu toplamı azaltmaz.

- Yerel disposable SQL lifecycle, replay, cleanup, hesap silme, UTC gün ve rol kontrolleri geçti; lifecycle işlemleri rollback edildi.
- İki farklı hesabın son günlük yer için eşzamanlı yarışında yalnız biri başladı; diğeri rate_limited aldı.
- Migration yalnız `chef-ai-staging` (`vcyqtbzhfanbpclfhibv`) üzerinde uygulandı. Anon/authenticated tabloyu okuyamaz veya rezervasyon RPC'sini çağıramaz; service_role sayacı doğrudan sıfırlayamaz. RLS ve fixed search_path doğrulandı.
- Beş gerçek staging kontrolü geçti: artış, başarısızlıkta koruma, replay, dolu kota reddi ve hosted hesap silmede sayacın korunması. Yalnız bu testin sentetik hesabı oluşturulup silindi; mevcut kullanıcı hesaplarına dokunulmadı. AI sağlayıcı çağrısı yapılmadı. Sentetik rezervasyon bugünün staging toplamında bilinçli olarak kalır; maliyet değildir.
- Kanıt: `mobile/security/durable-daily-cap-2026-10-16.json`.

**Sınır:** Bu bir uygulama işlemi limiti; token/dolar harcama defteri değildir. Staging503 toparlamasında her işlem en fazla iki sağlayıcı çağrısına çıkabilir. Daha önce silinmiş eski işlemler geri hesaplanamaz; başlangıç yalnız halen var olan job'lardan dolduruldu. Production migration ve gerçek sağlayıcı bütçe/uyarıları ayrı engeldir.

## Mevcut doğrulanmış parçalar

- Hosted staging config200, AI/TR açık. Önceki13 gerçek AI kabulü (tarif, fotoğraf, haftalık plan, kayıt/rapor/izin) geçerli tarihsel kanıttır; bu tur pahalı üretimler yeniden çağrılmadı.
- Özel kayıt, idempotency, hesap izolasyonu ve sentetik hesap silme için HTTP kanıtları var.
- Bu tur backend 36 güvenlik testi, TypeScript ve mobil 15 bağımlılık regresyonu geçti. Mevcut yamaların dosya bütünlüğü doğrulandı.
- Eski Android ARM64 APK için lint/izin/backup/debug ve 26 ELF / 16 KB kanıtı; iOS simülatör artefakt/runtime kanıtı var. Bunlar son kaynak değişikliklerini veya final storeIPA/AAB'yi kapsamaz.
- Backend için monorepo dizininden kurulum/lint/TypeScript/güvenlik/audit yapan `.github/workflows/backend.yml` hazırlandı. Build/deploy adımı yok. Uzak CI bu tur **çalıştırılmadı**; audit halen kırmızı kalır.

## Öncelikli kalan işler

| Sıra | Engel | Mevcut durum | Kapatmak için gereken |
|---|---|---|---|
|1|Bağımlılık ve güvenlik incelemesi|Raw npm: mobil56 yüksek / 5 orta, backend7 yüksek;0 kritik. Kök advisories braces/node-forge/sprintf-js. Yerel yamalar/regresyonlar geçiyor; npm sürüm uyarıları kapanmıyor.|Bakımı sürdürülen upstream düzeltme/uyumlu değişim veya bağımsız yama incelemesi; kimlik doğrulamalı DAST ve final artefakt kontrolü. Audit force/downgrade/ignore ile bulgu gizlenmeyecek.|
|2|Yayıncı, yasal sayfalar ve SMTP|Kullanıcı yayıncı adı, destek e-postası ve alan adını sonraya bıraktı. Staging-info gerçek production politikası değil. Supabase doğrulama çalıştığı kullanıcıca bildirildi; brandedSMTP kapalı.|Gerçek bilgiler, sahip olunan domain/From ve SMTP erişimi; SPF/DKIM/DMARC; TR/EN politika/koşullar/destek/silme sayfaları; gerçek recovery/expired/cold/warm/non-team teslim kontrolleri.|
|3|RevenueCat/abonelik/restore|Kaynak adapter'ları var; hostedbillingfalse. Gerçek aylık store ürünü, fiyat ve Premium kota onayı yok.|Mağaza+RevenueCat hesap/ürün/SDK ve server yapılandırması, webhook doğrulama/reconcile; sandboxpending/renewal/refund/restore/yeni cihaz/hesap çakışması kanıtları. Gerçek para alınmayacak.|
|4|Push|Client/server/token/claim/receipt kodu var; hostedpushfalse; stagingcron kapalı.|APNs/FCM/Expo proje bilgileri, gerçek cihaz token/delivery/tap/Settings/logout/timezone testleri ve gözlenen receipt temizliği. Gönderim kabulü teslim sayılmaz.|
|5|Sentry ve kullanım ölçümü|Scrub/source-map kodu var; gerçek project/DSN ve symbolicated release crash kanıtı yok. Opsiyonel analyticsfalse.|Sentry erişimi ve doğru release/source-map ayarları; gerçek release hata kanıtı. Analytics açık olacaksa gerçek alıcı ve opt-in/opt-out/payload kontrolü; varsayılan kapalı kalabilir.|
|6|Production veri/AI operasyonları|Yedi uygulama güvenlik migration'ı yalnız staging'de; production değişmedi. Yeni daily cap staging'de kapalı; kesin sağlayıcı token/maliyet defteri değil. Zamanlanmış cleanup kapalı.|Production şema/izin/env geçişi; yedek+gerçek geri yükleme provası; veri saklama/silme ve işlemci süreçleri; AI bütçe/uyarı, sağlayıcı veri koşulları, rapor inceleme ve olay müdahale sorumluları.|
|7|Son kaynakların native kabulü|Son ortak silme-linki/AI mesajı vb. kaynak düzeltmeleri kurulu APK'ya girmedi. Mevcut native kanıtlar kapsamı sınırlı.|Yeni build'e izin verildiğinde final imzalıIPA/AAB; fiziksel iOS/Android, ekABI/16KB, büyükfont/VoiceOver/TalkBack, offline/ağ geçişi, kamera/izin, yeniden başlatma/ikinci cihaz, authrecovery ve UI durumları. Şu an yeni build alınmaz.|
|8|Mağaza ve gerçek kullanıcı beta'sı|Hesap türü/kimlik/vergiler/ürünler/metadata incelemesi ve hedef testçi raporu tamamlanmadı.|Apple/Google yayıncı erişimleri; AppPrivacy/DataSafety/AI/health/age/encryption/privacy manifests; gerçek ekran görüntüleri/inceleme hesabı; TR/ABD yetişkin beta'sı ve gerekiyorsa Play kapalı test koşulu.|

24 release-evidence kapısı **pending**. Bu,24 özelliğin kodunun eksik olduğu anlamına gelmez; her kapıda üretim/native/harici kabul kanıtı gerekir. Bu tur hiçbir gate kanıtsız verified yapılmadı. `backend-contracts` içindeki eski503/AI-off kaydı düzeltildi.

## Supabase advisor değerlendirmesi

- Yeni sayaç ve diğer sunucu tablolarında RLS açık, client grant yok; `RLS Enabled No Policy` INFO kaydı bu sunucu-only erişim modeliyle uyumlu. Uyarıyı susturmak için kullanıcı policy'si eklenmedi. [Advisor açıklaması](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy).
- `apply_referral` için authenticated SECURITY DEFINER WARN sürüyor. İncelenen fonksiyon auth.uid() ile kendini yetkilendiriyor ve satır kilitleri kullanıyor; istemciden çağrılması mevcut akışta amaçlı. Bu inceleme kapsamlı güvenlik onayı değil. [Advisor açıklaması](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable).
- Leaked password protection kapalı WARN. Ücretsiz staging için ücretli plan açılmadı; production parola politikası/sağlayıcı tercihi açık. [Parola güvenliği](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).
- HawkScan skill incelendi; HAWK_API_KEY yok ve kullanıcı ücretli kurulumu daha önce reddetti. DAST yapılmadı veya geçmiş kod/unit taramasıyla eşdeğer sayılmadı.

## Güncel resmi gereklilikler (16 Ekim 2026 kontrolü)

- Apple: Xcode 26+ / iOS 26 SDK+ yükleme koşulu; yeni age-rating soruları. [Apple gereklilikleri](https://developer.apple.com/news/upcoming-requirements/).
- Google: yeni uygulama/güncellemelerde31 Ağustos 2026'dan beri API 36+. [TargetAPI](https://developer.android.com/google/play/requirements/target-sdk).
- Expo57: RN0.86/React19.2.3 ve minimum Node22.13; Androidtarget36, iOSminimum16.4; uyumlu araç zinciri final artefaktta doğrulanmalı. [Sürümlenmiş SDK57](https://docs.expo.dev/versions/v57.0.0/).
- Supabase 10 Kasım 2026 TLS cipher değişikliği eski OS/ağ test matrisine işlendi; desteklenen modern native ağ katmanında gerçek cihaz kontrolü gerekir. [Duyuru](https://supabase.com/changelog/cbc-tls-ciphers-deprecated).
- sprintf-js için advisories patchedversion bildirmiyor; yerel yama sürüm bazlı audit'i yeşile çevirmez. [Advisory](https://github.com/advisories/GHSA-hp3w-g68c-fv3c).

## Sonraki çalışma sırası

1. İlk sırada bağımlılık/yama güvenlik incelemesi ve erişim sağlandığında authenticatedDAST.
2. Yayıncı/domain/SMTP bilgileri geldiğinde gerçek e-posta ve yasal akışlar.
3. Store/RevenueCat erişimi+ürün/fiyat/kota kararıyla ödeme/restore.
4. Push/Sentry/production veri-operasyonları.
5. Kullanıcı yeni build'e izin verdiğinde final cihaz/beta/mağaza kabulü.

Anahtar/parola sohbete gönderilmez; bilgi beklenen maddeler için mevcut staging akışı kapatılmaz. Yeni harcama/deneme veya otomatik yayın başlatılmaz.


## Kamera ve haftalık menü kaynak düzeltmeleri — 16 Ekim 2026

İzin/Settings/picker recovery, önizleme onayı, geç yanıt/iptal, offline-first ve TR tek öğün yenileme düzeltildi.95 Jest + 15 güvenlik regresyonu, TypeScript/lint geçti. Yeni build/deploy yok; mevcut APK bu kaynak değişikliklerini içermez. Fiziksel kamera/izin/Android activity ve final UI kabulü açık. Ayrıntı: [CAMERA_MENU_FIXES_2026-10-16.md](CAMERA_MENU_FIXES_2026-10-16.md). Backend404/DB hata ayrımının kaynak düzeltmesi ve regresyonu da hazır; yeni deploy yapılmadığı için hosted sürüme yansımadı.


## Son yerel kapanış — 16 Ekim 2026

Güncel kaynak/kontrol ve açık kapılar: [ENGINEERING_CLOSEOUT_2026-10-16.md](ENGINEERING_CLOSEOUT_2026-10-16.md). 97 mobil, 15 dependency, 41 API, 3 secrets/şablon ve 4 artifact-denetleyici testi geçti; 7 migration ile sentetik geri yükleme provası geçti. En son raw audit mobil53 yüksek/5 orta, backend7 yüksek; güvenlik kapısı kapanmadı. Yeni build/deploy yok. Yalnız kullanıcıdan beklenenler OWNER_ACTIONS.md içinde.


## Daha sonraki güvenlik düzeltmesi — 16 Ekim 2026

[Son bağımlılık düzeltmesi](DEPENDENCY_REMEDIATION_2026-10-16.md): backend raw audit **0**; mobil **54 yüksek / 0 orta**. Orta uyarıların kaynağı sprintf-js ve eski YAML zinciri kaldırıldı. Yeni yüksek üst kayıt mevcut RevenueCat paketinin react-native üzerinden listelenmesi; yeni kök advisory değil. Kalan kökler braces/node-forge, yamaları testli; bağımsız inceleme/upstream/native kapıları açık. İki temiz kurulum,97 Jest + 15 bağımlılık + 42 backend testi, TS/lint/Expo geçti. Backend tek glob uyumluluk yaması, mobil15 dosya yaması var. Yeni build/deploy yok.
