# Picomatch — yerel artifact kanıtı (2026-10-20)

## Kapsam ve sonuç

Yalnız izin verilen yerel JavaScript/asset export ve Next production build incelemesi yapıldı. Uygulama kaynakları, paketler, lockfile'lar, mevcut yamalar ve B/C düzeltmeleri değiştirilmedi. Native IPA/AAB, EAS, uzak CI, deploy, migration, servis çağrısı veya risk kabulü yapılmadı.

- **PASS:** iOS ve Android Metro production JavaScript/asset çıktıları.
- **BLOCKED:** Varsayılan Next Turbopack build; CSS yardımcısı ağ sandbox'ında yerel port açamadı.
- **PASS:** Kurulu Next'in `--webpack` seçeneğiyle yerel production build. Aynı kaynak ve Next yapılandırması; derleyici farkı nedeniyle Turbopack artifact'iyle eşdeğer sayılmaz.
- **PASS:** Üretilen Next görüntü ayarlarıyla 36 senaryo / 3.600 saf doğrulama çağrısı, dört ayrı süre sınırlı süreç.
- **UNRESOLVED:** Picomatch paket açığı; önceki 24 saldırı denemesindeki **17 timeout** ve kısmi yama sınırı değişmedi. Genel saldırı/semantik testleri veya Snyk bu tur gereksiz tekrarlanmadı.

## Kaynak, ortam ve bütünlük

HEAD: `9edc2dc45c1b1f56f484f22a156fa27e38ffe88a` yalnız referanstır. Test edilen kaynak, diskteki izlenmeyen ve commit edilmemiş dosyalar dahil **443 dosyanın** içeriğidir. Editörde diske yazılmamış tamponlar bu kaydın kapsamında değildir.

Kaynak manifesti SHA-256: `ee9e03c6e5b93bbd84620a315018d8c69e38a7635a0ab3d216801f3b56726382`.

Paket dosyaları da ayrı manifestlendi: mobil **83.605**, backend **24.437** kurulu dosya/symlink kaydı. Son kontrolde hem orijinal hem izole kopyadaki kayıtlı dosyalarda fark **0**; kaynak dosyalarında fark **0**. B/C dosyaları ve yama betikleri kaynak manifestinin içindedir.

- Mobil kurulu dosya manifesti SHA-256: `1edd7676386c86ed07f86638f79a9bc428fba679924b40ef8ef827f30bc269e1`.
- Backend kurulu dosya manifesti SHA-256: `480f8006e5a0fcfe5d7b5de1285f65543b342958e11c3e1886f0d8c350a43734`.

İzole kopya: `/private/tmp/chef-picomatch-artifacts-cv7t643f`. Kurulu bağımlılıklar APFS clone ile kopyalandı; kurulum/indirme/postinstall çalıştırılmadı. Mevcut kaynak dizinindeki build/cache dosyalarına yazılmadı.

Build süreçleri temiz, açıkça tanımlanmış ortamla çalıştırıldı. OS sandbox tüm ağı ve gerçek kullanıcı dizinini okumayı engelledi. Gerçek dotenv, hesap ayarları, servis anahtarları ve hosting bilgileri taşınmadı. Telemetri/upload kapalı, HOME/TMPDIR izoleydi. Ana uygulama güvenlik ayarları değiştirilmedi.

**Eşdeğerlik sınırları:** `CI=true`, `NODE_ENV=production`; mobilde staging etiketi ve `.invalid` sentetik API/Supabase/auth adresleri, sentetik public anahtar kullanıldı. Sentry/RevenueCat servis bilgileri verilmedi. Backend'de yalnız istemci kurulumlarını mümkün kılan sentetik Supabase/AI değerleri kullanıldı; hiçbir servis hakkı sağlamaz. Production ortamıyla eşdeğer oldukları iddia edilmez. Git tarafından dışlanan dotenv, IDE ayarları, eski `.next`/`.expo`, generated native klasörler ve generated type/cache dosyaları build girdisine taşınmadı; kaynak/package dosyaları korundu. Sentry'nin mevcut native klasör kontrolü yalnız uyarı üretir. Tam native proje incelenmedi.

Mevcut komutlar ve lifecycle'lar önceden okundu: backend `build=next build`, pre/post-build yok; iki postinstall güvenlik yaması mevcut, tekrar çalıştırılmadı. Expo export mevcut Metro/NativeWind/Sentry yapılandırmasını kullandı; prebuild/native modlar çalıştırılmadı. Ayrıntılı komut/ortam/süreler evidence execution JSON'larında.

## Çıktı kimlikleri

