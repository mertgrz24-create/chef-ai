# Onaylı tekrar kullanım turu — 17 Ekim 2026

**Sonraki onaylı çalışma:** Ertelenen E kuralları ve dispatch sayaç açığı yerel kaynakta tamamlandı. Güncel kanıt/sınırlar: [AI yaşam döngüsü](AI_LIFECYCLE_2026-10-17.md). Bu belgedeki önceki bekleme/onay durumu tarihsel kalır; uzak migration/deploy yapılmadı.

## Kapsam ve teslim durumu

A–D ve E'nin yalnız kota görünürlüğü kaynak kodunda tamamlandı. Mevcut krem/yeşil/lime arayüz, beş sekme, güvenlik yamaları, bağımlılıklar ve onaylı kullanım limitleri korundu. Tanıtım sitesi değiştirilmedi. Mobil/backend aynı repoda, bağımsız paketlerdir.

Yeni build, OTA, deploy, push, uzak migration, ücretli servis veya gerçek sağlayıcı çağrısı yapılmadı. Telefonda bulunan eski Expo57 APK bu Expo58 kaynak değişikliklerini içermez. Kaynak ve yerel sentetik test başarısı cihaz/staging/yayın kabulü değildir.

## Ayrı aşama sonuçları

| Aşama | Uygulama | Kanıt ve sınır |
|---|---|---|
| A — Başlangıç/güvenlik | Mevcut kaynak ve güvenlik tabanı kaydedildi; paket/lock/yama dosyaları değişmedi | Başlangıç 99 mobil +17 bağımlılık +43 backend testi. Son npm audit iki pakette 0. |
| B — Mevcut içerikten öneri | Son20 özel tarif + mevcut haftanın planı + kiler; en fazla3 deterministik aday | TR/EN isimler, süt/badem sütü ayrımı, belirsiz miktar, tarih, sıfır eşleşme, süre, dedup ve gün/hafta sınırları test edildi. |
| C — Today/detay/güncellik | Ortak RecipeTicket/RecipeActions; hesap kapsamlı bellek deposu; filtreler yerel | Gerçek Today bileşeni AI açıkken yalnız3 okuma yapıyor. Filtre/detay/geri dönüş yeni okuma veya AI başlatmıyor. AI hakkı sıfırken de mevcut içerik açık. |
| D — Kiler düzenleme | Ad/miktar/tarih, serbest ISO tarih, revision ile atomik PATCH | Yerel PostgreSQL'e bağlanan gerçek route'a aynı revision ile paralel iki istek: 200 ve409. Sonuç revision1 ile tekrar okundu. Uzak migration uygulanmadı. |
| E — Kota görünürlüğü | Cook/Scan/Plan/Profile mevcut sunucu haklarını ödeme kapalıyken de okur | Eksik/hatalı yanıt sıfır/sınırsız gösterilmez. Miktarlar uydurulmadı. Yeni kota veya rezervasyon politikası yok. |
| E — Belirsiz işlem yaşam döngüsü | Uygulanmadı, ayrı onay bekliyor | Timeout, kilit, iade/sonuçlandırma, durum endpoint'i ve temizlik davranışları değiştirilmedi. |
| Sağlayıcı ölçümü | Var olan tüm Gemini girişleri ve var olan503 tekrarı gözlemlenir; yerel metadata özeti | Sahte SDK ile test edildi, gerçek AI çağrısı0. Her dispatch ölçülüyor; genel sayaç kapsamı aşağıdaki nedenle henüz kabulü karşılamıyor. |

## Kullanıcıya gösterilen doğruluk sınırları

- Süre için hem hazırlık hem pişirme verisi gerekir. Bilinmeyen süre0 değildir. “Süre bilgisi yok” ve “30 dakika altında sonuç yok” ayrı durumdur.
- Dolap filtresi, dolu kilerde sıfır eşleşmeyi uygun öneri saymaz. Hızlı filtrede sıfır eşleşen adayın kiler uyumu olduğu iddia edilmez.
- İsim eşleşmesi yeterli miktar veya güvenli tüketim garantisi değildir. Mevcut uygulamanın bugün ve öncesini geçmiş sayan tarih kuralı korunur.
- Kaydedilmiş tariflerde süre saklanmıyorsa süre uydurulmaz. Aynı içerik plan içinde doğrulanmış süreyle varsa o aday kullanılır.
- Son20 kayıt sınırı ve mevcut hafta kapsamı açıkça yazılır. Güncel plan bulunamazsa eski hafta güncel gibi gösterilmez. Mevcut sunucu/cihaz hafta sınırı farkında konservatif dışlama uygulanır.
- Hatalı kaynak boş veri gibi sunulmaz; eldeki içerik korunur. Disk cache'i veya çevrimdışı yazma kuyruğu eklenmedi.

