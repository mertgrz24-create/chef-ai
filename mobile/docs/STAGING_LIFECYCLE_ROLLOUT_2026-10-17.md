# Staging yaşam döngüsü geçişi — 17 Ekim 2026

## Sonuç ve ortam sınırı

Açık kullanıcı izniyle değişiklikler staging'e uygulandı. Sabit API: https://chef-ai-staging-nu.vercel.app.

Supabase: chef-ai-staging / vcyqtbzhfanbpclfhibv. Vercel: chef-ai-staging / prj_vWhn3DiZQH0XwiEAyZ4RKGA4SB2T. Vercel Hobby planı ve Fluid compute doğrulandı. Bu ayrı staging projesinin sabit adresi Vercel'de teknik olarak production target kullanır; gerçek uygulama production'ı değildir. Yalnız bu proje/DB'ye işlem yapıldı. Yeni mobil build, OTA veya Git push yok. Yeni ücretli servis/plan açılmadı. Mobil APK değişmedi.

## Geçiş kanıtı

Eski AI girişi geçici durduruldu ve pending iş0 doğrulandı. Pantry revision ile lifecycle migration'ları uygulandı. Backend dotenv/cache/özel dosya içermeyen izole snapshot'tan dağıtıldı; mevcut staging sırları korundu. Yeni dağıtım READY olduktan ve staging config doğrulandıktan sonra staging alan adları yönlendirildi.

Yeni deployment: dpl_BQ3DtEYmjqvt44t6gy3HcSfEBWPs. Önceki: dpl_GovLsMia88j1dCSkmUS2zpVTgMJ5.

Uzak migration geçmişi8→12; base schema ve operasyonel checkpoint'ler dahildir:

- 20261017110840 staging_ai_lifecycle_rollout_pause
- 20261017110934 pantry_revision
- 20261017110937 mobile_ai_lifecycle
- 20261017111028 staging_hourly_ai_cleanup

Kaynak SQL dosyalarının tarih damgaları ile uzak uygulama zamanları farklıdır; SQL/ad eşleştirmesi yapıldı. begin_mobile_ai_v2 ve dispatch başına atomik genel izin aktif. Eski giriş fonksiyonu yeni iş başlatmayı reddederek yarım rollback sırasında ölçümsüz çağrıyı engeller.

## Saatlik temizlik

Supabase pg_cron1.6.4: chef-ai-staging-ai-cleanup, jobId1, active=true,0 * * * * UTC. Her saatin başında cleanup_mobile_ai çalışır. Yalnız bu görevin90günden eski çalışma günlükleri de temizlenir. Cron şemasına authenticated erişimi yok. Vercel cron kapalı kaldı; HTTP isteğinde sunucu anahtarı taşıyan bir zamanlayıcı kurulmadı.

Gerçek scheduler teslimini doğrulamak için aynı görev kısa süre5s aralıkta çalıştırıldı:3 execution succeeded. Ardından saatlik düzene geri alınıp active/schedule tekrar okundu. Doğal sonraki saat başı beklenmedi. Operasyonel tanım backend/lib/mobile/staging-ai-cleanup.sql; generic HTTP örneği aktif staging görevi değildir.

## Gerçek akışlar

Kullanıcı en fazla4 gerçek AI işi /8 sağlayıcı çağrısını ayrıca onayladı. Test4 iş ve4 gerçek sağlayıcı çağrısıyla tamamlandı;503 tekrarı gerekmedi. Model ve sayısal limitler değiştirilmedi. Token metadata'sı doğrulandı; eksik thinking/cache ve parasal ücret bilinmiyor kaldı. Fatura/ücret0 iddiası yoktur.

13 HTTP/entegrasyon kontrolü geçti:

- Auth olmadan durum erişimi reddi ve AI aktarım izni olmadan üretim engeli.
- Kiler oluşturma/revision; paralel aynı revision ile200+409; diğer hesapta404/boş liste.
- Gerçek Türkçe metrik tarif ve kalıcı sonuç.
- Durum GET'i ve aynı anahtarla replay: aynı sonuç; ek çağrı/hak tüketimi yok.
- Özel tarif kaydı, mükerrer kayıt koruması, yeniden girişte geçmiş ve hesap izolasyonu.
- Google'ın herkese açık yemek fotoğrafıyla gerçek analiz.
- Gerçek7gün/14öğün plan üretimi ve yeniden okuma.
- Gerçek tek akşam öğünü yenilemesi; plan kimliği ve diğer öğünler korundu.
- Haklar: tarif1, Scan1, plan+yenileme2.
- Sentetik süresi dolmuş iş: tek iade, diğer hesapta not_found ve geç plan yazmasının reddi.

İki kendi sentetik hesabı için gerçek DELETE /api/account başarılı oldu. Son SQL kontrolünde auth/job/ölçüm kalanı0. Mevcut kullanıcılar değiştirilmedi. Admin-confirmed test hesapları kullanıldı; gerçek SMTP/e-posta teslimi test edilmedi. Kişisel fotoğraf kullanılmadı.

## Saklama ve güvenlik

Staging'de ayrı rollback transaction'ı ile kendi sentetik kayıtlarında24saat yanıt erişim kesilmesi/temizlik,30gün özet silinmesi,90gün ölçüm saklama, hesap silme ve güncel genel sayacın korunması doğrulandı. Transaction rollback edildi.

Yeni AI RPC'lerinde istemci EXECUTE izinleri kapalı. Supabase advisors0 ERROR; değiştirilmemiş2 WARN: authenticated apply_referral SECURITY DEFINER çağrısı ve kapalı leaked-password protection.11 INFO istemciye kapalı sunucu tablolarının RLS/client policy durumudur; gereksiz client erişimi açılmadı. Bu rapor bağımsız güvenlik/DAST onayı değildir. HawkScan oturumu/anahtarı olmadığı için DAST yapılmadı.

Backend61 test ve lint yeniden geçti. Önceki134mobil/17bağımlılık yerel kanıtı önceki rapordadır; bu tur native cihaz testi yapılmadı. Production, SMTP, billing, native, beta ve mağaza kapıları açık kalır. Yeni mobil kaynak arayüzü telefondaki eski APK'ya uygulanmış sayılmaz.

## Geri dönüş ve kanıt

Kritik sorunda yalnız staging AI kapatılıp veri okumaları korunmalı. Eski backend'e AI açıkken kör rollback yapılmamalı; legacy guard yeni iş başlatmaz. Genel sayaç/iade kayıtları sıfırlanmamalı. Production'a otomatik geçiş yoktur.

- mobile/security/staging-lifecycle-2026-10-17.json:13 kontrol, hedef, cleanup, migration/cron kanıtı.
- mobile/security/staging-lifecycle-provider-2026-10-17.json: içeriksiz4 dispatch/token/kullanım kanıtı.
- backend/lib/mobile/staging-lifecycle-acceptance.cjs: açık yetki bayrağı,4iş sınırı ve staging kimlik kontrolü; otomatik CI'ya bağlanmadı.

## 19 Ekim — doğal saatlik çalışmanın takip kanıtı

Salt okunur staging kontrolü:57 doğal saat başı çalışması (ilk17Ekim12:00UTC), önceki3hızlı doğrulama dahil60başarı/0hata. Son tamamlanma19Ekim20:00:00UTC. Görev aktif/saatlik; expired pending0. Bu takipte görev değişikliği, yeni migration/deploy veya AI çağrısı yok. Güncel durum: RELEASE_BLOCKERS_2026-10-19.md.
