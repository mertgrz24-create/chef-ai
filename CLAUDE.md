# CLAUDE.md — Chef-AI (mobil app repo)

Bu repo artık sadece **mobil uygulamayı** (`mobile/`, Expo/React Native) içerir. Web sitesi + API backend ayrı bir repo'da: [chef-ai-web](https://github.com/mertgrz24/chef-ai-web).

Mobil geliştirme kuralları için: [mobile/CLAUDE.md](mobile/CLAUDE.md) ve [mobile/AGENTS.md](mobile/AGENTS.md).

## Repo sınırı

- İki repo arasında dosya-sistemi bağımlılığı yok — mobil app, prod API'ye `EXPO_PUBLIC_API_URL` üzerinden HTTP ile bağlanır (bkz. `mobile/src/lib/api.ts`)
- Supabase şeması (migration'lar) `chef-ai-web` repo'sunda tutulur
- Bu repo'daki `PROGRESS.md`, projenin V1'den beri tüm geçmişini (hem web hem mobil) içerir — kronolojik günlük olarak burada kalıyor
