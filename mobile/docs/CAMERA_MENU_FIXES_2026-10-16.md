# Kamera ve haftalık menü — 16 Ekim 2026

## Kapsam ve sınır

Mobil kaynak düzeltmeleri yapıldı. **Yeni build, deploy, push, production/DB değişikliği veya gerçek AI çağrısı yapılmadı.** Kurulu APK/IPA bu kaynakları kendiliğinden almaz; production OTA kapalı. Mevcut hosted staging AI hizmeti değişmedi.

Bu turun kontrolleri mock native modüllerle bileşen testleri ve veri sözleşmesi/regresyon testleridir. Kamera donanımı, gerçek sistem izin penceresi/Ayarlar dönüşü, Android activity yeniden oluşturma ve final native görünüm **cihazda doğrulanmış sayılmaz**. Önceki AI HTTP kabulü de bu mobil kabulün yerine geçmez.

## Kamera / Scan düzeltmeleri

- İzin durumu önce okunur; yalnız kullanıcı Fotoğraf çek eylemine bastığında ve sistem tekrar sorabiliyorsa kamera izni istenir. Kalıcı reddetmede tekrar prompt çağrılmaz; Ayarları aç ve galeri alternatifi gösterilir.
- Ayarlar dönüşünde izin tekrar okunur. Kamera kendiliğinden açılmaz. İzin sorgusu beklerken kullanıcı Scan'den ayrılırsa yeni izin penceresi/kamera başlatılmaz.
- Sistem galeri seçicisi için geniş kütüphane izni istenmez. Picker görüntü-only; EXIF/base64 istenmez. Kamera yoksa/başlatılamazsa galeriye yönlendiren hata gösterilir.
- Android activity yeniden oluşturulmuşsa `getPendingResultAsync` ile sonuç geri alınır. Bu sonuç otomatik analize gönderilmez; geç gelen eski recovery sonucu yeni manuel seçimi ezmez.
- Önizleme tam görseli `contain` ile gösterir. Image yüklenmeden Analyze photo devreye girmez; görüntüleme hatasında analiz kapalı ve görsel değiştirme/silme açık kalır. Yeni galeriden seçim iptal edilirse önceki önizleme korunur.
- Kullanıcı önizlemede Analiz et demeden normalizasyon/upload başlamaz. İşlem kilidi seri çift dokunmayı engeller. Kota reddinde analizi tekrarlatmak yerine elle malzeme ekleme yolu gösterilir.
- Ekran unmount olduğunda upload iptal edilir. Normalizasyon geç tamamlanırsa dosya temizlenir ve upload başlatılmaz. Picker cache kopyaları/normalize geçici dosyalar temizlenir; kaynak galeri dosyası temizlenmez.
- Yeni izin/önizleme/kota geri bildirimlerinin TR/EN metinleri merkezi sözlüğe alındı.

Kaynaklar: `src/app/(app)/scan.tsx`, `src/lib/api.ts`, `src/lib/release/messages.ts`.

## Haftalık menü düzeltmeleri

- Türkçede loading kimliği çevrilmiş gün adından üretiliyordu; istekten gelen `monday-breakfast` ile eşleşmiyor, ilgili öğünde busy göstergesi çıkmıyordu. İşlem kimliği artık dil bağımsız; yalnız görünür metinler çevrilir. Kahvaltı/akşam yemeği ve erişilebilirlik etiketleri çevrildi.
- İlk açılış çevrimdışıyken sonsuz ilk-yükleme durumu kaldırıldı. Bağlantı açıklaması gösterilir; üretim/öğün yenileme engellenir. Önceden yüklenmiş öğün ve detay okunabilir kalır. Bağlantı dönünce güvenli GET yenilenir; yazma/AI otomatik tekrarlanmaz.
- Read istekleri ekran blur/unmount veya yeni mutasyonda iptal edilir; request version eski yanıtların yeni planı ezmesini engeller. Mutasyon sırasında mevcut plan korunur; başarısızlıkta eski yemek kaybolmaz. Unmount sonrası geç yanıt yerel state'i değiştirmez.
- Günler artık bilinen enum'dan doğrulanır, tekrar/uydurma günler reddedilir ve Pazartesi–Pazar sırasına alınır. Takvim tarihi array index yerine gerçek gün kimliğinden hesaplanır; kısmi/sırasız haftalarda tarih kayması önlenir. Geçersiz takvim tarihi hata olur.
- Tüm hafta başarıyla yenilenince seçili gün ilk güne döner ve eski detay kapanır. Tek öğün değişimi mevcut gün seçimini korur. Öğün/malzeme sayıları ve süreler okunaklı boşluk/çeviriyle sunulur.
- Read hatası boş planla eşitlenmez; yalnız gerçek 404 boş durumunu açar. Backend GET /api/meal-plan kaynağı da düzeltildi: maybeSingle ile gerçekten bulunmayan plan404, DB hatası500 döner; ham hata içeriği gönderilmez. Bu düzeltme için regression testi geçti. **Yeni deploy yapılmadığından hosted staging hâlâ önceki sunucu kodundadır.**

