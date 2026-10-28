# Chef-AI — Backend

Bu dizin `chef-ai` uygulama reposunun sunucu bölümüdür. Mobil istemci kardeş `../mobile/` dizinindedir; tanıtım sitesi ayrı `chef-ai-web` reposundadır.

## Çalıştırma

Bu dizinde:

```sh
npm ci
npm run env:check
npm run dev -- --hostname 127.0.0.1 --port 3000
```

Mevcut özel `.env.local` staging anahtarlarıyla birlikte buraya taşındı (0600, Git dışında). Dosyayı şablonla ezme. Root/mobile dosyalarına sunucu anahtarı kopyalama. İlk kurulumda `.env.example` alanları staging değerleriyle özel `.env.local` içinde doldurulur.

- `app/api`: mobil API endpoint'leri; yollar ve auth davranışı değişmedi.
- `lib/ai`, `lib/supabase`, `lib/mobile`: AI, veri ve güvenlik katmanları.
- `supabase`: migration'lar ve henüz etkinleştirilmemiş branded SMTP şablonları.
- `app/recipe`: mevcut public recipe işlevi; özel tarifleri herkese açmaz.
- `docs`: güncel mimari, tarihsel taşımalar ve doğrulama kanıtları.

## Dağıtım sınırı

Mobil ve backend aynı Git reposunda olsalar da bağımsız çalışır ve yayınlanır. Mobil backend dosyalarını import etmez. Hosted staging **https://chef-ai-staging-nu.vercel.app** adresinde önceki artefaktla devam eder. Bu taşıma build/deploy/push yapmaz; mevcut APK aynı adrese gider.

Ignored `.vercel/project.json` mevcut staging projesine aittir. Sonraki yetkili CLI deploy'u bu dizinden yapılır. Git ile monorepo deploy bağlanırsa Vercel Root Directory `backend` olmalıdır; bu oturumda remote bağlantı/ayar değiştirilmedi. Staging config cron kapalıdır; production ayrı onay ve doğrulama gerektirir.

Backend'in bağımlılıkları/lock dosyası mobile'den ayrıdır; ortak root npm workspace kullanılmaz. API, veritabanı, yasal/SMTP, DAST, native/beta/mağaza yayın engelleri taşımayla kapanmış sayılmaz.

[Güncel mimari](docs/MONOREPO.md) · [AI işletimi](lib/mobile/AI_OPERATIONS.md) · [Önceki üç repo ayrımı, tarihsel](docs/REPOSITORY_SPLIT.md)


## Yerel kapanış — 16 Ekim 2026

Sınırlı JSON/tarih/sayısal alan doğrulaması ve temizlik ayarlarında fail-closed kontrolü eklendi. 41 API regresyonu geçti. `npm run test:database` açıkça belirtilen özel yerel PostgreSQL socket ile yedi migration, concurrency ve sentetik backup/restore doğrular; uzak DB kabul etmez. CI aynı provayı içerir; uzaktan çalıştırılmadı. Gerçek production backup/deploy değildir. Ayrıntı: [Mühendislik kapanışı](../mobile/docs/ENGINEERING_CLOSEOUT_2026-10-16.md).


## Bağımlılık güvenliği son güncelleme — 16 Ekim 2026

Backend braces zinciri kaldırıldı: Tailwind/PostCSS4.3.3 ve Next root-glob için scoped tinyglobby0.2.17 + hash kontrollü absolute-path uyumluluk düzeltmesi. Temiz npm ci ve42 test, TypeScript/lint geçti; tam raw audit0. Build/deploy yapılmadı. Public recipe son görsel kabulü açık. Ayrıntı: [Güvenlik düzeltmesi](../mobile/docs/DEPENDENCY_REMEDIATION_2026-10-16.md).
