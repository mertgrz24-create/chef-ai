# Yayın hazırlığı — yerel mühendislik kapanışı, 16 Ekim 2026

Bu kayıt önceki kronolojik notların son durum özetidir. Kullanıcıdan yeni bilgi veya hesap erişimi istemeden yapılabilen kaynak düzeltmeleri ve yerel kontroller tamamlandı. **Production/yayın onayı değildir.** Yeni build, deploy, uzak CI, push veya ücretli servis başlatılmadı. Mevcut APK ve hosted staging artifact'i bu tur değişmedi.

## Ortam dosyaları

İki `.env.example` doğrudur: `mobile/.env.example` yalnız public istemci ayarları, `backend/.env.example` yalnız sunucu çalıştırma şablonudur. Gerçek anahtar içermezler; tek dosyada birleştirilmezler. Eski tanıtım sitesi API adresini öneren yorum kaldırıldı. Yeni `scripts/check-environment-templates.cjs` tekrar eden değişkenleri, mobile taşınmış sır alanlarını, dolu kimlik bilgilerini, farklı staging projelerini ve yanlışlıkla açılmış yayın yeteneklerini reddeder. Gerçek dotenv dosyalarını okumaz. Ayrı kurulumlar ve HTTP sınırı korunur.

## Bu tur tamamlanan kaynak işleri

- Pantry, Profile, Referral, Meals Eaten, Recipes, Recipe Modify ve günlük plan yenileme girişleri ortak sınırlı JSON okuyucusuna taşındı. 64 KB sınırı ve nesne doğrulaması kontrolsüz gövde tüketimini önler.
- Pantry ad/miktar uzunluğu ve gerçek takvim tarihi doğrulanır. Profile sayısal hedefleri sonlu, pozitif ve veritabanı sütununa uygun aralık/hassasiyetle sınırlandırılır.
- Bakım/temizlik ayarı eksik veya geçersizse veritabanı silme işlemlerine başlamadan hata döner. Hatalı ayarla kısmi temizlik yapılmaz.
- Sentry olayları izinli teknik alanlardan yeniden oluşturulur. Bilinmeyen SDK alanları, ek dosyalar, thread verileri, serbest metin, kullanıcı/istek içerikleri, etiketler, breadcrumb ve exception mesajları gönderilmez. Koleksiyonlar sınırlandırılır; kod yollarındaki sorgular ve kullanıcı dizinleri kaldırılır. Debug kimlikleri korunur. Gerçek native symbolication için Sentry projesi ve release cihaz testi hâlâ gerekir.
- Yeni yerel veritabanı doğrulayıcısı yalnız açıkça belirtilen özel Unix socket üzerinde, kendi oluşturduğu geçici veritabanlarında çalışır; uzak bağlantıyı reddeder. Yedi güvenlik migration'ı temiz sentetik şemaya uygulanır; RLS/roller/kota/silme/concurrency/push tekrar koruması kontrol edilir. Sentetik yedek ikinci geçici veritabanına geri yüklenir; veri ve erişim garantileri tekrar kontrol edilir. Yedek ve iki veritabanı temizlenmeden başarılı kanıt yazılmaz.
- Backend CI'ya aynı geçici PostgreSQL ve yedek/geri yükleme provası eklendi. Ubuntu 24.04 sabitlendi. Secrets CI'ya ortam şablonu kuralları ve regresyonları bağlandı. YAML yerelde ayrıştırıldı; GitHub'da çalıştırılmadı. Audit adımı başarısızlığı gizlemeye devam etmez: mevcut sürüm uyarıları pipeline'ı hâlâ durdurur.
- Kurulu doğrudan runtime SDK sürüm/lisans envanteri üretildi. Bu dosya tam transitif SBOM, hukuki lisans onayı veya mağaza gizlilik beyanı değildir.

## Çalıştırılan kontroller ve sınırları

| Kontrol | Sonuç | Sınır |
|---|---|---|
| Mobil Jest | 97 test / 14 suite geçti | Mock/component; fiziksel cihaz değildir |
| Mobil bağımlılık regresyonu | 15 geçti; yama bütünlüğü geçti | Upstream sürüm uyarısını veya bağımsız incelemeyi kapatmaz |
| Backend API güvenliği | 41 geçti; yama bütünlüğü geçti | Yerel sözleşme/regresyon; DAST değildir |
| Migration/geri yükleme | 7 migration, 5 kontrol grubu geçti | Yalnız sentetik yerel fixture; gerçek production yedeği değildir |
| Secrets/şablon regresyonu | 3 geçti | Gerçek yerel ignored dotenv dosyalarını tarama kapsamına eklemez |
| Android ELF denetleyicisi | 4 test geçti | Yeni APK/ABI/16 KB artifact kabulü değildir |
| TypeScript | Mobil ve backend geçti | Native derleme değildir |
| Lint | Mobil temiz; backend 0 hata / 4 mevcut uyarı | Stil uyarıları geçmiş kaynakta durur |
| Expo uyumluluğu | `expo install --check` geçti | Native servislerin gerçek testinin yerine geçmez |
| Secrets | Gitleaks 8.30.1, kaynak/geçmiş 0 bulgu | Yalnız yerelde bulunan Git refs, tracked ve ignored olmayan untracked dosyalar |
| CI dosyaları | Dört workflow YAML olarak ayrıştırıldı | Remote runner kanıtı yok |