Kaynaklar: `src/app/(app)/meal-plan.tsx`, `src/lib/release/meal-plan.ts`, `src/lib/release/contracts.ts`.

## Otomatik doğrulama

- Yeni23 kontrol:18 bileşen senaryosu (kamera/önizleme/haftalık ekran) + 5 takvim/sözleşme/işlem kimliği kontrolü.
- Tüm Jest: **95 test / 14 suite geçti**. Yeni senaryolar `tests/scan-menu.test.tsx` ve `tests/meal-plan.test.ts` içinde.
- Mevcut 15 bağımlılık/native-config güvenlik regresyonu ve 37 backend güvenlik/API testi geçti; native build yapılmadı. Backend TypeScript geçti; lint0hata/önceden mevcut4uyarı.
- `npm run lint`, `npm run typecheck` ve diff whitespace kontrolü temiz.
- Sır taraması sonucu `mobile/security/camera-menu-2026-10-16.json` içinde kaydedilir. Özel ignored dotenv, kaynak taraması kapsamına girmez.
- HAWK_API_KEY yok; kullanıcının ücretli HawkScan kurulumunu reddetme tercihi korundu. DAST yapılmış veya native kabul tamamlanmış sayılmaz.

## Yeni build'e izin verildiğinde cihaz kabulü

| Senaryo | Beklenen |
|---|---|
|iOS/Android ilk izin ve normal ret|Yalnız dokunmayla sistem prompt'u; ret sonrası galeri/yeniden deneme çalışır|
|Kalıcı ret → Ayarlar → uygulama|Ayarlar eylemi açık; dönüşte durum güncel, otomatik kamera/AI yok|
|Kamera olmayan cihaz/simülatör|Kamera hatası anlaşılır; galeriden devam edilebilir|
|Galeri iptal / HEIC / döndürülmüş/büyük/bozuk görsel|Önceki seçim korunur; doğru önizleme, açık analiz onayı ve hata/temizlik|
|Android Don't keep activities / picker sonucu|Sonuç önizlemeye döner, eski sonuç yeni seçimi ezmez|
|Analiz/normalizasyon sırasında ekran/hesap kapanması|Yeni upload/state yazımı yok; geçici dosyalar temiz; ağ belirsizliğinde mutasyon otomatik tekrar edilmez|
|TR/EN günler, öğün yenileme, detay ve tüm hafta|Doğru tarih/çeviri/busy; sadece hedef öğün değişir; hata eski planı korur|
|Uçak modu ilk açılış / yüklü plan / bağlantı dönüşü|Sonsuz spinner yok; mevcut detay okunur, yazma kapalı, dönüşte yalnız okuma yenilenir|
|Geri hareketi, küçük ekran, büyük font ve okuyucu|Detay kapanır; hedefler/etiketler ve içerik taşması cihazda kontrol edilir|

Resmi referanslar: [Expo SDK57](https://docs.expo.dev/versions/v57.0.0/), [ImagePicker ve Android pending sonuç](https://docs.expo.dev/versions/v57.0.0/sdk/imagepicker/).