| Çıktı | Sonuç / kimlik | SHA-256 |
|---|---|---|
| iOS JS | Production, minified, source maps; 2.651 modül, 61 asset referansı | `65803ce9b88fd383198360a48d14f6732275e23e64a0228d16336e089ffb6fa9` |
| iOS tüm çıktı manifesti | JS + map + assetler + metadata | `3d482026d839dbf54f185312b101367e08e5e55fadb04299dc10b4f4ca4897fc` |
| Android JS | Production, minified, source maps; 2.741 modül, 65 asset referansı | `593f2c99ef5669ef4b21cc626d2c795bc6d8a48ff5d26739ca45c6192335fe9a` |
| Android tüm çıktı manifesti | JS + map + assetler + metadata | `43058d9fa59ec6bbca252d331c995954c6ee4ab7d992377076c51c61ba674fb7` |
| Next Webpack | Build ID `4rMvm_GO_3GD1QpDCCm6E` | Çıktı manifesti: `4065af48f65d185915645cc5528dae969636a084011650b882e8b1fdca91765e` |
| Next bağımlılık izleri | 36 NFT trace, 777 benzersiz dosya, eksik dosya 0 | İz dosyaları manifesti: `b40f812b49eeb6967c1d72f3baf7d1e854607321af62fc833e1bbe7afa515ffb` |

Mobil komut: mevcut Expo CLI ile `export --platform ios --platform android --source-maps --dump-assetmap --no-bytecode --max-workers 2`. `--no-bytecode` bilinçli olarak okunabilir production JavaScript üretir; Hermes bytecode veya native paket doğrulanmış sayılmaz.

## Paket kimliği → artifact ilişkisi

Mobil analiz yalnız isim araması değildir: indexed source map'lerin tüm bölümleri açıldı; gerçek minified bundle AST'sindeki bütün `__d` modül tanımları map bölümlerine bağlandı. iOS 2.659, Android 2.749 source map kaydı; eşleştirilemeyen modül ve eksik source content **0**. iOS/Android platform dosyaları ve CSS interop'un `runtime/native` çözümlemesi doğrudan çıktıda görüldü.

Map içerikleri disk kaynak hashleriyle karşılaştırıldı: iOS 2.604, Android 2.691 birebir kaynak eşleşmesi. 50/53 farklı kayıt asset dönüşümleridir; farklı JS/TS kaynak **0**. Her platformdaki beş sanal kayıt prelude, debug ID, external-require/environment polyfill ve üretilen router context'idir. Router context uygulama rotalarını sabit bağımlılıklara bağlar. Sekiz kopyanın JS içerik hashleri ve paket sahipliği yollarıyla eşleşen mobil modül **0**.

| Kopya | iOS / Android JavaScript | Next production bağımlılık izi | Çalışma zamanı / girdi sonucu |
|---|---|---|---|
| mobile Anymatch → 2.3.2 | İkisinde de yok | Yok | Bu çıktıların mobil JS akışından çağrı yok; geliştirme/build riski ayrı kalır |
| mobile Jest-util → 2.3.2 | İkisinde de yok | Yok | Test aracının kopyası mobil modül grafiğine girmiyor |
| mobile Micromatch → 2.3.2 | İkisinde de yok | Yok | Tailwind/build kopyası mobil modül grafiğine girmiyor |
| mobile Readdirp → 2.3.2 | İkisinde de yok | Yok | Watcher kopyası mobil modül grafiğine girmiyor |
| mobile kök → 4.0.7 | İkisinde de yok | Yok | Metro/Expo araçlarında bulunması teslim edilen JS'de bulunduğu anlamına gelmiyor |
| backend Fast-glob alias → 4.0.7 | İkisinde de yok | Yok | Lint kopyası mevcut production izlerinde yok |
| backend Tinyglobby → 4.0.4 | İkisinde de yok | Yok | Lint/proje-keşif kopyası mevcut production izlerinde yok |
| Next `dist/compiled/picomatch` (ayrı sürüm belirtilmiyor) | İkisinde de yok | **Var:** `next-server.js.nft.json`, index.js + package.json | Image optimizer → remote/local pattern matcher → `makeRe(...).test(...)`; URL/yerel yol eşleştirilen girdidir |

Next üretim izleri `image-optimizer.js`, `match-remote-pattern.js`, `match-local-pattern.js` ve gömülü Picomatch'i birlikte içeriyor. Bu kopya app chunk içine gömülmek yerine Next framework dosyası olarak izlenmiş. İlgili dosyaların byte hashleri kurulu kopyayla ilişkilendirildi. Normal backend Picomatch kopyaları bu 36 izde bulunmadı; bu sonuç keyfi başka deployment/runtime yüklemelerini kapsamaz. İsim aramasının yokluğundan tek başına sonuç çıkarılmadı.

