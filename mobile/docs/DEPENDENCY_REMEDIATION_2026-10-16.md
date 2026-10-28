# Bağımlılık açıklarının giderilmesi — 16 Ekim 2026

Bu kayıt [önceki yerel kapanışın](ENGINEERING_CLOSEOUT_2026-10-16.md) güvenlik sonucunu günceller. Yeni build, deploy, Git push/remote CI veya ücretli tarama yoktur. Hosted staging/kurulu APK değişmedi.

## Neden önce kapanmadı?

Önceki işte yayımlanmış düzeltmesi olmayan paketler hash kontrollü kaynak yamalarıyla sınırlandırıldı. `npm audit` bu yamaların kodunu değerlendirmez: registry paket kimliği/sürümü ve üst bağımlılık zincirlerini raporlar. Bu yüzden başarılı saldırı regresyonlarıyla ham sürüm uyarıları farklı sonuçlardır. **53 yüksek, 53 bağımsız kök açık değildir.** Önceki üç kök advisory braces/node-forge/sprintf-js idi. Uyarıyı ignore etmek, sürüm uydurmak veya uyumsuz Expo/Jest sürümünü zorlamak çözüm sayılmadı.

## Bu tur gerçek bağımlılık değişiklikleri

### Mobil: beş orta uyarının kaynağı kaldırıldı

- `@istanbuljs/load-nyc-config` içindeki YAML ayrıştırıcısı scoped override ile `js-yaml 4.3.2` kullanır. Yükleyici zaten `.load()` API'sini kullandığı için çağrı sözleşmesi korunur.
- Eski iç `js-yaml 3`, `argparse 1` ve `sprintf-js` artık lock dosyasında veya temiz kurulmuş ağaçta yoktur. `sprintf-js` yerel yaması kaldırıldı; paket artık gerekli değil.
- Regresyon gerçek NYC YAML yapılandırmasını yükler, include/reporter alanlarını doğrular ve yürütülebilir JS YAML etiketinin reddedildiğini kontrol eder. Tam Jest/coverage araç zinciri ve Expo sürümü değiştirilmedi.

### Backend: yedi yüksek uyarının kaynağı kaldırıldı

- Tailwind 3 yerine `tailwindcss`/`@tailwindcss/postcss 4.3.3` kullanılır. Eski chokidar/micromatch/braces zinciri kalktı.
- Next ESLint eklentisinin yalnız root-directory keşfinde kullandığı `fast-glob`, scoped npm alias ile gerçek `tinyglobby 0.2.17` paketiyle değiştirildi. Lock dosyası gerçek paket adını/sürümünü/integrity kaydını tutar; eski pakete sahte sürüm verilmedi.
- İki kitaplığın mutlak glob sonuçları farklı olduğu için Next çağrısına `path.isAbsolute(rootDir)` seçeneği eklendi. Hash kontrollü tek uyumluluk yaması temiz kurulumda uygulanır, kaynak drift'inde kurulum durur. Varsayılan root, string/array, mutlak/bağıl, yalnız klasör ve bulunamayan glob senaryoları gerçek eklenti üzerinde test edilir.
- Backend'de `braces` artık yok; eski beş guard yaması kaldırıldı. Geriye tek Next glob uyumluluk yaması kaldı.
- Public recipe CSS girişi PostCSS v4'e taşındı; v3 shadow/shrink/outline adları eşdeğerlerine çevrildi. Evrensel reset `@layer base` içine alındı; utility margin/padding'lerinin yanlışlıkla ezilmesi önlendi. Ortak renkler değiştirilmedi. Mobil NativeWind/Tailwind 3 zinciri değiştirilmedi.
- PostCSS regresyonu gerçek backend kaynaklarından CSS işler: flex/padding/shadow/shrink, dinamik yüzey/metin renkleri, yeşil/lime, görünür focus ve reset katmanı doğrulanır. Bu tam uygulama build'i veya tarayıcı görsel kabulü değildir. Tailwind 4'ün modern tarayıcı tabanı yalnız backend'in public recipe sayfasını ilgilendirir; native arayüz veya mobil API protokolü değişmez. Son tarayıcı/native kabulü hâlâ açık.

