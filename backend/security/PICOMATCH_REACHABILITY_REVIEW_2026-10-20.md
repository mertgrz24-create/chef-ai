# Picomatch erişilebilirlik ve bağımsız test kurgusuyla yama incelemesi

**Tarih:** 20 Ekim 2026. **Karar: BLOCK — tam güvenlik/yayın kabulü başarısız.**

Bu rapor, önceki “kaynak mitigasyonu tamamlandı, yalnız katalog engeli kaldı”
yorumunu daraltır: mevcut yama **kısmi** korumadır. Yeni yerel testler korumanın
dışında kalan iki biçimi ve yama listesinde olmayan Next.js iç kopyasını gösterdi.
Snyk'i kapatmayı bekleyen bir etiket sorununun ötesinde, ölçülmüş bir kapsam eksiği var.

## 1. Sonucun sınırı

- Mevcut API/mobil kaynak akışında saldırganın Picomatch **desenini** kontrol
  edebildiği bir yol **gösterilemedi**. Bu, uzaktan sömürü kanıtı değildir.
- Desen ve eşleşecek metin saldırgan kontrolündeyse mevcut kurulu kodda CPU
  tüketimi/süre aşımı **tekrar üretildi**. Tam düzeltme kabulü bu nedenle başarısız.
- İnceleme aynı asistan tarafından, önceki literalization testlerinden bağımsız
  kapalı-form matematiksel oracle ve yeni saldırı aileleriyle yapıldı.
  **Harici insan/kurum denetimi veya sertifikası değildir.**
- Production/staging'e istek gönderilmedi; APK, IPA veya production server çıktısı
  doğrulanmadı. Yeni build/deploy/OTA/migration/AI/ücretli servis işlemi yok.

## 2. Erişilebilirlik kanıtı

`scripts/picomatch-reachability-review.cjs`, TypeScript AST ile literal runtime
import/require zincirlerini çıkarır. Test dosyaları yerine uygulama girişlerini
izler. Yerel alias/relative dosyalar çözülür; dış paketler genel olarak yaprak
olarak bırakılır. Bu çalışma bütün transitif paketlere uygulanan tam taint analizi
veya Metro/Next release grafiği değildir.

| Yüzey | Gözlem | Girdi sınırı ve risk yorumu |
|---|---|---|
| Backend API | 30 route girişinden 48 yerel dosya; doğrudan matcher importu 0, çözülemeyen yerel import 0, literal olmayan yükleme 0 | İncelenen kaynakta tarif, Pantry, fotoğraf veya plan girdisinden glob deseni oluşumu bulunmadı. Uzak sömürü yolu gösterilmedi. |
| Backend Snyk'in iki yolu | Next ESLint plugin ve TypeScript import resolver içindeki tinyglobby | Desenler proje/ESLint/tsconfig ayarlarından geliyor. Mevcut API request body/URL'sinden gelmiyor. Geliştirme/CI yüzeyi. |
| Next.js iç Picomatch | `next/dist/compiled/picomatch` var; önceki 7 lockfile kopyasının dışında | Image validator çalışma zamanı kullanımı doğrulandı. Desen güncel `next.config.mjs` sabitlerinden geliyor. |
| Mobil uygulama kaynakları | 18 app girişinden 64 yerel dosya; matcher importu 0, çözülemeyen yerel import 0, literal olmayan yükleme 0 | Kamera, tarif, plan/kiler metninin bir Picomatch desenine aktarımı bulunmadı. Bu kaynak incelemesi, bütün SDK transitifleri veya release bundle için yokluk kanıtı değildir. |
| NativeWind runtime/JSX | NativeWind + CSS interop içinde 22 dosyalık literal JS zinciri; matcher importu 0, çözümleme açığı 0 | Metro/preset/derleme girişleri runtime girişlerinden ayrıldı. Node çözümlemesi kullanıldı; gerçek platform bundle incelemesi yapılmadı. |
| Mobil Tailwind/49. satır | Tailwind → Chokidar/Anymatch/Readdirp ve Fast-glob/Micromatch | `tailwind.config.js` content alanı sabit `./src/**/*.{js,jsx,ts,tsx}`; HTTP/uygulama kullanıcısı ayarı değil. |
| Expo/Metro/Jest/codegen | Snyk'teki diğer yollar | Side-effects desenleri package.json'dan; export/file-transform desenleri geliştirici ayarlarından. Repo/bağımlılık yapılandırmasına güven sınırı var. |

