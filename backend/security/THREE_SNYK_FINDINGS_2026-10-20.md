# Üç Snyk bulgusu — uygulama ve doğrulama

**20 Ekim 2026, Europe/Istanbul.** İki yerel araç bulgusu kaynakta düzeltildi.
Picomatch açık; bu çalışma tam yayın güvenliği kabulü değildir.

| Bulgu | Teknik durum | Güncel Snyk sonucu |
|---|---|---|
| A — HIGH / Open Source, `SNYK-JS-PICOMATCH-21248802` (`CVE-2026-112366`) | **UNRESOLVED.** Mevcut kısmi mitigasyon korundu; yan yana tekrar grupları hâlâ süre aşımı üretiyor. | **OPEN:** mobil 28, backend 2 bağımlılık yolu; aynı advisory. |
| B — LOW / Code, `summarize-provider-usage.cjs`, önceki satır 30 | **FIXED (yerel kaynak/test).** CLI argümanından dosya okuma kaldırıldı. | Son kök Code taraması **0 bulgu**, exit 0. Eski tekil issue kimliği elde edilemedi. |
| C — MEDIUM / Code, `picomatch-independent-verification.cjs`, önceki satır 10 | **FIXED (yerel kaynak/test).** CLI argümanından dinamik modül yükleme kaldırıldı. | Aynı son kök Code taraması **0 bulgu**, exit 0. Eski tekil issue kimliği elde edilemedi. |

Ignore/suppress, risk kabulü veya kapsam daraltma yapılmadı. Snyk Code'un temiz
sonucu Picomatch Open Source bulgusunu kapatmaz; npm audit da Snyk yerine geçmez.

## Kaynak, ortam ve kanıt sınırı

- Repo: `/Users/mertgurbuz/chef-ai`; ayrı npm kökleri `mobile/` ve `backend/`.
- HEAD: `9edc2dc45c1b1f56f484f22a156fa27e38ffe88a`. Çalışma ağacı mevcut
  değişiklikler ve izlenmeyen backend/betik dosyaları içeriyor. Commit tek başına
  test edilen kaynağı tanımlamaz.
- Yerel Node `v24.14.0`; Darwin arm64. Snyk CLI `1.1308.1`.
- Son Code taraması öncesinde ilgili kaynak/paket/yama SHA-256'ları alındı;
  tarama sırasında ve kanıt kaydında değişmedikleri doğrulandı.
- Paket, lock, yama manifestleri ve mevcut yamalı kurulum dosyalarından oluşan
  **20 korunan dosyanın** hashleri başlangıçla aynı. Paket sürümü değişmedi.
- Snyk Code kök taraması 197 desteklenen dosya bildirdi: 33 CJS, 7 JS, 3 MJS,
  97 TS, 52 TSX, 3 Python, 2 HTML. İlgili dosyalar Git ignore kapsamında değil.
  SARIF uzantı bazında coverage veriyor; ayrı dosya listesi sunmuyor.
- İlk sandbox denemelerinde cache/ağ erişimi, doğrudan standalone binary'de
  kimlik doğrulama hatası alındı. Mevcut tam Snyk CLI'si gerekli cache/ağ
  erişimiyle çalıştırılınca authenticated taramalar tamamlandı. Yeni hesap,
  oturum açma akışı, ücretli paket veya deneme başlatılmadı.

Makine kanıtı: [three-snyk-findings-2026-10-20.json](three-snyk-findings-2026-10-20.json).
Önceki davranış kanıtları, kaynak hashleri, komut sonuçları ve korunan paket/yama
hashleri burada kayıtlı. Önceki raporlar tarihsel kapsamıyla korunmuştur.

## B — Rapor girdisi

Önceki akış `process.argv[2] → fs.readFileSync(file)` idi. Yerel operatör dosya
yolunu seçebiliyordu; uygulama API rotasından çağrı bulunmadı. Çıktının yalnız
izinli metadata alanlarını içermesi hangi dosyanın açılacağını sınırlamıyordu.

Değişiklik öncesinde geçici sentetik JSONL dosyası hem mutlak yol hem symlink
argümanıyla okunup bir olay olarak özetlendi (exit 0). Gerçek kullanıcı logu,
dotenv veya sır okunmadı.

