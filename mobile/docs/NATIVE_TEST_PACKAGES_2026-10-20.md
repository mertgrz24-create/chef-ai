# Chef-AI — 20 Ekim 2026 staging test paketleri

> **22 Ekim kayıt güncellemesi:** Sonraki oturumda mevcut paketle sentetik staging hesabına giriş yapıldı; Today, Pantry, Cook, Scan ve Profile görüntülendi. [Simülatör önizleme kaydı ve ekran kanıtları](IOS_SIMULATOR_PREVIEW_2026-10-22.md). Aşağıdaki giriş yapılmadığına ilişkin ifadeler ilk paket teslim anını anlatır. Haftalık plan/öğün detayı, dolu içerik ve tam cihaz kabulü açık; yeni build alınmadı.

Kullanıcı bu turda yeni Android APK ve iOS simülatör paketi hazırlanmasını açıkça istedi. Önceki build almama sınırı bu iki test paketi için kaldırıldı. Bu işlem production, mağaza yayını veya güvenlik risk kabulü değildir.

## Teslim

| Paket | Yerel dosya | SHA-256 |
|---|---|---|
| Android ARM64 staging APK | [ChefAI-staging-2026-10-20.apk](../artifacts/build-2026-10-20/ChefAI-staging-2026-10-20.apk) | `b84967fcad493146ea555ee4311c9b078020a4cdeb36c050217631848c928f5b` |
| iOS ARM64 simülatör paketi | [ChefAI-ios-simulator-2026-10-20.tar.gz](../artifacts/build-2026-10-20/ChefAI-ios-simulator-2026-10-20.tar.gz) | `9a7c3fb832d2e0aa333e6f8b607d037e7e120dcbc7e12d8dd37160d0e94b42dc` |

iOS uygulaması iPhone 17 / iOS 26.5 simülatöründe giriş ekranında çalışıyor. [Görüntü](../artifacts/build-2026-10-20/ios-running.png). iOS arşivi fiziksel iPhone'a kurulabilen IPA değildir. Android APK bu Mac'e indirildi; fiziksel telefona kurulup çalıştırıldığı iddia edilmiyor.

İki paket de mevcut `https://chef-ai-staging-nu.vercel.app` API'sini ve `vcyqtbzhfanbpclfhibv` staging Supabase projesini kullanır. Gerçek sunucu anahtarı build ortamına veya kaynak anlık görüntüsüne taşınmadı. Yalnız mevcut public mobil değişkenler kullanıldı; OTA kapalı kaldı. Production, backend, migration, mağaza, AI üretimi, ödeme ve e-posta gönderimi işlemi yok.

## Kaynak ve derleme yöntemi

Ana çalışma ağacı/indeks/branch korunarak yalnız ayrı `codex/staging-native-20261020` test dalına kaynak anlık görüntüsü gönderildi. Build dalında deploy workflow'u bulunmuyor. HEAD `9edc2dc45c1b1f56f484f22a156fa27e38ffe88a` tek başına kaynak kabul edilmedi; diskteki izlenen/izlenmeyen 476 dosyanın başlangıç manifesti alındı. Build girdisi 267 dosyaydı; açılış regresyon testi eklenince 268 oldu. Backend build girdisine alınmadı.

