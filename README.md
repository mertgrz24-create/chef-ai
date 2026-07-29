# Chef-AI — Mobil App

Bu repo Chef-AI'ın mobil uygulamasını (`mobile/`, Expo/React Native) içerir. Web sitesi ve API backend'i ayrı bir repo'da: [chef-ai-web](https://github.com/mertgrz24/chef-ai-web).

## Geliştirme

```bash
cd mobile
npm install
npx expo start
```

Detaylar için [mobile/README.md](mobile/README.md).

## Diğer repo

Chef-AI'ın Next.js sitesi + API'si (`app/api/...`) [chef-ai-web](https://github.com/mertgrz24/chef-ai-web) repo'sunda. Mobil app, prod'daki API'ye `EXPO_PUBLIC_API_URL` üzerinden HTTP ile bağlanır — iki repo arasında dosya-sistemi bağımlılığı yoktur.