CLI şimdi yalnız standart girdiden JSONL alıyor:

```sh
# backend dizininden; dosyayı operatörün kabuğu açar
node lib/mobile/summarize-provider-usage.cjs < metadata.jsonl
```

Dosya argümanları okumadan önce exit 1 ile reddedilir. Kabuk yönlendirmesi
operatörün dosya seçimi olarak kalır; bu araç kabuğu dosya sandbox'ına dönüştürmez.
CLI artık yol çözümlemez veya verilen yolu açmaz. `summarize(records)` export'u
değişmedi. Boş girdi boş özet üretir; bozuk JSON satırları sayılır; yinelenen
job/attempt kayıtları birleştirilir; bilinmeyen maliyet/token sıfıra çevrilmez.
Okuma hatalarında ham girdi basılmaz.

Backend testlerine iki CLI regresyonu eklendi. Normal/boş/bozuk/tekrarlı JSONL
ve bilinmeyen değerler geçti; mutlak yol, `../`, benzer adlı kardeş dizin,
symlink ve olmayan dosya argümanları reddedildi. Mevcut özet testi de geçti.

Değişenler: `backend/lib/mobile/summarize-provider-usage.cjs`,
`backend/lib/mobile/security.test.cjs`, `backend/lib/mobile/AI_OPERATIONS.md`.

## C — Sabit worker hedefleri

Önceki worker doğrudan `require(process.argv[3])` çalıştırıyordu. Değişiklik
öncesinde geçici ve zararsız bir modül yoluyla marker dosyası oluşturulabildi.
Bu, yerel çağıranın seçtiği modülün yüklenmesini gösterir; HTTP saldırısı kanıtı
değildir.

Yeni `scripts/picomatch-verification-worker.cjs` yalnız sekiz sabit hedef ve
`oracle`/üç sabit probe kimliğini kabul eder. Modüller sabit `require` ifadeleriyle
yüklenir; glob/metin veya modül yolu argüman olarak kabul edilmez. Eski üst
betik `worker <path> ...` arayüzü açık hata verir.

Lockfile hedef listesi sabit envanterle eşleşmezse çalışma durur. Hedef dizin,
entry, package metadata ve parser gerçek yolları ilgili kurulum/paket kökünde
kalmalıdır; dışarıya symlink ve benzer kardeş kök kaçışları reddedilir.
Kurulu paket içeriği hâlâ güvenilir kurulum girdisidir; bu kontrol paket dosyalarını
değiştirebilen yerel saldırgana karşı genel kod sandbox'ı değildir.

Üst süreç sabit Node/worker yolunu ayrı argümanlarla, `shell:false`, `SIGKILL`,
64 KiB çıktı sınırı, oracle için 2 saniye ve probe için 1 saniye sınırıyla başlatır.
Worker'a yalnız LANG/TZ aktarılır; NODE_OPTIONS, NODE_PATH ve servis sırları
miras kalmaz. V8 heap sınırı 128 MiB'dir; OS seviyesinde toplam bellek sandbox'ı
değildir. Saldırı senaryolarını üst doğrulayıcı üzerinden çalıştırın; worker iç
kullanım bileşenidir ve süreyi üst süreç uygular.

Yeni `scripts/picomatch-verification.test.cjs` içindeki **9 test geçti**:
sekiz hedef/432 oracle assertion, keyfî modül ve builtin reddi, geçersiz senaryo
ve fazla argüman reddi, eski giriş noktasının kapanması, değişen envanter,
dizin/dosya/kurulum symlink kaçışı, NODE_OPTIONS izolasyonu ve timeout sonrası
çocuk PID'nin artık yaşamaması.

Değişen/eklenenler: `scripts/picomatch-independent-verification.cjs`,
`scripts/picomatch-verification-worker.cjs`, `scripts/picomatch-verification.test.cjs`.
Bu testler yerel olarak çalıştırıldı; yeni CI işi eklenmedi.

## A — Korunan açık engel

Paket, lockfile, mevcut ReDoS yaması ve güvenlik testleri değiştirilmedi. Yeni
worker ile son kaydedilmiş kaynak üzerinde 8 kopya × 3 probe tekrar çalıştırıldı:
**24 probe, 17 matching-stage timeout, exit 2**. Ayrı semantik oracle **432/432**
geçti. Aracın güvenli hale gelmesi matcher'ın güvenli olduğu anlamına gelmez.

