# AGENTS.md — Chef-AI uygulama reposu

Bu repo mobil istemciyi ve onun backend'ini birlikte içerir:

- `mobile/`: Expo/React Native uygulama. Kurallar: [mobile/AGENTS.md](mobile/AGENTS.md).
- `backend/`: Mobil HTTP API, AI servisleri, Supabase sunucu erişimi, migration ve e-posta şablonları. Kurallar: [backend/AGENTS.md](backend/AGENTS.md).
- `chef-ai-web` ayrı reposu: yalnız tanıtım sitesi ve statik davet sayfası.

## Sınırlar

- Mobil ve backend ayrı package.json/lock dosyaları, bağımlılıklar ve çalışma ortamları kullanır. Root'ta workspace/hoisting yoktur; kurulumları ilgili dizinde çalıştır.
- Mobil backend'e yalnız `EXPO_PUBLIC_API_URL` üzerinden HTTP ile bağlanır. Mobil koddan backend dosyalarını import etme, Metro'ya backend'i ekleme.
- Sunucu anahtarları yalnız `backend/.env.local` ve backend hosting ortamlarında bulunur. Root/mobile dotenv dosyalarına taşıma; public değişkene koyma. `.env.local`, node_modules, .next ve .vercel Git dışında kalır.
- Supabase şemasının aktif sahibi `backend/supabase/` dizinidir. Şema/ortam değişikliği kendiliğinden production'a uygulanmaz.
- Yerel API backend dizininden 127.0.0.1:3000'de; tanıtım sitesi ayrı reposunda3001'de çalışır. Staging API adresi ve mevcut APK korunur.
- Kullanıcının yeni build almama talimatı devam ediyor. Build, deploy veya uzak main'e push ile otomatik yayın tetikleme.
- `PROGRESS.md` kronolojik geçmişi korur. Eski web+API/üç repo kayıtları tarihsel; güncel düzen mobile+backend aynı repodur.
