# Yerel geliştirme — mobil ve backend aynı repoda

## Güncel dizinler

| Konum | Sorumluluk ve ortam |
|---|---|
| `chef-ai/mobile/` | Expo istemci, kendi package/lock dosyaları; `.env` yalnız public staging ayarları |
| `chef-ai/backend/` | Mobil HTTP API, kendi package/lock dosyaları; `.env.local` yalnız sunucu anahtarları |
| `chef-ai-web/` | Ayrı tanıtım reposu; mobil API veya sunucu anahtarları içermez |

Root'ta npm workspace/hoisting yok. Kurulumlar ve komutlar ilgili uygulama dizininde çalıştırılır. Mobil backend dosyalarını import etmez; yalnız HTTP ile bağlanır.

## Mobil

`mobile/` içinde `npm ci`, `npm run env:check`, `npm start` kullanılır. Bu taşıma için Metro veya native build başlatılmadı.

- `EXPO_PUBLIC_APP_ENV=staging`.
- Supabase: `https://vcyqtbzhfanbpclfhibv.supabase.co`.
- Varsayılan API: `https://chef-ai-staging-nu.vercel.app`.
- Gemini/service-role anahtarı mobil pakete girmez.
- Mevcut yerel guard yanlış proje/rol, production ile karışık ayarlar veya public sunucu sırrını reddeder.

## Backend

Gerçek ayar dosyası: `/Users/mertgurbuz/chef-ai/backend/.env.local`. Mevcut staging Supabase service-role ve yeni Gemini anahtarı buraya taşındı. Dosya0600 ve Git dışında. Değerleri root/mobile içine kopyalama, sohbete/rapora yazdırma veya şablonla ezme.

`backend/` içinde:

```sh
npm ci
npm run env:check
npm run dev -- --hostname 127.0.0.1 --port 3000
```

Sunucu zaten açıksa ikinci örnek başlatma. Yerel API hosted API'ye proxy yapmaz; staging Supabase ve Google Gemini'ye doğrudan bağlanır. Aynı staging verisi ve sağlayıcı kotası paylaşılır. AI/TR açık; ödeme, push, analytics ve cron kapalıdır. `/api/mobile/config` JSON yapılandırmasıdır, mobil UI değildir.

Mobil varsayılanını değiştirmeden, özel yerel denemede API adresi iOS simülatörü/web için `http://127.0.0.1:3000`, Android emulator için `http://10.0.2.2:3000` seçilebilir. Fiziksel telefonun localhost'u Mac değildir. Development API yalnız loopback'e bağlıdır; mevcut APK'nın hosted adresi değişmedi. Tarayıcı istemcilerinin CORS/izin davranışı ayrıca doğrulanmalıdır.

## Yayın ve yedekler

Bu taşıma **yeni build, deploy, remote push veya native CI çalıştırması yapmadı**. Mevcut hosted staging önceki artefaktla çalışır. Production'a dokunulmadı. İleride Vercel Git deploy'u monorepoya bağlanırsa Root Directory `backend`; Expo/EAS/native çalışma dizini `mobile` olmalıdır. Remote ayarlar bu oturumda değiştirilmedi.

Eski standalone backend klasörü artık yok; `.git` geçmişi özel `~/.config/chef-ai/repository-split-backups/backend-history-*/git` yedeğinde, eski GitHub reposu tarihsel snapshot olarak korunur. Aktif kaynak `chef-ai/backend/` dizinidir. Eski production dotenv dosyaları ayrı `~/.config/chef-ai/env-backups/` arşivinde kalır ve geliştirme ortamına geri yüklenmez.

## Kanıt

Önceki bağımsız API turunun 16 entegrasyon kontrolü ve sonraki repo ayrımının 36 güvenlik / 8 entegrasyon kontrolü tarihsel kanıttır; bu fiziksel taşıma için tekrar çalıştırılmış sayılmaz. Güncel taşıma kaynak hash'leri, ortam/HTTP/sır kontrolleri `mobile/security/monorepo-layout-2026-10-16.json` ve `backend/docs/monorepo-transfer-2026-10-16.json` içinde. Ayrıntı: `backend/docs/MONOREPO.md`. DAST/native/beta/mağaza kapıları önceki durumlarıyla devam eder.