Yamalı 7 kopyada `+(a)` veya `*(ab)` gruplarının art arda gelişi mevcut grup-içi
kontrolü aşmaya devam ediyor. Next'in `dist/compiled/picomatch` kopyası yama
envanteri dışında; bu tur ayrıca yamalanmadı. Önceki kaynak erişilebilirlik
incelemesi kullanıcı kontrollü glob deseninden uzak sömürü göstermedi; bu tur
da production/native artifact veya HTTP sömürü testi yapılmadı.

Güncel Snyk JSON'larında aynı advisory'nin `fixedIn` alanı boş. Mobildeki
Tailwind 4 önerisi bir bağımlılık yolunu değiştirir; diğer yolları ve mevcut
NativeWind/Tailwind 3 uyumunu çözmüş sayılmaz. Paket adını/sürümünü değiştiren
tarayıcı hileleri, rastgele fork veya yeni regex motoru eklenmedi.

Yayın engeli sürer. Uyumlu resmî düzeltme veya saldırı ve semantik kontrolleri
birlikte geçen incelenmiş aday olmadan **FIXED** kabulü verilmeyecek. Next iç
kopyası ilişkili takip olarak kalır; bu onay kapsamında Next yükseltmesi yok.

## Çalıştırılan kontroller

| Komut / kapsam | Sonuç |
|---|---|
| `node --test --test-timeout=10000 scripts/picomatch-verification.test.cjs` | 9 PASS |
| Backend `node --test --test-name-pattern='operational summary' …` | 3 PASS |
| Mobil `npm test -- --watch=false` | 150 test / 20 suite PASS |
| Mobil `npm run test:security` | 19 PASS |
| Backend `npm run test:security` | 66 PASS |
| İki projede `npm run lint`, `npm run typecheck` | PASS |
| Değişen 3 root CJS dosyasında ESLint `no-unused-vars`; betik syntax kontrolleri | PASS |
| İki mevcut patch script'i `--check` | PASS |
| `node scripts/picomatch-independent-verification.cjs` | **FAIL / exit 2: 17 timeout**, açık bulgu doğru şekilde korunuyor |
| İki npm kökünde `npm audit --json` | **0 / 0** |
| İki npm kökünde `snyk test --dev --json` | **28 mobil / 2 backend yol**, exit 1 |
| Repo kökünde son `snyk code test --json` | **0 bulgu / exit 0**, kaynak hashleri tarama boyunca aynı |
| HawkScan DAST | **BLOCKED**: CLI 6.6.0 var; API key, kullanıcı credentials dosyası ve proje scan config yok |
| Temiz npm kurulumu | NOT RUN: paket/lock/yama değişmedi; mevcut kurulum hashleri ve patch kontrolleri doğrulandı |
| Native/build/bundle, deploy, uzak migration, gerçek AI | NOT RUN / kullanıcı sınırı |

Son Code taraması: `snyk-three-findings-code-2026-10-20.json`.
Open Source: `snyk-three-findings-mobile-2026-10-20.json`,
`snyk-three-findings-backend-2026-10-20.json`.
Audit: `audit-three-findings-mobile-2026-10-20.json`,
`audit-three-findings-backend-2026-10-20.json`.
Matcher: `picomatch-three-findings-2026-10-20.json`.

HawkScan skill ön kontrolleri uygulandı; skill sürümü için uzak sorgu başarısız
oldu, CLI cache durumunu güncel bildirdi. Tarama hesabı/ücretli servis kurulmadı.
Bu iki araç yerel CLI'dir; DAST ayrıca Code/yerel regresyon doğrulamasının yerine
geçmez. Yeni hesap erişimi beklemeden izin verilen işler tamamlandı.

## Teslim sınırı

**Kaynakta düzeltildi ve yerel test edildi; canlıya uygulanmadı.**
Staging, production ve mevcut APK değişmedi. Yeni build, deploy, OTA, push,
uzak migration, gerçek AI çağrısı veya ücretli servis işlemi yapılmadı.
API sözleşmeleri, kota/oturum/RLS ve mevcut güvenlik yamaları korundu.
