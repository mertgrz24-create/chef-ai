# Proje güvenlik incelemesi — 16 Ekim 2026

## Sonuç ve kapsam

Önceki sohbetin kaybolması kaynak değişikliklerini silmemiş. Forge kaldırma çalışmasının kapanış kanıtları [FORGE_REMOVAL](FORGE_REMOVAL_2026-10-16.md) içinde duruyor. Eski günlükteki `Snyk 1 high` kaydı tarihsel; sonraki kayıtlı `snyk test --dev` sonuçları mobil ve backend için sıfır bulgu gösteriyor. **Bu turda Snyk yeniden çalıştırılmadı**; güncel npm audit iki dizinde de yeniden çalıştırıldı ve sıfır açık döndürdü.

İnceleme mobil/backend güvenlik sınırlarını, 28 API route dosyasını, oturum/izin/veri işleme kodunu, Supabase migrationlarını, bağımlılık yamaları/sertifika adaptörünü, sır tarama betiklerini ve GitHub iş akışlarını kapsadı. Ayrı `chef-ai-web` reposu kapsam dışında. Mevcut kaydedilmemiş çalışmalar korundu. Bu, kaynak incelemesi ve yerel test sonucudur; canlı sistem için tam güvenlik onayı değildir.

## Bulunan ve düzeltilen sorunlar

### Hesap değişiminde yanlış oturumla HTTP isteği

`mobile/src/lib/api.ts` oturum neslini `getSession()` öncesinde alıyor, fakat hesap değişimini HTTP isteği tamamlandıktan sonra kontrol ediyordu. Bekleyen oturum okuması yeni hesabı döndürürse eski ekranın yazma isteği yeni kullanıcı adına gönderilebiliyordu. Sonradan yanıtı iptal etmek sunucudaki yazmayı geri almıyordu.

Artık oturum okumasından hemen sonra, ağ isteğinden önce hesap değişimi kontrol ediliyor. Oturum yenileme sonrası okuma tekrarı da aynı kullanıcı kimliğini gerektiriyor. İki regresyon testi eski kodda başarısız oldu; düzeltmeyle geçti. Testler yanlış hesapla HTTP çağrısının hiç yapılmadığını doğruluyor.

### Geçersiz AI çıktısının başarılı tarif sayılması

`backend/lib/ai/gemini.ts` JSON ayrıştırma hatasında modelin ham metnini döndürüyordu. `structured: null` yanıtı route kontrolünü geçebildiğinden geçersiz çıktı başarı ve tüketilmiş tarif kredisi olarak sonuçlanabiliyordu. `{}` gibi eksik çıktılar da geçerli sayılabiliyordu.

Tarif artık metne çevrilmeden önce mevcut şemayla doğrulanıyor; geçersiz JSON/şema `invalid_ai_output` hatasına dönüşüyor. Mevcut hata yolu HTTP 502 ve başarısız iş kaydı kullanıyor; SQL başarısız işte kullanıcı kredisini iade ediyor, global deneme sayısını koruyor. Ham metin, boş nesne, null/dizi, hatalı malzemeler/makrolar/uzunluk ve geçerli düz/markdown kod çitli JSON test edildi. Yeni regresyon eski kodda başarısız, düzeltmeden sonra başarılı.

### Kapanış bilgisinin ana günlükte eksik olması

`PROGRESS.md` son kaydı Forge/Snyk bulgusunu hâlâ açık gösteriyordu; sonraki başarılı kapanış ayrı güvenlik belgesindeydi. Tarihsel kayıtlar değiştirilmeden kapanış ve bu inceleme günlüğe eklendi. Eski bulgu yeni tarama sonucu olarak yorumlanmamalı.

## Bu turdaki doğrulama

| Kontrol | Sonuç |
|---|---|
| Mobil `npm run check` | Lint/TypeScript temiz; 14 suite, 99 uygulama testi ve 17 gerçek bağımlılık güvenlik testi geçti |
| Backend test/TypeScript/lint | 43 güvenlik testi geçti; TypeScript ve lint temiz |
| `npm audit --json`, dev bağımlılıkları dahil | Mobil 0; backend 0. Sandbox DNS hatasından sonra izinli ağ erişimiyle başarılı tekrar |
| Gitleaks 8.30.1 | Kaynak ve yerel Git geçmişinde 0 bulgu; değerler rapora yazılmadı |
| Sır tarayıcısı ve ortam şablonu regresyonları | 3/3 geçti |
| Android artifact denetleyici birim testleri | 4/4 geçti; yeni APK incelenmedi/üretilmedi |
| İzole PostgreSQL | 7 release migrationı, 5 kontrol grubu; roller/RLS, özel tarif izolasyonu, kota/eşzamanlılık, günlük limit, cascade, push tekilleştirme ve sentetik yedek/restore geçti |
| Ortam sınırları | İki `env:check` geçti; backend `.env.local` ve mobil `.env` 0600 ve Git dışında |
| Yama/adaptör bütünlüğü | Gerçek bağımlılık testlerindeki hash ve kriptografik uyumluluk kontrolleri geçti |

Veritabanı kanıtı: [project-review-database](project-review-database-2026-10-16.json). Sır tarama kanıtı: [project-review-secrets](project-review-secrets-2026-10-16.json). PostgreSQL yalnız geçici Unix soketiyle çalıştırıldı; test veritabanları temizlendi ve sunucu durduruldu. Staging/production SQL veya hesap mutasyonu yapılmadı.

## Kalan doğrulama sınırları

- **Kimlik doğrulamalı DAST yapılmadı.** HawkScan 6.6.0 mevcut; API anahtarı ve `~/.hawk/hawk.properties` yok. Skill sürüm kontrolü ağdan bilgi alamadı, önbelleği güncel bildirdi. Önceki yeni hesap/ücretli servis açmama tercihi korundu. Bu bir başarılı DAST sonucu değildir.
- **Yeni native/gerçek cihaz doğrulaması yok.** Kaynak Expo 58/RN 0.88; kurulu Expo 57 APK değişmedi. Eski APK testleri yeni kaynak için kanıt değildir. [Expo 58 sürüm tablosu](https://docs.expo.dev/versions/v58.0.0/) değişiklik öncesi kontrol edildi.
- Dar kapsamlı Node/OpenSSL sertifika adaptörü ve fork bağımlılıklar için bağımsız inceleme/yeni native kabul hâlâ gereklidir; temiz advisory taraması bunların yerine geçmez.
- Önceki kapanışta kayıtlı online Expo kontrolünün Jest 29 önerisi/kurulu ve testleri geçen Jest 30 farkı ile CI adımı bu turda değiştirilmedi veya yeniden çalıştırılmadı. Uzak CI başarılı sayılmaz.
- Önceki SMTP, abonelik, push, Sentry, production/yedek ve mağaza kabul kapıları bu incelemeyle kapanmaz. Webhook kriptografisi yerel testlidir; gerçek ödeme sağlayıcısı entegrasyon onayı değildir.

Build, export, OTA, deployment, uzak push veya native CI başlatılmadı. Bu turdaki düzeltmeler yalnız yerel kaynakta; mevcut APK/hosted API'ye yayımlanmadı.