### Next.js görüntü yolu: desen ile metin ayrımı

İzole süreçte gerçek `hasRemoteMatch` / `hasLocalMatch` fonksiyonları çağrıldı.
HTTP sunucusu başlatılmadı; fetch/http/https istemcileri deneyde engellendi.
Güncel Next config üretim-server fazında okunurken development ortam kontrolü
çalıştırılmadı; dotenv dosyası yüklenmedi.

4 sentetik URL yolu × izinli uzak host / reddedilen host / yerel validator =
**12 doğrulama çağrısı** başarılı. URL'lerde önceki saldırı biçimleri, ardışık
gruplar ve 2000 karakterlik yol kullanıldı. `makeRe` gözleminde derlenen desenler
yalnız **`images.pexels.com`** ve **`**`** idi. Saldırı biçimli URL path'i
eşleşecek **metin** olarak kaldı, derlenecek **desen** olmadı.

Kaynak dayanakları (kurulu sürümler):

- `backend/next.config.mjs:6`: sabit remotePatterns.
- `backend/node_modules/next/dist/shared/lib/match-remote-pattern.js:38`: hostname deseni; `:48`: pathname deseni.
- `backend/node_modules/next/dist/shared/lib/match-local-pattern.js:38`: localPatterns yoksa matcher çalışmadan kabul.
- `backend/node_modules/next/dist/server/image-optimizer.js:235` / `:259`: validator çağrıları.
- `backend/node_modules/@next/eslint-plugin-next/dist/utils/get-root-dirs.js:25`: desen kaynağı ESLint settings.
- `backend/node_modules/eslint-import-resolver-typescript/lib/index.cjs:287`: config/project kaynağı.
- `mobile/tailwind.config.js:8`: content kaynağı.
- `mobile/node_modules/tailwindcss/lib/lib/content.js:183`: content desenlerinin matcher'a verilmesi.
- `mobile/node_modules/@expo/metro-config/build/serializer/sideEffects.js:131`: package.json sideEffects kaynağı.

## 3. Önceki yamayı aşan bağımsız kontroller

Yeni araç: `scripts/picomatch-independent-verification.cjs`.
Önceki `scripts/picomatch-regression.cjs` değiştirilmedi ve oracle olarak
kullanılmadı. Kaynak/paket/yama dosyaları değiştirilmedi.

**Semantik oracle:** `+(a)` grubunun k kez ardından `b` gelmesi, yalnız en az k
adet `a` ve ardından `b` bulunan metinleri kabul etmelidir. k=1..3, uzunluk=0..8,
iki son ek için 54 assertion × incelenen 8 kopya = **432 assertion geçti**.
Bu küçük girdilerde semantik uyumu gösterir; performans güvenliği göstermez.

**Üç probe × 8 kopya = 24 ayrı süreç**, her biri 1000 ms sınırla çalıştı.
Her worker matcher'ı derledikten sonra `MATCH_STARTED` işareti verdi; dolayısıyla
gözlenen 17 timeout modül yükleme/derleme değil **eşleştirme aşamasındaydı**.

| Probe | Girdi | Yamalı 7 kopya | Next iç kopyası |
|---|---|---|---|
| Önceki `+(*a)` kontrolü | 96 × `a` + `!` | 7/7 tamamlandı | TIMEOUT |
| `+(a)` × 8 + `b` | 96 × `a` + `!` | **7/7 TIMEOUT** | TIMEOUT |
| `*(ab)` × 8 + `c` | 64 × `ab` + `!` | **7/7 TIMEOUT** | TIMEOUT |

