> **20 Ekim son inceleme — KISMİ KORUMA / YAYIN ENGELİ:** Ardışık tekrar grupları yamalı 7 kopyada süre aşımı üretiyor; Next.js içinde yama listesinde olmayan bir kopya da bulundu. Sorun yalnız katalog etiketi değil. İncelenen API kaynaklarında kullanıcı kontrollü desen yolu gösterilmedi. [Yeni erişilebilirlik ve yama incelemesi](../../backend/security/PICOMATCH_REACHABILITY_REVIEW_2026-10-20.md). Aşağıdaki önceki test sonuçları tarihsel kapsamıyla korunmuştur.

# Picomatch ReDoS kaynak düzeltmesi — 20 Ekim 2026

## Sonuç

**SNYK-JS-PICOMATCH-21248802 / CVE-2026-112366 için kaynak mitigasyonu uygulandı. Snyk katalog bulgusu açık.** Yeni authenticated Snyk taraması mobilde28, backend'de2bağımlılık yolunda aynı tek yüksek advisory'yi gösteriyor. Ignore/suppression, risk acceptance, paket yeniden adlandırma veya sürüm uydurma yok. Temiz Snyk sonucu iddia edilmiyor.

npm registry sorgusunda son resmi sürüm4.0.7. Advisory tüm sürümleri(*) eşleştiriyor; fixedIn boş. Üretici PR194 açık ve başlığı parser wildcard davranışını düzeltmekle ilgili; tüm bu saldırı sınıfını kapatan yayımlanmış çözüm olarak kabul edilmedi. Sırf tarayıcıyı susturmak için doğrulanmamış fork/alternatif matcher kullanılmadı. Sürümler ve lock dosyaları bu turda değişmedi.

## Kaynak düzeltmesi

Mevcut postinstall/hash yama mekanizması kullanıldı:

- Mobilde5parse.js kopyası: anymatch, jest-util, micromatch ve readdirp altındaki2.3.2 ile kökteki4.0.7.
- Backend'de2kopya: fast-glob altında4.0.7 ve tinyglobby altında4.0.4.
- Tek branch olsa da tekrarlı extglob gövdesinde sınırsız wildcard/quantifier ve iç içe grup/brace belirsizliği mevcut risky-pattern literalization yoluna girer.
- Çoklu alternatiflerde karmaşık branch'ler literalize edilir. Düz metin alternatiflerinde yalnız aynı karakter tekrarları yerine genel prefix çakışması da saptanır; +(ab|abab) kaçışı kapanır.
- Yeni belirsizlik koruması opsiyonel recursion limitinden önce çalışır; maxExtglobRecursion:false ile bu güvenlik kontrolü kapatılamaz.
- Normal glob yıldızları, standart uzantı/brace eşleşmesi ve tekrarlı olmayan extglob davranışı korunur. Riskli/karmaşık tekrarlı extgloblar artık regex tekrarı yerine literal yorumlanır; bu bilinçli uyumluluk sınırıdır. Tüm olası kullanıcı regex'leri için genel doğrusal zaman garantisi iddia edilmez.

Her kopyanın upstream dosya SHA256'sı ve yamalı SHA256'sı manifestte. Bilinmeyen içerikte postinstall/check başarısız olur. Önceki6mobil bütünlük/yama girdisi ve1backend glob uyumluluk yaması aynen korundu. İki temiz npm ci kurulumunda orijinaller doğrulandı ve yamalar yeniden uygulandı; paket/lock, uygulama kaynakları, quota/AI lifecycle ve SQL hashleri korundu.

## Tekrar üretim ve regresyon

Düzeltmeden önce +(*a) ve suffix'li tekrarlı wildcard örnekleri ayrı Node sürecinde süre aşımını yeniden üretti. Her test süreci2saniyeyle sınırlı; ana test sürecinin bloke olması önleniyor.

Düzeltmeden sonra kurulu7kopyada11saldırı biçimi, uzun başarısız girdiler ve capture/fastpaths/recursion-limit seçenekleri geçti. Normal brace/uzantı/dotfile/negation/escape/Windows path, scan/parse/makeRe ve güvenli literal alternatifler de kontrol edildi. ? ile başlayan ve mevcut parser tarafından tekrarlı extglob olarak tanınmayan biçimlerde bounded-match kontrolü var; ilgisiz wildcard parser özelliği değiştirilmedi.

