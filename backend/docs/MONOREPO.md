# Güncel mimari — 16 Ekim 2026

Kullanıcının onayladığı düzen:

```text
chef-ai/
  mobile/    Telefon istemcisi, kendi package.json ve lock dosyası
  backend/   HTTP API ve sunucu, kendi package.json ve lock dosyası
chef-ai-web/ Tanıtım sitesi, ayrı Git reposu
```

## Taşıma

Eski `/Users/mertgurbuz/chef-ai-backend` çalışma dizini, kaynak/dependency/özel staging ortamıyla birlikte `/Users/mertgurbuz/chef-ai/backend` konumuna alındı. Önceki commit'teki115 kaynak dosyası SHA-256 ile karşılaştırıldı; taşıma kaydı `monorepo-transfer-2026-10-16.json` içinde. Sonraki doküman düzenlemeleri bu eski hash'leri doğal olarak değiştirir; API/servis kodu değişmedi.

İç içe Git reposu bırakılmadı: eski backend `.git` geçmişi `~/.config/chef-ai/repository-split-backups/backend-history-*/git` altında özel kurtarma kopyası olarak korundu. Yeni `backend/` normal chef-ai kaynak dizinidir; submodule/gitlink değildir. Mevcut kullanıcı değişiklikleri ve parent Git indeksi sıfırlanmadı. Eski GitHub backend reposu silinmedi veya değiştirilmedi; tarihsel snapshot, aktif kaynak değil. Bu oturumda chef-ai/web remote push yapılmadı.

## Sunucu ve anahtarlar

- Sunucu `.env.local`: yalnız `backend/.env.local`,0600 ve Git dışında. Root/mobile altında service-role/Gemini anahtarı bulunmaz.
- API geliştirmesi bu dizinden 127.0.0.1:3000'de; tanıtım geliştirmesi ayrı repoda 3001'de çalışır.
- Mobil kendi public staging `.env` dosyasını kullanmaya devam eder. Mobil → backend bağlantısı yalnız HTTP; Metro/backend import veya filesystem runtime bağımlılığı yoktur.
- npm kurulumları ilgili dizinde yapılır. Root workspace/hoisting eklenmedi; mobil ve backend bağımlılıkları ayrı kaldı.
- Eski mutlak yolu içeren üretilmiş `.next` development cache'i yenilendi; production/native build alınmadı.

## Staging ve sonraki dağıtım

Mevcut Supabase staging projesi, callback izinleri, Gemini anahtarı/modeli ve hosted staging adresi değişmedi. Telefona hizmet veren deployment önceki artefakttır; yeni konum yayına geçti diye sunulmaz. Yeni APK/IPA/AAB, production build, deployment veya CI çalıştırması yoktur.

Sonraki yetkili CLI dağıtımının çalışma dizini `backend/` olmalıdır. Vercel Git bağlantısı ileride chef-ai monoreposuna alınırsa Root Directory `backend` olarak ayarlanmalı. Bu oturumda Git bağlantısı/Root Directory remote ayarları değiştirilmedi; build tetiklenmedi. Expo/EAS ve native CI çalışma dizini `mobile/` kalmalıdır; backend'e ihtiyaç duymaz.

## Geri dönüş ve kanıt

Hosted staging bu yerel taşıma sırasında değiştirilmedi; geri dönüş için yeni deploy gerekmez. Yerel bir sorun halinde development server durdurulup kaynak dizin kontrollü geri taşınabilir. Geçmişi kurtarmak gerekirse özel Git yedeği kullanılır; kullanıcı işlerini kaybettiren Git reset/clean kullanılmaz. Özel production dotenv arşivleri geri yüklenmez.

Önceki API testleri ve repo ayrım kanıtları tarihsel bağlamlarıyla saklanır. Bu fiziksel taşımada yeni AI üretimi veya gerçek kullanıcı hesabı değişikliği gerekmez. Güncel ortam/HTTP/sır kontrolleri ayrıca kaydedilir. Önceki açık yayın kapıları ve authenticated DAST bu taşımayla kapanmaz.


## Yerel kapanış — 16 Ekim 2026

Sınırlı JSON/tarih/sayısal alan doğrulaması ve temizlik ayarlarında fail-closed kontrolü eklendi. 41 API regresyonu geçti. `npm run test:database` açıkça belirtilen özel yerel PostgreSQL socket ile yedi migration, concurrency ve sentetik backup/restore doğrular; uzak DB kabul etmez. CI aynı provayı içerir; uzaktan çalıştırılmadı. Gerçek production backup/deploy değildir. Ayrıntı: [Mühendislik kapanışı](../../mobile/docs/ENGINEERING_CLOSEOUT_2026-10-16.md).


## Bağımlılık güvenliği son güncelleme — 16 Ekim 2026

Backend braces zinciri kaldırıldı: Tailwind/PostCSS4.3.3 ve Next root-glob için scoped tinyglobby0.2.17 + hash kontrollü absolute-path uyumluluk düzeltmesi. Temiz npm ci ve42 test, TypeScript/lint geçti; tam raw audit0. Build/deploy yapılmadı. Public recipe son görsel kabulü açık. Ayrıntı: [Güvenlik düzeltmesi](../../mobile/docs/DEPENDENCY_REMEDIATION_2026-10-16.md).