**Neden kaçıyor?** `hasUnsafeRepeatedBranch`, her bir extglob gövdesini ayrı
inceliyor. `a` ve `ab` güvenli tekil gövdeler sayılıyor. Yan yana gelen grupların
birbirleriyle oluşturduğu belirsiz bölüşüm kontrol edilmiyor. Regex çıktısı
örneğin art arda `(?:a)+` grupları içeriyor. Bu, tek grubun içindeki tekrara
odaklanan mevcut kontrolün dışında kalıyor.

Next iç kopyası minify edilmiş `index.js` olarak dağıtılıyor; kendi package.json'ı
Picomatch sürümünü bildirmiyor. Dosyanın SHA-256'sı kanıtta saklandı. Bu kopyanın
varlığı lockfile/Snyk yollarının bütün gömülü kod envanteri olmadığını gösteriyor.
Yeni bir CVE atandığı veya bugünkü uzaktan saldırı yolu bulunduğu iddia edilmiyor.

## 4. Kurulum/yama bütünlüğü

`scripts/picomatch-integrity-review.cjs`, her proje için patch script, manifest
ve hedef dosyaları **küçük geçici kopyalara** alır. Asıl node_modules'a yazmaz.

Her proje için 5 kontrol geçti: temiz yamalı kaynak kabul; değiştirilmiş parser
`--check` reddi; aynı drift'in postinstall reddi; geri yüklenen parser kabul;
eksik parser reddi. Reddedilen işlemlerde timeout değil gerçek hata çıkışı ve
beklenen mesaj doğrulandı. **Toplam 10/10 kontrol geçti.**

Bu bütünlük mekanizması yamanın kurulu olduğunu gösterir; **yamanın yeterliliğini
göstermez**. `npm ci` postinstall ve mevcut CI kontrolleri yerinde. Bunları
atlayan bir kurulum veya eski deploy/APK bu kanıttan koruma devralmaz.

## 5. Adversarial inceleme özeti

**Karar: BLOCK (tam düzeltme/yayın kabulü). Bu etiket uzaktan kritik HTTP açığı
kanıtı veya yeni CVSS puanı değildir.**

- **Saboteur / Security Auditor:** Tek tek güvenli görülen grupların birleşimi
  matcher'ı bloke ediyor; mevcut test kapsamı yalnız grup içi belirsizliği yakalıyor.
- **Security Auditor:** Next iç kopyası yama envanterinde yok; önceki sayım tam
  runtime kod envanteri olarak kullanılamaz.
- **New Hire / Security Auditor:** “Kaynak mitigasyonu tamamlandı; yalnız katalog
  engeli var” ifadesi bu yeni kanıtla fazla geniş. Güncel belgelerde kısmi koruma
  ve başarısız kabul açıkça belirtildi; tarihsel kayıtlar silinmedi.

## 6. Yeniden çalıştırılan kontroller

| Kontrol | Sonuç |
|---|---|
| Yeni bağımsız performans doğrulaması | **FAIL: 17/24 timeout**, araç exit 2 |
| Yeni semantik oracle | 432/432 PASS |
| İzole yama bütünlüğü/bozulma kontrolleri | 10/10 PASS |
| Next görüntü validator gözlemi | 12/12 PASS |
| Mevcut mobil testler | 150 / 20 suite PASS |
| Mevcut mobil bağımlılık testleri | 19 PASS |
| Mevcut backend testleri | 64 PASS |
| İki lint / TypeScript | PASS |
| İki npm audit | 0 / 0 |
| Kurulu yama hash kontrolleri | PASS |
| Snyk | Bu incelemede yeniden çalıştırılmadı; aynı paket/lock hashleriyle önceki authenticated rapor 28 mobil / 2 backend yol gösteriyor |
| HawkScan DAST | BLOCKED: CLI 6.6.0/güncel skill mevcut; API key/tarama config yok |

