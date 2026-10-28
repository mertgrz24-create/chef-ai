> Güncel mimari: mobil `chef-ai/mobile/`, API ve sunucu `chef-ai/backend/`; aynı Git reposunda, bağımsız uygulamalar. Tanıtım ayrı `chef-ai-web` reposunda. Önceki üç repo ayrımı kayıtları tarihsel; `backend/docs/MONOREPO.md` geçerlidir.

# AI 503 düzeltmesi — 16 Ekim 2026

## Sonuç

Staging API üzerinde **13 gerçek HTTP kabul kontrolü geçti**. Tarif üretimi, gerçek yemek fotoğrafı analizi ve yedi günlük plan oluşturma mevcut staging APK'sı için açıldı. API yapılandırması `ai=true` ve `localizedAi=true` döndürüyor. Billing, push ve analytics kapalı kalıyor.

- API: https://chef-ai-staging-nu.vercel.app
- Ayrı staging Supabase: `vcyqtbzhfanbpclfhibv`.
- Dağıtım: `dpl_GovLsMia88j1dCSkmUS2zpVTgMJ5`, sunucu bölgesi `bom1`.
- Model: sunucuda açıkça seçilen `gemini-3.5-flash-lite`.
- **Yeni APK/IPA/AAB, native CI veya mobil build alınmadı.** Backend staging güncellendi; müşteri production API/veritabanı değiştirilmedi.

## Kaynak ve düzeltme

Doğrudan sağlayıcı kontrolü ile hosted loglar, önceki modelin Google `503 UNAVAILABLE / high demand` yanıtını doğruladı. Anahtar geçerliydi; model listesi çalışıyordu. Güncel modeller karşılaştırıldı. Flash-Lite tam tarif, görüntü ve plan isteklerinde başarılı oldu; ilk hosted çalışmalarda yine aralıklı kapasite hatası gözlendi.

- Staging seçimi `gemini-3.1-flash-lite` → `gemini-3.5-flash-lite` değiştirildi; aynı Google sağlayıcısı ve mevcut sahip anahtarı kullanılıyor. Ücretli plan veya yeni hesap açılmadı.
- Dört yapılandırılmış üretici JSON MIME çıktısı istiyor. Boş tarif/öğün/plan metni başarılı yanıt olarak dönmüyor. Fotoğrafta gıda yoksa boş malzeme listesi hâlâ geçerli.
- Yalnız staging'de `GEMINI_RETRY_503=true`: sağlayıcının açık 503 yanıtından sonra 2–3 saniye bekleyerek **bir** ek çağrı yapılabilir. Toplam süre 110 saniye. Kota, ağ belirsizliği ve timeout tekrarlanmıyor; ikinci hata tekrar döngüsü başlatmıyor. Production varsayılanı değişmedi.
- Tek mevcut AI işlem/idempotency kaydı korunuyor; provider başarısından sonra uygulama verisi bir kez kaydediliyor. API replay kontrolü aynı içeriği tekrar üretmeden döndürüyor.
- Önceki güvenli hata kodları ve izin/kota kontrolleri korunuyor. Sonuç uydurulmadı, fixture yanıtı kullanılmadı.

Günlük sınır uygulama işlemlerini sayar; toparlanma açıkken bir işlem en fazla iki sağlayıcı çağrısı yapabilir. Hesap silme ile job satırlarının silinmesine bağlı kalıcı maliyet sayacı eksikliği production için hâlâ açık; bu çalışma onu kapatmış sayılmaz.

## Geçen canlı kontroller

1. AI aktarım izni yokken üretim reddi.
2. Sürümlü iznin gerçekten kaydı.
3. İngilizce yapılandırılmış tarif üretimi (~10 sn).
4. Aynı istek kimliğiyle aynı sonucun tekrar okunması.
5. Üretilen tarifin kullanıcıya özel kaydı.
6. Tekrarlanan kayıtta aynı kayıt ID'si.
7. Yeni giriş oturumundan tarif geçmişini okuma.
8. İçerik bildiriminin veritabanında doğrulanması.
9. Türkçe tarif üretimi (~6 sn).
10. Google'ın kamuya açık yemek fotoğrafının yüklenmesi ve görünür gıdaların bulunması (~11 sn).
11. Yedi günlük plan üretimi ve veritabanından yeniden okuma (~19 sn).
12. Tek akşam öğününün yenilenmesi (~20 sn).
13. AI izni geri çekildikten sonra üretimin tekrar reddi.

Kontrol kendi sentetik hesabını oluşturup sonunda sildi. Mevcut kullanıcının hesabı ve test verileri etkilenmedi. İlk replay kontrolündeki JSONB alan sırası farkı, testte derin nesne eşitliği kullanılarak düzeltildi; bu bir backend veri kaybı değildi. Diğer ilk hosted çalışmadaki 503 başarısızlık kanıtı saklanıyor; başarılı son çalışma bunları tarihsel olarak geçersiz kılmaz.

## Diğer doğrulamalar ve sınırlar

- API: 36 güvenlik/regresyon testi ve TypeScript geçti. Lint: 0 hata, önceden mevcut 4 uyarı.
- Sınırlı 503 tekrarının koşulları, iki çağrı sınırı, ortak zaman bütçesi ve production'da kapalı olması birim testinde doğrulandı. Son canlı çalışmanın belirli bir isteğinde tekrar mekanizmasının devreye girdiği iddia edilmiyor.
- Gitleaks: API131/mobil181 kaynak dosyası ve yerel Git geçmişinde 0 bulgu. Geçici teşhis anahtar dosyaları temizlendi. Ignore edilen ortam dosyaları ve native çıktılar bu kaynak taramasının dışında. Authenticated DAST ve bağımsız güvenlik incelemesi açık.
- Bu, gerçek API doğrulamasıdır; fiziksel kamera/galeri etkileşimi, native ekranların görsel kontrolü, ikinci cihaz, gerçek SMTP, abonelik, push ve mağaza yayın kabulü yerine geçmez.
- Sağlayıcı gelecekte tekrar kapasite hatası verebilir. İki çağrı da başarısızsa hata gösterilir; sınırsız tekrar veya sahte başarı yoktur.

## Telefonda deneme

Mevcut staging uygulamasını tamamen kapatıp yeniden aç. Giriş yaptıktan sonra AI aktarım açıklamasını inceleyip onayla. Cook'ta tarif üret, Scan'de gıda fotoğrafını önizleyip analizi onayla ve Meal Plan'da haftalık planı oluştur. Yeni APK yüklemene gerek yok. Kontrollü staging verisi kullan; yeni model/erişim production yayını anlamına gelmiyor.

Kanıt: `mobile/security/staging-ai-recovery-2026-10-16.json`. API işletim ve tekrar rehberi: `backend/lib/mobile/AI_OPERATIONS.md`.

Kaynaklar: [Google hata rehberi](https://ai.google.dev/gemini-api/docs/troubleshooting), [güncel modeller](https://ai.google.dev/gemini-api/docs/models), [JSON çıktısı](https://ai.google.dev/gemini-api/docs/structured-output).


## Repository ownership update — 2026-10-16

The active API, migrations, server dotenv and operational documents now live in `chef-ai/backend/`. `chef-ai-web` is marketing only. Earlier results describe their original context; repository relocation is not a new deployment, build, DAST scan or release approval. Existing hosted staging URL and installed APK remain unchanged. See backend `docs/REPOSITORY_SPLIT.md`.
