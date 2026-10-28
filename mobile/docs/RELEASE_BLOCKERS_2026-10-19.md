> **20 Ekim — güncel kayıt:** Picomatch **UNRESOLVED — kısmi mitigasyon mevcut; incelenen uygulama yollarında sömürü gösterilmedi**. Kullanıcı yerel çıktı incelemesini tamamlanmış kabul etti; FIXED/risksiz veya risk kabul edildi olarak işaretlenmedi. [Yerel çıktı raporu](../../backend/security/PICOMATCH_ARTIFACT_REVIEW_2026-10-20.md) ve [kanıt indeksi](../../backend/security/picomatch-artifact-evidence-2026-10-20/index.json), [yayın kontrol listesindeki dört açık takip maddesine](RELEASE_READINESS.md#picomatch--sonraki-onaylı-yayın-derlemesinde-açık-kontroller) bağlandı. Gerçek derleme yöntemi, gerekirse Turbopack çıktısı, kaynak/lockfile/ayar karşılaştırması ve final native paket/cihaz kontrolleri pending. B/C düzeltmeleri ve önceki 17 timeout korunuyor. Bu kayıt güncellemesinde yeni build, tarama, yama, paket denemesi, deploy veya ücretli işlem yapılmadı. Aşağıdaki önceki notlar kendi turlarının tarihsel sonuçlarıdır.

> **20 Ekim — üç bulgu takibi:** Yerel rapor aracındaki dosya yolu ve doğrulama aracındaki dinamik modül yükleme kaldırıldı; güncel kök Snyk Code **0 bulgu**. npm audit **0/0**. Picomatch **UNRESOLVED**: güncel Snyk mobil **28**, backend **2** yol; kontrollü deney yine **17/24 timeout**. Paket/yama değişmedi, yayın engeli sürüyor. [Uygulama ve test raporu](../../backend/security/THREE_SNYK_FINDINGS_2026-10-20.md). Yeni build/deploy yok.

> **20 Ekim — yeni güvenlik kanıtı:** Picomatch mitigasyonu kısmi: yeni testlerde yamalı 7 kopyada ardışık gruplar süre aşımı üretiyor; Next iç kopyası kapsam dışında. İncelenen kaynakta uzaktan kullanıcı kontrollü desen yolu gösterilmedi; yayın engeli sürüyor. [Güncel karar ve kanıt](../../backend/security/PICOMATCH_REACHABILITY_REVIEW_2026-10-20.md). Yeni build/deploy yok.

> **20 Ekim — güvenlik takibi:** Picomatch ReDoS kaynağı7kopyada yamalandı ve temiz kurulum/regresyonlar geçti. npm audit0/0; güncel Snyk aynı tek yüksek advisory ile açık. [Düzeltme ve kalan katalog engeli](../security/PICOMATCH_REMEDIATION_2026-10-20.md). Build/deploy yok.

> **20 Ekim güncellemesi:** [UI polish ve yeni Snyk sonucu](UI_POLISH_2026-10-20.md). UI kaynak turu tamamlandı. npm audit0/0; güncel Snyk tek ortak yüksek picomatch advisory gösteriyor (mobil28/backend2 bağımlılık yolu). Bu bulgu açık yayın engelidir. Yeni build/deploy yok.

# Yayın engelleri — 19 Ekim 2026

Bu rapor güncel durumdur. 15–16 Ekim belgelerindeki eski audit sayıları ve üç repo mimarisi tarihsel kayıttır. Aktif kaynak: aynı repoda `mobile/` ve `backend/`; ayrı `chef-ai-web` yalnız tanıtım sitesidir.

## Bu tur kapananlar

- Push izin/token/API bekleyişlerinde hesap değişimi yarışı düzeltildi. Başlangıç hesabı yakalanır, kayıt/kayıt kaldırma HTTP çağrısında aynı hesap zorunludur; yerel owner kısıtı HTTP'ye gönderilmez. Çıkış/devre dışı bırakma eski aktif ve sıradaki kayıtları geçersiz kılar. Sunucu onayı sonrası token yeni hesaba yazılmaz. Bildirim servisi açılmadı.
- Altı yeni regresyon: izin sırasında hesap değişimi, token sırasında değişim, sunucu yanıtı sırasında değişim, aktif/sıradaki kayıt iptali, API'de eski owner reddi ve owner bilgisinin transport'a taşınmaması.
- Staging saatlik temizlik doğal saat başlarında doğrulandı: **57 saatlik çalışma**, önceki üç kısa scheduler denemesi dahil **60 başarılı / 0 başarısız**. İlk doğal saat: 17 Ekim 12:00 UTC; son tamamlanma: 19 Ekim 20:00:00 UTC. Aktif `0 * * * *`; süresi dolmuş pending iş **0**. Bu tur yalnız SELECT, görev/DB ayarı değişmedi.
- Güncel yerel kontroller: **140 mobil / 19 suite**, **17 gerçek bağımlılık güvenlik testi**, **61 backend**, **3 secrets/şablon testi** geçti. Her iki lint/TypeScript temiz. Backend testinde Node modül türü uyarısı var; test başarısızlığı değil, paket türü değiştirilmedi.
- npm audit: mobil **0**, backend **0**. Gitleaks 8.30.1: 394 kaynak dosyada **0**, yerel Git geçmişinde **0**. Tarama ignored dotenv, yeni native binary veya bağımsız kripto incelemesi yerine geçmez. Yeni Snyk taraması yapılmadı; son temiz Snyk raporu 16 Ekim'den.

## Önceden kapanmış staging işleri

17 Ekim'deki izinli geçişte Pantry revision, AI lifecycle, her gerçek dispatch için atomik izin, tek sonuçlandırma/iade, geç yazma engeli ve 24 saat/30 gün/90 gün temizlik aktif oldu. Gerçek tarif, fotoğraf, haftalık plan ve tek öğün yenilemesi toplam dört çağrıyla doğrulandı; bu tur ek AI çağrısı yapılmadı. Kiler yarışında 200+409, özel kayıt/yeniden giriş/hesap izolasyonu ve iki test hesabı silme doğrulandı. [Geçiş raporu](STAGING_LIFECYCLE_ROLLOUT_2026-10-17.md).

## Kalan yayın kapıları

| Sıra | Kapı | Gereken dış girdi veya kabul | Hazır olan / sınır |
|---|---|---|---|
| 1 | Yasal içerik ve destek | Yayıncı türü/adı, destek e-postası, alan adı ve hukuki onay | Şablonlar/bağlantı adapter'ı hazır; staging test metinleri production politikası değildir. |
| 2 | Markalı e-posta | SMTP sağlayıcısı, gönderici/DNS yetkisi ve gerçek alıcı testi | Supabase doğrulaması kullanıcı tarafından çalışır bildirildi; markalı doğrulama/kurtarma teslimi açık. |
| 3 | Premium | Mağaza/RevenueCat proje erişimi, aylık ürün/fiyat ve onaylı Premium hakları | İstemci/webhook/kota altyapısı hazır, billing kapalı. Scan/Premium için yeni sayı seçilmedi. Sandbox satın alma/restore/iptal/iade gerekir. |
| 4 | Hata izleme ve push | Sentry projesi; push açılacaksa APNs/FCM/Expo erişimi ve cihazlar | Mahremiyet filtresi ve adapter'lar hazır. Sembolleştirilmiş native hata ve cihaz teslim kanıtı açık; isteğe bağlı analytics kapalı kalabilir. |
| 5 | Bağımsız güvenlik/DAST | Yetkili tarayıcı erişimi ve bağımsız yama/kripto değerlendirmesi | HawkScan 6.6.0 mevcut, HAWK_API_KEY yok ve proje tarama yapılandırması yok. Oturum/anahtar olmadan tarama yapılamadı. Ücretli servis açılmadı. npm/Gitleaks sonucu DAST kabulü değildir. |
| 6 | Güncel native sürüm | Kullanıcının yeni build izni; güncel kaynak için IPA/AAB ve cihaz testi | Kaynak Expo58/RN0.88; mevcut Expo57 APK bu değişiklikleri içermez. OTA yapılmamalı. Kamera/Settings, callback, erişilebilirlik, offline, 16KB ve sandbox kabulü açık. |
| 7 | Gerçek kullanıcı beta'sı | TR/ABD yetişkin testçiler, iOS/Android cihazlar ve katılım | Görev protokolü hazır; gerçek katılımcı başarıları ölçülmedi. Mağazanın hesap türüne bağlı kapalı test koşulu ayrıca doğrulanmalı. |
| 8 | Production operasyonu | Ayrı açık onay, yetkili erişim, yedek hedefi/saklama ve operasyon sorumlusu | Bu tur production'a erişilmedi. Staging kanıtları production yedek/geri yükleme, e-posta, kota ve izleme kabulünün yerine geçmez. |
| 9 | Mağaza gönderimi | Apple/Google hesap işlemleri, gerçek metadata/hukuki beyanlar ve son onay | İnceleme hesabı, final ekran görüntüleri, App Privacy/Data Safety ve güncel native binary gerekir. |

## Güvenlik ve teslim sınırı

Staging'deki önceki advisor raporunda iki WARN bulunuyordu: mevcut authenticated referral fonksiyonu ve kapalı leaked-password protection. Bu tur advisor taraması yeniden yapılmadı; free planda ücretli güvenlik özelliği kendiliğinden açılmadı. Sunucu tablolarına istemci erişimi açılmadı.

`release-evidence.json` içindeki 24 kapı, nihai yayın kabulü tamamlanmadığı için pending tutuldu. Bu, 24 uygulanmamış özellik anlamına gelmez. Yerel, staging, fiziksel cihaz ve production kanıtları birbirinden farklıdır.

Yeni mobil build, backend build/deploy, OTA, push, uzak migration, ücretli servis işlemi veya gerçek AI testi **yapılmadı**. Paketler, lock dosyaları, güvenlik yamaları, modeller ve sayısal kullanım limitleri değiştirilmedi. Mevcut APK ve hosted staging korundu. Kod düzeltmesi yalnız yerel kaynakta; telefona uygulanmış değildir.

Makine tarafından okunabilir kanıt: `mobile/security/release-followup-2026-10-19.json`. Kullanıcı görevleri: [OWNER_ACTIONS.md](OWNER_ACTIONS.md). SDK kaynağı: [Expo58 Notifications](https://docs.expo.dev/versions/v58.0.0/sdk/notifications/).
