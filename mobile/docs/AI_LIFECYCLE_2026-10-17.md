# AI işlem yaşam döngüsü — onaylı E uygulaması, 17 Ekim 2026

**Sonraki staging geçişi tamamlandı:** [Geçiş raporu](STAGING_LIFECYCLE_ROLLOUT_2026-10-17.md). Aşağıdaki yerel kanıtlar tarihsel kapsamını korur; Production ve mobil build değişmedi.

## Durum

Kullanıcının onayladığı bekleme, kilit, iade, ölçüm ve saklama kuralları mobil/backend kaynak kodunda uygulandı ve yerel sentetik testlerle doğrulandı. Bu belge önceki APP_REUSE_ROUND_2026-10-17.md içindeki ertelenmiş E ve genel deneme sayacı açığının **yerel kaynak** durumunu günceller. Hosted staging veya production'ın güncellendiği anlamına gelmez.

Yeni native/backend build, OTA, deploy, uzak migration, push, ücretli servis veya gerçek maliyetli AI testi yapılmadı. Telefon APK'sı ve hosted staging değişmedi. Paketler, lock dosyaları, bağımlılık güvenlik yamaları ve mevcut 503 retry politikası korundu. Sayısal kullanım limitleri değiştirilmedi; Scan/Premium için yeni sayı seçilmedi.

## Uygulanan kurallar

| Konu | Davranış |
|---|---|
| Normal istek | Sağlayıcı110 saniye, mobil AI/upload120 saniye sınırı korunur. HTTP istekleri için maxDuration120 kaynak bildirimi eklendi; hosting desteği henüz doğrulanmadı. |
| Belirsiz sonuç | Aynı request key ile yalnız GET durum sorguları yapılır; üretim POST/PATCH'i tekrarlanmaz. Telefonun beklemesi en fazla5 dakika; çevrimdışı durumda iade uydurulmaz. |
| Hesap kilidi | Tüm AI türleri arasında tek pending iş. Kesin sonuçta hemen, sunucuda başlangıçtan5 dakika sonra mantıksal olarak sona erer. |
| Hak | Başta1 rezervasyon; doğrulanmış/geçerli sonuç ve gerekli uygulama yazması aynı transaction'da tamamlanınca1 tüketim. Kesin başarısızlıkta bir kez iade. |
| Sonuç bulunamaması | Beş dakikalık deadline sonunda pending iş bir kez failed/refunded olur. Hiç iş bulunmadığı veya sunucuya ulaşılamadığı durumda istemci iade olmuş gibi konuşmaz. |
| Geç yanıt | Tamamlanmış/iade edilmiş iş tekrar sonuçlanamaz. Plan ve değiştirilmiş tarif yazmaları, hak ve iş sonucuyla aynı SQL transaction'ına alındı. Deadline kontrolü yazmalardan sonra da yapılır; geç yazma geri alınır. |
| Ay değişimi | İade işin başlangıç UTC ayına yapılır; yeni aya ek hak taşınmaz. |
| Tam sonuç | Sonuçlandırmadan24 saat sonra erişime kapanır; saatlik temizlik payload'u kaldırır. Kaydedilmiş özel tarif ve mevcut planın saklama davranışı değişmez. |
| İçeriksiz işlem özeti | Sonuçlandırmadan30 gün; bu sürede aynı anahtar yeni üretim başlatamaz. Sonrasında anahtar koruması sona erer. Yeni işler zaten rastgele yeni anahtar kullanır. |
| Sağlayıcı ölçümü | İçeriksiz deneme/token metadata'sı90 gün. Kullanıcı kimliği doğrudan saklanmaz; opak job/attempt kimliği kullanılır. |
| Günlük genel toplam | UTC günleriyle90 günlük toplam; kullanıcı silme/iade bu sayacı azaltmaz. |

## Beş dakika ve saatlik temizlik ayrımı

Arka planda sürekli çalışan bir sunucu veya telefonda timer varsayılmadı. Sonlandırma, deadline kontrolü altında ilk durum/kota sorgusunda, sonraki işlem başlatmada, sağlayıcı sonucunu kaydetme girişiminde veya bakımda kalıcılaştırılır. Böylece cron çalışmasa da süresi dolmuş iş yeni işlemi engelleyemez veya geç sonuç yazamaz; kota okunurken eski rezervasyon sonuçlandırılır. Telefonda uygulama kapanınca arka planda poll çalışacağı varsayılmaz.