En son registry audit: **mobil 53 yüksek / 5 orta (58), backend 7 yüksek; 0 kritik**. Önceki 56 yüksek sayısından değişim yeni bir kaynak düzeltmesi olarak sayılmadı; veritabanındaki advisory/üst bağımlılık yayılımı değişebilir. Kök uyarılar ve yerel yamalar ayrıca değerlendirilmelidir. Sürüm numarası uydurulmadı, ignore/severity düşürme veya audit-force yapılmadı. Güvenlik yayın kapısı **açık**.

HawkScan skill yeniden incelendi, CLI 6.6.0 ve skill güncelliği doğrulandı. API anahtarı yok; kullanıcı ücretli kurulumu reddetti. Kimlik doğrulamalı DAST yapılmadı ve bu sonuçlar DAST yerine sunulmaz. Bağımsız yama incelemesi ve uygun upstream düzeltme/uyumlu değişim hâlâ gerekir.

## Kanıtlar

- [Toplu kontrol özeti](../security/engineering-closeout-2026-10-16.json)
- [Secrets](../security/engineering-secrets-2026-10-16.json)
- [Sentetik veritabanı/restore](../security/database-rehearsal-2026-10-16.json)
- [Doğrudan SDK/lisans envanteri](../security/sdk-inventory-2026-10-16.json)
- [Mobil raw audit](../security/engineering-mobile-audit-2026-10-16.json), [backend raw audit](../security/engineering-backend-audit-2026-10-16.json)

## Operasyon ve son kabul

`release-evidence.json` içindeki 24 kapı pending kalır: gerçek entegrasyon, production, bağımsız güvenlik ve son native artifact kanıtı eksiktir. Bu sayı 24 kod özelliğinin eksik olduğu anlamına gelmez. Önceki kamera/haftalık plan kaynak düzeltmeleri bu kaynak setindedir; kurulu APK'ya kendiliğinden geçmez.

Yeni erişimler geldiğinde teknik devam sırası: güvenlik incelemesi → yayıncı/domain/SMTP/yasal sayfalar → mağaza/RevenueCat → Sentry/push → production veri ve AI operasyonları → kullanıcı yeni build ve kontrollü deploy'a izin verdikten sonra final cihaz/beta/mağaza kabulü. Opsiyonel ürün analitiği kapalı kalabilir; gerçek alıcı olmadan gönderilmiş sayılmaz.

Gerçek production restore çalışması için: onaylı şifreli hedefe erişimi sınırlı yedek al; kullanıcıya hizmet vermeyen izole hedefe geri yükle; sayım/bütünlük/RLS/roller/fonksiyonlar/oturum ve hesap silme sonuçlarını doğrula; geri dönüş süresi ve veri kaybı toleransını kaydet; prova verilerini saklama politikasına göre temizle. Yerel fixture bu işlemin kanıtı olarak kullanılamaz. Migration production'a otomatik uygulanmaz.

Kullanıcıdan beklenenlerin tek listesi: [OWNER_ACTIONS.md](OWNER_ACTIONS.md). Kullanıcının migration veya CI kodu yazması gerekmiyor; erişim ve kararlar geldiğinde teknik adımlar buradan sürdürülebilir.

### Referanslar

- [Sürümlenmiş Expo SDK 57](https://docs.expo.dev/versions/v57.0.0/)
- [GitHub Ubuntu 24.04 runner envanteri](https://github.com/actions/runner-images/blob/main/images/ubuntu/Ubuntu2404-Readme.md)
- [Braces advisory](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm), [node-forge advisory](https://github.com/advisories/GHSA-86w9-cpqp-85rv), [sprintf-js advisory](https://github.com/advisories/GHSA-hp3w-g68c-fv3c)


## Daha sonraki güvenlik düzeltmesi — 16 Ekim 2026

[Son bağımlılık düzeltmesi](DEPENDENCY_REMEDIATION_2026-10-16.md): backend raw audit **0**; mobil **54 yüksek / 0 orta**. Orta uyarıların kaynağı sprintf-js ve eski YAML zinciri kaldırıldı. Yeni yüksek üst kayıt mevcut RevenueCat paketinin react-native üzerinden listelenmesi; yeni kök advisory değil. Kalan kökler braces/node-forge, yamaları testli; bağımsız inceleme/upstream/native kapıları açık. İki temiz kurulum,97 Jest + 15 bağımlılık + 42 backend testi, TS/lint/Expo geçti. Backend tek glob uyumluluk yaması, mobil15 dosya yaması var. Yeni build/deploy yok.