Gerçek tüketiciler: micromatch, anymatch, readdirp, dosyadan Tailwind/PostCSS sınıf keşfi, tinyglobby ve mevcut Next ESLint fast-glob adapter'ı PASS. Yeni test yardımcısı scripts/picomatch-regression.cjs; mobil/backend test:security içine bağlandı. Yardımcı dosya değişimi de iki mevcut CI kontrolünü tetikler; uzakta workflow çalıştırılmadı.

| Kontrol | Sonuç |
|---|---|
| Temiz npm ci, iki repo | PASS |
| Mobil uygulama testleri |150test /20suite PASS |
| Gerçek bağımlılık güvenlik testleri |19PASS (önceki17korundu) |
| Backend güvenlik/API testleri |64PASS (önceki62korundu) |
| Lint ve TypeScript, iki repo | PASS |
| npm audit, dev dahil | mobil0 / backend0 |
| Snyk test --dev, yeniden | FINDINGS: aynı tek yüksek picomatch advisory;28mobil/2backend yol |
| Secrets/ortam şablonu regresyonları |3PASS |
| Gitleaks8.30.1,410kaynak dosya / yerel Git geçmişi |0 /0 |
| HawkScan DAST | BLOCKED:6.6.0 ve güncel skill mevcut, API key/proje tarama ayarı yok |
| Native/build/deploy/gerçek AI | NOT RUN; bu görevde başlatılmadı |

## Yayın durumu ve takip

Kaynak mitigasyonu ve kurulum/regresyon kanıtı hazır; **Snyk sürüm/katalog kapanışı tamamlanmadı**. Upstream güvenli sürümün yayımlanması/tanınması veya kapsamlı incelenmiş gerçek bir alternatifle kaldırma gerekir. Yerel yama nedeniyle advisory false-positive/accepted olarak işaretlenmedi. Nihai güvenlik/yayın kapısı pending kalır.

Production, hosted staging, mevcut APK, API/veritabanı ve kullanıcı verileri değiştirilmedi. Yeni mobil/backend build, deploy, OTA, push, uzak migration, ücretli servis veya gerçek AI çağrısı yok. Önceki UI polish ve güvenlik düzeltmeleri korunur.

Kanıt: mobile/security/picomatch-remediation-2026-10-20.json. Raw raporlar her paketin security dizininde snyk-picomatch-2026-10-20.json ve audit-picomatch-2026-10-20.json. Tarihsel UI taramaları silinmedi.

Üretici kaynakları: https://github.com/micromatch/picomatch/pull/194 ; https://github.com/micromatch/picomatch/issues/175 . Advisory kaynağı: authenticated Snyk CLI JSON (web sayfası bu oturumda erişilemedi). Registry doğrulaması: npm view picomatch dist-tags versions --json.


## Follow-up: isolated backend replacement trial (2026-10-20)

Minimatch10.2.6 was tested outside the runtime dependency tree and rejected:
45/53 compatibility comparisons equivalent, eight different; five bounded
security probes timed out for the candidate and none for the patched baseline.
Fresh backend Snyk still reports the same advisory on two dependency paths.
No dependency/lock/patch changes, build or deploy. Full evidence:
[Backend compatibility trial](../../backend/security/PICOMATCH_COMPATIBILITY_TRIAL_2026-10-20.md).


## Follow-up: independent non-backtracking engine (2026-10-20)

Globrex0.1.2 + RE2JS2.8.8 was tried outside the application dependency tree.
Eight repeated-extglob probes completed and one malformed pattern was explicitly
rejected without timeout. However, 15/55 compatibility comparisons differed,
including Micromatch's private utility API; the candidate was not promoted.
Fresh mobile Snyk still shows28paths, including the Tailwind → Chokidar →
Anymatch → Picomatch path associated with package.json line49. Existing source
mitigation and package/lock files remain unchanged.
[Full RE2 trial and verification](../../backend/security/PICOMATCH_RE2_TRIAL_2026-10-20.md).
