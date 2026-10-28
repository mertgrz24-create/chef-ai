# Cihaz geri bildirimi düzeltmeleri — 16 Ekim 2026

## Bu oturumda yapılanlar

1. Ortak `LegalLinks` içinden hesap silme web bağlantısı kaldırıldı. Giriş/kayıt, onboarding, Premium ve Profile ortak bağlantı listesi artık yalnızca gizlilik, koşullar ve destek içeriyor. Profile en altındaki mevcut kırmızı **Hesabı sil** butonu ve yerel onay penceresi korundu. Bu kırmızı buton tarayıcı açmadan `DELETE /api/account` çağırır.
2. Kullanıcı, silmeye dokununca tarayıcıda uzun yazı gördüğünü açıkladı. Bu davranış, web silme bilgilendirme bağlantısıyla örtüşüyor; gerçek API silmesinin başarısız olduğunu kanıtlamıyor. Kullanıcının gerçek hesabı silinmedi.
3. Staging SQL'de auth kullanıcılarına bağlı 22 yabancı anahtar ve özel trigger tanımları incelendi. Kişisel uygulama kayıtlarında cascade mevcut; Storage nesnesi sayısı sıfır. Postgres hata sorgusunda ilgili kayıt bulunmadı (bu, tüm hataların yokluğu kanıtı değildir).
4. Staging veritabanında tamamen sentetik auth/profil/kiler/tarif verileriyle silme ve cascade doğrulandı; transaction **ROLLBACK** ile kapatıldı. İlk testte zorunlu `expiry_date` eksikliği nedeniyle fixture kurulumu başarısız oldu; fixture düzeltildi ve kontrol geçti. Şema, gerçek kullanıcı verisi ve production değiştirilmedi.
5. Silme API'sine regresyon testi eklendi: kimliksiz istek reddi, üyelik/outbox hatasında işlemi durdurma, silme hatasında başarısız yanıt ve yalnız doğrulanmış çağıran kullanıcı ID'sini silme. API'nin çalışan silme davranışı değiştirilmedi.
6. Beş AI endpoint'inde sağlayıcı yoğunluğu, sağlayıcı kotası, yapılandırma, timeout ve geçersiz çıktı güvenli sabit hata kodlarına ayrıldı. Ortak AI katmanı yalnız izinli hata kodlarını geçiriyor ve idempotency sonucuna kaydediyor; ham sağlayıcı mesajı/anahtar/prompt dönmüyor. Otomatik AI tekrar denemesi eklenmedi.
7. Mobil Cook/Scan/Meal Plan hata metinleri TR/EN olarak bu kategorilere bağlandı. Haftalık planda her 403 yanıtının kota dolumu sayılması düzeltildi; yalnız `limit_reached` bu mesajı gösteriyor.
8. Chef-AI krem/yeşil/lime renkleriyle iki dilli doğrulama ve parola yenileme e-posta HTML şablonları ile SMTP kurulum/kabul rehberi API reposuna eklendi. Supabase'in ürettiği `ConfirmationURL` korunuyor. Şablonlar **kurulmadı/gönderilmedi**.
9. Kullanıcının telefonda doğrulama e-postasını aldığını ve doğrulamanın çalıştığını bildirmesi kanıta işlendi. Bu kullanıcı bildirimi, kontrollü agent testi veya marka adına/kurum dışı alıcıya teslim kanıtıyla karıştırılmadı.

## Kontroller

- Mobil: 12 Jest paketi / **72 test geçti**; Expo lint ve TypeScript geçti.
- API: **34 güvenlik/regresyon testi geçti**; TypeScript geçti; lint 0 hata, önceden mevcut 4 uyarı.
- Gitleaks: mobil 178, API 128 kaynak dosyası; kaynakta ve yerelde bulunan Git geçmişinde **0 bulgu**. Ignore edilen yerel ortam dosyaları ve native çıktılar bu kaynak taramasının dışında.
- Supabase sentetik silme/cascade SQL kontrolü geçti; rollback yapıldı. Gerçek hesabın kırmızı butonla cihazdan silinmesi bu oturumda doğrulanmadı.
- HawkScan için önceki ücretli servis reddi ve kimlik bilgisi yokluğu geçerli; yeni hesap/deneme başlatılmadı. Authenticated DAST kapısı açık kalıyor. Birim testleri DAST yerine sayılmıyor.

## Açık kalanlar

- **AI gerçek servis erişimi:** son hosted kanıt Google 503; bu oturumda yeni canlı üretim başarısı yok. Hosted AI bayrakları kapalı kalıyor. Hata sunumu düzeltildi, sağlayıcı erişimi çözülmüş sayılmıyor. Model/anahtar/ödeme planı sessizce değiştirilmedi.
- **Markalı e-posta:** doğrulanmış gönderici alan adı/From adresi ve SMTP bilgileri gerekli. Kullanıcı alan adı/yasal bilgileri daha sonra vereceğini belirtti. Yeni Free projelerde default SMTP ile şablon değişimi desteklenmiyor; yalnız şablon dosyası eklemek göndericiyi değiştirmez. Production SMTP ve gerçek signup/recovery inbox kabulü açık.
- Mevcut staging bilgi sayfaları üretim hukuki metinleri değildir; mağaza web hesap silme URL alanı sözleşmeden kaldırılmadı.
- RevenueCat/store, push, gerçek cihaz kapsamı, bağımsız güvenlik incelemesi ve önceki yayın kapıları açık kalıyor.

## Dağıtım sınırı

Kullanıcının isteğiyle **yeni build, APK/IPA/AAB, native CI veya backend deploy yapılmadı**. Kod değişiklikleri kaynakta hazırdır; telefondaki mevcut APK'nın arayüzü değişmedi. Yeni AI hata kodları da backend deploy edilene kadar canlı servise yansımaz. Mevcut APK'da gerçek silme eylemi Profile en altındaki kırmızı butondur; onay sonrası hesap ve giriş bilgileri geri alınamaz.

Kaynaklar: [Supabase özel SMTP](https://supabase.com/docs/guides/auth/auth-smtp), [e-posta şablonları](https://supabase.com/docs/guides/auth/auth-email-templates), [Free SMTP şablon değişikliği](https://supabase.com/changelog/46599-changes-to-email-template-customisation-on-free-tier), [Gemini hata rehberi](https://ai.google.dev/gemini-api/docs/troubleshooting).