## Next görüntü yolunun sınırlandırılmış kontrolü

Kaynak next.config tek başına kullanılmadı: başarılı build'in `required-server-files.json` içindeki normalize config alındı. Remote pattern `https / images.pexels.com`, pathname varsayılan `**`. **Yeni kanıt:** Next varsayılanı ayrıca `localPatterns=[{pathname:'**',search:''}]` ekliyor. Önceki saf kaynak incelemesindeki undefined-localPatterns bypass'ı normalize production config için geçerli kabul edilemez.

Gerçek kurulu `ImageOptimizerCache.validateParams` çağrıldı. Width=640, quality=75; mevcut image config değiştirilmedi. Dört ayrı sabit senaryo grubu; süreç başına 3 saniye kesin timeout ve 128 MiB V8 heap sınırı; OS ağı kapalı. Ağ isteği, sunucu başlatma veya görsel indirme yok.

36 senaryo × 100 tekrar = **3.600 doğrulama** geçti; timeout **0**. En yavaş 100 çağrılık grup **2,45 ms** (bu makinede gözlem; garanti/SLA değildir). Geçerli/yanlış host, protokol, uzun near-miss hostname, tekrar eden glob görünümlü metin, nokta/slash/encoded metin, yerel query/recursive path ve 3.071–3.072–3.073–4.096 karakter sınırları kontrol edildi. Next'in 3.072 üzerindeki URL reddi de aynı gerçek fonksiyonla doğrulandı.

İlk test harness denemesi yanlış çalışma dizini nedeniyle OS sandbox `uv_cwd` hatası aldı; test yürütülmedi. Hata kaydı korundu, yalnız harici harness çalışma dizini düzeltildi ve dört grup geçti. Uygulama kodu değişmedi.

Bu sonuç hem gerçek sabit deseni hem kullanıcı kontrollü eşleştirme metnini test eder; yalnız “desen değiştirilemiyor” iddiasına dayanmaz. Yine de sonlu test kümesi tüm olası girdiler için matematiksel ispat değildir. Paket seviyesindeki farklı tehlikeli desenler ve önceki **17 timeout** açık kalır.

## Kanıtlanamayanlar ve durma noktası

- Varsayılan Turbopack artifact'i **BLOCKED**. Webpack başarılı sonucu onun yerine geçmiş gösterilmedi.
- JS export **tam native paket incelemesi değildir**; Hermes bytecode, native modüller, imzalama ve cihaz çalıştırması kapsam dışı.
- Yerel Next build **canlı deployment değildir**; hosting'in minimal/serverless paketlemesi ve gerçek ortam ayarları doğrulanmadı.
- Paket üretim izinde mevcut olmak **uzaktan sömürü kanıtı değildir**. Sabit mevcut yapılandırmada bu yerel senaryolarla ReDoS gösterilememesi **Picomatch açığının düzelmesi değildir**.
- Kullanıcı verisi → tehlikeli değişken glob deseni uygulama yolu bu tur bulunmadı. Mevcut yapılandırma ile test edilen girdilerde kilitlenme gözlenmedi; build/CI yapılandırması güven sınırı ve upstream açık bulgu korunuyor.

Yeni yama/paket değişikliği, yayın veya risk kabulü yapılmadı. Bunlar ayrı kullanıcı onayı gerektirir. Bu rapor artifact kanıtını tamamlar; yeni genel güvenlik planı önermez.

## Kanıt dosyaları

Kalıcı kanıt dizini: `backend/security/picomatch-artifact-evidence-2026-10-20/`. `index.json` tüm kanıt dosyalarını SHA-256 ile listeler. Büyük paket/modül manifestleri kayıpsız gzip olarak saklandı; JSON içeriğinin özgün hashleri ayrıca kaydedildi. Execution JSON'ları, başarı/başarısızlık logları, source verification, sınırlı image testi, analiz sonuçları ve harici harness metinleri dahil.

Ham mobil JS/map/asset çıktıları: `/private/tmp/chef-picomatch-artifacts-cv7t643f/mobile-output/`.
Ham Next çıktısı: `/private/tmp/chef-picomatch-artifacts-cv7t643f/source/backend/.next/`.
Bu geçici ham çıktılar sistem temizliğiyle kaybolabilir; kaynak/çıktı kimlikleri, bağımlılık izleri ve analiz kanıtları repo içindeki kanıt dizininde korunur.