| İş | Gerçek kaynak/işlem | Sonuç |
|---|---|---|
| İlk iOS native derleme | [Run 39432735779](https://github.com/mertgrz24/chef-ai/actions/runs/39432735779), commit `9607dd2cc9a409716058cb8720741eaceb211d59`; Expo58 prebuild, CocoaPods, Xcode26.6, Release ARM64 simulator | iOS işi başarılı. Aynı run'ın Android SDK adımı başarısız olduğundan run'ın tümü başarılı sayılmıyor. |
| Android native temel paket | [Run 39433293674](https://github.com/mertgrz24/chef-ai/actions/runs/39433293674), commit `20c52fe3cf37e04ff88cb2c67591a64e48c0b2bf`; Expo58 prebuild, Gradle Release ARM64 | Başarılı; native APK gerçek paket incelemesi geçti. |
| Son Android paketleme | [Run 39438764645](https://github.com/mertgrz24/chef-ai/actions/runs/39438764645), commit `a664affb3a9d4ce419465f3938c794115795db05` | Başarılı; yeni Hermes JS üretimi, hizalama, aynı test kimliğiyle imzalama ve yeniden paket incelemesi. |
| Son iOS paketleme | Aynı son JS kaynağı; yerel resmi `expo export:embed --platform ios --dev false --bytecode` | İmza ve entitlements koruma kontrolü geçti; simülatöre kuruldu. |

İlk Android kurulum hatası, Google'ın resmi SDK paket adının `platforms;android-37.0` olmasıydı. Eski `platforms;android-37` adı kullanılmadı. Compile SDK37.0/build-tools37.0.0 kullanılır; APK'nın gerçek target API'si 36 olarak doğrulandı.

İlk native paketler bu turda güncel Expo58 / RN0.88 bağımlılıklarıyla gerçekten derlendi. Daha sonra yalnız iki TSX dosyasındaki açılış yönlendirmesi düzeltildi. Bu JS düzeltmesinden sonra bütün native kütüphanelerin yeniden derlendiği iddia edilmez:

- Android'de resmi Expo CLI son Hermes bundle'ını üretti. İlk native APK'nın JS dışındaki **1377 girdisinin byte hashleri** korundu; aynı Hermes bytecode formatı, aynı imzalama sertifikası, final ELF/manifest/zipalign kontrolleri doğrulandı. Aynı girdiler indirilen final dosyada yerel olarak yeniden karşılaştırıldı.
- iOS'ta 299 dosya ilk Xcode paketiyle karşılaştırıldı; yalnız `main.jsbundle`, Mach-O imza alanı ve `_CodeSignature/CodeResources` değişti. İmza bloğu dışındaki native executable kodu, framework'ler ve diğer kaynaklar byte olarak aynı; orijinal entitlements korundu. Yeni `.app` ad-hoc simülatör imzasıyla doğrulandı. Bu physical-device/distribution signing değildir.
- Simülatöre kurulu gerçek `main.jsbundle` hash'i son yerel paketle aynı. JS kaynak haritaları ve artifact hashleri kanıt dizininde saklandı. Geçici teşhis giriş dosyası son iOS/Android bundle'larında yok.

## Bu turda düzeltilen açılış hatası

Gerçek simülatör açılışı, oturumsuz kök URL'de `Unmatched Route` sorununu ortaya çıkardı. Kaynakta tekrar üretildi. Mevcut `Stack.Protected` kullanılarak `(app)` için giriş/kurtarma hedefi, `(auth)` için Today hedefi açıklandı. Auth grubunun başlangıcı login yapıldı; recovery durumunda diğer auth ekranları mevcut reset-password ekranına gider. Navigator ilk render'ını tamamlamadan yapılan imperative recovery yönlendirmesi kaldırıldı. Auth/RLS/kota kontrolleri gevşetilmedi.

Değişen uygulama dosyaları:

- `mobile/src/app/_layout.tsx`
- `mobile/src/app/(auth)/_layout.tsx`
- Yeni regresyon: `mobile/tests/startup-routing.test.tsx`

Son kontroller: **154 test / 21 suite**, **19 bağımlılık regresyonu**, lint ve TypeScript geçti; aynı kaynak remote son paketleme işinde de doğrulandı. Yeni dört test oturumsuz kök açılışı, özel deep link'in login'e yönlenmesi, oturumlu Today açılışı ve recovery hedefini kapsar. İlk test harness'indeki eksik nested layout/font mock'ları düzeltildikten sonra eski kaynakta 3 başarısız/1 başarılı; düzeltmeden sonra 4/4 başarılı sonuç alındı. Hatalı harness sonuçları ürün güvenlik bulgusu olarak sunulmadı; eski testler zayıflatılmadı.

## Gerçek paket ve cihaz kontrolleri

Android final APK: 45,618,108 byte; target API 36; debuggable=false, backup=false, yasak geniş izinler yok; **31 native kütüphane** ELF kontrolünden ve 16 KB zip hizalama kontrolünden geçti. Sertifika native temel paketle aynı. Bunlar APK kanıtıdır; AAB/Play veya fiziksel cihaz kabulü değildir.

iOS: Xcode26.6 / iphonesimulator26.5 ARM64, paket imzası ve native/privacy/izin incelemesi başarılı. Normal uygulamanın ilk açılışı, `chefai:///` kök bağlantısı, parola kurtarma ekranına geçiş ve login'e dönüş gerçek simülatörde görüldü. Public staging config kontrolü `schema=1, ai=true` döndü. Gerçek kullanıcı girişi, kamera/Scan/AI/haftalık üretim, ödeme, e-posta gönderimi ve fiziksel iPhone testi yapılmadı.

Simülatörde eski `com.chefai.securitycheck` uygulaması aynı `chefai` scheme'ini sahipleniyordu. Bazı bağlantılar eski sürüme gidip eski bağlantı/hatalı giriş uyarılarını gösteriyordu. Yeni API/şema sorunu gibi sunulmadı: yeni paketin public config çağrısı başarılıydı. Eski test uygulaması ve container'ı APFS clone ile yerel, 0700 korumalı dizine yedeklendi; 238 dosya hash ile doğrulandıktan sonra yalnız eski test kurulumu kaldırıldı. Keychain silinmedi; güncel uygulama verisi korunuyor. Bu yedek GitHub'a veya teslim arşivine eklenmedi.

Mac'te 1,6 GB'den az boş alan ve Java/Android SDK eksikliği vardı. Yalnız yeniden üretilebilir eski geçici bağımlılık kopyaları ve Expo57 generated Pods temizlendi. Ana node_modules, paket/lock/yama dosyaları ve kullanıcı dosyaları korunuyor. Android artifact ZIP'ini diskte ayrıca tutan ilk indirme alan hatası aldı; son ZIP bellekte açıldı ve APK tek kopya kaydedildi. Dosya hash'i CI kaydıyla eşleşiyor.

## Güvenlik ve yayın durumu

**Picomatch: UNRESOLVED — kısmi mitigasyon mevcut; incelenen uygulama yollarında sömürü gösterilmedi.** Bu build, FIXED/risksiz veya risk kabul edildi anlamına gelmez. İzole prototip entegre edilmedi; önceki 17 timeout sonucu kapatılmadı. Paket/lock/yamalar ve B/C düzeltmeleri başlangıç hashleriyle korundu. 19 bounded dependency testinin geçmesi bu açık bulgunun yerine kapanış kanıtı değildir.

HawkScan skill ön kontrolleri geçti; authenticated DAST için API key/config yok: **NOT RUN/BLOCKED**. Yeni ücretli hesap/deneme/servis başlatılmadı. Yeni genel Snyk/npm audit turu yapılmadı; eski raporlar yeni tarama sayılmıyor.

GitHub billing UI'da başlangıçta 713/2.000 dakika, 0/0,5 GB storage ve 0 dolar Actions bütçesi/paid usage blocked görüldü. Standart Ubuntu24.04 ve macOS26 runner'ları, süre sınırı ve bir günlük artifact saklama kullanıldı. Billing ayarları değiştirilmedi; EAS/ücretli runner kullanılmadı.

Bunlar staging test paketleridir. Final signed IPA/AAB, fiziksel cihaz matrisi, gerçek auth/AI/ödeme entegrasyonları, native tam lint/erişilebilirlik, mağaza ve yayın güvenlik kapıları açık kalır. Backend/Next build yapılmadı; önceki Turbopack/deployment kontrolleri tamamlanmış sayılmadı. `release-evidence.json` pending kapıları verified yapılmadı.

## Kanıtlar

Yerel kanıtlar `mobile/artifacts/build-2026-10-20/` altındadır: başlangıç/son kaynak manifestleri; iki native temel iş ve final paketleme kimlikleri; CI logu; APK imza/native/hash kayıtları; iOS tekrar paketleme ve runtime eşitliği; kaynak değişikliği karşılaştırması; sıkıştırılmış Android ve normal iOS source map'leri. Uygulama paketleri ve özel eski-simülatör yedeği Git dışında kalır. GitHub artifact'leri bir gün sonra silinebilir; teslim edilen dosyalar bu Mac'te tutulur.

Güncel Picomatch yayın kontrolü: [Release readiness](RELEASE_READINESS.md) · [Önceki artifact raporu](../../backend/security/PICOMATCH_ARTIFACT_REVIEW_2026-10-20.md).