**Standart regresyonların geçmesi yeni FAIL sonucunu kapatmaz.** Yeni araçlar
manuel inceleme araçlarıdır; mevcut CI'ye bağlanmadı. Yerel Node sürümü kanıtta
kayıtlı; CI Node22, iOS/Hermes/Android veya başka OS için bu tur performans kabulü
verilmedi. Başlangıçta mevcut olan uygulama/SQL/JSON/paket/lock/yama kaynaklarının
hashleri korundu. Yalnız yeni inceleme araçları, kanıt ve MD eklendi/güncellendi.

## 7. Gerçek yayın riski ve önerilen sonraki iş

1. **Bugünkü son kullanıcı/API yüzeyi:** İncelenen kaynak ve sabit Next ayarları
   için saldırganın deseni kontrol etmesi gösterilmedi. Uzak sömürü riski bu
   kanıtla doğrulanmış değildir; “kullanıcı uygulamayı açınca saldırabilir” denemez.
2. **Geliştirme/CI ve yapılandırma:** Glob desenini kontrol eden kötü niyetli
   repo/bağımlılık ayarı ile yerel CPU DoS üretilebildi. Mevcut yama tam değil.
3. **Dağıtılmış sürüm:** Güncel APK/IPA/server çıktısı ve hosting ayarları bu tur
   incelenmedi. Kaynak için elde edilen sonuç dağıtılmış sürüme taşınamaz.

**Yayın engeli sürüyor.** Sonraki teknik iş, rastgele yeni matcher denemek değil:

- Ardışık gruplar dahil genişletilmiş saldırı ailesini mevcut yamanın güvenlik
  kabulüne eklemek; semantik ve performans kontrolünü birlikte geçiren düzeltme
  geliştirmek veya bu kapsamı sağlayan doğrulanmış upstream düzeltmesini almak.
- Next'in iç kopyasını ayrı hedef olarak ele almak; ilgili Next düzeltmesini veya
  bütünlüğü denetlenen, uyumluluğu doğrulanmış kapsamlı düzeltmeyi değerlendirmek.
- Düzeltmeden sonra mevcut kontrollerin yanında **bu yeni FAIL'leri de** kapatmak;
  temiz kurulum ve kapsam envanterini yeniden doğrulamak. Snyk kapanışı ayrıca
  doğrulanmalı; ignore/yeniden adlandırma güvenlik düzeltmesi değildir.
- Sonraki ayrıca onaylı build/deploy aşamasında gerçek artifact/hosting kontrolü
  yapmak. Bu rapor build/deploy yetkisi vermez.

Bu tur inceleme kapsamıyla sınırlı kaldı; mevcut yamalar kaldırılmadı veya
genişletilmedi. Düzeltmenin yeterliliği ve release kabulü açık kaldı.

## 8. Tekrar üretim / kanıt

```sh
CHEF_REACHABILITY_EVIDENCE=/private/tmp/chef-reachability.json node scripts/picomatch-reachability-review.cjs
CHEF_REVIEW_EVIDENCE=/private/tmp/chef-picomatch-verification.json node scripts/picomatch-independent-verification.cjs
CHEF_INTEGRITY_EVIDENCE=/private/tmp/chef-picomatch-integrity.json node scripts/picomatch-integrity-review.cjs
```

İkinci komut bilinen başarısızlıklar nedeniyle exit **2** döndürür; bunu PASS
olarak çevirmeyin. Alt süreçler süre sınırında öldürülür. İlk/üçüncü komut ağ,
dotenv, AI veya uzak veritabanına erişmez; geçici fixture'lar finally ile silinir.

Kanıtlar aynı dizinde: `picomatch-reachability-2026-10-20.json`,
`picomatch-independent-verification-2026-10-20.json`,
`picomatch-integrity-review-2026-10-20.json`,
`picomatch-review-summary-2026-10-20.json`.