Saatlik temizlik için `backend/lib/mobile/maintenance-schedule.example.json` hazırlandı. **Bu dosya zamanlayıcı kaydetmez.** Staging vercel.json cron-disabled kaldı; uzakta saatlik görev açılmadı. İleride onaylı dağıtımda ücretsiz/uygun zamanlayıcı kapasitesi ve CRON_SECRET ile mevcut rapor saklama ayarı doğrulanarak etkinleştirilmelidir. Temizlik hatası başarılı sayılmaz.

## Genel sınır ve gerçek dispatch güvenliği

- `begin_mobile_ai_v2` yalnız kullanıcı hakkını rezerve eder. Genel günlük izin, her SDK dispatch'inden önce `claim_mobile_ai_attempt` ile atomik alınır.
- Mevcut staging503 tekrarı varsa ikinci dispatch ikinci izin ister. Sınırda yer yoksa ikinci SDK çağrısı yapılmaz. Kullanıcıdan yine en fazla1 hak tüketilir.
- Ortak production dispatch sınırı, kota bağlamı olmadan Gemini çalıştırmayı reddeder. Üretim dışı saf SDK/çıktı birim testleri açık fake adaptörler kullanır.
- İzin onayı belirsiz/hatalıysa fail-closed davranılır; spekülatif çağrı veya yeni otomatik retry yoktur. İzin verildikten hemen sonra süreç kesilirse sayaç gerçek çağrı sayısından yüksek kalabilir; bu güvenli üst sınırdır, fatura ölçümü değildir.
- Başlatılan izin; sağlayıcı hatası, kullanıcı hakkı iadesi, hesap silme veya iş temizliğinde geri düşmez. Mevcut günlük sayısal limit korunur. Eski günlerdeki eksik dispatch sayıları geriye dönük uydurulmaz.
- Başlangıç/sonuç metadata'sı içerik, fotoğraf, e-posta, bearer/API key veya ham hata mesajı saklamaz. Eksik token/ücret bilinmiyor kalır; tahmini veya gerçek ücret0 yapılmaz.
- Metadata yazılamasa da başarılı sağlayıcı yanıtı yeniden çağrılmaz veya başarısız yapılmaz; önceden kaydedilmiş izin, tamamlanmamış/bilinmeyen ölçüm olarak kalır. Sağlayıcının faturası ayrıca doğrulanmış değildir.

## Mobil kurtarma

Yalnız owner'a göre ayrılmış `{operation,key,startedAt}` pointer'ı mevcut güvenli depoda saklanır. Tarif/fotoğraf/token diske yazılmaz. Belirsiz normal istekte durum okunarak mevcut yanıt teslim edilir. Uygulama yeniden açıldığında “Mevcut sonucu kontrol et” eylemi bulunur; arka planda yeni üretim yoktur.

Kurtarılan tarif mevcut Cook ve açık özel kaydetme akışına; Scan mevcut malzeme gözden geçirme/seçme akışına gider. Kaydedilmiş plan güncellenip mevcut Meal Plan ekranında açılır. Kayıtlı tarifler ve Today yeni AI olmadan kullanılmaya devam eder. Çıkışta pointer temizlenir; geç gelen önceki hesap yanıtı yeni hesaba taşınmaz.

## Veritabanı ve sürüm geçişi

Yeni migration: `backend/supabase/migrations/20261017000200_mobile_ai_lifecycle.sql`. Uzakta uygulanmadı. Önceki migration dosyaları değiştirilmedi.

Yeni RPC'ler: begin_mobile_ai_v2, claim_mobile_ai_attempt, record_mobile_ai_attempt, complete_mobile_ai, mobile_ai_status, reconcile_mobile_ai_user ve cleanup_mobile_ai. Authenticated/anon çağrıları yasaktır; HTTP uçları doğrulanmış kullanıcıyı sunucudan alır. Sabit pg_catalog search_path, sahiplik ve RLS sınırları korunur.

Eski begin_mobile_ai yeni iş başlatmayı policy_update_required ile reddeder: ileri bir migration sırasında eski backend'in ölçümsüz SDK dispatch yapmasını önler. Gelecekteki onaylı rollout için AI kapatılmalı, mevcut işler sonlandırılmalı; migration ve backend birlikte uyumlu hale getirilmeli, yerel kanıtlara ek gerçek entegrasyon kabulünden sonra AI yeniden açılmalıdır. Bu tur böyle bir rollout yapılmadı.

Hesap silmede hâlâ hesaba bağlanabilen deneme ölçümleri auth->job cascade'den önce temizlenir.30 gün sonunda job silindikten kalan içeriksiz opak ölçümler90 gün sonunda temizlenir; kimliksiz günlük toplam korunur. Kalıcı tarifler/planlar mevcut hesap silme cascade'ine tabidir.

