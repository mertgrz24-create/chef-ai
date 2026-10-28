# Kullanıcıdan beklenenler — 19 Ekim 2026

> **20 Ekim son durum:** İki yerel araç bulgusu düzeltildi; authenticated Snyk Code kök taraması 0 bulgu. Bu kontroller için kullanıcıdan yeni Snyk hesabı/anahtarı gerekmiyor. Picomatch teknik engeli açık (güncel 28 mobil / 2 backend yol ve 17 timeout). Risk kabulü yapılmadı; build/deploy için ayrıca onay sınırı sürüyor. [Kanıt](../../backend/security/THREE_SNYK_FINDINGS_2026-10-20.md).

Yerel teknik kontroller ve staging AI akışları tamamlandı; nihai yayın kabulü açık. Production'a geçiş veya yeni mobil build için bu liste otomatik izin değildir. Parola, anahtar ve kurtarma kodunu sohbete gönderme.

1. **Yayıncı/yasal:** Bireysel veya şirket tercihi, gerçek yayıncı adı, destek e-postası, sahip olunan alan adı ve TR/EN hukuki metin onayı. Destek/olay sorumlusu ve veri saklama kararlarını kesinleştir.
2. **Markalı e-posta:** SMTP sağlayıcı/gönderici alan adı erişimi ve DNS yetkisi sağla; gerçek doğrulama ve parola sıfırlama gelen kutusu testine katıl.
3. **Mağaza/Premium:** Apple Developer, Play Console, Expo/EAS ve RevenueCat proje erişimleri; aylık ürün/fiyat ve Premium kullanım haklarını kesinleştir. Scan/Premium sayıları kendiliğinden seçilmeyecek. Kimlik/sözleşme/vergi/banka işlemlerini hesap sahibi yapmalı.
4. **İzleme/bildirim:** Sentry proje erişimi; bildirimler açılacaksa APNs/FCM/Expo erişimleri ve gerçek cihazlar. İsteğe bağlı kullanım analitiği kapalı kalabilir.
5. **Güvenlik:** Bağımsız yama/kripto incelemesi ve yetkili API DAST erişimi sağla. Ücretli HawkScan açmak zorunlu değil; şu an tarama erişimi yok. Güncel npm audit iki tarafta0, kaynak/geçmiş secrets0; bunlar bağımsız/native kabul yerine geçmez.
6. **Cihaz/beta:** Hazır olduğunda güncel kaynak için yeni test build'ine ayrıca izin ver. Eski Expo57 APK yeni Expo58 kaynak değişikliklerini içermez. TR/ABD yetişkin testçiler ve iOS/Android cihazlarla görev testlerine katılım sağla; sandbox'ta gerçek ödeme gerekmez.
7. **Production ve son gönderim:** Production işlemlerine ayrıca açık onay ver; yedek hedefi, saklama/kurtarma ve operasyon sorumlularını belirle. Mağaza beyanları, inceleme hesabı ve final gönderimini gerçek bilgilerle onayla.

Staging backend geçişi ve saatlik temizlik **17 Ekim'de önceki açık izinle tamamlandı**; yeniden bu izin istenmiyor. 19 Ekim kontrolünde57 doğal saatlik çalışma başarılı. Bu tur production değişikliği, deploy, yeni build veya gerçek AI testi yapılmadı. Mevcut sayısal limitler ve paketler korundu.

Ayrıntı: [Güncel yayın engelleri](RELEASE_BLOCKERS_2026-10-19.md).


## 20 Ekim takip notu

UI polish kaynakta tamamlandı; yeni build alınmadı. Güncel Snyk taraması tek ortak yüksek picomatch advisory gösteriyor (mobil28/backend2 yol); güvenlik kabulü yeniden açık. Paketler korundu, bulgu bastırılmadı. Kullanıcıdan gizli bilgi istenmiyor; bu ayrı bağımlılık düzeltmesi olarak takip edilmeli. Ayrıntı: UI_POLISH_2026-10-20.md.

## 20 Ekim — picomatch kaynak düzeltmesi

Yerel ReDoS mitigasyonu7kopyada tamamlandı; temiz kurulum ve regresyonlar geçti. Snyk tüm sürümleri eşleştirmeye devam ettiği için bulgu açık. Kullanıcıdan yeni parola/hesap erişimi istenmiyor; upstream sürüm/katalog kapanışı ayrıca izlenmeli. Ignore veya risk acceptance yapılmadı. Yeni build/deploy yok. Ayrıntı: ../security/PICOMATCH_REMEDIATION_2026-10-20.md.


## 20 Ekim — erişilebilirlik ve yama doğrulaması: teknik iş hâlâ açık

Yeni bağımsız test kurgusu mevcut yamanın tam olmadığını gösterdi: ardışık tekrarlar7kopyada süre aşımı, ayrıca Next iç kopyası kapsam dışında. Mevcut API/mobil kaynakta kullanıcı kontrollü glob deseni yolu gösterilmedi; bu uzaktan sömürü kanıtı değil. Yayın engeli yalnız Snyk etiketi olarak ele alınmamalı. Bu teknik düzeltme için kullanıcıdan yeni hesap/anahtar gerekmiyor. Sonraki iş genişletilmiş matcher koruması ve Next iç kopyasının doğrulanması; gerçek artifact kabulü daha sonra ayrıca onaylı build/deploy gerektirir. Bu tur yalnız inceleme, yerel test araçları ve belgeler değişti; mevcut yamalar korundu. Rapor: ../../backend/security/PICOMATCH_REACHABILITY_REVIEW_2026-10-20.md.
