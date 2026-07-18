# Chef-AI — EAS Build & Store Yayını Rehberi (M6)

Bu rehber, `mobile/` (Expo/React Native) uygulamasını gerçek bir `.ipa`/`.apk`'ye
dönüştürüp App Store ve Google Play'e göndermenin adımlarıdır. Kod hazır; buradaki
işler hesap + imzalama + build operasyonu.

> Tüm komutlar `mobile/` klasöründe çalıştırılır.

---

## 0. Ön koşullar (kod-dışı, senin hesapların)

| Gerekli | Ne için | Maliyet |
|---------|---------|---------|
| **Apple Developer** hesabı | App Store | 99 USD / yıl |
| **Google Play Developer** hesabı | Play Store | 25 USD / tek sefer |
| **Expo (EAS)** hesabı | Build servisi | Ücretsiz başlar |
| Node 18+ | zaten kurulu | — |

```bash
npm install -g eas-cli   # veya: npx eas-cli@latest ...
eas login                # Expo hesabınla giriş
```

---

## 1. EAS projesini oluştur (⚠️ push'u da bu aktifleştirir)

```bash
eas init
```

Bu komut `app.json`'a `extra.eas.projectId` yazar. **Bu projectId, push
notification token alımını da otomatik açar** — `src/lib/notifications.ts` şu an
projectId olmadığı için token almayı atlıyor; bu satır gelince alacak.

Değişikliği commit et:
```bash
git add app.json && git commit -m "chore(mobile): eas init - projectId"
```

---

## 2. Ortam değişkenleri (build'e gömülecek)

Uygulama 3 `EXPO_PUBLIC_*` değişkenine ihtiyaç duyar. Lokalde bunlar
`mobile/.env`'de (git'e girmez). Build sunucusunda `.env` **yok**, o yüzden bunları
EAS'e tanıtman gerekir:

```bash
# EXPO_PUBLIC_* değerleri gizli değil (zaten client'a gömülür) ama env olarak tut
eas env:create --name EXPO_PUBLIC_SUPABASE_URL       --value "https://<proje>.supabase.co"  --environment preview --environment production
eas env:create --name EXPO_PUBLIC_SUPABASE_ANON_KEY  --value "<anon-key>"                   --environment preview --environment production
```

`EXPO_PUBLIC_API_URL` zaten `eas.json`'da preview/production için ayarlı
(production Vercel URL'i). Değerleri `mobile/.env`'den kopyalayabilirsin.

> **🚨 Kritik bağımlılık:** `eas.json` preview/production `EXPO_PUBLIC_API_URL`'i
> `https://chef-ai-puce-zeta.vercel.app`'e bakıyor. Ama **o deployment (main)
> henüz M1'in Bearer auth'unu içermiyor** → build'ler login sonrası 401 alır.
> **Önce `next16-upgrade → main` merge edilip deploy edilmeli**, yoksa store
> build'i çalışmaz. (Alternatif: geçici olarak `us-market`/`next16-upgrade`
> branch'ini production'a al.)

---

## 3. Build profilleri (`eas.json`)

| Profil | Ne üretir | Ne için |
|--------|-----------|---------|
| `development` | dev-client (simulator dahil) | Kod yazarken canlı geliştirme |
| `preview` | internal — Android **APK**, iOS ad-hoc | Gerçek cihazda test (store'suz) |
| `production` | store paketi (`autoIncrement`) | App Store / Play Store |

`appVersionSource: remote` → `buildNumber`/`versionCode` EAS tarafında otomatik
artar; elle sürüm yönetmene gerek yok. Kullanıcıya görünen `version` (`1.0.0`)
`app.json`'da senin kontrolünde.

---

## 4. İlk gerçek-cihaz testi (preview)

```bash
# Android APK (telefona doğrudan kurulur)
eas build --profile preview --platform android

# iOS (cihazını Apple Developer'a kaydetmen gerekir)
eas build --profile preview --platform ios
```

Build bulutta çalışır; bitince indirme linki verir. APK'yi Android telefona
kur, giriş yap, akışları dene (Gemini kredisi + main-merge şartıyla).

İlk build'de EAS imzalama anahtarlarını **senin adına oluşturmayı** teklif eder →
"yes" de (EAS keystore/certificate'ı yönetir; manuel uğraş yok).

---

## 5. Production build + store'a gönderim

```bash
# 1) Store paketlerini üret
eas build --profile production --platform all

# 2) eas.json > submit.production alanlarını doldur:
#    ios:  appleId, ascAppId (App Store Connect'te app oluşturunca gelir), appleTeamId
#    android: google-service-account.json (Play Console > API erişimi) + track
# 3) Gönder
eas submit --profile production --platform ios
eas submit --profile production --platform android
```

**Store tarafında ayrıca gereken (manuel, konsollarda):**
- App Store Connect'te uygulama kaydı (isim, kategori: Food & Drink, gizlilik
  politikası URL'i, ekran görüntüleri, açıklama)
- Play Console'da uygulama kaydı + içerik derecelendirme + veri güvenliği formu
- İkonlar/splash zaten `assets/` içinde (gerekirse markaya göre güncelle)

---

## 6. Push notification'ı canlıya alma (M5'i tamamlar)

Kod hazır; şunlar yapılınca uçtan uca çalışır:
1. **`eas init`** yapıldı → `projectId` var → token alınıyor (Adım 1)
2. Supabase SQL Editor'da **`supabase/migrations/20260718_create_push_tokens.sql`**
   çalıştırıldı (bu tablo olmadan `/api/push/register` 500 verir)
3. **Vercel'e `CRON_SECRET`** env eklendi (Production) → günlük cron korunur
4. Kullanıcı bildirim iznini verdi → token `push_tokens`'a yazılıyor → cron
   yarın bozulacak malzemeler için Expo Push gönderiyor

---

## ✅ Yayın öncesi kontrol listesi

- [ ] `eas init` yapıldı, `projectId` app.json'da + commit'lendi
- [ ] `EXPO_PUBLIC_*` env'ler EAS'e tanıtıldı (preview + production)
- [ ] **`next16-upgrade → main` merge + deploy** (deployed API Bearer içersin) ⚠️
- [ ] Supabase migration'ları çalıştı (`referral_and_usage_rpc` + `push_tokens`)
- [ ] Vercel'de `CRON_SECRET` set
- [ ] **Gemini kredisi** yüklendi (Cook/Scan/Meal-plan)
- [ ] `eas submit` için Apple/Google hesap bilgileri `eas.json`'da
- [ ] Store sayfaları (açıklama, görsel, gizlilik politikası) hazır
