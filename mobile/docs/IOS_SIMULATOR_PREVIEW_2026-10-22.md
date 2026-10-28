# iOS simülatör önizlemesi — 22 Ekim 2026 kayıt güncellemesi

Bu belge önceki simülatör oturumunun sonuçlarını kaydeder. **22 Ekim'de yeni cihaz oturumu, test, build veya tarama çalıştırılmadı.** Mevcut [20 Ekim staging test paketi](NATIVE_TEST_PACKAGES_2026-10-20.md) kullanıldı; kaynak veya paket değiştirilmedi.

## Doğrulananlar

- iPhone 17 / iOS 26.5 simülatöründe güncel `com.chefai.app` uygulaması açıldı.
- Daha önce hazırlanmış sentetik staging hesabıyla uygulamanın normal giriş akışı kullanılarak giriş yapıldı. Kimlik bilgileri bu belgeye eklenmedi.
- Today, Pantry, Cook, Scan ve Profile ekranları açıldı; mevcut krem, koyu yeşil ve lime arayüz görüntülendi. Son doğrulanan gezinme durumu Today ekranıydı; bu, simülatörün şu anda hâlâ aynı ekranda olduğu iddiası değildir.
- Hesapta Pantry ve kayıtlı tarif içeriği boş göründü. Cook'ta sunucudan gelen ücretsiz tarif hakkı **10/10** ve **1 Kasım 2026 00:00 UTC** yenilenmesi görüntülendi; sayaç politikası değiştirilmedi.
- Gerçek AI üretimi, fotoğraf analizi veya hak tüketen aksiyon başlatılmadı. Bu oturumda sağlayıcı/kota telemetrisiyle ayrı bir sıfır-çağrı testi çalıştırılmadı.

## Ekran kanıtları

Görüntüler simülatör penceresini içerir; fiziksel cihaz veya final mağaza paketi kanıtı değildir. Dosyalar yereldir ve Git dışında kalır.

| Ekran | Yerel görüntü | SHA-256 |
|---|---|---|
| Today | [today.png](../artifacts/build-2026-10-20/ui-preview/today.png) | `8c0b23dbb15676ca7ae3b7be7fc67edee9efbedfa7a47aafdd784f6db91e1837` |
| Pantry | [pantry.png](../artifacts/build-2026-10-20/ui-preview/pantry.png) | `60c5b182542a68b43aa498fbe81ac1cad4b51dba522a595b0dae2a7042701c53` |
| Cook | [cook.png](../artifacts/build-2026-10-20/ui-preview/cook.png) | `655ba92e05746557d93b1ba4c60b90b4b9c29da5ce1e0c0491fe1bad0253718e` |
| Scan | [scan.png](../artifacts/build-2026-10-20/ui-preview/scan.png) | `03ebdc7c883ea853035fdbfe4e1a5b0bd98ac6807cd9a3e6b00cbdff0592306e` |
| Profile | [profile.png](../artifacts/build-2026-10-20/ui-preview/profile.png) | `9bd87039592ad2d949883071def884f97fd6177ec5ef5a2609219abfc3eac08d` |

## Açık kalanlar ve görülen sorun

- **Dil tutarlılığı:** Aynı oturumda Türkçe ve İngilizce metinler birlikte görüldü. Profile'da English seçili görünürken bazı başlıklar/sekme etiketleri Türkçeydi. Kök neden bu önizlemede teşhis edilmedi; düzeltildi veya tam TR/EN kabulü geçti sayılmaz.
- **Dolu içerik:** Tarif fişi, dolu öneri kartları, Pantry düzenleme/silme animasyonu ve Scan önizleme/sonuç geçişi görüntülenmedi. Test hesabına sırf ekran doldurmak için veri eklenmedi veya AI çağrısı yapılmadı.
- **Haftalık plan:** Today'deki plan giriş kartı görüldü; haftalık plan ekranına başarılı geçiş ve öğün detayı bu oturumda doğrulanamadı. Plan üretimi de çalıştırılmadı.
- **Cihaz kabulü:** 60fps ölçümü, Reduced Motion, VoiceOver/TalkBack, kamera/izin dönüşleri, çevrimdışı davranış, yeniden açılışta oturum, ikinci hesap izolasyonu ve fiziksel Android/iPhone kontrolleri bu oturumda test edilmedi. Önceki otomatik test sonuçları bu gözlemlerin yerine geçirilmez.

## Güvenlik ve yayın sınırı

**Picomatch: UNRESOLVED — kısmi mitigasyon mevcut; incelenen uygulama yollarında sömürü gösterilmedi.** Önceki 24 saldırı denemesindeki 17 timeout kapanmadı; B/C düzeltmeleri ve mevcut yamalar korunuyor. Bu önizleme yeni güvenlik taraması, risk kabulü veya yayın onayı değildir.

Yeni build, deploy, uzak migration, production işlemi, ödeme/push/analytics aktivasyonu veya ücretli servis işlemi yapılmadı. [Yayın kontrol listesi](RELEASE_READINESS.md) ve makine tarafından okunan yayın kapıları açık kalır.