## Ayrı doğrulama sonuçları

1. **Mobil yaşam döngüsü:**134 test/19 suite; bunun içinde önceki öneri, kamera, haftalık plan, auth ve izolasyon testleri. Kurtarma için salt GET, en fazla5 dakika, eksik iş/expired ayrımı, iptal, paralel başlatma, owner pointer izolasyonu ve mevcut Cook yönlendirmesi doğrulandı.
2. **Bağımlılık güvenliği:**17 gerçek bağımlılık regresyonu; paket/lock/yama hashleri değişmedi.
3. **Backend API/dispatch:**61 test. İki sahte SDK çağrısı=iki izin; ikinci izin reddedilince ikinci SDK çağrısı0. Belirsiz provider timeout anında refund edilmez. Durum ve kota HTTP uçları yalnız auth owner için çalışır. Metadata sink hatası retry/başarı kaybı üretmez.
4. **Gerçek yerel PostgreSQL:**9 migration/8 kontrol grubu; atomik izin yarışında bir true/bir false; success/failure yarışında bir settlement; deadline sonrası plan yazmama; tek iade; UTC ay değişimi;24/30/90 gün temizliği; hesap silme; RLS/roller; sentetik yedek/restore geçti. Pantry aynı revision paralel200/409 testi korundu. Test veritabanları temizlendi; geçici PostgreSQL sunucusu durdurulup yalnız bu tur oluşturulan küme kaldırıldı.
5. **Statik kontroller:**Mobil/backend TypeScript ve lint geçti. Ek sır/ortam şablonu3 ve artifact denetleyicisi4 birim testi geçti. Npm audit her iki pakette0; Gitleaks kaynak/geçmiş0. Sonuçlar kanıt JSON'undadır.
6. **Yapılmayan kontroller:**Gerçek sağlayıcı/ağ/hosting süreleri, native cihaz/ikinci cihaz, yeni dağıtım artifact'ı, uzakta migration, saatlik cron teslimi, Snyk yeniden taraması ve authenticated DAST yapılmadı. HawkScan6.6.0 ön kontrolü geçti fakat API key/oturum yok; ücretli hesap açılmadı. Yayın kapıları bu yerel testlerle verified yapılmadı.

## Değişen dosyalar

- `backend/app/api/billing/status/route.ts`
- `backend/app/api/meal-plan/generate/route.ts`
- `backend/app/api/meal-plan/regenerate-day/route.ts`
- `backend/app/api/mobile/ai-status/route.ts`
- `backend/app/api/mobile/maintenance/route.ts`
- `backend/app/api/recipes/modify/route.ts`
- `backend/app/api/recipes/route.ts`
- `backend/app/api/vision/route.ts`
- `backend/lib/ai/gemini.ts`
- `backend/lib/mobile/ai-lifecycle-concurrency.test.cjs`
- `backend/lib/mobile/ai-lifecycle.test.sql`
- `backend/lib/mobile/ai.ts`
- `backend/lib/mobile/database-concurrency.test.cjs`
- `backend/lib/mobile/database-security.sql`
- `backend/lib/mobile/durable-daily-cap.test.sql`
- `backend/lib/mobile/maintenance-schedule.example.json`
- `backend/lib/mobile/provider-error.ts`
- `backend/lib/mobile/provider-usage.ts`
- `backend/lib/mobile/security.test.cjs`
- `backend/lib/mobile/verify-database.cjs`
- `backend/supabase/migrations/20261017000200_mobile_ai_lifecycle.sql`
- `mobile/src/app/(app)/cook.tsx`
- `mobile/src/app/(app)/scan.tsx`
- `mobile/src/app/_layout.tsx`
- `mobile/src/components/release/ai-recovery.tsx`
- `mobile/src/lib/api.ts`
- `mobile/src/lib/release/ai-error.ts`
- `mobile/src/lib/release/ai-recovery.ts`
- `mobile/src/lib/release/messages.ts`
- `mobile/src/lib/release/storage.ts`
- `mobile/tests/ai-recovery-ui.test.tsx`
- `mobile/tests/ai-recovery.test.ts`
- `mobile/tests/api.test.ts`
- `mobile/tests/scan-menu.test.tsx`

Bu liste tur başlangıcı hashlerine göredir; daha önceki kullanıcı değişiklikleri bu tura mal edilmez. Bu kaynaklara ek olarak ilgili MD ve kanıt dosyaları güncellendi.