## Güncellik ve izolasyon

Kiler ekle/sil/düzenle; Scan'den kısmen başarılı eklemeler; onaylanmış tarif kaydı; tüm plan üretimi ve tek öğün yenileme ilgili bellek verisini geçersizleştirir. Başarıdan önce kayıt başarılı sayılmaz. Görünür ekrana dönüşte okumalar yenilenir. Gün/hafta değişimi timer ve uygulama etkinleşmesinde denetlenir; filtre değişimi indirme başlatmaz.

Testler store invalidation, gün/hafta geçişi, gerçek kaydetme bileşeni, Scan/plan yenileme bağlantıları, bekleyen cevabın eski generation'a yazamaması, eski hesabın yanıtının yeni hesaba taşınmaması, PATCH auth/owner ve yerel RLS okuma/yazma izolasyonunu kapsar. Gerçek cihaz/ikinci cihaz testi yapılmadı.

## Mevcut bileşen ve API tekrar kullanımı

- API: GET /api/pantry, GET /api/recipes/history, GET /api/meal-plan, GET /api/billing/status. Mevcut ekleme/silme, özel tarif kaydetme ve plan üretme uçları korunur.
- UI: RecipeTicket, RecipeActions, Field/Chip/Button/Notice ve mevcut tema/çeviri altyapısı kullanılır. Yeni ana sekme veya öneri servisi yok.
- Yeni HTTP yüzeyi yalnız PATCH /api/pantry/:id; yeni şema yalnız pantry.revision ve artış trigger'ıdır. Aktif şema sahibi backend/supabase'dir.
- Uzak sunucuda revision yoksa GET eski alanlarla çalışır; düzenleme açık gerekçeyle devre dışı kalır. Mutasyon için sessiz fallback/tekrar yok.

## Test sonuçları

- Mobil: 119 test /17 suite; ayrıca17 gerçek bağımlılık güvenlik regresyonu. TypeScript ve lint geçti.
- Backend: 51 güvenlik/API/ölçüm testi; TypeScript ve lint geçti.
- İzole yerel PostgreSQL: 8 migration,6 kontrol grubu, gerçek paralel PATCH, RLS, roller, kotalar, cascade ve sentetik backup/restore geçti. Bu production yedek provası değildir. Test veritabanları temizlendi ve geçici PostgreSQL sunucusu durduruldu.
- Sır/ortam şablonu3 ve artifact denetleyicisi4 testi geçti. Denetleyici birim testi yeni native artifact doğrulaması değildir.
- npm audit: mobil0/backend0. Gitleaks kaynak/geçmiş0; tarama kapsamı kanıt JSON'unda.
- Snyk bu tur yeniden çalışmadı; geçmiş temiz raporlar yeni tarama sayılmadı. HawkScan6.6.0 ön kontrolü yapıldı; API anahtarı/oturum olmadığından DAST çalışmadı. Bunlar yayın kapısı olarak açık.

## Açık kabul açığı: gerçek sağlayıcı denemeleri genel sınırda değil

Mevcut staging'e özel503 kurtarması açıkken bir mantıksal iş iki sağlayıcı çağrısı yapabilir. Yeni ölçüm her ikisini kaydeder; mevcut begin_mobile_ai günlük sayacı yalnız bir rezervasyon sayar. Test bunu2 dispatch/1 rezervasyon olarak yeniden üretti. Testin geçmesi bu davranışın doğrulandığı anlamındadır; istenen genel deneme sınırının karşılandığı anlamına gelmez.

