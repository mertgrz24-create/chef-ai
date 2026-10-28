# Chef-AI — Mobil uygulama ve backend

```text
chef-ai/
  mobile/     Expo / React Native istemci
  backend/    Next.js HTTP API ve sunucu servisleri

chef-ai-web/  Ayrı repo: yalnız tanıtım sitesi
```

Mobil ve API aynı Git reposunda, ayrı uygulamalar olarak yönetilir. Mobil kod backend'i import etmez; `EXPO_PUBLIC_API_URL` üzerinden HTTP ile bağlanır. Kurulum ve bağımlılık dosyaları ayrı tutulur; root'ta ortak npm kurulumu gerekmez.

## Yerel geliştirme

Mobil için `mobile/` içinde `npm ci`, `npm run env:check`, `npm start` kullanılır. Public staging ayarları `mobile/.env` içindedir. Kaynak artık Expo 58 / React Native 0.88 kullanır; mevcut Expo 57 APK yeni kaynakla uyumlu değildir. Yeni build/deploy yapılmadı, OTA kapalıdır. [Bağımlılık geçişi ve kontrol durumu](mobile/security/PACKAGE_REPLACEMENTS_2026-10-16.md).

API için `backend/` içinde `npm ci`, `npm run env:check`, `npm run dev -- --hostname 127.0.0.1 --port 3000` kullanılır. Mevcut makinede `.env.local` zaten hazırdır; şablonla ezme. Gemini/Supabase sunucu anahtarları yalnız bu dosyadadır (0600, Git dışında).

Mevcut hosted staging: **https://chef-ai-staging-nu.vercel.app**. Mobil varsayılanı bu adrestir. Yerel API hosted API'ye proxy yapmaz; aynı staging Supabase'e doğrudan bağlanır. `/api/mobile/config` JSON ayarıdır, mobil arayüz değildir.

16 Ekim 2026: backend ayrı repodan `backend/` altına alındı. Yeni build/deploy/push yapılmadı; mevcut staging ve APK değişmedi. Eski `chef-ai-backend` GitHub reposu tarihsel snapshot olarak bırakıldı; aktif geliştirme kaynağı bu repodaki `backend/` dizinidir.

[Yerel geliştirme](mobile/docs/LOCAL_DEVELOPMENT.md) · [Backend rehberi](backend/README.md) · [Güncel mimari ve taşıma](backend/docs/MONOREPO.md) · [Yayın hazırlığı](mobile/docs/RELEASE_READINESS.md)
