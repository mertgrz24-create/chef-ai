> Güncel durum: backend artık aynı uygulama reposunda `chef-ai/backend/` altındadır. Aşağıdaki üç repo kayıtları tarihsel; aktif rehber `docs/MONOREPO.md`.

# Chef-AI Backend — İlerleme

## 16 Ekim 2026 — bağımsız backend repo

Mobil API ve sunucu ayarları tanıtım reposundan ayrıldı. Kaydedilmemiş güvenlik/AI düzeltmeleri korundu. API yolları, Supabase şeması, mevcut anahtarlar ve staging domaini korunuyor. Gerçek `.env.local` Git dışında 0600 olarak taşındı. Repo'lar arasında dosya sistemi bağımlılığı yok.

Ayrımda yeni build/deploy yapılmadı. Mevcut hosted staging önceki artefakt üzerinden çalışmaya devam ediyor; yerel API bu repoya taşındı. Ayrıntı ve sınırlar: `docs/REPOSITORY_SPLIT.md`. Önceki web/mobil kronoloji mobil repo `PROGRESS.md` içinde; eski web notları `docs/WEB_HISTORY_BEFORE_SPLIT.md` içinde tarihsel kanıttır.

Backend GitHub özel repo olarak oluşturulup kaynak gönderildi.36 güvenlik ve8 yerel/hosted sentetik entegrasyon kontrolü geçti. Web/mobile uzak repolarına gönderim yapılmadı; otomatik build tetiklenmedi. Ayrıntı ve DAST sınırı: docs/REPOSITORY_SPLIT.md.