Yeni retry eklenmedi, mevcut retry/timeout ve SQL sayaç politikaları değiştirilmedi. Her gerçek dispatch'in aynı onaylı sayısal genel sınıra dahil edilmesi, ertelenmiş E aşamasında açık sözleşme/onayla ele alınmalıdır. Bu açık kapatılmadan maliyet kontrolü tamamen bitti denemez.

Ölçüm içerik/kimlik/anahtar taşımayan metadata logudur; kalıcı fatura defteri değildir. Eksik token, fiyat ve gerçek ücret null/bilinmiyor kalır. Sağlayıcı toplam token değeri tahminle toplanmaz. Log taşınmasındaki tekrarlar job+attempt ile yerel özette ayıklanır; yarım kalan kayıtlar bilinmeyen olarak sayılır. Barındırma loglarının saklama süresi/eksiksizliği doğrulanmadı.

## Ayrı onay gerektiren E kararları

Mevcut kodun10 dakikalık pending kilidi ve24 saatlik iş sonlanma alanı yeni ürün kararı değildir ve bu tur değiştirilmedi. Aşağıdakiler netleşip ayrıca onaylanmadan davranış değişmeyecek:

1. Sonucu belirsiz iş için azami bekleme ve kullanıcıya gösterilecek durumlar.
2. Kilidin ne zaman/nasıl bırakılacağı; geç gelen sonuç ve mükerrer sonucun yönetimi.
3. Süre sonunda sonuç bulunamazsa hakkın bekletilmesi, bir kez iadesi veya tüketilmiş sayılması.
4. İş/sonuç/ölçüm kayıtlarının saklama ve temizlik kuralları; silme ile sayaç sürekliliği.
5. Var olan retry dahil her sağlayıcı dispatch'inin genel sınırdan atomik düşülmesi; hakkı kalmadığında dispatch yapılmaması.

Scan/Premium için yeni sayısal kota seçilmedi. Uzak migration, native kabul ve yayın bu onaydan bağımsız olarak da ayrıca izin gerektirir.

## Bu tur değişen kaynak dosyaları

Liste, tur başlangıcındaki hash tabanına göre hazırlanmıştır; daha önceki kaydedilmemiş çalışmalar bu tura mal edilmez. Aşağıdaki dosyalara ek olarak bu rapor, API/operasyon belgeleri, PROGRESS ve kanıt JSON'u güncellendi.

- `backend/app/api/pantry/[id]/route.ts`
- `backend/app/api/pantry/route.ts`
- `backend/lib/ai/gemini.ts`
- `backend/lib/mobile/ai.ts`
- `backend/lib/mobile/pantry-concurrency.test.cjs`
- `backend/lib/mobile/pantry-revision.test.sql`
- `backend/lib/mobile/provider-usage.ts`
- `backend/lib/mobile/security.test.cjs`
- `backend/lib/mobile/summarize-provider-usage.cjs`
- `backend/lib/mobile/test-schema.sql`
- `backend/lib/mobile/verify-database.cjs`
- `backend/supabase/migrations/20261017000100_pantry_revision.sql`
- `mobile/src/app/(app)/cook.tsx`
- `mobile/src/app/(app)/index.tsx`
- `mobile/src/app/(app)/meal-plan.tsx`
- `mobile/src/app/(app)/pantry.tsx`
- `mobile/src/app/(app)/profile.tsx`
- `mobile/src/app/(app)/scan.tsx`
- `mobile/src/app/_layout.tsx`
- `mobile/src/components/release/pantry-editor.tsx`
- `mobile/src/components/release/quota-status.tsx`
- `mobile/src/components/release/recipe-actions.tsx`
- `mobile/src/components/release/recommendations.tsx`
- `mobile/src/lib/api.ts`
- `mobile/src/lib/release/contracts.ts`
- `mobile/src/lib/release/kitchen-data.tsx`
- `mobile/src/lib/release/kitchen-store.ts`
- `mobile/src/lib/release/messages.ts`
- `mobile/src/lib/release/recommendations.ts`
- `mobile/src/lib/release/state.tsx`
- `mobile/src/lib/types.ts`
- `mobile/tests/quota-state.test.tsx`
- `mobile/tests/recommendation-flow.test.tsx`
- `mobile/tests/recommendations.test.ts`
- `mobile/tests/scan-menu.test.tsx`