## Temiz kurulum sonrası sonuçlar

| Kontrol | Sonuç |
|---|---|
| Mobil ham audit | **54 yüksek, 0 orta, 0 kritik** |
| Backend ham audit (dev dahil) | **0 bulgu** |
| Mobil gerçek bağımlılık regresyonları | 15 geçti |
| Mobil Jest | 97 test / 14 suite geçti |
| Backend API/bağımlılık/CSS | 42 geçti |
| Temiz `npm ci` | Her iki dizinde postinstall ile geçti |
| TypeScript / lint | İki TypeScript geçti; mobil lint temiz, backend 0 hata / 4 mevcut uyarı |
| Expo sürüm uyumluluğu | Geçti |

Mobil yüksek sayısının53→54 olması yeni eklenen bir mobil paketten kaynaklanmadı: yeni raporda **mevcut ve sürümü değişmeyen `react-native-purchases`, `react-native` üzerinden üst bağımlılık olarak listeleniyor**. Mobil ağaçtan üç eski paket kaldırıldı; yeni runtime paket eklenmedi. Kök advisories **braces ve node-forge**, yani iki kaldı. Önce/sonra raporları korunmuştur; sayılar değiştirilmedi veya gizlenmedi.

## Açık kalan yüksek bulgular

| Paket | Neden basit güncelleme yok? | Mevcut koruma ve kalan kabul |
|---|---|---|
| braces 3.0.3 | Registry ve resmi advisory'de yayımlanmış sabit sürüm yok. Mobil Metro/Jest/NativeWind/Tailwind3 zincirleri kullanıyor. | Hash doğrulamalı parse/AST sınırları ve gerçek derinlik/döngü testleri geçiyor. Bağımsız inceleme veya uyumlu upstream düzeltme/değişim gerekir. |
| node-forge 1.4.0 | Expo CLI ve Expo code-signing-certificates kullanıyor; resmi advisory'de yayımlanmış sabit sürüm yok. | Fazla/nested DigestAlgorithm ve hatalı NULL parametreleri reddedilir; geçerli RSA imzası testi geçer. Kriptografik yamanın bağımsız incelemesi hâlâ gerekir. |

Yerel yamalar temiz kurulumda tekrar uygulandı, 15 dosya bütünlüğü/regresyonları geçti. Paketleri yeniden adlandırarak veya yama uygulanmış sürümü registry'de varmış gibi göstererek sayıyı sıfırlamadım. Expo57'nin desteklediği zinciri büyük bir geçişle değiştirmek ve native doğrulamak ayrı bir uyumluluk çalışmasıdır; kullanıcı yeni build istemediği için native kabul yapılmadı. Güvenlik yayın kapısı **pending** kalır.

HawkScan skill/preflight incelendi: CLI6.6.0, skills güncel; authenticated scanner anahtarı/kurulumu yok. Kullanıcının ücretli kurulumu reddetme kararı korundu; DAST yapılmış sayılmadı.

## Kanıtlar ve kaynaklar

- [Toplu kanıt ve kaynak hash'leri](../security/dependency-remediation-2026-10-16.json)
- [Mobil ham audit](../security/dependency-remediation-mobile-audit-2026-10-16.json), [backend ham audit](../security/dependency-remediation-backend-audit-2026-10-16.json)
- [Braces advisory](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm), [node-forge advisory](https://github.com/advisories/GHSA-86w9-cpqp-85rv), [kaldırılan sprintf-js advisory](https://github.com/advisories/GHSA-hp3w-g68c-fv3c)
- [Tailwind resmi geçiş rehberi](https://tailwindcss.com/docs/upgrade-guide), [tinyglobby üretici belgesi](https://github.com/SuperchupuDev/tinyglobby), [Expo57](https://docs.expo.dev/versions/v57.0.0/)
