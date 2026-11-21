# Chef-AI — Progress Tracker

> Her seans sonu güncellenir. Yarın geri dönüldüğünde "neredeyiz?" sorusunun cevabı buradadır.

## 📍 Şu an neredeyiz?

**Aktif Faz:** V5 — mobil yayın hazırlığı (Expo/React Native).
**Aktif Mikro-Adım:** TR/EN, auth kurtarma, güvenli API, onboarding/AI izni, özel tarif kaydı adapter’ı, RevenueCat/restore, push/analytics/Sentry ve CI eklendi. Otomatik kontroller geçti; gerçek backend, native release, mağaza ve güvenlik kapıları bekliyor. Yayın hazır sayılmıyor. Ayrıntılar: `mobile/docs/RELEASE_READINESS.md`.

**Son güncelleme:** 15 Ekim 2026

**Canlı URL:** https://chef-ai-puce-zeta.vercel.app — artık `chef-ai-web` repo'sunun `main`'inden deploy oluyor  
**Bu repo'nun kapsamı:** sadece `mobile/` (+ bu proje günlüğü). Next.js kodu (`app/`, `components/`, `lib/`, `types/`, `public/`, `supabase/`) bu repo'dan tamamen silindi — geçmişi hâlâ `git log`'da duruyor, güncel hali `chef-ai-web`'de.

### 15 Ekim 2026 — Krem yüzey paleti
- Kullanıcı isteğiyle beyaz/chalk yüzeyler sıcak krem ailesine çevrildi: zemin `#F5F0E5`, kart/alan/sekme yüzeyleri `#FFF9EF`, ikincil yüzey `#EBE3D3`, ayraçlar `#DDD3C1`. Pantry green ve lime korundu; değişiklik ortak token kaynağından tüm ekranlara yansıyor.

### 15 Ekim 2026 — Açık defter arayüz revizyonu
- Kullanıcı tercihiyle chalk/beyaz yüzeyler, pantry green ana aksiyonlar ve ölçülü lime vurgular uygulandı. Bricolage Grotesque, Instrument Sans ve Space Mono korundu. Redesign Existing Projects, Frontend Design, Design Critique ve Accessibility Review skill yönergeleri yeniden gözden geçirildi; Expo SDK 57 dokümantasyonu incelendi.
- Today tek yemek hazırlama aksiyonu, satır içi kiler özeti ve öncelikli malzemelerle düzenlendi. Pantry listeyle açılıyor; + ile açılan ekleme formu başarılı kayıttan sonra kapanıyor ve klavye gizleniyor.
- Cook üretimden sonra doğrudan tarif sayfasına geçiyor; malzemeleri değiştirme ve eski tarife dönme korunuyor. Ortak tarif sayfası süreler, malzemeler, numaralı yöntem (yanıt numaralıysa), mutfak notu ve besin bilgilerini gösteriyor.
- Haftalık plan yatay gün seçicisi ve iki öğün özetiyle açılıyor; detaylar iOS page sheet içinde ortak tarif bileşenini kullanıyor. Tek öğün/tüm hafta yenileme kilitleri korundu. Scan, Profile, auth ve sekme çubuğu açık yüzeylere uyarlandı.
- Doğrulama: Expo lint ve TypeScript sıfır hata/uyarı; Android Hermes export başarılı. 320×568 ve 390×844 yerel web senaryolarında auth doğrulama/e-posta onayı, pantry ekleme/silme hatası, tarif başarı/hata/limit, plan boş/hata/detay/çift yenileme ve Scan kısmi kayıt/tekrar deneme geçti; tarayıcı çalışma zamanı hatası yok.
- Native örnek veri önizlemesi iPhone 17 Pro ve iPhone 17 simülatörlerinde açıldı; ana ekran, pantry formu, Cook sonucu ve haftalık öğün detayları görsel olarak incelendi. Prod API/AI veya gerçek hesap işlemleri yapılmadı. Android emülatör/SDK olmadığı için Android native görsel kontrolü bekliyor. HawkScan preflight tekrar denendi: hawk CLI ve API anahtarı yok; güvenlik taraması çalıştırılamadı.

### 15 Ekim 2026 — Mobil UI polish
- Mevcut kaydedilmemiş UI taslağı üzerine çalışıldı: renk/tipografi token’ları, ortak Screen/Header/Button/Field/Chip/Card/Ticket ve loading/empty/error/success bileşenleri tamamlandı. İngilizce ve beş sekmeli yapı korundu; API/veri sözleşmeleri değişmedi.
- Today artık yükleme hatasını boş kiler olarak göstermiyor. Pantry’de alan etiketleri, görünür ekleme/silme geri bildirimi ve küçük ekran/klavye açıkken kaydırılabilir ekleme paneli var.
- Cook boş seçimi engelliyor, üretim hatasında mevcut tarifi koruyor, yapılandırılmamış tarif yanıtını da gösteriyor. Ortak RecipeTicket haftalık plan detaylarında da kullanılıyor; çalışmayan Premium CTA eklenmedi.
- Scan: kamera izni ve picker hataları, tekrar analiz, boş sonuç/seçim, limit durumları; kısmi pantry kaydında yalnızca başarısız malzemeler yeniden ekleniyor.
- Meal Plan: ilk yükleme hatası ile 404 boş durum ayrıldı; yenileme istekleri sıraya kilitlendi, eski GET yanıtlarının yeni planı ezmesi engellendi. Profile ve auth: işlem geri bildirimi, alan bazlı doğrulama, e-posta onayı ve hesap silme onayı.
- iOS Expo Go’da Worklets/Hermes native çökmesi gözlendi. Bu ekranların basış/skeleton animasyonları React Native Animated’a taşındı; native giriş ve doğrulama ekranı açıldı, yazılım klavyesiyle kontrol edildi. Sistem reduced-motion tercihi destekleniyor.
- QA: TypeScript + Expo lint + Android Hermes bundle export başarılı; 320×568 ve 390×844 web önizlemesinde yerel sahte API yanıtlarıyla auth doğrulama/onay, pantry ekleme/silme hatası, tarif başarı/hata/limit, plan boş/hata/detay ve çift yenileme, scan kısmi kayıt/yeniden deneme kontrol edildi. Gerçek prod API/AI mutasyonları yapılmadı.
- Native UI önizlemesi: `/private/tmp/chef-ai-ui-preview` altında üretimden bağımsız, yalnızca örnek veri kullanan kopya açıldı. Today/Pantry/Scan/Cook/Profile ve haftalık plan iPhone 17 Pro’da görüntülendi; Cook’ta örnek tarif hazırlandı. Today hızlı işlem kartlarının native’de üst üste gelmesine neden olan iç `flex-1` kaldırıldı; TypeScript ve lint yeniden geçti. Üretim auth/API kodu değiştirilmedi.
- Kalan doğrulama: Android SDK/emülatör bu ortamda bulunmadığından Android ekran görüntüsü alınamadı; kamera/gerçek AI ve push uçtan uca cihaz QA’sı bekliyor. HawkScan CLI ve HAWK_API_KEY yok; DAST taraması çalıştırılamadı.
- Aşağıdaki Temmuz tarihli backend/EAS açık işleri tarihsel kayıt niteliğinde; bu seansta prod ortamında yeniden doğrulanmadı. EAS_BUILD.md içindeki eski Bearer/merge blocker’ı 30 Temmuz repo ayrımı kaydıyla tutarsız, yayın öncesi mevcut backend durumundan doğrulanmalı.

### 🏗️ Mimari kararı (14 Tem 2026)
**Landing = web, App = mobil.** Next.js landing page pazarlama yüzü olarak Vercel'de kalır; asıl uygulama **Expo/React Native** ile indirilebilir mobil app olur (App Store + Play Store). 17 API route + Supabase **ortak backend** olarak iki istemciye de hizmet eder.
- **Next.js dashboard redesign'ı İPTAL** — app RN'e taşınıyor, o iş çöpe giderdi. Dashboard olduğu gibi duruyor (web fallback).
- Neden webview/Capacitor değil: 8/8 dashboard sayfası Server Component + cookie auth → statik bundle'da çalışmaz, veri katmanı zaten baştan yazılmalıydı.
- Expo'nun asıl kazancı: **push notification** (israf uyarılarının can damarı), native kamera, mağaza varlığı.

### ✂️ V5.11 — Web'i pazarlama yüzüne indirgeme + ayrı repo'ya taşıma ✅ TAMAMLANDI
14 Temmuz'daki "landing = web, app = mobil" mimari kararı hem koda hem repo yapısına işlendi. İki aşamada yapıldı:

**1) Marketing-only teardown** (`marketing-only-web` branch, commit `0d39cb4` — bu branch artık tarihi referans, kodu `chef-ai-web`'e taşındı):
- **PWA kurulumu söküldü** — asıl sorun buydu: `manifest.ts` (`display:standalone` + `start_url:/dashboard`) sayesinde kullanıcı siteden kayıt olup telefonuna "app" olarak kuruyordu, native app'e hiç ihtiyaç duymuyordu. `/manifest.webmanifest` artık 404.
- `public/sw.js` **silinmedi, "tombstone"a çevrildi** — eski SW sayfaları cache'liyordu, dosyayı silmek kurulu istemcilerde eski dashboard'u sonsuza dek servis etmeye devam ettirirdi. Yeni sürüm tüm cache'leri silip `unregister()` ediyor. ~6 ay sonra silinebilir.
- `app/(auth)/`, `app/(dashboard)/` (7 sayfa), dashboard component'leri, `middleware.ts`, `next-themes` kaldırıldı.
- Landing CTA'ları → `components/marketing/store-badges.tsx` (env-gated `NEXT_PUBLIC_IOS_APP_URL`/`NEXT_PUBLIC_ANDROID_APP_URL`, boşken "Coming soon").
- `/recipe/[id]` kaldı (viral mekanizma + SEO): auth isteyen Yedim/Değiştir butonları çıktı → store CTA'sı, auth istemeyen "Pişirmeye Başla" korundu.
- Referral web'den mobile taşındı: `/signup?ref=KOD` yerine `/invite/[code]` (statik, auth yok) + mobilde kod girme alanı → `POST /api/referral` (backend değişikliği gerekmedi, route zaten Bearer kabul ediyordu).

**2) Repo ayrımı** (30 Temmuz 2026):
- Web kodu **yeni, ayrı bir git repo'suna** taşındı: [chef-ai-web](https://github.com/mertgrz24/chef-ai-web) (private). Geçmiş taşınmadı (tek "initial import" commit) — sebep: bu repo'daki (`chef-ai`) tüm web geçmişi zaten kalıcı olarak duruyor, `git-filter-repo` kurulu değildi, tek kişilik proje için efor/fayda düşük.
- Vercel projesi (`chef-ai-puce-zeta`) **aynı kaldı**, sadece Git bağlantısı `chef-ai-web`'e çevrildi (Settings → Git → Disconnect + reconnect, dashboard üzerinden — bu adım otomatize edilemedi). Environment variable'lar projeye bağlı olduğu için repo değişince kaybolmadı.
- **Doğrulama:** reconnect tek başına build tetiklemedi, `chef-ai-web`'e boş bir commit push edilerek webhook tetiklendi. Sonrasında canlı URL dışarıdan `curl` ile doğrulandı: `/dashboard` `/login` `/signup` `/manifest.webmanifest` → 404, `/invite/CHEF-XXXX` → 200, `/sw.js` tombstone sürümü serve ediyor.
- Bu repo'dan (`chef-ai`) web'e ait **97 dosya** silindi (`app/`, `components/`, `lib/`, `types/`, `public/`, `supabase/`, tüm Next.js config'leri). Kalan tek içerik: `mobile/` + proje günlüğü. Root `README.md`/`CLAUDE.md` mobil-app-only diline göre yeniden yazıldı.
- **Teknik not (gerekçe kaydı):** Bu ayrım *zorunlu* değildi — `mobile/`'ın zaten kendi `node_modules`/`package-lock.json`'ı vardı, Metro bundler sadece `mobile/`'ı tarıyordu (`metro.config.js`'de özel `watchFolders` yok), yani web kodunun repo'da durması ne EAS build'in nihai `.ipa`/`.apk` boyutunu ne de store submission'ı etkiliyordu. Kullanıcı organizasyonel tercih olarak ayrı repo istedi.
- ⚠️ **Kapsam dışı bırakılan:** `chef-ai-web`'deki `CLAUDE.md` bu repo'nunkinin birebir kopyası — hâlâ eski "hem web hem mobil" dilini taşıyor (Directory Structure, Phase-gated roadmap bölümleri artık yanlış). İki repo'da da elle güncellenmesi gerekiyor, mekanik taşımanın kapsamında değildi.
- 🔴 **Viral döngü hâlâ üreticisiz:** mobilde tarif kaydet & paylaş yok → `/recipe/[id]`'yi (artık `chef-ai-web`'de) besleyen hiçbir şey yok. Store yayını öncesi mobile `POST /api/recipes/save` eklenmeli.

### 🔐 V5.10 — Veri güvenliği & minimizasyon ✅ CANLIDA (commit `a1f74dc`)
- **Hesap kapatma:** `DELETE /api/account` — token'dan **kendi** user id'si, service-role ile `auth.users`'tan siler → profiles/pantry/recipes/meal_plans/meals_eaten/push_tokens **cascade** ile temizlenir. id client'tan asla alınmaz. Web'de "Danger zone" (2 adımlı onay), mobilde destructive Alert.
- **Minimizasyon:** `full_name`, `current_weight_kg`, `target_weight_kg`, `daily_steps_goal` artık **toplanmıyor** — hiçbir özellik kullanmıyordu (tarif/plan motoru yalnızca kalori+makro+su+diet_type okuyor). Form + API allowlist + tipler + dashboard'dan çıkarıldı; **allowlist sunucuda zorluyor** (client gönderse bile yazılmaz).
- Denetimde çıkan iyi haberler: buzdolabı fotoğrafları **hiç saklanmıyor** (base64→Gemini→atılıyor, Storage yok); signup yalnızca **email+parola**.
- Doğrulama: lokal 7/7 fonksiyonel test + **production'da canlı teyit** (401/200, gerçek hesap silme + cascade, allowlist).
- ⏳ **Kalan:** `20260719_drop_unused_profile_fields.sql` migration'ı SQL Editor'da çalıştır (kod deploy edildi, sıra artık güvenli).
- 🔎 Follow-up: `profiles.email` de mükerrer ama signup trigger'ı yazıyor → önce trigger düzenlenmeli.

### ⏳ Bekleyen manuel adımlar (sadece kullanıcı yapabilir) — 18 Tem GÜNCEL
1. ✅ **Supabase migration'ları çalıştırıldı ve doğrulandı (18 Tem):**
   - `20260703_referral_and_usage_rpc.sql` → 3 RPC canlı (referral + atomik freemium artık çalışıyor, legacy fallback devre dışı)
   - `20260718_create_push_tokens.sql` → tablo + RLS canlı; `/api/push/register` uçtan uca **201** (gerçek kullanıcıyla test edildi, cascade delete çalışıyor)
2. ⏳ **Vercel'e `CRON_SECRET` env ekle (Production)** — `vercel.json` cron'u (`/api/push/send-expiry-alerts`) canlı; secret set değilken günde bir 500 döner (zararsız ama). Set edilince korunur.
3. ⏳ **Gemini API kredisi** yükle ([AI Studio](https://ai.studio/projects)) — Cook/Scan/Meal-plan (web+mobil) hepsi `429 credits depleted`.
4. ⏳ **EAS build** (`mobile/EAS_BUILD.md`) — deployed API artık Bearer içeriyor, teknik engel kalktı.
5. ⏳ **Prod QA** → canlı auth'lu akışlar (Gemini kredisi sonrası).

## 🗺️ Genel Yol Haritası

### Phase 1 — Landing Page ✅ TAMAMLANDI (Hafta 1)
- [x] Adım 0 — Ortam hazırlığı (Node.js, VS Code, Claude Code)
- [x] Adım 1 — Boş Next.js 14 + Tailwind v3 + TypeScript kurulumu
- [x] Adım 1.5 — localhost:3000'de varsayılan sayfa çalışıyor
- [x] Adım 2 — globals.css + layout.tsx (krem bg, Inter font, metadata)
- [x] Adım 3 — Navbar (logo, masaüstü nav, hamburger menü, fade-in)
- [x] Adım 4 — Hero section (iki kolon, telefon mockup, staggered animasyon)
- [x] Adım 5 — Features section (3 kart, featured koyu, whileInView stagger)
- [x] Adım 6 — HowItWorks + Pricing bölümleri (sol-sağ stagger, fiyat kartları)
- [x] Adım 7 — Footer (koyu bg, link grupları, alt copyright)
- [x] Adım 8 — Vercel'e deploy + canlı URL → https://chef-ai-puce-zeta.vercel.app

### Phase 2 — Auth & Pantry UI ✅ TAMAMLANDI (Hafta 2)
- [x] Supabase kurulumu
- [x] Login/signup akışı — test edildi, dashboard'a erişim çalışıyor ✅
- [x] Landing page butonları bağlandı — "Ücretsiz Başla" → /signup, "Giriş Yap" → /login ✅

### Phase 3 — Recipe Engine ✅ TAMAMLANDI (Hafta 3)
- [x] Claude API entegrasyonu — `lib/ai/claude.ts` wrapper (prompt caching dahil)
- [x] `/api/recipes` endpoint'i (auth korumalı, mock mod ile test edildi)
- [x] Tarif üretme akışı + UI — `RecipeGenerator` bileşeni, dashboard'a entegre

### Phase 4 — Visual Pantry ✅ TAMAMLANDI (Hafta 4)
- [x] Gemini Vision API entegrasyonu — `lib/ai/gemini.ts` wrapper (`gemini-2.5-pro`)
- [x] Fotoğraf yükleme akışı — `/api/vision` endpoint'i (auth korumalı, 10 MB limit)
- [x] Otomatik malzeme tanıma + UI — `PhotoAnalyzer` bileşeni, dashboard'a entegre
- [x] Uçtan uca test: mercimek + patates tespit edildi, tarif üretildi ✅

### Phase 5 — Polish ✅ TAMAMLANDI (Hafta 5)
- [x] Mobile responsive — sidebar `hidden md:flex`, `MobileNav` hamburger menü
- [x] PhotoAnalyzer mobil fix — `<label htmlFor>` ile native file trigger, `inputKey` reset
- [x] MobileNav fix — `type="button"`, ☰/✕ toggle
- [x] Butonlar mobilde `w-full`, masaüstünde `w-auto`
- [x] framer-motion 10.18.0'a sabitlendi (11.x `motion-utils` build hatası çözüldü)

### Phase 6 — Waste Alert & Beta ✅ TAMAMLANDI (Hafta 6)
- [x] Supabase `pantry` tablosu — uuid PK, user_id FK, name, expiry_date, quantity, created_at
- [x] RLS politikaları — SELECT / INSERT / UPDATE / DELETE kullanıcı bazlı izole
- [x] `GET /api/pantry` — malzemeleri expiry_date ASC sıralar
- [x] `POST /api/pantry` — validasyonlu ekleme (name zorunlu, date format kontrolü)
- [x] `DELETE /api/pantry/[id]` — RLS + user_id çift kontrol, 204 döner
- [x] `PantryClient` — optimistic UI, renk kodlaması (🔴 ≤0 · 🟠 ≤3 · 🟡 ≤7 · 🟢 7+gün)
- [x] Dashboard stats gerçek veriye bağlandı — kiler sayısı + israf uyarısı sayısı
- [x] Placeholder sayfalar oluşturuldu — /pantry /recipes /profile

### Phase 7 — Launch ✅ TAMAMLANDI (Hafta 7)
- [x] Production Vercel deploy — canlıda ✅
- [x] Environment variables Vercel'e taşındı
- [x] PWA kurulumu — manifest, icon, apple-icon, service worker
- [x] Telefona "Ana Ekrana Ekle" çalışıyor
- [x] Kamera + galeri seçimi (capture attribute kaldırıldı)

---

## 🚀 V2 — Haftalık Yemek Planı

### V2.1 — Diyet Hedefleri (Aktif)
- [x] **A1** — `profiles` tablosu oluşturuldu (email, full_name + 10 diyet alanı, RLS, trigger) ✅
- [x] **A2.1** — `GET /api/profile` + `PUT /api/profile` endpoint'leri (auth, validasyon, RLS) ✅
- [x] **A2.2** — `/profile` sayfasında diyet hedefi formu (UI) ✅
- [x] **A2.3** — Dashboard'a "Tüketim Tarihi Geçmiş" kutusu (kırmızı, koşullu, /pantry linki) ✅
- [x] **A3.1** — Claude JSON çıktısı + makro tahmini + diyet hedefi prompt entegrasyonu ✅
- [x] **A3.2** — Dashboard "Hedeflerim" paneli (null-filtreli goal kartları, boşsa link) ✅
- [x] **A4** — Dashboard hedef göstergesi — ilerleme çubuğu yok, hedef değerleri doğrudan kartlarda gösteriliyor ✅

### V2.2 — Paylaşılabilir Tarif Kartları ✅ TAMAMLANDI
- [x] **B1** — `recipes` Supabase tablosu (SQL: id, user_id, name, ingredients[], instructions, macros jsonb, diet_context, is_public, created_at) + RLS ✅
- [x] **B2** — Tarif kaydetme ve paylaşım API endpoint'leri ✅
  - `types/recipe.ts` — `Recipe`, `RecipeMacros` tipleri
  - `POST /api/recipes/save` — auth + validasyon + insert, 201
  - `GET /api/recipes/history` — auth + user tarifleri, limit 20, DESC
  - `GET /api/recipes/[id]` — public, is_public kontrolü, 404 guard
- [x] **B3** — Tarif kaydet & paylaş UI + public tarif sayfası ✅
  - `RecipeGenerator`: "🔗 Kaydet & Paylaş" butonu, Web Share API / clipboard fallback, `parseFormattedRecipe` helper
  - `app/recipe/[id]/page.tsx`: public sayfa, auth yok, malzeme+adım+makro, "Sen de dene →" CTA
  - `dashboard/page.tsx`: "Geçmiş Tariflerim" son 5 tarif listesi, "Kayıtlı tarif" stat gerçek sayı

### V2.3 — Haftalık Yemek Planı ✅ TAMAMLANDI
- [x] **C1** — `meal_plans` Supabase tablosu (id, user_id, week_start_date, meals jsonb, created_at, updated_at) + RLS + unique(user_id, week_start_date) ✅
- [x] **C2** — API endpoint'leri ✅
  - `types/meal-plan.ts` — `MealItem`, `MealPlanDay`, `MealPlan` tipleri
  - `lib/ai/gemini.ts` — `generateWeeklyMealPlan(dietContext?)` + `generateSingleMeal(day, mealType, dietContext?)`
  - `POST /api/meal-plan/generate` — auth + profil çek + Gemini + UPSERT, 201
  - `GET /api/meal-plan` — auth + bu haftanın planı, 200/404
  - `PATCH /api/meal-plan/regenerate-day` — auth + body validasyon + tek öğün yenile + UPDATE, 200
  - typecheck: 0 hata · lint: 0 hata
- [x] **C3** — Haftalık plan UI ✅
  - `app/(dashboard)/meal-plan/page.tsx`: yükleme/boş durum/plan görünümü, 🔄 tüm plan yenile, tek öğün yenile (sadece o satır spinner), accordion detay (malzeme + talimat + makro badge)
  - `app/(dashboard)/layout.tsx`: sidebar'a "🗓️ Yemek Planı" nav linki eklendi
  - `components/dashboard/mobile-nav.tsx`: mobile menüye "Yemek Planı" eklendi
  - `app/(dashboard)/dashboard/page.tsx`: "Bu Haftaki Planın" widget'ı — bugünün kahvaltı+akşam öğünü, plan yoksa "oluştur →" linki
  - typecheck: 0 hata · lint: 0 hata

### V2 Kapsam (Genel) ✅ TAMAMLANDI 🎉
- [x] Paylaşılabilir tarif kartları (viral mekanizma) ✅
- [x] Haftalık yemek planı oluşturma ✅
- [x] Kalori tahmini — makrolar tarif ve plan öğünlerinde gösteriliyor ✅

---

## 🚀 V3 — App'i Canlandırma

> V3 amacı: V2'nin temel özellikleri üzerine görsel zenginlik, etkileşim ve keyif katmanları eklemek.

### V3.1 — Tarif Görselleri ✅ TAMAMLANDI
- [x] **D1** — `lib/unsplash.ts` wrapper (Unsplash API, tarif adına göre fotoğraf çek, hata → null)
- [x] **D2** — `app/api/recipes/save/route.ts` — kayıt sırasında getRecipeImage çağrısı, image_url DB'ye yazılıyor
- [x] **D3** — `components/dashboard/recipe-generator.tsx` (kayıt sonrası görsel), `app/recipe/[id]/page.tsx` (hero görsel), `app/(dashboard)/recipes/page.tsx` (60×60 thumbnail)
- [x] `supabase/migrations/20260512_add_image_url_to_recipes.sql` — ⚠️ Supabase SQL Editor'da manuel çalıştırılacak

### V3.2 — Dark Mode + Animasyonlar ✅ TAMAMLANDI
- [x] **E1** — `tailwind.config.ts`: `darkMode: 'class'`; `components/theme-toggle.tsx` (☀️/🌙 toggle); `next-themes` ThemeProvider
- [x] **E2** — `globals.css`: CSS custom properties (--bg, --bg-card, --border, --text-* vb.) light + dark versiyonları
- [x] **E3** — `components/dashboard/page-transition.tsx`: AnimatePresence + usePathname ile sayfa geçişi; `components/dashboard/stat-card.tsx`: whileHover scale 1.02; meal-plan accordion'u smooth height animasyonu

### V3.3 — Adım Adım Pişirme Modu ✅ TAMAMLANDI
- [x] **F1** — `components/cooking-mode.tsx`: full-screen overlay, adım parse (numaralı liste → satır → cümle sırasıyla), slide animasyonu, keyboard nav (←→ Esc)
- [x] **F2** — `components/cooking-mode-button.tsx`: server page için client wrapper; `recipe/[id]/page.tsx`'e "👨‍🍳 Pişirmeye Başla" butonu eklendi
- [x] **F3** — Otomatik zamanlayıcı: "15 dakika" / "2 saat" gibi ifadeler parse edilir, ▶ Başlat / ⏸ Duraklat / 🔄 Sıfırla
- [x] Meal plan accordion'larına "👨‍🍳 Pişir" butonu eklendi, aynı CookingMode component'i kullanıyor

### V3.4 — Alışveriş Listesi ✅ TAMAMLANDI
- [x] **G1** — `app/api/shopping-list/route.ts`: GET endpoint, haftalık plan öğünlerinin ingredients'ı birleştir, pantry'den çıkar (case-insensitive), alfabetik sırala
- [x] **G2** — `app/(dashboard)/shopping-list/page.tsx`: checkbox listesi (UI-only, çizgi efekti), "📋 Listeyi Kopyala" butonu, plan yoksa "haftalık plan oluştur →" yönlendirme, her şey kilerdeyse yeşil onay durumu
- [x] Sidebar nav + MobileNav'a "🛒 Alışveriş" linki eklendi

### V3.5 — Tarif Sohbeti ✅ TAMAMLANDI
- [x] **H1** — `lib/ai/gemini.ts`: `modifyRecipe(recipe, instruction, dietContext?)` — Gemini'ye mevcut tarif + kullanıcı isteği gönderilir, aynı JSON formatında yeni tarif döner
- [x] **H2** — `app/api/recipes/modify/route.ts`: POST endpoint, auth + kaynak tarif sahipliği kontrolü, profil diyet bağlamı eklenir, yeni tarif DB'ye kaydedilir + Unsplash görseli çekilir
- [x] **H3** — `components/recipe-modifier.tsx`: "✨ Bu Tarifi Değiştir" UI, 401 → giriş linki, başarıda `/recipe/[newId]`'ye yönlendirme
- [x] `recipe/[id]/page.tsx`'e RecipeModifier entegre edildi
- [x] `components/dashboard/recipe-generator.tsx`'e "✨ Değiştir" input eklendi — tarif üretildikten sonra görünür, gerekirse otomatik kayıt + modify

### V3.6 — Tüketim Takibi ✅ TAMAMLANDI
- [x] **I1** — `supabase/migrations/20260525_create_meals_eaten.sql`: `meals_eaten` tablosu + RLS + indeksler — ⚠️ MANUEL çalıştır
- [x] **I2** — `components/eat-button.tsx`: "✓ Yedim" butonu, POST /api/meals-eaten, başarı → yeşil "✓ Kaydedildi"
  - `app/recipe/[id]/page.tsx`: CookingModeButton yanına EatButton eklendi (`source="recipe"`)
  - `app/(dashboard)/meal-plan/page.tsx`: her öğünün accordion'una EatButton eklendi (`source="meal_plan"`)
- [x] **I3** — `app/api/meals-eaten/route.ts`: POST (yeni kayıt) + GET (bugünün kayıtları + toplamlar)
- [x] **I4** (kısmi) — Dashboard'da "📊 Bugünkü Tüketim" widget'ı: kayıt varsa 🔥💪🍚🧈 toplamları, kalori hedefi varsa "X kcal kaldı" veya "Hedefe ulaştın!"

---

## 🎯 Önemli Kararlar (kronolojik)

- **26 Nis 2026:** Stack: Next.js 14 + Tailwind v3 + TypeScript + Framer Motion + Supabase + Claude API + Gemini API. (16 + v4 yerine, daha bol kaynak için.)
- **26 Nis 2026:** Çalışma modu: mikro-adım, her değişiklik sonrası dur ve onay bekle.
- **26 Nis 2026:** Türkçe iletişim, İngilizce kod yorumları.

## ❓ Açık Sorular (sonraki seansta cevaplanacak)

- Renk paleti: sıcak gıda tonları mı, premium soğuk tonlar mı?
- Landing page'de hero altında hangi bölümler olacak?
- Brand voice: samimi mi, profesyonel mi, oyuncu mu?
- Logo/görsel kimlik şimdi mi yoksa sonra mı?

## 🚀 Sonraki Seansa Başlangıç Prompt'u

Yeni bir Claude Code konuşması açtığında şunu yapıştır:

> Chef-AI V3 projesindeyim. CLAUDE.md ve PROGRESS.md'yi oku, iki cümleyle özetle: nerede kaldık, sıradaki mikro-adım ne? Mikro-adım modunda kal, Türkçe konuş.

## 🚀 V5 — Mise en Place Redesign + Mobil App

### V5.1 — Tasarım sistemi + Landing ✅ TAMAMLANDI (commit `81c810a`)
- Anthropic **frontend-design** skill'iyle yapıldı. Eski krem(`#f5f5f0`)+turuncu(`#ffa51f`)+Inter kombinasyonu, skill'in "AI default" dediği #1 kalıptı — ondan çıkıldı.
- **Palet:** pantry green `#1E3A2F` + electric lime `#CDF23E` (tek accent) + ink `#17180F` + chalk `#F5F6F1`
- **Tipografi:** Bricolage Grotesque (display) · Instrument Sans (body) · Space Mono (fiş/etiket dokusu)
- **İmza öğe:** malzeme (girdi) → basılan mutfak fişi (tarif çıktısı). Hero'daki vanity istatistikler (12K+/94%/50K+) kaldırıldı.
- `globals.css` token'ları eski değişken adları korunarak yenilendi (dashboard kırılmadı), light+dark ikisi de
- navbar/hero/features/how-it-works/pricing/footer yeni dile taşındı

### V5.2 — M1: Backend mobil-hazır ✅ TAMAMLANDI (commit `4f40c45`)
- **Blocker'dı:** 17 API route cookie-auth'du, RN cookie taşıyamaz → hepsi mobil'e 401 dönerdi
- `lib/supabase/api.ts` → `createApiClient()`: önce `Authorization: Bearer`, yoksa cookie'ye düşer. Header `next/headers` ile okunuyor → parametresiz `GET()` handler'larının imzası değişmedi
- Bearer token PostgREST'e olduğu gibi iletilir → **RLS hâlâ çağıranın kendi JWT'sine göre** çalışır; mobil, tarayıcıdan fazla yetki almaz
- Doğrulama: auth-suz 401 · geçersiz Bearer 401 (fail-closed) · geçerli Bearer 200 + dönen profil token'ın sahibine ait

### V5.3 — M2: Expo iskeleti + tasarım sistemi ✅ TAMAMLANDI (commit `f41104d`)
- `mobile/` — Expo SDK 57 + expo-router + RN 0.86 + React 19, kendi `package.json`'ı. Root tsconfig/eslint `mobile/`'ı hariç tutuyor
- Tasarım sistemi RN'e taşındı (NativeWind): aynı palet, aynı 3 font, "recipe ticket" bileşeni native olarak yeniden yazıldı
- NativeWind v4 için `babel.config.js` + `metro.config.js` eklendi — **Expo 57 template'i bunları içermiyor**
- `src/lib/supabase.ts` — session **expo-secure-store**'da (Keychain/Keystore), AsyncStorage'da değil (token hassas veri)
- `src/lib/api.ts` — Next API'lerini Bearer ile çağırır. **AI anahtarları cihaza hiç inmiyor**, sunucuda kalıyor
- 🔒 `mobile/.gitignore`'a `.env` eklendi — template sadece `.env*.local` yoksayıyordu, **anon key commit'lenecekti**
- Doğrulama: typecheck 0 · Metro bundle temiz (933 modül) · web hedefinde render doğrulandı (3 font yüklendi) · console hatasız

### V5.4 — M3: Auth ekranları + korumalı navigasyon ✅ TAMAMLANDI (commit `53b9d14`)
- Expo Router **protected-routes** pattern (SDK 57 `Stack.Protected guard={...}`)
- `src/lib/auth.tsx` — `AuthProvider` + `useAuth`: `getSession` ile persisted oturumu geri yükler, `onAuthStateChange` ile senkron. signIn/signUp/signOut
- `_layout.tsx` — session varsa `(app)`, yoksa `(auth)` render edilir; giriş/çıkışta router **otomatik** geçer (manuel navigasyon yok)
- `(auth)/login.tsx` + `signup.tsx` — tasarım sistemi ekranları; `src/components/ui.tsx` (Field/Button/Screen/ErrorText primitifleri)
- Rotalar `(auth)`/`(app)` gruplarına bölündü, home `(app)/index.tsx`'e taşındı
- Doğrulama (web hedefi): typecheck 0 · **tam döngü test edildi** — guard oturumsuz login gösteriyor, geçici test kullanıcısıyla giriş → home ("Signed in as…"), sign out → login. Console hatasız. Test kullanıcısı silindi
- ⚠️ Açık: mobile eslint (eslint-config-expo) henüz kurulmadı — ayrı tooling işi (chip açıldı)

### V5.5 — M4: Tab bar + Pantry + Cook ✅ ÇEKİRDEK TAMAMLANDI (commit `d207708`)
- `(app)/_layout.tsx` → Stack yerine **Tabs** (Today / Pantry / Cook / Profile), `@expo/vector-icons` Ionicons, pantry-green bar + lime aktif
- **Pantry** (`pantry.tsx`): tam CRUD, expiry ASC liste, optimistic add/delete, **expiry hızlı-seçim çipleri** (3d/1w/2w/1mo → YYYY-MM-DD; date-picker bağımlılığı yok), renk kodlu aciliyet (`lib/expiry.ts`)
- **Cook** (`cook.tsx`): pantry çip seçimi + elle ekleme → POST /api/recipes → yapılandırılmış tarifi "fiş" dilinde gösterir; 403 → Premium yükselt
- **Profile**: email + sign out. **Today**: gerçek pantry sayacı + expiring-soon
- Doğrulama: Node testi (mobil apiFetch'in aynısı) → pantry GET/POST/DELETE + expiry hesabı + sıralama **hepsi doğru**. 4 ekran da render (get_page_text). typecheck 0
- 🔴 **Cook için GEMINI kredisi bitmiş** (429 billing) — kod değil, hesap sorunu. Hata yolu doğru çalıştı (kredi iadesi + temiz 500). **Kullanıcı Gemini kredisi yüklemeli**, sonra Cook çalışır
- ⚠️ expo web'de API çağrıları cross-origin **CORS**'a takılıyor ("Failed to fetch") — sadece web-preview artifact'i, native'de yok

### V5.6 — M4b: Kamera/Vision ekranı (Scan) ✅ TAMAMLANDI (commit `200c09a`)
- `scan.tsx`: `expo-image-picker` (SDK 57 API `mediaTypes:['images']`) ile foto çek/seç → multipart upload → POST /api/vision → tespit edilen malzemeler çip (tap-to-deselect) → seçilenleri pantry'e ekle (7g default) → /pantry
- `lib/api.ts` → **`apiUpload()`**: multipart/form-data için, Content-Type **elle set edilmiyor** (RN boundary'yi kendi hesaplar; apiFetch'in json content-type'ı multipart'ı bozardı)
- `(app)/_layout.tsx`: **5. sekme "Scan"** (viewfinder ikonu) — markanın "snap your fridge" özü
- Doğrulama: Node testi (apiUpload'ın aynısı: gerçek token + multipart PNG) → geçerli PNG+Bearer **500** (auth+multipart+validasyon GEÇTİ, Gemini billing'de durdu), auth yok **401**, dosya yok **400** → upload plumbing sağlam. Görsel: Scan render + 5-sekme. typecheck 0

### V5.7 — M4c: Meal-plan ekranı ✅ TAMAMLANDI (commit `03b7640`) — M4 EKRANLARI TAMAM 🎉
- `meal-plan.tsx`: GET (404 → boş durum + generate), plan varsa 7 gün × (kahvaltı+akşam), accordion detay (LayoutAnimation), tek öğün yenile (PATCH, sadece o satır spinner), tüm hafta yenile (POST)
- `_layout.tsx`: meal-plan **tab bar'dan gizli** (`href:null`) — 6. sekme yerine Today'den erişiliyor
- `index.tsx`: Today'e "This week's meal plan" giriş kartı (router.navigate)
- Doğrulama: boş durum + Today kartı + navigasyon render doğru, tab bar 5 sekme. typecheck 0
- **Mobil app'in tüm ekranları hazır:** Today · Pantry · Scan · Cook · Meal-plan · Profile

### V5.8 — M5: Push notification altyapısı ✅ KOD TARAFI TAMAM (commit `642db9e`)
- **Mimari:** mobil token alır → `/api/push/register` → `push_tokens` tablosu → günlük **Vercel Cron** `/api/push/send-expiry-alerts` → yarın bozulacak malzemeler → **Expo Push API**
- Backend: `push_tokens` migration (RLS) · `lib/supabase/admin.ts` (service-role, cron için) · register endpoint (upsert) · send-expiry endpoint (CRON_SECRET korumalı, ET gün sınırı, 100'lük batch) · `vercel.json` cron (`0 13 * * *`) · `.env.example`'a CRON_SECRET
- Mobil: `expo-notifications` · `src/lib/notifications.ts` (handler + izin + EAS projectId guard + register) · `(app)/_layout.tsx` mount'ta register · app.json plugin
- Doğrulama: endpoint guard'ları canlı test (register 401; cron 401/401/**200 {sent:0}** = uçtan uca akış) · web+mobil typecheck 0 · expo-notifications web'de kırmadı
- ⚠️ Test edilemeyen (beklenen): register happy-path (**push_tokens migration** manuel) + gerçek token/teslimat (**cihaz + EAS projectId = M6**)

### V5.9 — M6: EAS Build hazırlığı ✅ HAZIRLIK TAMAM (commit `fd443a0`)
- `mobile/eas.json`: development/preview/production profilleri, `appVersionSource:remote` + autoIncrement, preview APK, production store, submit iskeleti (placeholder)
- `mobile/app.json`: `ITSAppUsesNonExemptEncryption=false` (store prompt'unu önler)
- **`mobile/EAS_BUILD.md`**: adım adım rehber (eas init → projectId → push aktif, env, build, submit, store) + yayın öncesi kontrol listesi
- **Kalan M6 işi tamamen operasyonel/senin hesaplarınla:** `eas init`, Apple/Google hesapları, gerçek build + store gönderimi. Rehberi takip et
- 🔑 `eas init` → `projectId` → **push token alımı otomatik aktifleşir** (kod bekliyor)

### 🔧 Bilinen açık işler (güncel)
- **Gemini kredisi** yükle (Cook + Scan + Meal-plan)
- **Manuel Supabase migration'ları:** `20260703_referral_and_usage_rpc.sql` (eski) + **`20260718_create_push_tokens.sql`** (yeni — push register bunsuz 500)
- **Vercel'e `CRON_SECRET`** ekle (production'da cron'u korur; lokalde `.env.local`'da test değeri var)
- `next16-upgrade → main` merge (deployed API mobil Bearer'ı içermiyor)
- mobile eslint kurulumu (chip açık)

### 🔧 Bilinen açık işler (mobil)
- **Gemini kredisi** yüklenmeli (Cook + vision + meal-plan hepsi Gemini'ye bağlı)
- `mobile/.env` → `EXPO_PUBLIC_API_URL=http://localhost:3000` (default). Gerçek cihaz/simülatör testinde LAN IP veya deployed API'ye çevrilmeli. **Not:** deployed API henüz M1 Bearer'ı içermiyor (main'e merge edilmedi) → mobil şu an sadece **lokal** Next server'a bağlanabilir
- mobile eslint kurulmadı (chip açık)

### ⚠️ Bilinen açık — mobile npm audit
11 moderate, hepsi `uuid` kaynaklı ve Expo'nun **CLI/build toolchain**'inde (@expo/cli, metro-config, prebuild-config…). **App bundle'ına girmiyor.** `--force` gerektiriyor (Expo 57'yi kırar) → bilinçli bırakıldı, Expo upstream'de yamalayacak. Web tarafı audit **0**.

---

## 📝 Seans Notları

### 14 Temmuz 2026 — Görsel kaynağı sadeleştirildi (Unsplash kalıntısı temizliği)

- **Bağlam:** AI görsel üretimi denemesi araştırıldı → repoda böyle bir fonksiyon **hiç yok** (git temiz, `generateImage`/`dall-e`/`imagen` vb. hiçbir yerde geçmiyor). Deneme bu projede iz bırakmamış.
- **Gerçek kalıntı:** Unsplash → Pexels geçişinden (28 Mayıs) kalan ölü config. Görsel kaynağı tek pakete indirildi:
  - `next.config.mjs`: `images.unsplash.com` remote pattern kaldırıldı, sadece `images.pexels.com` kaldı.
  - Supabase `recipes`: Unsplash URL'i taşıyan 1 bayat test satırı (`Limon Ferahlığında Ton Balığı Salatası`, ABD revizyonu öncesi Türkçe kayıt) → `image_url = NULL`. Kalan unsplash satırı: 0.
- **Not:** `lib/unsplash.ts` zaten daha önce silinmişti; aktif görsel yolu `lib/pexels.ts` (meal-image + recipes/modify) — dokunulmadı.
- typecheck 0 · build ✅ · repoda kalan unsplash referansı 0.

---

### 13 Temmuz 2026 — Seans sonu özeti

**Bugün ne yapıldı (kronolojik):**
1. photo-analyzer.tsx client-side validation + FileReader → `URL.createObjectURL` (blob URL) refactor'ı
2. npm audit: `overrides` ile 5 → 1 (postcss + glob yamalandı)
3. Next 16 + React 19 migration (`next16-upgrade` branch, detay aşağıda) → **npm audit 1 → 0**
4. Snyk: bağımlılık açıkları 16 → 0; kalan `photo-analyzer.tsx` DOM-XSS bulgusu doğrulanmış false positive → Snyk hesabına giriş yapılıp **"Ignored"** olarak gerekçeli işaretlendi
5. Vercel preview deploy doğrulandı: `next16-upgrade` build'i **READY** (Turbopack ile Vercel altyapısında da temiz derlendi)

**Yarın buradan devam:** Yukarıdaki "📍 Şu an neredeyiz?" bölümündeki **2 bekleyen manuel adım** hâlâ açık (Supabase migration çalıştırılmadı, preview QA yapılmadı — preview Vercel Deployment Protection arkasında, bypass linki bu seansta üretildi ama süresi 14 Temmuz 13:53'te doldu, yeniden üretilebilir). İkisi tamamlanınca sıradaki iş: `next16-upgrade` → `us-market` → `main` merge zinciri + production deploy.

**Git durumu:** `next16-upgrade` branch'inde, commit `59432de`'ye kadar push edilmiş. `us-market` ve `main` dokunulmadı, production hâlâ eski koddaki `main`'de.

---

### 13 Temmuz 2026 — Next 16 + React 19 migration (`next16-upgrade` branch)

**Neden:** npm audit'te kalan 14 advisory'nin hepsi `next` framework'ünde; 14 içinde yama yok, yalnızca Next 16 kapatıyor. Ayrı branch'te, launch'u bozmadan yapıldı.

**Baseline:** us-market'teki 38 commit'siz dosya (us-market revizyonu + güvenlik fix'leri) tek commit'e alındı (`9fd4ab7`, local, push yok) → `next16-upgrade` branch'i açıldı.

**Bağımlılıklar:** next 14.2.35→**16.2.10**, react/react-dom 18→**19.2.7**, eslint 8→**9**, eslint-config-next 14→**16.2.10**, framer-motion 10.18→**12.42** (React 19 peer'i destekliyor — eski kırılgan pin'den çıkış). `postcss: "$postcss"` override korundu (next@16 hâlâ nested 8.4.31 bundle'lıyor). **npm audit 5 → 0.** ✅

**Kod değişiklikleri (beklenenden küçük):**
- Async `params`: 3 dinamik route (`recipe/[id]/page`, `api/recipes/[id]`, `api/pantry/[id]`) → `params: Promise<{id}>` + `await params`.
- `cookies()` zaten `await` ile yazılıydı (`lib/supabase/server.ts`) → değişiklik gerekmedi.
- `next lint` Next 16'da kaldırıldı → `.eslintrc.json` silindi, `eslint.config.mjs` (flat config; eslint-config-next'in **native flat export**'ları) eklendi, lint script `eslint .`. FlatCompat ESLint 9'da circular-JSON bug'ı verdi → native export'larla çözüldü.
- Yeni `react-hooks/set-state-in-effect` kuralı 5 mevcut mount-guard pattern'ini error'ladı → `warn`'a indirildi (perf önerisi, correctness değil; launch sonrası tek tek bakılacak).
- `tsconfig.json` Next 16 tarafından otomatik güncellendi. middleware.ts / next.config.mjs / signup dokunulmadı (uyumlu).

**Doğrulama:** typecheck 0 · lint 0 error / 6 warning · build 29/29 · **audit 0** · **runtime smoke test** (prod server): `/` `/login` `/signup` `/premium` → 200 + güvenlik header'ları, `/recipe/<bad-id>` → 404 (async params runtime'da çalışıyor).

**Durum:** commit `59432de` → push edildi. **Vercel preview build'i `READY` ✅** (Turbopack ile, Vercel altyapısında da temiz derlendi) — `chef-ai-git-next16-upgrade-...vercel.app`. Preview'lar Vercel Deployment Protection (SSO) arkasında, o yüzden auth'lu QA kullanıcıda. Merge zinciri: `next16-upgrade` → `us-market` (fast-forward) → `main` → production.

**Snyk durumu (kapandı):** Bağımlılık açıkları **16 → 0** (Next 16 migration'ı sayesinde). Kalan tek `photo-analyzer.tsx` DOM-XSS bulgusu **doğrulanmış false positive** (blob URL, lokal dosya, `<img>` script çalıştırmaz) → Snyk'e giriş yapılıp **"Ignored"** olarak gerekçeli işaretlendi. Not: Snyk ignore'ları hesaba bağlıdır; giriş yapmadan inline `deepcode ignore` / quick-fix / `.snyk` çalışmaz — takıldığımız buydu.

---

### 12–13 Temmuz 2026 — İki kalan güvenlik açığının ele alınması

**photo-analyzer.tsx — client input validation + XSS false-positive:**
- `handleFileChange`'e `/api/vision` ile aynı guard'lar eklendi: `ALLOWED_TYPES` (MIME) + `MAX_SIZE_BYTES` (10 MB). Geçersiz/oversized dosya, belleğe okunmadan ve upload edilmeden reddediliyor (defense-in-depth; server ancak 10 MB'da reddediyordu, o ana kadar sekme belleği + bant genişliği boşa gidiyordu).
- Preview mekanizması `FileReader.readAsDataURL` (base64 `data:` URL) yerine **`URL.createObjectURL`** (`blob:` URL) ile değiştirildi: dosya belleğe kopyalanmıyor + `<img src>`'ye giden değer artık browser-managed referans, ham string değil. `previewUrlRef` + `URL.revokeObjectURL` (replace/reset/unmount) ile blob leak yok. Bu, SAST'in DOM-XSS taint akışını da kaynağında ortadan kaldıran daha temiz çözüm.
- Not: Snyk Code'un DOM-XSS kuralı sink'i yine de işaretlerse residual false positive'dir (blob URL güvenli). Snyk inline `deepcode ignore` bu kurulumda işe yaramadı (Consistent Ignores / hesap gerektiriyor) → gerekirse `.snyk` policy veya platform ignore. Kullanıcı ikinci bir tarayıcıyla kontrol edecek.

**package.json / npm audit — kısmi fix (5 → 1) + kalan Next 16'ya ertelendi:**
- `overrides` eklendi: `"postcss": "$postcss"` ($-referans EOVERRIDE'ı çözdü; next'in nested 8.4.31'i → 8.5.x, devDep `^8.5.10`'a sabitlendi) + `"@next/eslint-plugin-next": { "glob": "10.5.0" }` (glob@7.2.3'ü bozmamak için scoped). **npm audit 5 → 1'e düştü.** İkisi de zaten erişilemezdi (postcss build-time/own-CSS, glob dev-only CLI) ama sayaç temizlendi ve gerçek sinyal (Next) yalın kaldı.
- Kalan **1 high = `next`** (14 framework advisory'si tek pakette; çoğu self-hosted → Vercel mitige). Sadece **Next 16** (breaking) kapatır → ayrı, test edilebilir migration fazı olarak ertelendi (kullanıcı kararı). 14.2.35 son 14.x yaması, 14 içinde fix yok.
- typecheck 0 · lint 0 (1 eski `<img>` warning) · production build ✅ (postcss CSS pipeline + glob eslint sağlam).

**Sonraki adım:** (değişmedi) Migration'ı çalıştır → main'e merge → production deploy. Ayrı iş: Next 16 migration.

---

### 3 Temmuz 2026 (3. oturum) — 5 yöntemli güvenlik/bug denetimi

**Kullanılan yöntemler:** (1) `npm audit` bağımlılık taraması, (2) statik desen analizi (grep: secret/XSS/eval/auth-eksik), (3) dinamik endpoint testi (Node harness, 37 kontrol — auth-suz/malformed/oversized/injection payload), (4) yetkilendirme+IDOR kod incelemesi, (5) iş mantığı istismar analizi.

**Dinamik test sonucu:** 37/37 kontrol geçti. Tüm 18 endpoint auth-suz istekte 401, malformed body'de temiz 400 (500 yok), SQL-injection şekilli input reddedildi, güvenlik header'ları doğrulandı, yanlış HTTP method 405. Not: Sandbox Supabase'e ağ erişemedi (`ENOTFOUND`), bu yüzden auth'lu yollar kod incelemesiyle denetlendi — önemli olumlu sonuç: backend ulaşılamazken tüm endpoint'ler **fail-closed** davrandı, client'a stack trace sızmadı.

**Bulunan + düzeltilen:**
- 🟠 **F1 (orta, DoS/maliyet):** `/api/recipes` POST — ingredients dizisi sınırsızdı; pahalı Gemini çağrısı burada, 10k öğe/2MB string ile maliyet/DoS mümkündü → ≤50 öğe, ≤200 char/öğe cap + boş filtreleme eklendi
- 🟡 **F2 (düşük):** `/api/recipes/[id]` — geçersiz UUID formatı Postgres 22P02 → 500 (gürültülü) → UUID regex guard (DB'ye gitmeden 404) + 22P02 handling; **dinamik doğrulandı** (5 kötü id → hepsi 404)
- 🟡 **F3 (düşük):** `/api/recipes/modify` — instruction sınırsızdı → ≤500 char cap
- 🟡 **F5 (düşük, veri sızıntısı):** public `/api/recipes/[id]` `select('*')` ile sahibin `user_id` + `diet_context`'ini döndürüyordu → yalnızca public-güvenli kolonlar seçiliyor (in-app tüketicisi yoktu, defense-in-depth)
- 🔒 **npm audit:** `ws@8.20.0` yüksek-önem açığı (Supabase realtime → ama bu app realtime kullanmıyor, erişilemez kod) `npm audit fix` ile `ws@8.21.0`'a çözüldü (8→5 açık)

**Raporlanan — ürün kararı gerektiriyor (fix uygulanmadı):**
- 🟠 **F4 (orta, gelir sızıntısı):** Freemium 10 tarif/ay limiti YALNIZCA `/api/recipes`'te zorlanıyor. Gemini çağıran diğer 3 endpoint (`/api/recipes/modify`, `/api/meal-plan/generate`, `/api/meal-plan/regenerate-day`) limit kontrolü içermiyor → limitini dolduran ücretsiz kullanıcı bu yollarla sınırsız AI içeriği üretebilir. `consume_recipe_credit` RPC'si hazır, karar verilince modify/meal-plan'e de eklenebilir.

**Kalan npm audit açıkları (fix edilmedi — bilinçli):** 4 Next.js advisory (DoS/SSRF/cache-poisoning) + 1 postcss — hepsi yalnızca `next@16`'ya (breaking) yükseltmeyle kapanıyor; proje CLAUDE.md kararıyla Next 14'te. Next 14.2.35 zaten 14.2.x'in son patch'i. Deploy öncesi Next 15/16 geçiş değerlendirmesi ayrı bir iş olarak not edildi.

- typecheck: 0 · lint: 0 · build: 30/30 ✅

---

### 3 Temmuz 2026 (2. oturum) — UI/UX Hızlı Kazanımlar

- **Yapılandırılmış tarif kartı** — `components/recipe-card.tsx` (yeni): tarif adı + 🔪⏱🍴 badge'leri, tik atılabilir malzeme checklist'i, numaralı adım kartları, 💡 Chef's Note callout, makro satırı (fiber dahil)
  - `lib/ai/gemini.ts`: `parseRecipeJson` artık `structured: StructuredRecipe | null` da döndürüyor; `types/recipe.ts`'e `StructuredRecipe` tipi eklendi
  - `POST /api/recipes` response'una `structured` alanı eklendi (geriye uyumlu — `recipe` text hâlâ dönüyor)
  - `RecipeGenerator` + `PhotoAnalyzer`: structured varsa RecipeCard, yoksa eski text bloğu (fallback); kaydetme artık emoji-parse yerine structured veriden
- **Skeleton loading** — `components/recipe-skeleton.tsx` (yeni): 4 sn'de bir dönen aşama mesajları ("Analyzing… → Crafting… → Estimating macros… → Finishing touches…") + shimmer iskelet; her iki generator'da da spinner yerine bu
- **Open Graph metadata** — `app/recipe/[id]/page.tsx`: `generateMetadata` eklendi (tarif adı, ilk 5 malzeme + kcal description, og:image varsa image_url, twitter card); React `cache()` ile metadata + sayfa tek DB sorgusu
- **Toast sistemi** — `components/toast.tsx` (yeni): `ToastProvider` + `useToast()`, framer-motion animasyonlu, 3.5 sn auto-dismiss, success/error/info varyantları; `providers.tsx`'e eklendi
  - `RecipeGenerator`: "Link copied" ve kayıt hataları toast; clipboard fallback URL'i inline kaldı (bilinçli)
  - `EatButton`: başarı + hata toast'ları — hata durumu önceden tamamen sessizdi (bug)
- Doğrulama: typecheck 0 · lint 0 · build 30/30 ✅ · RecipeCard + Skeleton SSR çıktısı geçici test sayfasıyla doğrulandı (sayfa silindi)

**Sonraki adım:** Migration'ı çalıştır → main'e merge → production deploy

---

### 3 Temmuz 2026 — Güvenlik denetimi + ABD revizyonu eksik fix'leri

**Çeviri eksikleri giderildi (us-market'te atlanmış 12 dosya):**
- `app/layout.tsx` — metadata title/description İngilizce, `lang="tr"` → `lang="en"` (SEO)
- `app/manifest.ts` — PWA description İngilizce
- `app/recipe/[id]/page.tsx` — public paylaşım sayfası tamamen İngilizce (Ingredients/Instructions/carbs/fat/"Try it yourself"), tarih `en-US` + `America/New_York`
- `components/recipe-modifier.tsx` — tüm UI İngilizce; kırılgan `error.includes('giriş')` kontrolü `needsLogin` state'ine çevrildi
- `components/cooking-mode-button.tsx` — "Start Cooking"; `theme-toggle` aria-label'ları; profile "Fat" etiketi; recipe-generator "Saving…"
- API hata mesajları İngilizce: `/api/vision`, `/api/recipes/[id]`, `/api/recipes/history`

**Güvenlik fix'leri:**
- 🔴 `/api/referral` RLS altında hiç çalışamıyordu (başkasının profil satırını okuma/güncelleme own-row RLS'e takılıyor) → `apply_referral` SECURITY DEFINER RPC'si yazıldı, route RPC kullanıyor
- 🔴 Freemium sayaç yarış durumu (read-modify-write, eşzamanlı isteklerle limit aşılabiliyordu) → `consume_recipe_credit` + `refund_recipe_credit` atomik RPC'leri; migration çalıştırılana kadar legacy fallback devrede
- 🟠 `/api/meal-image` auth'suzdu (Pexels kota yakma) → auth eklendi, name 100 char cap
- 🟠 `/api/meal-plan/generate` iç hata detayını (`detail`) client'a sızdırıyordu → kaldırıldı
- 🟠 Security header'ları eklendi (`next.config.mjs`): X-Frame-Options DENY, nosniff, Referrer-Policy, Permissions-Policy
- 🟡 `/api/meals-eaten` POST: makro validasyonu (negatif/NaN/aşırı değer reddi), `source` allowlist, isim 200 char cap
- 🟡 `/api/recipes/save`: `macros` jsonb sanitizasyonu (sadece bilinen 6 sayısal alan), ingredients ≤100 öğe, instructions ≤20k char
- 🟡 `PUT /api/profile`: string alanlara 120 char sınırı + trim
- 🟡 `nanoid` package.json'a eklendi (phantom dependency idi — sadece transitive geliyordu)
- `.env.example`: `PEXELS_API_KEY` eklendi, kullanılmayan `UNSPLASH_ACCESS_KEY` kaldırıldı

**Bug fix'leri:**
- `dashboard/page.tsx` + `pantry/page.tsx`: `user!.id` non-null assertion'ları — layout redirect etse de page paralel render'da TypeError fırlatıyordu → `if (!user) redirect('/login')` guard'ları eklendi
- "Bugünkü Tüketim" gün sınırı UTC yerine ET (`America/New_York`) — hem `/api/meals-eaten` hem dashboard sorgusu (akşam 8'den sonra yenen öğünler yanlış güne düşüyordu)

- ⚠️ **MANUEL ADIM:** `supabase/migrations/20260703_referral_and_usage_rpc.sql` Supabase SQL Editor'da çalıştırılmalı (referral bu olmadan çalışmaz; tarif limiti legacy yolla çalışmaya devam eder)
- typecheck: 0 hata · lint: 0 hata (1 eski img warning) · build: 30/30 ✅
- Smoke test: landing 200, meal-image auth'suz 401, security header'lar doğrulandı, dashboard → /login redirect ✅

**Sonraki adım:** Migration'ı çalıştır → main'e merge → production deploy

---

### 28 Mayıs 2026 — V4 + ABD Revizyonu

- **V4.1** — Freemium model: `FREE_MONTHLY_LIMIT = 10` tarif/ay, `is_premium` kolonu, kullanım sayacı, limit aşımında "Upgrade to Premium!" mesajı
- **V4.2** — Apple Health / Google Fit JSON export: `GET /api/health-export` — son 30 günlük tüketimi güne göre gruplandırır, CSV/JSON indirir
- **V4.3** — Tavsiye programı: referral kodu üretimi, paylaşım linki, davet edilen kullanıcı takibi
- Pexels API entegrasyonu: `lib/pexels.ts` + `app/api/meal-image/route.ts` — Unsplash'ten geçiş (yemek planı görselleri için)
- `us-market` branch'i açıldı — 37 dosya tamamen İngilizce'ye çevrildi (UI, API route'ları, hata mesajları, diet context)
- Gemini prompt'larının tamamı ABD pazarı için sıfırdan revize edildi:
  - Mutfak odağı: Modern American, Mediterranean, Asian-Fusion, Tex-Mex
  - Yeni format önerileri: grain bowls, sheet-pan, one-pot, wraps, air-fryer
  - Trader Joe's hazır ürünleri teşvik ediliyor
  - Sadece imperial ölçüler (cups/oz/lbs/tbsp/tsp/°F)
  - Yeni JSON alanları: `prep_time_min`, `cook_time_min`, `servings`, `chefs_note`, `fiber_g`, `net_carbs_g`
  - Air Fryer / Instant Pot alternatifleri adımlar içinde inline
  - `parseRecipeJson` güncellendi: ⏱ timing satırı + 💡 Chef's Note render ediyor
  - `RecipeMacros` + `MealItem` tipleri yeni alanlarla genişletildi
- Preview deploy `us-market` branch'ine push edildi ✅
- typecheck: 0 hata · lint: 0 hata · build: 30/30 ✅

**Sonraki adım:** Eksiklikleri fix et → main'e merge → production deploy

---

### 25 Mayıs 2026 — V3.4 + V3.6 tamamlandı — V3 TAMAMLANDI 🎉
- `app/api/shopping-list/route.ts`: haftalık plan ingredients birleştirme, pantry çıkarma (case-insensitive Set), alfabetik sort
- `app/(dashboard)/shopping-list/page.tsx`: checkbox listesi (UI-only state, çizgi efekti), "📋 Listeyi Kopyala", plan yok → yönlendirme, tüm malzemeler kilerde → yeşil ekran
- `app/(dashboard)/layout.tsx` + `components/dashboard/mobile-nav.tsx`: "🛒 Alışveriş" nav linki eklendi
- `supabase/migrations/20260525_create_meals_eaten.sql`: meals_eaten tablosu + RLS + 2 indeks — ⚠️ MANUEL çalıştırılacak
- `app/api/meals-eaten/route.ts`: GET (bugünün kayıtları + totals) + POST (yeni kayıt)
- `components/eat-button.tsx`: "✓ Yedim" → POST /api/meals-eaten → "✓ Kaydedildi" (yeşil)
- `app/recipe/[id]/page.tsx`: EatButton eklendi (source="recipe")
- `app/(dashboard)/meal-plan/page.tsx`: EatButton accordion'a eklendi (source="meal_plan")
- `app/(dashboard)/dashboard/page.tsx`: "📊 Bugünkü Tüketim" widget — kayıt varsa makrolar + kalori hedef karşılaştırması
- `types/meals-eaten.ts`: MealEaten + DailyTotals interface'leri
- typecheck: 0 hata · lint: 0 hata · build: 26/26 ✅

### 25 Mayıs 2026 — V3.3 + V3.5 tamamlandı + Vercel deploy
- `components/cooking-mode.tsx`: full-screen pişirme modu; `parseSteps` (numaralı → satır → cümle); `extractMinutes` (dakika/saat algılama); Framer Motion slide ←→; klavye navigasyonu (ArrowLeft/Right/Escape); ilerleme çubuğu
- `components/cooking-mode-button.tsx`: server page için client wrapper, open state
- `app/api/recipes/modify/route.ts`: POST, auth, kaynak tarif sahipliği, diyet bağlamı, modifyRecipe AI çağrısı, Unsplash görsel, DB insert, 201
- `lib/ai/gemini.ts`: `modifyRecipe(recipe, instruction, dietContext?)` → MODIFY_RECIPE_SYSTEM_PROMPT, aynı JSON parse mantığı, `ModifyRecipeInput` + `ModifyRecipeResult` interface'leri
- `components/recipe-modifier.tsx`: "✨ Bu Tarifi Değiştir" input + submit + 401 guard + router.push
- `app/recipe/[id]/page.tsx`: CookingModeButton + RecipeModifier entegrasyonu (server → client prop geçişi)
- `app/(dashboard)/meal-plan/page.tsx`: accordion'a "👨‍🍳 Pişir" butonu, CookingModal state, CookingMode modal entegrasyonu
- `components/dashboard/recipe-generator.tsx`: `autoSave()` helper (paylaşımsız kayıt), "✨ Değiştir" form + `handleModify` (auto-save → modify → navigate)
- typecheck: 0 hata · lint: 0 hata · build: 23/23 ✅
- `git push origin main` → Vercel otomatik deploy tetiklendi (V3.1 + V3.2 + V3.3 + V3.5 canlıya alındı)
- ⚠️ **Manuel adımlar gerekli (henüz yapılmadıysa):**
  1. Supabase SQL Editor: `ALTER TABLE recipes ADD COLUMN IF NOT EXISTS image_url TEXT;`
  2. Vercel → Settings → Environment Variables: `UNSPLASH_ACCESS_KEY` ekle + redeploy

### 25 Mayıs 2026 — V3.1 + V3.2 tamamlandı
- `lib/unsplash.ts`: `getRecipeImage(name)` → Unsplash API, landscape, 1 sonuç, hata → null; `next: { revalidate: 86400 }`
- `next.config.mjs`: `images.remotePatterns` → images.unsplash.com
- `supabase/migrations/20260512_add_image_url_to_recipes.sql`: `ALTER TABLE recipes ADD COLUMN IF NOT EXISTS image_url TEXT` — ⚠️ MANUEL çalıştır
- `app/api/recipes/save/route.ts`: kayıt öncesi `getRecipeImage` çağrısı, `image_url` DB'ye yazılıyor ve response'a dahil
- Görseller: tarif kartı (kayıt sonrası → Unsplash, yoksa amber gradient placeholder), `recipe/[id]` hero görsel, recipes sayfasında 60px thumbnail
- `next-themes` kuruldu; `components/providers.tsx` ThemeProvider wrapper; `app/layout.tsx`: suppressHydrationWarning + Providers
- `tailwind.config.ts`: `darkMode: 'class'`
- `globals.css`: CSS variables (--bg, --bg-card, --bg-sidebar, --border, --border-subtle, --text-primary, --text-secondary, --text-muted, --accent, --accent-light, --accent-border) — light + dark set
- `components/theme-toggle.tsx`: ☀️/🌙 buton, useTheme, mount guard
- `components/dashboard/page-transition.tsx`: AnimatePresence + usePathname key, opacity 0→1, y 10→0, 0.2s
- `components/dashboard/stat-card.tsx`: motion.div, whileHover scale 1.02
- Tüm dashboard sayfaları (`dashboard`, `recipes`, `meal-plan`, `profile`) + public `recipe/[id]` + dashboard `layout.tsx` — CSS variable dark mode sınıflarına geçirildi
- `meal-plan/page.tsx`: accordion AnimatePresence + height 0→auto smooth animasyonu
- `.env.example` oluşturuldu (UNSPLASH_ACCESS_KEY dahil)
- typecheck: 0 hata · lint: 0 hata

### 12 Mayıs 2026 — V3 yol haritası planlandı — V2 TAMAMLANDI 🎉
- V2.1 diyet hedefleri tamamlandı (profil sayfası, dashboard kartları)
- V2.2 paylaşılabilir tarif kartları (link + public sayfa + geçmiş)
- V2.3 haftalık yemek planı (Gemini üretim + öğün yenileme + dashboard widget)
- Tarif üretimi Claude API'den Gemini API'ye taşındı (maliyet optimizasyonu)
- V3 yol haritası 6 başlıkta planlandı (V3.1–V3.6)

### 12 Mayıs 2026 — V2.3 tamamlandı
- `types/meal-plan.ts`: `MealItem`, `MealPlanDay`, `MealPlan` tipleri
- `lib/ai/gemini.ts`: `generateWeeklyMealPlan(dietContext?)` + `generateSingleMeal(day, mealType, dietContext?)` eklendi
- `POST /api/meal-plan/generate`: auth + profil + Gemini + UPSERT, hata detayı response'a eklendi
- `GET /api/meal-plan`: bu haftanın planı, 200/404
- `PATCH /api/meal-plan/regenerate-day`: tek öğün yenileme, body validasyonu
- `app/(dashboard)/meal-plan/page.tsx`: boş durum + oluştur butonu + 7 günlük liste + accordion detay + tek öğün yenile + tüm planı yenile
- Sidebar ve mobil nav'a "🗓️ Yemek Planı" eklendi
- Dashboard'a "Bu Haftaki Planın" widget'ı (bugünün öğünleri)
- Bug fix: `regenMeal` surgical state update, `finally` bloğu, hata mesajı gösterimi

### 11 Mayıs 2026 — V2.2 B3 tamamlandı — V2.2 COMPLETE
- `components/dashboard/recipe-generator.tsx`: `parseFormattedRecipe` helper; `parsedRecipe`, `savedRecipeId`, `saving`, `shareMessage`, `saveError` state; `handleSave` → POST /api/recipes/save; `triggerShare` → Web Share API önce, `AbortError` ignore, clipboard fallback; "🔗 Tekrar Paylaş" idempotent
- `app/recipe/[id]/page.tsx`: server component, Supabase doğrudan sorgu, `notFound()` guard, malzeme bullet listesi, `whitespace-pre-wrap` talimatlar, makro satırı (amber bg), "Sen de dene →" CTA
- `app/(dashboard)/dashboard/page.tsx`: Promise.all'a recipes count + 5 recent sorguları eklendi; "Kayıtlı tarif" stat artık gerçek; "📋 Geçmiş Tariflerim" bölümü isim+tarih+paylaş linki; `formatDate` helper; `RecentRecipe` tipi
- ⚠️ Public recipe sayfası için Supabase'de "anyone can read public recipes" RLS policy gerekiyor (bkz. test talimatı)

### 11 Mayıs 2026 — V2.2 B2 tamamlandı
- `types/recipe.ts` oluşturuldu: `Recipe` + `RecipeMacros` interface'leri
- `POST /api/recipes/save`: auth, name+ingredients+instructions zorunlu validasyon, is_public=true insert, 201 + kayıtlı satır
- `GET /api/recipes/history`: auth, user_id filtreli, created_at DESC, limit 20
- `GET /api/recipes/[id]`: public endpoint, PGRST116 → 404, is_public=false → 404
- Mevcut `app/api/recipes/route.ts` dokunulmadı
- **Not:** `recipes` Supabase tablosu henüz oluşturulmadı — B1 için SQL gerekiyor
- lint: 0 error, typecheck: 0 error

### 11 Mayıs 2026 — Tarif üretimi Claude → Gemini'ye taşındı
- `lib/ai/gemini.ts`: `RecipeMacros`, `RecipeResult`, `RECIPE_SYSTEM_PROMPT`, `parseRecipeJson`, `generateRecipeWithGemini(ingredients, dietContext?)` eklendi; `analyzeIngredients`'a dokunulmadı
- `app/api/recipes/route.ts`: Claude importları kaldırıldı; `generateRecipeWithGemini` + local `buildDietContext` helper kullanılıyor; mantık (auth, validasyon, profil fetch) aynı
- `lib/ai/claude.ts`: değiştirilmedi (ileride başka amaçla kullanılabilir)
- GEMINI_API_KEY .env.local'da mevcut ✅

### 11 Mayıs 2026 — V2.1 A3 tamamlandı
**A3.1 — Tarif motoru:**
- `lib/ai/claude.ts`: System prompt JSON çıktısı istiyor; `RecipeMacros`, `ProfileContext`, `RecipeResult` (macros dahil) tipleri eklendi; `buildDietBlock` + `parseRecipeJson` helper'ları; `generateRecipe(ingredients, profile?)` imzası güncellendi; code fence strip fallback var
- `app/api/recipes/route.ts`: Mock tamamen kaldırıldı; gerçek Claude API; tarif öncesi Supabase'den profil çekiliyor, `ProfileContext` olarak `generateRecipe`'ye geçiliyor; `{ recipe, macros }` dönüyor
- `components/dashboard/recipe-generator.tsx`: `macros` state eklendi; tarif kartı altına 🔥💪🍚🧈 satırı; "Yeni tarif üret" macros'u da sıfırlıyor

**A3.2 — Dashboard Hedeflerim paneli:**
- `app/(dashboard)/dashboard/page.tsx`: Profil Promise.all ile pantry ile paralel çekiliyor; null-filtreli `goalItems` dizisi; grid `2/3/4/5 col` responsive; boşsa dashed border + "Hedeflerini belirle →" linki; "Düzenle →" header linki
- `dietLabel()` helper: DB değerlerini Türkçe etikete çeviriyor
- lint: 0 error, typecheck: 0 error

### 11 Mayıs 2026 — V2.1 A2.3 tamamlandı
- `app/(dashboard)/dashboard/page.tsx`: `expiredCount` hesabı eklendi (`expiry < today`, dün veya öncesi)
- Dashboard stat grid'i `sm:grid-cols-3` → `sm:grid-cols-2 lg:grid-cols-4`'e güncellendi
- `expiredCount > 0` olduğunda kırmızı `🗑️` kartı render ediliyor, tıklanınca `/pantry`'ye yönlendiriyor
- `import Link` eklendi; lint: 0 error, typecheck: 0 error
- Semantik ayrım: `wasteAlertCount` (≤ today, bugün dahil) vs `expiredCount` (< today, dün veya öncesi)

### 11 Mayıs 2026 — V2.1 A2.2 tamamlandı
- `app/(dashboard)/profile/page.tsx` tamamen yeniden yazıldı (placeholder → çalışan form)
- 4 bölümlü form: Beslenme Hedefleri / Aktivite / Kilo Takibi / Diyet Tercihi
- Sayfa açılınca GET /api/profile ile değerleri çekiyor, forma dolduruyor
- "Diğer" diyet tipi seçilince text input açılıyor
- Kaydet → PUT /api/profile, başarı/hata mesajı gösteriyor
- Loading ve hata state'leri mevcut; buton kayıt sırasında disabled
- Framer Motion fade-up (delay stagger, 0.25s, easeOut) ile 4 bölüm
- Yeni paket eklenmedi; lint: 0 error, typecheck: 0 error

### 11 Mayıs 2026 — V2.1 A2.1 tamamlandı
- `app/api/profile/route.ts` oluşturuldu (GET + PUT)
- GET: auth kontrolü → `profiles` tablosundan satır çek → 200/401/404/500
- PUT: izin verilen 10 alan, sayısal alanlar null|pozitif kontrol, `id/email/created_at` yok sayılır, `goals_updated_at` + `updated_at` her güncellemede set edilir
- `types/profile.ts`'e `ProfileUpdatePayload` tipi eklendi
- lint: 0 error, typecheck: 0 error

### 4 Mayıs 2026 — V2.1 A1 tamamlandı
- `profiles` tablosu yoktu, sıfırdan oluşturuldu
- 14 kolon: id, email, full_name, 10 diyet alanı, created_at, updated_at
- RLS politikaları + signup trigger kuruldu
- Mevcut kullanıcı (1 hesap) otomatik migrate edildi
- Eski migration dosyası silindi, referans dosyası oluşturuldu
- `types/profile.ts` güncellendi

### 1 Mayıs 2026 — Phase 7 tamamlandı — V1 COMPLETE 🎉
- Vercel deploy canlı: https://chef-ai-puce-zeta.vercel.app
- PWA: manifest.ts, icon.tsx, apple-icon.tsx, sw.js (cache-first static / network-first pages)
- iOS + Android "Ana Ekrana Ekle" çalışıyor
- `capture` attribute kaldırıldı — kamera ve galeri seçimi aktif
- Tüm V1 fazları tamamlandı (Phase 1-7)

### 1 Mayıs 2026 — Phase 6 tamamlandı
- Supabase `pantry` tablosu + RLS kuruldu (SQL Editor ile manuel)
- `GET/POST /api/pantry` + `DELETE /api/pantry/[id]` route'ları yazıldı
- `PantryClient`: optimistic add/delete, expiry renk kodlaması, israf uyarısı sayacı
- Dashboard stats (`🥦 kiler`, `⚠️ israf`) gerçek DB verisine bağlandı
- Phase 5 mobil fixler: MobileNav hamburger, PhotoAnalyzer label-trigger, buton genişlikleri
- framer-motion 10.18.0 sabitlendi (motion-utils webpack uyumsuzluğu)

### 1 Mayıs 2026 — Phase 4 tamamlandı
- `@google/generative-ai` 0.24.1 kuruldu
- `lib/ai/gemini.ts`: `gemini-2.5-pro` vision wrapper, base64 görüntü → Türkçe malzeme listesi
- `app/api/vision/route.ts`: POST endpoint, auth + MIME tipi + 10 MB validasyonu
- `components/dashboard/photo-analyzer.tsx`: 5 adımlı state machine (idle → previewing → analyzing → ingredients → generating → recipe), tek akışta fotoğraf → tarif
- Uçtan uca test: mercimek + patates doğru tespit, tarif üretildi

### 1 Mayıs 2026 — Phase 3 tamamlandı
- `lib/ai/claude.ts`: Anthropic SDK wrapper, system prompt caching (`cache_control: ephemeral`)
- `app/api/recipes/route.ts`: POST endpoint, auth korumalı, mock mod (2-3s gecikme, gerçekçi tarif)
- `components/dashboard/recipe-generator.tsx`: Virgülle ayrılmış malzeme girişi, Framer Motion AnimatePresence ile tarif kartı
- Dashboard'a `RecipeGenerator` entegre edildi
- `framer-motion` 12.x → 11.18.2 downgrade: Next.js 14 hidrasyon sorunu (opacity:0 kalma) çözüldü
- `.next` cache temizlendi, sunucu port 3000'de yeniden başlatıldı

### 30 Nisan 2026 — Phase 2 tamamlandı
- Landing page butonları /signup ve /login'e bağlandı (navbar desktop+mobil, hero, pricing)
- `<a href="#">` → Next.js `<Link>` geçişi yapıldı

### 30 Nisan 2026 — Auth doğrulama
- Supabase URL DNS hatası tespit edildi (proje ID yanlış kopyalanmıştı), .env.local güncellendi
- Login ve signup sayfaları test edildi, kullanıcı dashboard'a erişebildi
- Auth akışı çalışıyor: signup → e-posta doğrulama → login → /dashboard

### 26 Nisan 2026 — İlk seans
- Boş klasörden çalışan Next.js'e kadar geldik
- Next.js 16 + Tailwind v4 ile başladık ama 14 + v3'e geri döndük (doğru karar)
- create-next-app'in "boş olmayan klasör"e yüklenmemesi sorunu CLAUDE.md'yi /tmp'ye taşıyarak çözüldü
- İlk git commit alındı


## 15 Ekim 2026 — Mobil yayın hazırlığı

- Krem/yeşil/lime tasarım korundu; TR/EN ve ölçü tercihleri, üç adımlı onboarding, sürümlü ayrı AI aktarım izni eklendi.
- Auth recovery/verification callback allowlist, yeniden gönderim sınırı, AppState yenilemesi, tek 401 refresh, güvenli oturum saklama ve hesap temizliği tamamlandı.
- API timeout/şema/GET retry, hesap izolasyonu, offline/bakım/minimum sürüm ve hata sınırı eklendi.
- Fotoğraf önizleme/onay, 1600px/4MB JPEG normalizasyonu, geçici dosya temizliği ve gerçek ack isteyen raporlama eklendi.
- Özel kaydetme/geçmiş, RevenueCat aylık satın alma/restore, server üyelik kontrolü, push yaşam döngüsü ve opt-in analytics adapter’ları hazırlandı. Backend capability doğrulanmadan yeni entegrasyonlar açılmıyor.
- Lint/TypeScript ve 9 suite/59 test geçti. Mock tarayıcı akışı ile iOS Expo Go login/recovery görsel kontrolü yapıldı; signed build/gerçek cihaz/ikinci cihaz/backend/beta doğrulanmadı.
- CI, 20 madde kanıt matrisi, API sözleşmeleri, mağaza taslak paketi ve yayın/geri dönüş rehberi eklendi. Production kontrolü eksik kanıtları reddediyor.
- Güvenlik engeli: audit sonrası 54 high/20 moderate bağımlılık bulgusu sürüyor. HawkScan CLI/API key yok; DAST çalıştırılmadı. Backend veya prod servisleri değiştirilmedi; mağazaya gönderim yapılmadı.


## 15 Ekim 2026 — Güvenlik düzeltmeleri ve yetkilendirilmiş API hazırlığı

- Güncel mobil audit 75 bulgu ile başladı (55 high/20 moderate). image-size, decode-uri-component, selector-parser ve uuid düzeltildi; yayımlanmış düzeltmesi bulunmayan braces/node-forge/sprintf-js için hash kontrollü, kurulumda uygulanan yerel yamalar ve saldırı regresyonları eklendi. Ham npm audit 59 uyarı göstermeyi sürdürüyor (54 high/5 moderate); uyarılar gizlenmedi, güvenlik yayın kapısı pending.
- Mobil: 64 uygulama testi + 9 bağımlılık güvenlik testi, lint, TypeScript, Expo sürüm uyumu ve üç platform bundle export geçti. İzole iOS/Android native prebuild geçti; signed native build veya gerçek ödeme/push testi yapılmadı.
- Kullanıcı API kapsamını chef-ai-web için açıkça onayladı. Tanıtım sayfaları değiştirilmedi. Özel/idempotent kayıt, config, izin/raporlar, server-only atomik AI kotası/istek kaydı, profil yetki koruması, RevenueCat doğrulama/webhook, push/receipt, processor silme kuyruğu ve anonim günlük analytics kaynakları eklendi.
- API repo bağımlılık güncellemesi kritik Next bulgusunu giderdi; ham audit 17→7 (kalanlar yerel yamalı braces zinciri). 26 Node testi ve izole PostgreSQL 17 güvenlik/kota/eşzamanlılık kontrolleri geçti; Next build doğrulandı. Gerçek Supabase migration/deploy yapılmadı.
- Vercel hesabı ve chef-ai projesi salt okunur doğrulandı. Supabase bağlantısı bu çalışma sırasında kuruldu; staging şeması, servis hesapları/ürünleri, gerçek entegrasyon, native QA ve beta hâlâ yayın engeli. HawkScan CLI/anahtar eksikliği nedeniyle DAST çalıştırılamadı.

## 15 Ekim 2026 — Supabase bağlantısı ve gerçek şema incelemesi

- Mevcut chef-ai projesi yeniden etkinleştirildi; durum ACTIVE_HEALTHY. Salt okunur katalog incelemesi altı ana tablo/RLS ve mevcut fonksiyon yetkilerini doğruladı. Uygulama satırları okunmadı; uzak migration veya veri değişikliği yapılmadı.
- Supabase danışmanı: handle_new_user search_path, handle_new_user/rls_auto_enable gereksiz istemci EXECUTE yetkileri, eski kredi RPC yetkileri ve kapalı leaked-password koruması. API reposuna altıncı tetikleyici hardening migration eklendi; signup tetikleyicisi ve yetkileri yerel testte doğrulandı. apply_referral kimlik doğrulamalı kullanım için ayrıca gözden geçirilecek.
- Altı migration, SQL güvenlik kontrolleri ve iki bağlantılı eşzamanlılık/101 cihaz deduplication testi izole PostgreSQL üzerinde geçti; 26 API Node testi tekrar geçti. Yerel recipes fixture tipi gerçek jsonb şemasıyla hizalandı.
- Kullanıcı mertgrz24's Org altında staging projesini onayladı. get_cost aracı bağlantıda UNAVAILABLE döndü; maliyet doğrulanamadığı için proje oluşturulmadı. Alternatif yönetim paneli oturum açmayı bekliyor. Ücretli plan veya production deploy açılmadı.

## 15 Ekim 2026 — Ayrı staging veritabanı hazır

- Kullanıcı oturum açtıktan sonra panelde Free plan doğrulandı; chef-ai-staging (vcyqtbzhfanbpclfhibv), ap-south-1 bölgesinde oluşturuldu. Otomatik tablo API grant'leri kapalı, otomatik RLS açık. Ücretli plan seçilmedi.
- Boş temel şema ve altı güvenlik migration'ı sadece staging'e uygulandı. Üretim verisi/kullanıcısı kopyalanmadı; production migration veya API deploy yapılmadı.
- Gerçek staging PostgreSQL üzerinde sentetik kullanıcılar ile signup, RPC yetkileri, profil Premium koruması, hesap izolasyonu/özel tarif, kota, idempotency, tek iade, rapor limiti, üyelik sıralaması ve analytics kontrolleri geçti. Testler rollback edildi; auth/profiles/recipes/AI jobs sayıları 0 doğrulandı. Bu test gerçek istemci oturumu/SMTP/ödeme testi değildir.
- Staging security advisor: apply_referral için 1 bilinçli authenticated-definer uyarısı; istemci yetkileri kapalı dokuz service-only tabloda policy bulunmaması için bilgilendirme. Uyarılar gizlenmedi. Ayrı staging API deployment, gerçek servis ayarları ve native/beta kanıtları hâlâ bekliyor.

## 15 Ekim 2026 — Staging API ve gerçek oturum doğrulaması

- Vercel'de ayrı chef-ai-staging projesi oluşturuldu. Preview ortamı yalnızca staging Supabase'e bağlı; sunucu anahtarı sensitive, AI/ödeme/push/analytics ve cron kapalı. Son Preview build: dpl_2FvuGduCJFq9iT2kUiHUtUmdE9c5 (READY).
- Yerel API + gerçek Supabase oturumlarında 13 kontrol geçti. Yayımlanan son Preview üzerinde 13 API kontrolü + 3 gerçek hesap silme kontrolü tekrar geçti: özel tarif/idempotency, ikinci istemciyle tarif ve kiler kalıcılığı, hesap izolasyonu, Premium/RPC yetki reddi, oturum sahibinin silinmesi ve eski token reddi. Sentetik kullanıcılar temizlendi; son sayımlar 0.
- Eski API yollarının ham hata logları sınırlı kod helper'ına alındı. 27 Node güvenlik testi, TypeScript ve lint (0 error, iki eski UI warning) geçti. Vercel build'de hash kontrollü bağımlılık yamaları doğrulandı.
- Vercel ilk deploy'u Production etiketlediği için ayrı staging projesinde yalnızca sır/API içermeyen statik başlangıç sayfası kullanıldı; sonraki gerçek API build'leri Preview hedefinde. İlk cron sınırı hatası ücretli plana geçmeden, yalnızca geçici staging kopyasının cron'unu kapatarak çözüldü. Mevcut chef-ai production API/web deploy edilmedi.
- Yayıncı adı/destek e-postası/yasal alan adı kullanıcı tarafından sonraya bırakıldı. Gerçek AI, SMTP, RevenueCat sandbox, Sentry symbolication, push cihaz teslimi, signed native build, mağaza ve beta kapıları açık. Ham audit uyarıları ve HawkScan erişim eksikliği sürüyor; yayın onayı verilmedi.

## 15 Ekim 2026 — Bağlantı sonrası güvenlik takibi

- Supabase skill ve güncel changelog incelendi. Staging security advisor aynı 1 authenticated-referral uyarısı ve servis tablolarına ait 9 bilgilendirmeyi döndürdü; uyarıları kapatmak için erişim genişletilmedi.
- npm registry'de braces 3.0.3, node-forge 1.4.0 ve sprintf-js 1.1.3 hâlâ latest. Kurulu gerçek bağımlılıklara ait 9 güvenlik kontrolü tekrar geçti.
- Yeni ham mobil audit 61 (56 high/5 moderate); iki yeni üst paket adı nativewind/react-native-css-interop, aynı üç kök advisory'den etkileniyor. Eski/yeni raporlar birlikte korundu; API audit hâlâ 7 high. Hiçbir risk acceptance/exclusion eklenmedi.
- Supabase staging TLS 1.3 bağlantısı/sertifika doğrulaması geçti; minimum iOS/Android cihaz matrisi ayrıca bekliyor.
- HawkScan 6.6.0 resmî manifestten indirildi, SHA256 doğrulandı, ~/.local/bin/hawk kuruldu; version/config/skills ön kontrolleri geçti. StackHawk tarayıcı girişi başlatıldı; kullanıcı oturumu bekleniyor. Henüz DAST çalışmadı, ücretli hesap/deneme açılmadı. 28 API yolu/31 HTTP metodu envanteri hazırlandı.
- Yayın kanıtları staging başarısını ve kalan üretim/native/servis eksiklerini ayrı gösterecek şekilde güncellendi; yasal bilgiler kullanıcı isteğiyle bekliyor.

## 15 Ekim 2026 — Kullanıcı tercihi: ücretsiz Snyk

- Kullanıcı ücretli StackHawk yerine Snyk istedi. Bekleyen HawkScan tarayıcı giriş süreci durduruldu; ücretli hesap/deneme açılmadı. HawkScan girişini otomatik yeniden başlatma.
- Resmî Snyk Free planı Open Source/Code taramalarını destekliyor. Çalışan API taraması ayrı Snyk API & Web ürününde; ürün sayfası aylık tek uygulama taraması için Free seçeneği sunuyor. Gerçek hesap hakkı/kota ve yeniden tarama sınırı doğrulanmadan işlem açılmayacak. Snyk taraması henüz yapılmadı; güvenlik kapısı pending.

## 15 Ekim 2026 — VS Code Snyk bulguları

- Kullanıcı mevcut Snyk eklentisinden 5 bağımlılık ve 2 kod bulgusunu paylaştı. Expo CLI’nin eski Zod kopyası kapsamlı olmayan, yalnızca CLI’ye uygulanan override ile 4.6.7’ye geçirildi. Gerçek DevTools/MCP şemaları ve üç platform export doğrulandı.
- deepmerge kaynak/CJS/UMD ve Worklets TS/JS/C++ için altı hash kontrollü yama eklendi; toplam 16 dosya. deepmerge saldırısı özgün kaynakta üretildi, yamada engellendi. Worklets üretici düzeltmesi mevcut Reanimated 4.5.1 ile uyumlu 0.10.1’e taşındı; yeni 0.12.2/0.13.0 sürümüne uyumsuz geçiş yapılmadı. Native yardımcı RN JSI başlıklarıyla derlendi; tam native build/çalışma testi bekliyor.
- Test token’ı çalışma anında üretiliyor. Password→Parola arayüz çevirisi gerçek parola olmadığı için yanlış pozitif olarak belgelendi; taramadan gizlenmedi.
- Temiz npm ci, 64 uygulama testi + 12 güvenlik regresyonu, lint, TypeScript, Expo uyumu ve iOS/Android/web export geçti. Ham npm audit 59 (54 high/5 moderate); uyarılar korunuyor.
- Mevcut VS Code Snyk hesabında yeniden tarama başlatıldı: Open Source 5→4 (2 high/2 medium), Zod kalktı. Kaynak yamaları paket sürümünü değiştirmediği için kalanlar görünür. Code sonucu bekleniyor; Secrets kapalı. Ücretli servis açılmadı, güvenlik yayın kapısı pending.

Worklets ek native kontrol / native follow-up: gerçek yamalı `Serializable.cpp` dosyasının tamamı, kurulu RN/Worklets başlıklarıyla C++20 `-DNDEBUG -fsyntax-only` kontrolünden geçti. Debug kontrolü CocoaPods bağımlılığı `glog/logging.h` henüz kurulmadığı için tamamlanmadı. Bu sonuç linklenmiş iOS/Android binary veya native çalışma testi değildir.

Snyk son yeniden tarama: ilk Code isteği API timeout verdi; tek tekrar başarıyla tamamlandı. Toplam **7→5**: Open Source 4 (2 high/2 medium), Code 1 medium (Password→Parola çeviri etiketi). Test token bulgusu kalktı; IaC bulgusuz, Secrets hâlâ kapalı. Ekran görüntüsü ve elle aktarılmış UI kanıt kaydı saklandı. Uyarılar gizlenmedi; kaynak yamaları bağımsız/native onay yerine geçmez.

## 15 Ekim 2026 — Secrets ve gerçek iOS native güvenlik kontrolleri

- Snyk Secrets proje için açıldı; organizasyon özelliği kapalı. Ücretli paket/deneme açılmadan Gitleaks 8.30.1 ile mobil/API kaynakları ve mevcut Git geçmişleri tarandı: 0 kaynak/geçmiş bulgusu. Ignored .env envanterindeki beş eşleşme anon anahtarları ve yerel sunucu anahtarları; modlar 0600 yapıldı. Kaynak snapshot'ları silindi, değerler yazdırılmadı. Normal native pakette dört sunucu anahtarı değeri bulunmadı.
- Çevrimdışı scanner/CI eklendi; gerçek sahte anahtar ve geçmişte silinmiş anahtar yakalama, hatada başarısız olma kanıtları geçti. CI aksiyonları resmî repolardan doğrulanan commit SHA'larına sabitlendi. Android APK izin/ELF/ZIP 16 KB denetleyicisi ve manuel CI hazırlandı; henüz uzakta çalıştırılmadı. Betiklerin serbest yol parametrelerine ait Snyk uyarıları sabit proje yolları/komutlarıyla giderildi; final tarama ayrıca kaydedilecek.
- Face ID açıklaması kaldırıldı; Android backup/overlay kapatıldı; yeni oturum yazıları WHEN_UNLOCKED_THIS_DEVICE_ONLY kullanıyor. Lint/TS, 65 uygulama + 12 bağımlılık + 2 scanner + 4 ELF parser testi geçti.
- Xcode 26.6 / iOS SDK 26.5 ARM64 Release simülatör derlemesi geçti. İlk imzasız Keychain yetki hatası doğru Xcode simülatör imzasıyla çözüldü; korumalar gevşetilmedi. Hermes'te gerçek RN↔UI prototip aktarımı ve uzun Unicode Keychain yaz/oku, uygulama yeniden açılışı, silme dahil 10 native kontrol geçti. Normal uygulamada 222 dosya/16 gizlilik manifesti incelendi; test probe'u pakette yok. Probe normal uygulamayla değiştirildi, giriş ekranı oturum hatası olmadan açılıyor. Servis uyarısı mevcut API'ye yeni mobil sözleşmeler henüz yayımlanmadığı için korunuyor.
- Mac'te Android SDK/Java yok; kullanıcı daha fazla alan açamıyor. Android/gerçek cihaz/dağıtım imzası, bağımsız yama incelemesi, kimlik doğrulamalı DAST ve gerçek servis/mağaza kapıları açık. Normal simülatör app+dSYM saklandı, yalnızca bu işin oluşturduğu 3+ GB native ara dosyalar temizlendi. Production deploy veya mağaza yayını yapılmadı.

16 Ekim kapanış kaydı: Secrets ve iOS yerel alt kontrolleri tamamlandı; Android/DAST/bağımsız inceleme ve üretim API/şema kapıları açık. Sıradaki yayın işleri docs/NATIVE_SECURITY.md içinde sıralandı. 65+12+2+4 otomatik test ve 10 gerçek iOS native kontrolü geçti; uzakta CI çalıştırılmadı.

Android uzak alternatif: mevcut private GitHub repo erişimi doğrulandı. Ücretsiz Actions kotası API (404) ve panel (bağlantı kesildi) üzerinden doğrulanamadı; kullanıcıdan ücretsiz kota/ücretli kullanımın kapalı olduğu bilgisi istendi. Kaynak push veya ücret doğurabilecek runner başlatılmadı.

## 16 Ekim 2026 — Ücretsiz GitHub Actions doğrulaması ve Android başlangıcı

- Kullanıcının açık GitHub hesabında Actions kotası doğrulandı: 436/2.000 dakika kullanılmış, 1.564 dakika kalmış; depolama 0/0,5 GB. Hesap geneli Actions bütçesi $0, durdurma kutusu açık, geçerli ödeme yöntemi yok. Faturalandırma ayarları değiştirilmedi.
- Yerel main/index ve WIP korunarak ayrı codex/android-native-validation-20261016 dalına mobil kaynak snapshot’ı gönderildi. Bu snapshot yalnız Android workflow’unu içeriyor; standart Ubuntu runner, 45 dakika sınırı, bir gün artifact saklama. Staging public anahtar/API değişkenleri ayarlandı; protected Preview gerçek native API doğrulaması sayılmıyor.
- İlk Android run: https://github.com/mertgrz24/chef-ai/actions/runs/38809519194 — başladı; sonuç/gerçek APK denetimi henüz bekleniyor. Push öncesi Gitleaks: 160 kaynak dosyası, kaynak/geçmiş 0 bulgu.

Android ilk gerçek artifact: run 38810065531 ARM64 Release APK üretti (56.788.137 bayt), fakat Worklets tam lint K2 motoru KaModule iç hatasıyla durdu. Yerel APK incelemesi: 26 ELF/ZIP native hizalama geçti, probe yok, 1.376 dosyada dört bilinen yerel sunucu değeriyle eşleşme yok. Tam lint kapatılmadan K1 analiz seçeneğiyle ve ayrı assemble/lint/artifact adımlarıyla run 38812576433 başlatıldı. Ön iki kurulum/snapshot hatası da kanıtta korundu; genel sonuç henüz pending.

Android run 38812576433, uygulama vital lint’inde gerçek 4 ExtraTranslation hatası buldu: iOS NSCamera/NSPhotoLibrary izin çevirileri Android kaynaklarına yazılıyordu. EN/TR native locale dosyaları Expo’nun desteklediği ios nesnesine alındı; gerçek Expo çözümleyicisiyle regresyon eklendi ve temiz Android prebuild kaynaklarında iOS anahtarı bulunmadığı doğrulandı. Lint kuralı/baseline/suppression eklenmedi. Yerel lint/TS, 65 uygulama ve 13 güvenlik/yapılandırma testi geçti. Yeni run 38816907980 devam ediyor.

## 16 Ekim 2026 — Android native CI tamamlandı

- Run https://github.com/mertgrz24/chef-ai/actions/runs/38822859339, commit 3313a6477a71f6b71f3af369371375067d35f8ac: Release assembly, tam lint, gerçek ARM64 APK manifest/26 ELF/SDK zipalign 16 KB kontrolleri ve artifact upload geçti (~32 dakika). API33 splash kaynağı sürümlü dizine ayrıldı; kamera donanımı opsiyonel bildirildi. Hiçbir lint kuralı susturulmadı.
- Yerel lint/TypeScript, 65 uygulama testi, 15 güvenlik/yapılandırma regresyonu ve 4 ELF parser testi geçti. Son kaynak/geçmiş Secrets kontrolünde 0 bulgu.
- Son CI arşivinin yerel indirmesi ağ timeout nedeniyle tamamlanmadı. Yerelde saklanan önceki APK raporunun run 38816907980 kökeni açıkça belirtildi; son CI başarısı bununla karıştırılmıyor. Fiziksel cihaz, final IPA/AAB ve diğer ABI kontrolleri açık.
- Kullanıcı mevcut Snyk hesabına Safari’de giriş yaptı. Kullanım ekranı private manifest 12/200, IaC 0/300, Code 0/100 gösteriyor; bunlar DAST hakkı sayılmadı. API & Web SSO account-not-accessible sayfasına ulaştı, ücretli paket/deneme açılmadı ve DAST başlatılmadı.
- Bağımsız yama incelemesi, erişilebilir staging API, gerçek SMTP/ödeme/push/Sentry, hukuki bilgiler ve beta/mağaza kapıları açık. Production deploy/yayın yapılmadı.

## 16 Ekim 2026 — Telefona erişilebilir staging API

- Ayrı chef-ai-staging Vercel projesinin sabit HTTPS adresi: https://chef-ai-staging-nu.vercel.app. Bu adres Vercel oturumu/bypass anahtarı gerektirmiyor; Preview koruması korunuyor. Platformun bu staging projesindeki Production target kullanıldı; müşteri production API/DB değişmedi. Fonksiyonlar ayrı staging DB ile aynı bom1 bölgesinde.
- Exact chefai://auth/callback yönlendirmesi kullanıcının eylem anındaki açık onayıyla staging Supabase’e eklendi. 16 doğrudan HTTP kalıcılık/izolasyon/silme kontrolü ve 6 auth token/redirect kontrolü geçti. Gerçek SMTP kurulmadı; e-posta teslimi doğrulanmadı. Telefona ayrı, önceden doğrulanmış sentetik test hesabı hazırlandı; bilgiler sadece özel yerel Downloads dosyasında.
- Yeni Gemini anahtarı kullanıcı tarafından özel geçici dosyaya yazıldı ve yalnız staging sunucusuna aktarıldı. Model seçimi sunucu env’iyle yapılabiliyor; production varsayılanı korunuyor. Mac’te gerçek yapılandırılmış tarif üretildi, ancak hosted istekler model/bölge değişimine rağmen sağlayıcı 503 verdi. AI kabulü yapılmış sayılmadı; AI/localized-AI staging bayrakları tekrar kapatıldı.
- Staging test bilgilendirme API sayfası eklendi; production hukuki metni değildir, varsayılan production/başka DB’de 404 regresyonu var. Güvenli kategori tabanlı staging teşhisi ham sağlayıcı hatası, URL, token veya içerik loglamıyor. 30 API güvenlik testi ve TypeScript geçti; lint 0 hata/4 mevcut uyarı. İki repo kaynak/geçmiş Secrets taraması 0 bulgu.
- Yeni Android run https://github.com/mertgrz24/chef-ai/actions/runs/38905484217 başarılı; APK indirmesi sürüyor. Önceki APK korumalı Preview adresine bağlı olduğundan yenisiyle değiştirilmeli. Ayrıntılar mobile/docs/STAGING_DEVICE_TEST.md içinde.

Android staging APK teslimi: run38905484217 artifact12049860632 indirildi; arşiv SHA-256 GitHub digest ile eşleşti. APK bütünlüğü ve sabit staging URL’si doğrulandı; incelenen 6 bilinen sunucu değeriyle literal eşleşme 0. Dosya Downloads/Chef-AI-Staging-2026-10-16.apk olarak hazır. AI/provider, SMTP, ödeme/push ve gerçek cihaz kabulü açık; tüm akışlar tamamlandı denmedi. Geçici sunucu anahtarı/env/test kimlik bilgisi kopyaları temizlendi; kullanıcıya ayrılan test hesabı ve özel giriş notu korundu.


## 16 Ekim 2026 — Cihaz geri bildirimi: silme bağlantısı, AI hata ayrımı ve auth e-posta hazırlığı

- Ortak hesap silme web bağlantısı kaldırıldı; yalnız Profile'daki kırmızı gerçek silme eylemi kaldı. Kullanıcının tarayıcıda uzun metin görme bildirimi staging bilgilendirme linkiyle örtüşüyor; gerçek API arızası doğrulanmadı.
- Staging sentetik auth/profil/kiler/tarif cascade kontrolü rollback ile geçti; gerçek hesap silinmedi, production/şema değiştirilmedi. Silme API'sinin kimlik ve başarısızlık yollarına regresyon testi eklendi.
- Beş AI endpoint'inde güvenli sağlayıcı hata kategorileri ve mobil TR/EN hata sunumu eklendi; haftalık planda her 403'ün kota sayılması düzeltildi. Hosted 503 ve AI-off durumu açık engel; yeni başarılı canlı AI kanıtı yok.
- Kullanıcı gerçek cihazda doğrulama e-postasının çalıştığını bildirdi. Chef-AI markalı doğrulama/reset HTML şablonları ve SMTP rehberi hazırlandı; alan adı/gönderici/SMTP bilgileri olmadan etkinleştirilmedi.
- Mobil 72 test, API 34 test, iki TypeScript kontrolü geçti. Mobil lint temiz; API lint 0 hata/önceden mevcut 4 uyarı. Gitleaks mobil178/API128 dosya, kaynak ve yerel geçmişte sıfır bulgu.
- Kullanıcı talebiyle **yeni build veya deploy alınmadı**; kaynak düzeltmeleri mevcut APK'ya yansımadı. Ayrıntılı oturum dökümü: `mobile/docs/DEVICE_FEEDBACK_2026-10-16.md`.


## 16 Ekim 2026 — AI 503 toparlanması: staging üzerinde gerçek kabul geçti

- Google model listesi ve doğrudan çağrı/log karşılaştırması: anahtar geçerli; 503 nedeni sağlayıcı yüksek talebi. Yeni `gemini-3.5-flash-lite` staging modeli seçildi; API güncellendi. Müşteri production ve mobil build değişmedi.
- JSON çıktı modu ve boş çıktı reddi eklendi. Yalnız staging'de açık sağlayıcı 503'ünde bir ek çağrı, 2–3sn bekleme ve ortak110sn bütçe; ağ/timeout/kota hatasında otomatik tekrar yok. Mevcut idempotency ve uygulama kaydı tek kalıyor. İşlem başına en fazla iki sağlayıcı çağrısı sınırı maliyet notuna işlendi.
- **13 gerçek hosted HTTP kabulü geçti:** EN/TR tarif, özel kayıt/tekrar/yeni giriş geçmişi, rapor, kamuya açık yemek fotoğrafı analizi, 7 günlük plan/yeniden okuma, öğün yenileme, izin verme/geri çekme. Test hesabı temizlendi.
- API36 test ve TypeScript geçti; lint0 hata/4 mevcut uyarı. Sabit staging origin'de `ai=true`, `localizedAi=true`; satın alma/push/analytics kapalı. Yeni APK alınmadı; mevcut APK'yı kapatıp açmak yeterli.
- Güncel dağıtım `dpl_GovLsMia88j1dCSkmUS2zpVTgMJ5` (bom1). Ayrıntı ve kanıt: `mobile/docs/AI_RECOVERY_2026-10-16.md`, `mobile/security/staging-ai-recovery-2026-10-16.json`. Fiziksel cihaz kabulü ve önceki production/yayın/güvenlik kapıları açık.


## 16 Ekim 2026 — Yerel staging/production ayrımı (build/deploy yok)

- Mobil `.env` artık staging Supabase ve hosted staging API'ye bağlı; APP_ENVstaging. `.env.example` de aynı public varsayılanları gösteriyor. Gemini/service-role mobil dosyaya konmadı.
- Eski kök `.env.local` ve mobil production `.env`, otomatik yüklenmeyen `~/.config/chef-ai/env-backups/` tarihli özel yedeğe taşındı (0700/0600). Production servisleri ve anahtarları değiştirilmedi.
- Mobil config yerel aşamada proje/API/public anahtar eşleşmesini ve public secret sızıntısını kontrol ediyor. Gerçek staging config geçti; beş karışık/production/public-secret örneği reddedildi.
- API reposuna staging-only `.env.local`, örnek ayar ve development-server guard eklendi. İki server key güvenli aktarımı tamamlanamadığından **boş**; yerel API başlamayı reddediyor. Bu bir tamamlanmış yerel API entegrasyonu değildir. Mobil çalışan hosted staging API üzerinden geliştirilebilir.
- Mobil/API TypeScript ve lint kontrolleri geçti (API4 mevcut uyarı). Yeni build, native workflow, Metro veya deploy başlatılmadı. Rehber: `mobile/docs/LOCAL_DEVELOPMENT.md`.


## 16 Ekim 2026 — Bağımsız yerel API tamamlandı (build/deploy yok)

- Önceki yerel ortam ayrımındaki iki eksik alan tamamlandı: mevcut staging Supabase service-role ve mevcut yeni Gemini anahtarı authenticated sağlayıcı panellerinden okunup yalnız API `.env.local` dosyasına kaydedildi (0600, Git dışında). Yeni anahtar/hesap oluşturulmadı; production yedeğindeki değerler kullanılmadı.
- `npm run env:check` geçti; service-role JWT staging proje/rolü ve gerçek Supabase hazırlık sorguları doğrulandı. Gemini yapılandırılmış model erişimi200 döndü; yerel AI/TR bayrakları açıldı. Diğer servis bayrakları kapalı.
- Next development API yalnız `127.0.0.1:3000` üzerinde başlatıldı. Hosted API'ye proxy bağımlılığı yok; doğrudan staging Supabase ve Google'a bağlanıyor.
- **16 gerçek yerel entegrasyon kontrolü geçti:** 13 tarif/izin/özel kayıt/geçmiş/rapor/fotoğraf/haftalık plan/öğün yenileme ve 3 hesap silme/hesap izolasyonu/silinmiş oturum reddi. Tüm sentetik hesaplar temizlendi.
- Mobil varsayılan API hâlâ hosted staging; mevcut APK değiştirilmedi, sunucu LAN'a açılmadı. Yeni build, EAS/native workflow veya backend deploy yapılmadı. Rehber güncellendi: `mobile/docs/LOCAL_DEVELOPMENT.md`; kanıt `mobile/security/local-api-ready-2026-10-16.json`.


## 16 Ekim 2026 — mobil / tanıtım / backend üçlü repo ayrımı

Kullanıcının talebiyle API ve sunucu ayarları `chef-ai-web` reposundan bağımsız `chef-ai-backend` reposuna taşındı. Kaydedilmemiş güvenlik/AI düzeltmeleri dahil kaynaklar önce kopyalanıp hash ile doğrulandı; API route'ları, servisler, tipler, Supabase migration/e-posta şablonları ve public recipe işlevi yeni backend'de. Tanıtım sayfası ve statik davet sayfası web'de kaldı. Gerçek staging `.env.local` yalnız backend'de,0600 ve Git dışında; mobil public ayarları değişmedi. Web bağımlılıkları/sunucu cron'ları ayrıldı, güvenlik bağımlılık yamaları korundu.

Mevcut hosted staging adresi/artefaktı ve telefondaki APK korundu. Yerel API development sunucusu yeni backend reposuna alındı. Yeni build veya deployment yapılmadı. Önceki günlükteki web/API konumları tarihsel kayıttır; güncel sözleşme sahibi backend'dir. Production geçişi, SMTP/yasal bilgiler, DAST, native/beta ve mağaza kapıları bu taşıma ile tamamlanmış sayılmaz. Ayrıntı: backend `docs/REPOSITORY_SPLIT.md`.

Ayrım doğrulaması: backend36güvenlik testi ve8yerel/hosted sentetik entegrasyon kontrolü geçti; geçici hesap temizlendi. Web/mobile kaynaklarında ve backend başlangıç snapshot/geçmişinde sır taraması0bulgu. Backend GitHub özel repo hazır; web/mobile push edilmedi, yeni build/deploy tetiklenmedi. Tanıtım3001/API3000 development portlarında; canlı staging aynı artefaktla çalışır.


## 16 Ekim 2026 — mobil ve backend aynı uygulama reposunda

Kullanıcının seçtiği sade düzen uygulandı: `mobile/` ve `backend/` chef-ai reposunda, tanıtım ayrı chef-ai-web reposunda. Önceki standalone backend çalışma dizini buraya taşındı;115 kaynak dosyası taşıma öncesi/sonrası SHA-256 ile doğrulandı. API/servis işlevi değişmedi. Nested .git bırakılmadı; önceki backend Git geçmişi özel kurtarma alanında, GitHub standalone repo tarihsel snapshot olarak korundu. Mobildeki kaydedilmemiş işler ve Git indeksi sıfırlanmadı.

Sunucu anahtarları yalnız `backend/.env.local` içinde 0600 / Git dışında; mobile/.env yalnız public staging değerlerinde. Paketler/lock dosyaları bağımsız, mobil-backend ilişkisi HTTP üzerinden. Yerel API yeni dizinden 3000 portunda; tanıtım ayrı repoda 3001. Güncel yönergeler/MD'ler düzenlendi; önceki üç repo kayıtları tarihsel tutuldu.

Staging Supabase/Vercel ve mevcut APK değişmedi. Yeni build/deploy/push veya native CI çalıştırılmadı. İleride monorepo Git deploy'u yapılacaksa Vercel Root Directory backend; Expo/EAS çalışma dizini mobile olmalıdır. Ayrıntı: backend/docs/MONOREPO.md.

Güncel taşıma kontrolü: 64 işlevsel API/servis/SQL dosyası değişmeden korundu; backend TypeScript ve ortam kontrolü geçti. Yerel/hosted config200 ve AI/TR hazır; kimliksiz korumalı istekler401. Git kaynak/yerel geçmiş sır taramasında0bulgu; sunucu anahtarları mobile/.env içinde yok. Önceki testler tekrar çalıştırılmadı; yeni AI üretimi veya hesap/veri mutasyonu yapılmadı. Kanıt: mobile/security/monorepo-layout-2026-10-16.json.


## 16 Ekim 2026 — yayın engellerinin yeniden kontrolü ve kalıcı günlük AI limiti

Güncel20madde/24kabul kapısı yeniden incelendi; stale503/AI-off backend kaydı düzeltildi. Raw npm: mobil56high/5moderate, backend7high; kök braces/node-forge/sprintf-js yerel yamalarının bütünlüğü ve15mobil regresyonu geçti. Backend36güvenlik testi ve TypeScript geçti. Audit uyarıları/bağımsız inceleme/DAST halen açık; ücretli servis açılmadı.

Global AI limiti job satırlarından hesaplandığından hesap silme/cleanup ile azalabiliyordu. UTC gün+sayısı tutan kimliksiz counter ve atomic rezervasyon migration hazırlandı, local SQL lifecycle ve farklı hesapların son kota yarışı geçti. Yalnız staging Supabase üzerinde uygulandı; RLS/grant/search_path doğrulandı,5gerçek staging replay/başarısızlık/kota/hesap silme kontrolü geçti. Sentetik hesap temizlendi; AI sağlayıcı çağrısı0. Production değişmedi; bu kesin dolar/token muhasebesi değildir.

Backend non-build CI kaynak kontrolü monorepoya eklendi; uzak CI/push/build/deploy yapılmadı. Güncel sıralı engeller: mobile/docs/RELEASE_BLOCKERS_2026-10-16.md. SMTP/yasal bilgiler, abonelik, push/Sentry, production yedek/restore/işletim, final native/beta/mağaza kanıtları bekliyor.24gate pending kaldı.


## 16 Ekim 2026 — kamera/önizleme ve haftalık menü mobil düzeltmeleri

İzin yalnız kullanıcı eylemiyle ve canAskAgain uygunsa istenir; kalıcı ret/Settings dönüşü ve Scan'den ayrıldıktan sonra kamera açmama eklendi. Android pending picker sonucu önizlemeye kurtarılır; tam görsel yüklenmeden ve Analyze onayı olmadan gönderilmez. Görsel değiştirme/iptal, kota elle ekleme alternatifi ve unmount upload/normalizasyon temizliği düzeltildi.

Haftalık menüde TR işlem kimliği/loading eşleşmesi, offline ilk açılış spinner'ı, gün sırası/tarih doğrulaması ve eski read yanıtının yeni planı ezmesi düzeltildi. Öğün detayları/önceki plan hatada ve offline korunur.95test/14suite ve15güvenlik regresyonu, TypeScript/lint geçti;23yeni test eklendi. Gerçek OS izin/kamera/activity kabulü yapılmadı. Backend'in DB hatasını404 yapması ayrıca açık. Yeni build/deploy/push veya gerçek AI çağrısı yok; kurulu APK kaynak düzeltmelerini almadı. Detay: mobile/docs/CAMERA_MENU_FIXES_2026-10-16.md.

Aynı turdaki ek kontrol: haftalık plan GET kaynağında DB hata/boş durum ayrımı maybeSingle ile düzeltildi; gerçek boş404, DB hatası500. Kimlik/kapsam/ham hata sızdırmama regresyonu eklendi. Backend37test ve TypeScript geçti; lint0hata/4eskiuyarı. Yeni deploy olmadığı için hosted sürüm eski handler'ı kullanıyor. Mobil95Jest ve lint/TypeScript tekrar geçti.


## 2026-10-16 — Kullanıcı erişimi gerektirmeyen yayın hazırlığı kapanışı

İki env şablonu doğru mobil/sunucu sınırlarıyla korundu; şablon kuralları CI ve regresyonlara bağlandı. Yedi legacy API girişinde bounded JSON, Pantry gerçek tarih/uzunluk, Profile sayısal sütun sınırları ve bakım ayarı ön kontrolü tamamlandı. Sentry bilinmeyen alanları göndermez; teknik debug/stack alanları sınırlanır. Yedi migration temiz sentetik yerel DB'de, eşzamanlı kota/push ve yedek/geri yükleme kontrolleriyle geçti; geçici DB/yedekler temizlendi. Production provası değildir. Backend CI hazırlandı, remote çalıştırılmadı.

97 mobil/14 suite, 15 dependency, 41 API, 3 secrets/şablon, 4 ELF-denetleyici testi; iki TypeScript/lint ve Expo uyumluluk kontrolü geçti (backend4 mevcut lint uyarısı). Gitleaks kaynak/geçmiş0. Raw audit mobil53 yüksek/5 orta, backend7 yüksek: güvenlik kapısı, bağımsız inceleme ve DAST açık. Build/deploy/push/harcama yok, kurulu APK değişmedi. Tüm 24 harici/native/production kabul kapısı pending. Ayrıntı ve yalnız kullanıcı işleri: [ENGINEERING_CLOSEOUT](mobile/docs/ENGINEERING_CLOSEOUT_2026-10-16.md), [OWNER_ACTIONS](mobile/docs/OWNER_ACTIONS.md).


## 2026-10-16 — Bağımlılık güvenliği: backend sıfır, mobil orta bulgular sıfır

Mobil scoped js-yaml4.3.2 geçişiyle eski YAML/argparse/sprintf-js ağaçtan kaldırıldı; sprintf yaması artık yok. Backend Tailwind/PostCSS4.3.3 ve Next lint root-glob için tinyglobby0.2.17 alias + mutlak yol uyumluluk yamasıyla braces zinciri tamamen kaldırıldı. İki gerçek temiz npm ci,97 mobil/15 bağımlılık/42 backend testi, TS/lint ve Expo uyumluluğu geçti. Backend raw audit0; mobil54 yüksek/0orta. Önceki53'e göre ek üst kayıt değişmeyen react-native-purchases via react-native; kökler braces/node-forge ve yayımlanmış upstream düzeltme yok. Mobil15 dosya yaması hâlâ bütünlük/regresyonla korunuyor; bağımsız inceleme ve finalnative kapısı açık. Build/deploy/push/ücretli tarama yok. [Ayrıntı](mobile/docs/DEPENDENCY_REMEDIATION_2026-10-16.md).


## 2026-10-16 — Snyk altı bulgunun takibi

VS Code Snyk ekranındaki dört mobil bağımlılık ve iki kod bulgusu doğrulandı. Backend webhook testi sabit HMAC anahtarı/authorization yerine her çalışmada kriptografik rastgele değer üretir ve test sonunda önceki ortamı geri yükler. Mobil giriş formu mevcut Your password / Parolan çevirisini kullanır; parola değeri sanılan gereksiz Password: Parola etiketi kaldırıldı. TR/EN etiket regresyonu geçti.

Gerçek Snyk yeniden taraması tamamlandı: 6 → 4 toplam, 0 yeni; Code Security ve IaC temiz, Open Source 2 yüksek/2 orta. Kalan braces/node-forge/deepmerge/Worklets bulguları kapatılmadı veya gizlenmedi. İlk üçü için yayımlanmış düzeltme yok; Worklets güvenli sürümü mevcut Expo native eşleşmesinden farklı. Mevcut 15 kaynak yamasının bütünlüğü ve 15 bağımlılık regresyonu, 42 backend testi, 4 locale/privacy testi, iki TypeScript ve değişen kod dosyalarının ESLint kontrolleri geçti. Bu kanıtlar bağımsız güvenlik onayı veya kurulu APK doğrulaması değildir.

HawkScan 6.6.0 mevcut ancak API anahtarı/yerel oturum yok; DAST çalışmadı, hesap açılmadı. Yeni build/deploy/push yapılmadı. Ayrıntı: mobile/security/SNYK_FINDINGS.md içindeki son takip kaydı.


## 2026-10-16 — Kalan dört Snyk bağımlılığı için kaynak düzeltmeleri

Braces/deepmerge, kaynakları incelenen tam sürüme sabitlenmiş npm forklarıyla değiştirildi. Forge, birleşmemiş PR1152'nin ceba34402e329f0365134f23fe19898756527d65 commit arşivine sabitlendi; kendi sürümü1.4.1-0, resmi yayımlanmış düzeltme değil. Daha sıkı canonical NULL doğrulaması hash kontrollü postinstall yaması olarak korunuyor. Sürüm uydurma veya bulgu gizleme yapılmadı.

Resmi Worklets0.13.0 için Expo58/RN0.88/React19.3/Reanimated4.7.1 uyumlu kaynak geçişi uygulandı. Jest/RNTL async API ve TypeScript uyarlamaları yapıldı. Expo58 ağacından image-size/decode-uri-component/query-string kalktı; eski geçiş yamaları kaldırıldı. Mobil yama manifesti15dosyadan1Forge dosyasına indi.

Temiz bağımlılık kurulumu,17gerçek-bağımlılık güvenlik regresyonu, final TypeScript/lint/npm ls ve kurulu Expo tablosuyla offline uyumluluk kontrolü geçti. Registry npm audit0; tam uygulama Jest suite'i Expo58 sonrasında çalıştırılmadı. Eski97test/native sonuçları yeni kaynak için kabul kanıtı değildir.

Snyk son tamamlanan günlük22:45'te1OSS/0Code/0IaC bildiriyor; panel eski sürümleri gösteriyor. CLI son taraması401: eklenti oturumunun erişim token'ı süresi dolmuş. Kalan bulgunun kimliği logdan belirlenemedi; kullanıcıdan Snyk yeniden oturum/tarama istendi. **Snyk0 doğrulanmadı; kapanış açık.** HawkScan6.6.0 hazır, anahtar/oturum yok; DAST çalışmadı.

Yeni build/deploy/push/OTA yok, APK ve staging değişmedi. Expo57 APK bu kaynağı yüklememeli; gelecekte izinli native build/cihaz kabulü gerekir. Kaynak/provenance ve kanıt: mobile/security/PACKAGE_REPLACEMENTS_2026-10-16.md; raw audit: mobile/security/audit-package-replacements-2026-10-16.json.


## 2026-10-16 — Son Snyk bulgusunun kimliği doğrulandı

Kullanıcı ekranı açıp yeniden taradı; eklentinin tamamlanan sonucu1total/0new:1highOSS,0Code/0IaC. Kalan node-forge1.4.1-0, CVE-2026-85393 / SNYK-JS-NODEFORGE-19635204 (CVSS8.7). Önceki kimliği belirsiz kalan bulgu/oturum engeli bu başarılı UI taramasıyla açıklığa kavuştu.

ExpoCLI ve sertifika kütüphanesi aynı yamalı Forge kopyasını yüklüyor; nested DigestAlgorithm ve canonical NULL kontrolü kaynakta mevcut, hash bütünlük kontrolü geçti. Snyk advisory tüm sürümleri(*) eşleştiriyor; npm en son1.4.0, düzeltmePR1152açık ve yayımlanmış güvenli sürüm yok. Kaynak mitigasyonu ile tarayıcı kapanışı ayrı: **Snyk1high halen açık**. Ignore/sürüm uydurma yapılmadı; bu takipte kod değişmedi/test/build/deploy/push yok. Ayrıntı: mobile/security/SNYK_FINDINGS.md; gözlem kaydı: mobile/security/snyk-final-residual-2026-10-16.json.


## 2026-10-16 — Reload Window sonrası güvenlik çalışmasının doğrulanması

Önceki sohbetin sonundaki Forge kaldırma ve temiz Snyk sonuçları diskte doğrulandı: mobile/security/FORGE_REMOVAL_2026-10-16.md, mobil/backend snyk-dev-final raporları. Bu kayıt önceki Snyk1high/oturum engeli kayıtlarının tarihsel olduğunu açıklar; geçmiş kayıtlar korunur. Bu turda Snyk yeniden çalıştırılmadı.

Mobil/backend güvenlik sınırları,28APIroute, Supabase migrationları, sertifika adaptörü/bağımlılıklar, sır taraması ve CI gözden geçirildi. İki ek sorun regresyonlarla yeniden üretildi ve düzeltildi: getSession beklerken hesap değişiminde eski ekran isteğinin yeni hesaba gönderilmesi; hatalı AI JSON/şemasının ham metin üzerinden başarılı tarif sayılması. Oturum yenilemede aynı kullanıcı kontrolü eklendi. Yeni testler önce başarısız, düzeltmeler sonrası başarılı.

Son doğrulama:99mobil/14suite,17bağımlılık,43backend,3sır/şablon ve4artifact-denetleyici testi geçti; iki lint/TypeScript temiz. Güncel npm audit mobil0/backend0. Gitleaks kaynak/geçmiş0. İki ortam kontrolü geçti; dotenv dosyaları0600/Gitdışı. Yedi migration, roller/RLS/kota/cascade/eşzamanlılık ve sentetik yedek/restore izole yerel PostgreSQL üzerinde geçti; test DB'leri temizlendi, sunucu durduruldu. Canlı veritabanına dokunulmadı.

HawkScan6.6.0 mevcut fakat anahtar/oturum yok; DAST yapılmadı. Expo/Jest online öneri farkı önceki kayıtta sürüyor; uzakta CI çalıştırılmadı. Yeni native/gerçek cihaz, bağımsız kripto incelemesi ve production/servis kabul kapıları açık. Build/deploy/push/OTA yok; APK ve hosted staging korunuyor. Detay/kanıt: mobile/security/PROJECT_REVIEW_2026-10-16.md.


## 2026-10-17 — Onaylı tekrar kullanım turu: A–D ve kota görünürlüğü

Today mevcut son20 özel tarif/haftalık plan/kilerden deterministik en fazla3 öneri sunar; filtre/detay AI veya yeniden indirme başlatmaz. Süre bilinmiyor/uygun hızlı sonuç yok ayrılır; sıfır eşleşme kiler uyumu değildir. Hesap kapsamlı bellek deposu, mutation invalidation ve gün/hafta yenilenmesi eklendi. Mevcut RecipeTicket ve tasarım kullanıldı. Kiler düzenleme revision CAS ile eklendi; migration yalnız yerelde uygulandı. Ödeme kapalıyken de sunucu kota bilgileri gösterilir; limit seçilmedi/değişmedi.

119mobil/17suite +17bağımlılık,51backend,3sır/şablon ve4artifact birim testi; TS/lint, npm audit0/0, Gitleaks0/0. İzole PostgreSQL8migration/6grup ve gerçek paralel PATCH200+409, RLS ve sentetik restore geçti. Gerçek sağlayıcı çağrısı0. Paket/lock/yamaların tur başlangıcına göre hashleri değişmedi.

Sağlayıcı gözlemi tüm mevcut dispatch'leri ölçer; eksik token/ücret bilinmiyor kalır. **Genel limit kabul açığı:** mevcut staging503 retry2çağrı/1günlükrezervasyon; bu sayaç politikası değiştirilmedi ve kapanmış sayılmadı. Belirsiz timeout/kilit/iade/durum/temizlik ayrı E onayı bekliyor. Snyk yeni tarama ve HawkScanDAST yapılmadı (Hawk anahtarı/oturumu yok). Yeni build/deploy/push/OTA/uzak migration/ücretli işlem yok. Staging ve APK değişmedi; native/yayın kapıları açık. Ayrıntı: mobile/docs/APP_REUSE_ROUND_2026-10-17.md.


## 2026-10-17 — Onaylanan E kuralları ve dispatch sınırı yerelde tamamlandı

Kullanıcının120sn normal bekleme/5dk belirsizlik, kesin sonuçta veya deadline'da kilit bırakma, tek seferlik orijinal UTC ayına iade,24saat sonuç/30gün özet/90gün ölçüm kararları uygulandı. Yeni begin_mobile_ai_v2 + dispatch başına atomik izin, mevcut503 tekrarını genel sınıra dahil eder; sayısal limit/model/retry politikası değişmedi. Eski guard gelecekteki yarım rollout'ta ölçümsüz üretim yapamasın diye bloklanır. Plan ve değiştirilmiş tarif yazmaları hak/sonuç ile aynı transaction'da; geç/iade edilmiş iş yeni veri yazamaz. Mobil yalnız mevcut durum GET'i ile kurtarır; owner'a özel içeriksiz pointer, Cook/Scan/Plan tekrar kullanımı ve çıkış/hesap izolasyonu eklendi.

134mobil/19suite +17bağımlılık,61backend,3sır/şablon,4artifact birim testi, iki TS/lint; audit0/0 ve Gitleaks0/0.9migration/8grup izole PostgreSQL ve sentetik restore; izin ve sonuçlandırma yarışları, geç plan fence'i, tek iade, UTC ay,24/30/90saklama, RLS/roller/hesap silme ve korunmuş Pantry200+409 geçti. Gerçek sağlayıcı çağrısı0.

Saatlik temizlik kodu/etkin olmayan zamanlayıcı örneği hazır; uzak görev açılmadı. Yeni build/deploy/push/OTA/uzak migration/ücretli servis yok; staging/APK değişmedi. HawkScan6.6.0 hazır ama anahtar/oturum yok, DAST çalışmadı; Snyk yeni tarama değil. Hosting120sn desteği, gerçek entegrasyon/native/cron ve önceki mağaza/servis kapıları açık. Rapor: mobile/docs/AI_LIFECYCLE_2026-10-17.md.


## 2026-10-17 — Açık izinle staging geçişi ve saatlik temizlik

Yalnız chef-ai-staging Supabase/Vercel doğrulandı; eski AI girişi durdurulup pending0 iken Pantry/lifecycle uygulandı. Yeni backend READY/config kontrolünden sonra sabit staging adresi dpl_BQ3DtEYmjqvt44t6gy3HcSfEBWPs'a yönlendirildi. Ayrı staging projesinin Vercel production target etiketi gerçek uygulama production'ı değildir. Production/push/mobil build/OTA yok.

Supabase pg_cron job1 chef-ai-staging-ai-cleanup aktif,0 * * * * UTC. Aynı job kısa5s doğrulamasında3 scheduler başarısı verdi; saatlik düzene geri alındı. Vercel cron kapalı; ek ücretli plan/servis açılmadı.

Ayrıca onaylanan4 AI işi/8 çağrı bütçesiyle13 entegrasyon kontrolü geçti: TR tarif, fotoğraf,7gün plan ve teköğün yenileme;4 sağlayıcı çağrısı, retry gerekmedi. Replay/status ek çağrı tüketmedi. Kiler200+409, özel kayıt/yeniden giriş/izolasyon, hak1/1/2, deadline iadesi/geç yazma reddi ve2 hesap silme HTTP kontrolü geçti. Test auth/job/ölçüm kalanı0 SQL ile doğrulandı. Ayrı rollback24saat/30gün/90gün saklama ve güncel sayaç korunmasını doğruladı. Eksik token/ücret0 sayılmadı.

Advisors0ERROR; değiştirilmemiş referral/kapalı leaked-password protection2WARN; sunucu client izinleri kapalı. DAST/native/SMTP/production/store kabulü yapılmadı.61backend/lint geçti. Rapor: mobile/docs/STAGING_LIFECYCLE_ROLLOUT_2026-10-17.md; içeriksiz kanıtlar mobile/security/staging-lifecycle*.json.


## 2026-10-19 — Yayın engelleri takibi ve push hesap izolasyonu

Güncel belgeler/kod gözden geçirildi. Push izin/token/API bekleyişindeki hesap değişimi yarışı kapatıldı: captured owner, API beklenen kullanıcı kontrolü, yeni hesaba yerel token yazmama ve detach sırasında eski aktif/sıradaki kayıtları geçersiz kılma. Altı yeni regresyon eklendi; bildirim servisi açılmadı.

140mobil/19suite +17bağımlılık,61backend,3secrets/şablon testi; iki lint/TypeScript geçti. Güncel npm audit0/0. Gitleaks394kaynak dosya/yerel Git geçmişinde0/0. HawkScan6.6.0 mevcut, anahtar ve proje yapılandırması yok; DAST tamamlanmadı. Son Snyk16Ekim kanıtı; yeni tarama yapılmadı.

Staging yalnız SELECT ile kontrol edildi:57doğal saat başı +3önceki hızlı doğrulama=60başarılı temizlik/0hata; aktif0 * * * *; expired pending0. Production, yeni mobil/backend build, deploy, OTA, push, migration veya gerçek AI çağrısı yok. Paket/lock/yamalar ve sayısal limitler değişmedi. APK aynı; yeni kaynak telefona uygulanmış değil.

Güncel RELEASE_BLOCKERS_2026-10-19.md ve OWNER_ACTIONS.md yazıldı; eski belgeler tarihsel olarak işaretlendi,24nihai yayın kapısı pending korundu. Dış girdiler: hukuk/SMTP/mağaza ve Premium kararları/Sentry-push erişimi/bağımsız DAST/native-beta/production onayı. Kanıt: mobile/security/release-followup-2026-10-19.json.


## 2026-10-20 — Onaylı son ürün/UI polish turu

Eski Son Geliştirme Turu MD'si uygulama planı olarak ele alındı; güncel kaynakta öneri/Pantry edit/kota görünürlüğü DONE doğrulandı, yeniden yazılmadı. emil-design-eng, design-critique ve accessibility-review uygulandı. Ortak native-driver MotionView, kesilebilir basış/chip geçişleri, canlı Reduced Motion ve modal odak yardımcısı; Today tek kart hedefi/stagger, Pantry sunucu onayı sonrası tek satır giriş/edit/silme çıkışı, Cook sonuç/kayıt feedback, Scan preview/chip ve Meal Plan gün/öğün geçişleri tamamlandı. Krem/yeşil/lime, fontlar ve beş sekme korundu.

Yeni regresyonlar: animasyonda draft/aksiyon korunması, unmount ve preference yarışları, server ack öncesi silme/saved başarısı göstermeme, çift üretim/kayıt/silme, hızlı gün/detay seçimi, sıfır hakta detay ve boş içerikten Cook yalnız navigasyon. Backend gerçek üç read route'u provider/SDK spy ile dispatch0/SDK0/kota yazması0 doğruluyor. Son mobil test sayısı ve tarama kanıtı mobile/security/ui-polish-2026-10-20.json içinde. Backend62test, iki lint/TypeScript,17bağımlılık güvenlik ve3secrets/şablon testi geçti. İzole PostgreSQL9migration/8grup ve sentetik restore geçti; kendi geçici DB/cluster temizlendi.

Güncel npm audit mobil0/backend0. Yeni authenticated snyk test --dev: tek ortak yüksek SNYK-JS-PICOMATCH-21248802/CVE-2026-112366 (yayın19Ekim19:21UTC), mobil28/backend2bağımlılık yolu; fixedIn boş. Eski temiz Snyk raporu bu yeni bulguyu kapatmaz. Ignore/suppression yok; paket/lock/yama/SQL başlangıç hashleri korundu. Ayrı bağımlılık düzeltmesi açık yayın engeli. HawkScan6.6.0 anahtar/proje config yok:BLOCKED; DAST çalışmadı. Native görsel/60fps/ekran okuyucu kabulü NOT RUN.

Yeni mobil/backend build, deploy, uzak migration, OTA, Git push, mağaza, push/analytics aktivasyonu, gerçek AI veya yeni ücretli servis işlemi yok. Hosted staging/APK ve production korunuyor. Detay: mobile/docs/UI_POLISH_2026-10-20.md; yeni raw Snyk/audit raporları her paketin security dizininde. Nihai yayın kapıları pending kaldı.


## 2026-10-20 — Picomatch ReDoS kaynak mitigasyonu ve yeni taramalar

Kullanıcının açık izniyle SNYK-JS-PICOMATCH-21248802/CVE-2026-112366 incelendi. Registry latest4.0.7 ve advisory(*)/fixedIn[] doğrulandı; açık PR194 tüm saldırı sınıfını kapatan yayımlanmış çözüm sayılmadı. Tek branch tekrarlı wildcard saldırısı bounded Node sürecinde timeout ile tekrar üretildi.

Mevcut hash/postinstall mekanizmasına mobil5/backend2parse.js yaması eklendi: wildcard/quantifier/nested-group belirsizliğini mevcut literalization yoluna alma ve genel literal prefix çakışmasını engelleme. Önceki6mobil/1backend yama girdisi aynen korundu. Paket/lock ve uygulama/SQL kaynakları değişmedi. Riskli/karmaşık tekrarlı extglobların literal yorumlanması uyumluluk sınırı olarak belgelendi.

İki temiz npm ci,150mobil/20suite,19bağımlılık,64backend,3secrets/şablon, iki lint/TypeScript ve yama bütünlük kontrolü geçti. Gerçek Tailwind/micromatch/anymatch/readdirp/tinyglobby/Next ESLint adapter regresyonları başarılı. Ortak test yardımcısı iki CI path filtresine bağlandı; uzak workflow tetiklenmedi. npm audit0/0. Secrets kaynak/geçmiş sonucu makine kanıtında.

Yeniden authenticated Snyk --dev aynı tek yüksek advisory gösteriyor: mobil28/backend2yol. Ignore/suppression, paket yeniden adlandırma, sürüm uydurma veya risk acceptance yok. Kaynak mitigasyonu tamamlandı; Snyk katalog/yayın kapısı açık. HawkScan6.6.0/güncel skill var; API key/proje config yok, DAST BLOCKED. Build/deploy/OTA/push/uzak migration/gerçek AI/ücretli servis yok; staging/APK/production korunuyor. Rapor: mobile/security/PICOMATCH_REMEDIATION_2026-10-20.md.


## 2026-10-20 — Backend izole Picomatch alternatif uyumluluk denemesi

Kullanıcının onayıyla Minimatch10.2.6 yalnız repo dışındaki geçici bağımlılık alanına kuruldu; izole alt süreçte iki gerçek tinyglobby tüketicisi ve Next ESLint root dizini keşfi karşılaştırıldı. Deneme yardımcısı scripts/backend-glob-compatibility-trial.cjs, uygulamaya import edilmiyor. İlk dar adapter27/53, terminal /** uyarlamasından sonra45/53 eşdeğer sonuç verdi; kalan8 fark gizli dosya/negatif extglob, parantez ve dynamic sınıflandırması. Bilinen5 sentetik saldırının tamamında aday1sn süreç sınırını aştı; mevcut yamalı matcher5/5 tamamlandı. Aday REDDEDİLDİ; runtime paket/lock/yamalar değiştirilmedi.

Mevcut backend64test, lint/TypeScript ve yama bütünlüğü geçti; npm audit0. Yeni authenticated Snyk --dev gerçek backend’de tek yüksek Picomatch advisory/2yol göstermeye devam ediyor. Ayrı adayın3bağımlılığı Snyk’te temiz; bu sonuç backend temizliği veya çalışma zamanı güvenliği sayılmadı. Önceki mobil/backend package-lock ve yama manifestlerinin hashleri korundu. HawkScan6.6.0/güncel skill mevcut, API key/proje config yok: DAST BLOCKED.

Yeni build/deploy/uzak migration/AI/ücretli servis yok; staging/production/APK değişmedi. Mobil tarama/native/DB testi bu backend denemesinde yeniden çalıştırılmadı. Rapor ve yeni makine kanıtları: backend/security/PICOMATCH_COMPATIBILITY_TRIAL_2026-10-20.md. Yayın engeli açık kalıyor; mevcut kaynak mitigasyonu korunuyor.


## 2026-10-20 — Picomatch için bağımsız RE2JS yaklaşımı ve 49. satır kontrolü

Kullanıcının isteğiyle başka çözüm izole alanda denendi: globrex0.1.2 yalnız glob derleyici, re2js2.8.8 geri izleme yapmayan eşleştirme motoru. Paketler repo dışına ignore-scripts ile kuruldu; gerçek node_modules/package/lock/yamalar değiştirilmedi. scripts/backend-re2-glob-trial.cjs yalnız alt süreçte iki backend tüketicisi ve mobil Anymatch/Micromatch probunu çalıştırıyor; uygulamaya import yok.

İyileştirilmiş denemede55karşılaştırma/40eşdeğer/15fark;8tekrarlı extglob saldırısı süre aşmadan tamamlandı,1hatalı POSIX girişi açık hatayla reddedildi. Native eşleştirme fallback’i yok. Negatif extglob/lookahead, escape/brace/seçenekler ve Micromatch özel API eksikleri nedeniyle NOT PROMOTED. Bu sonucun evrensel güvenlik veya tam API uyumu olmadığı belirtildi.

49. satır mobile/package.json Tailwind girdisi; yeni Snyk raporu tailwindcss3.4.19 → chokidar3.6.0 → anymatch3.1.3 → picomatch2.3.2 yolunu doğruluyor. Diğer yollar da açık: mobil28/backend2aynı yüksek advisory; fixedIn boş. Adayın2bağımlılığı Snyk’te temiz ancak gerçek uygulama taraması sayılmadı.

Yeni150mobil/20suite,19mobil bağımlılık ve64backend testi; iki lint/TypeScript ve yama bütünlüğü geçti. npm audit0/0. Paket/lock/yama başlangıç hashleri korundu. HawkScan6.6.0/güncel skill var; key/proje config yok, DAST BLOCKED. Yeni build/deploy/uzak migration/AI/ücretli servis yok; staging/production/APK değişmedi. Rapor: backend/security/PICOMATCH_RE2_TRIAL_2026-10-20.md; makine kanıtları aynı dizinde.


## 2026-10-20 — Picomatch erişilebilirlik ve adversarial yama incelemesi

Adversarial-reviewer skill kullanıldı; dış insan denetimi değil, aynı asistanın farklı kapalı-form oracle/yeni saldırı kurgusu olarak açıklandı. 30API rotası/48yerel dosya,18mobil app girişi/64yerel dosya ve22NativeWind/CSS interop dosyası incelendi; doğrudan matcher importu/literal olmayan yükleme/yerel çözümleme açığı0. Dış paketler genel olarak yaprak; tam taint veya release bundle incelemesi değil. Gerçek Next image validator12sentetik çağrıda yalnız sabit images.pexels.com/** desenlerini derledi, kullanıcı URL’si metin olarak kaldı. HTTP/AI/servis isteği yapılmadı.

Yeni kritik kabul kanıtı: art arda gelen +(a) ve *(ab) grupları yamalı7kopyanın tamamında1sn eşleştirme sınırını aştı. Lockfile dışında Next/dist/compiled/picomatch kopyası da bulundu; önceki +(*a) dahil3probe onda timeout. Toplam24probe/17timeout; tüm süreçler eşleştirme aşamasına ulaştı. Ayrı küçük-girdi semantik oracle432assertion geçti. Yama bütünlüğü geçici kopyalarda10/10tamper/missing kontrolünü geçti; bu yeterlilik kanıtı değil. Yeni audit aracı exit2:FAIL; standart eski testler bunun yerine PASS sayılmadı.

Mevcut150mobil/20suite,19bağımlılık,64backend, iki lint/TypeScript ve npm audit0/0 geçti. Bu tur Snyk yeniden çalıştırılmadı; aynı package/lock hashleriyle önceki authenticated28mobil/2backend yolu kanıtı korundu. HawkScan6.6.0/güncel skill var, API key/config yok:DAST BLOCKED. Önceden mevcut uygulama/SQL/JSON/paket/yama kaynak hashleri korundu; yalnız yeni inceleme yardımcıları/kanıtlar ve MD güncellendi.

Karar:BLOCK_INCOMPLETE_MITIGATION. Mevcut kaynakta kullanıcı kontrollü glob deseniyle uzak saldırı gösterilmedi; ancak koruma tam değil ve dağıtılmış artifact doğrulanmadı. Önceki “yalnız katalog engeli” ifadesi yeni üst notlarla düzeltildi, tarihçe silinmedi. Sonraki teknik iş ardışık grup koruması/Next iç kopyası ve genişletilmiş regresyon kabulü. Yeni build/deploy/OTA/push/migration/ücretli servis/production-staging isteği yok. Rapor: backend/security/PICOMATCH_REACHABILITY_REVIEW_2026-10-20.md.

## 2026-10-20 — Onaylı üç Snyk bulgusu planı: iki araç düzeltmesi

Path Traversal: summarize-provider-usage.cjs artık dosya yolu argümanı kabul etmiyor; yalnız stdin JSONL verisi alıyor. Eski mutlak/symlink okuması sentetik fixture ile gösterildi. Normal/boş/bozuk/tekrarlı veri, bilinmeyen maliyet ve yol reddi kontrolleri geçti; summarize(records) arayüzü korundu, kullanım belgesi güncellendi.

Code Injection: picomatch-independent-verification.cjs içindeki argv kaynaklı require kaldırıldı. Yeni sabit worker sekiz hedef/sabit senaryolarla çalışıyor; literal require, gerçek yol/symlink kontrolü, lock envanteri eşitliği, shell:false, SIGKILL, 1/2sn süre, 64KiB çıktı, 128MiB V8 heap ve sınırlı ortam var. Önceki serbest modül yüklemesi zararsız marker ile gösterildi; yeni 9 test bunu ve kaçışları reddediyor, timeout sonrası çocuk süreç kalmıyor. Mevcut saldırı/oracle testleri zayıflatılmadı.

150 mobil/20 suite, 19 bağımlılık, 66 backend, 9 worker testi; iki lint/TypeScript ve root betik lint/syntax geçti. Paket/lock/yama/kurulum dosyalarının 20 başlangıç hash'i korundu. Yeni npm audit 0/0. Cache/ağ kısıtı aşılarak mevcut tam Snyk CLI ile authenticated taramalar tamamlandı: son kaydedilmiş kaynakta Snyk Code 197 dosya/0 bulgu; Open Source aynı Picomatch advisory ile mobil28/backend2 yol. B/C kaynakta FIXED; önceki Code tekil kimlikleri bilinmiyor, sonuç kök taraması olarak raporlandı.

Picomatch A UNRESOLVED: yeni worker ile 432 oracle assertion geçti ancak 24 probe/17 matching timeout, exit2 sürdü. Mevcut kısmi yama korundu; Next iç kopyası ayrıca açık. HawkScan skill ön kontrolleri yapıldı; CLI6.6.0 var, API key/credentials/config yok: DAST BLOCKED. Kullanıcıdan yeni hesap, ücretli servis veya risk kabulü istenmedi. Build/bundle/deploy/OTA/migration/AI/production-staging işlemi yok; mevcut APK değişmedi. Kaynakta düzeltildi/test edildi, canlıya uygulanmadı. Rapor: backend/security/THREE_SNYK_FINDINGS_2026-10-20.md; kaynak hashleri ve güncel tarama kanıtları aynı dizinde.

## 2026-10-20 — Picomatch yerel çıktı kanıtının yayın listesine bağlanması

Kullanıcı önceki yerel çıktı incelemesini tamamlanmış kabul etti. Picomatch durumu **UNRESOLVED — kısmi mitigasyon mevcut; incelenen uygulama yollarında sömürü gösterilmedi** olarak korundu. Bu kayıt FIXED/risksiz veya risk kabul edildi anlamına gelmez; önceki 24 saldırı denemesindeki 17 timeout açık kalır. B/C düzeltmeleri değiştirilmedi.

[Yerel çıktı raporu](backend/security/PICOMATCH_ARTIFACT_REVIEW_2026-10-20.md) ve [kanıt indeksi](backend/security/picomatch-artifact-evidence-2026-10-20/index.json), [yayın kontrol listesine](mobile/docs/RELEASE_READINESS.md#picomatch--sonraki-onaylı-yayın-derlemesinde-açık-kontroller) ve güncel engel belgesine bağlandı. Sonraki ayrıca onaylı yayın derlemesinde gerçek derleme yöntemi, gerekiyorsa Turbopack çıktı incelemesi, kaynak/lockfile/paket/yama/ilgili ayar karşılaştırması ve final native paket/cihaz kontrolleri dört açık madde olarak tutuldu. Yerel JS export/Next Webpack kanıtı final native paket veya canlı deployment kabulüne dönüştürülmedi; makine tarafından okunan yayın kapıları değiştirilmedi.

Bu tur yalnız üç MD kaydı güncellendi. Yeni yama, paket/fork denemesi, genel tarama, test, build, deploy, ücretli işlem veya risk kabulü yapılmadı. Önceki kaynak/çıktı raporu ve kanıt indeksi değiştirilmedi.


## 2026-10-20 — Açık izinle yeni staging Android APK ve iOS simülatör paketi

Kullanıcı yeni paketleri açıkça istedi. Ayrı codex/staging-native-20261020 dalında diskteki kaynak manifestiyle ücretsiz standart GitHub runner kullanıldı; main/indeks ve production korunuyor. İlk run39432735779 iOS işi Xcode26.6/Expo58/RN0.88 ARM64 Release simulator native derlemesini geçti; aynı run Android resmi SDK adının android-37.0 olması nedeniyle başarısızdı. Düzeltilmiş Android native run39433293674 geçti.

Simülatörde oturumsuz kök URL Unmatched Route ve erken recovery yönlendirmesi tekrar üretildi. Yalnız root/auth layout'larında mevcut Stack.Protected hedefleri tamamlandı; yeni dört gerçek-router regresyonu eklendi.154mobil/21suite+19dependency, lint/TypeScript yerelde ve final CI'da geçti. B/C, paket/lock/yama hashleri korundu; deneysel Picomatch prototipi entegre edilmedi.

Native girdi değişmediğinden son JS resmi Expo export:embed ile yeniden üretildi. Android final run39438764645/a664affb3a9d4ce419465f3938c794115795db05: aynı sertifika,1377JS-dışı girdinin byte eşitliği, targetAPI36,31ELF kütüphanesi ve16KB hizalama geçti. Son APK yerel olarak indirildi/hash ve girdiler yeniden doğrulandı. iOS'ta native executable kodu/imza dışı kaynaklar/entitlements aynı kaldı; normal Hermes bundle ve ad-hoc simulator imzası yenilendi, iPhone17/iOS26.5 üzerinde kurulu bundle hash eşitliği ve root/login/recovery geçişleri doğrulandı. JS fix sonrasında full native recompile yapıldığı veya physical-device IPA/AAB kabulü iddia edilmez.

Eski securitycheck simülatör uygulamasının aynı chefai scheme'ini sahiplenmesi ayrıştırıldı:238dosya ile app/data APFS yedeği doğrulandıktan sonra yalnız eski test kurulumu kaldırıldı, keychain silinmedi. Geçici config teşhisi başarılı; diagnostik bundle son paketlere girmedi. APK, iOS archive ve screenshot mobile/artifacts/build-2026-10-20/ altında. Native yöntem/kimlik/hash/izin ve açık kapılar: mobile/docs/NATIVE_TEST_PACKAGES_2026-10-20.md.

Picomatch UNRESOLVED — kısmi mitigasyon mevcut; incelenen uygulama yollarında sömürü gösterilmedi. Önceki17timeout geçerli; yeni genel Snyk/audit turu yok. Hawk preflight mevcut; key/config yok:DAST BLOCKED. Yeni production/backend deploy, migration, OTA, store upload, gerçek AI/ödeme/e-posta gönderimi veya ücretli servis yok. Fiziksel cihaz, final dağıtım ve diğer yayın kapıları pending.

## 2026-10-22 — Önceki iOS önizleme oturumunun belgelenmesi

Mevcut 20 Ekim Expo58 simülatör paketiyle önceki oturumda sentetik staging hesabına normal giriş yapıldı; iPhone17/iOS26.5 üzerinde Today, Pantry, Cook, Scan ve Profile açıldı. Beş yerel ekran görüntüsünün mevcut dosyaları ve hashleri kayıt altına alındı. Son doğrulanan ekran Today; güncel canlı simülatör durumu bu belge turunda kontrol edilmedi.

Hesabın kileri ve kayıtlı tarifleri boştu; dolu tarif/öneri/Scan sonucu kabulü yapılmadı. Cook ücretsiz tarif10/10 ve 1Kasım2026 00:00UTC yenilenmesini gösterdi; limitler değiştirilmedi. Türkçe/İngilizce metin karışıklığı gözlemi açık iş olarak kaydedildi. Haftalık plan giriş kartı görüldü ancak plan/öğün detayına başarılı geçiş doğrulanamadı; tamamlanmış sayılmadı. AI üretimi başlatılmadı; ayrıca sağlayıcı/kota telemetrisi testi yapılmadı.

[Önizleme raporu](mobile/docs/IOS_SIMULATOR_PREVIEW_2026-10-22.md), paket teslim belgesi ve yayın kontrol listesi güncellendi. Önceki testler yeniden çalışmış gibi sunulmadı; tarihsel kayıtlar korundu. Bu tur yalnız MD değişikliği: uygulama/backend kodu, paket/lock/yamalar ve B/C düzeltmeleri değişmedi. Yeni build, deploy, uzak migration, tarama, test veya ücretli işlem yok. Picomatch UNRESOLVED/kısmi mitigasyon ve önceki17timeout korunuyor; yayın kapıları pending.

## 2026-10-28 — Picomatch ardışık grup koruması ve sekme erişilebilirlik dili

Picomatch parse.js yamasına üçüncü düzenleme eklendi (mobil 5, backend 2 kopya): art arda ikiden fazla sınırsız `+(…)`/`*(…)` grubunun üçüncüsünden sonrası literal'e çevrilir. Üç grup ve altı oracle'ı etkilemez; 432 oracle assertion geçti. Next iç kopyası (`next/dist/compiled/picomatch`, korumasız eski sürüm) için fail-closed giriş reddi yaması manifestine eklendi: tekrarlı extglob gövdesinde `| * + (` veya dört ve üzeri ardışık grup varsa SyntaxError. Next yalnız sabit config desenleriyle kullandığı için ters etki beklenmiyor; yine de bu kopya literalize etmez, reddeder.

Bağımsız doğrulama: 24 probe / 0 timeout (önceki 17), exit 0. Bu sonuç sınırlı sentetik probe kabulüdür; tam sertifikasyon, Snyk kapanışı veya dağıtılmış artifact doğrulaması değildir. Snyk advisory'sinde fixedIn hâlâ boş; yeniden taranmadı. Durum: kaynakta kısmi mitigasyon güçlendi, upstream düzeltme gelene kadar UNRESOLVED/izlenecek olarak kalır. Eski "bilinen zafiyetli probe öldürülür" testi artık zafiyetli probe kalmadığı için reddetme/tamamlanma testleriyle değiştirildi; süreç öldürme yolu ayrıca test edilmiyor. Orijinal paketten yamalanmış hale temiz `npm ci` uçtan uca yeniden denenmedi (bütünlük/regresyon araçları geçici kopyalarda geçti).

Dil: Scan sekmesinin `tabBarAccessibilityLabel` değeri çeviri dışı sabit İngilizce'ydi; `t()` ile çevrildi, mesaj eklendi. Yeni test (`tests/locale-tabs.test.tsx`) sekme etiketlerinin dil değişince güncellendiğini ve bu etiketin çevrildiğini doğrular. Tüm `t('…')` çağrılarının `messages.ts` karşılığı olduğu taramayla görüldü. 22 Ekim'deki karışıklığın diğer olası nedenleri (soğuk açılışta cihaz dili ile kayıtlı dil farkı) simülatörde yeniden üretilmedi; dil tutarlılığı tam kabul edilmedi.

Kontroller: mobil 156 test/22 suite, 19 bağımlılık, backend 66, kök betik 11 test geçti; iki lint/TypeScript temiz. Build, deploy, push, migration, AI çağrısı yok.

## 2026-11-10 — Önerilerde kiler karşılaştırmasının açıklanması

Ürün geliştirme planının ilk adımı olarak Bugün önerilerinin tarif detayına kiler adıyla eşleşen malzemeler ve ayrıca kontrol edilmesi gereken satırlar eklendi. Miktarlar karşılaştırılmıyor; ayrıştırılamayan veya kiler adıyla eşleşmeyen satırlar eksik olduğu iddia edilmeden kontrol listesinde gösteriliyor. Kiler verisi yüklenmemişse veya yenileme hatalıysa karşılaştırma gösterilmiyor. Yeni AI çağrısı veya API değişikliği yok.

Kişisel code-quality zero-hallucination-coder, TDD, karpathy-coder ve code-reviewer; frontend emil-design-eng ve design-system yönergeleri ve ilgili referansları kullanıldı. Önce başarısız olan mantık ve ekran testleri uygulamayla geçti; toplam mobil 158 test/22 suite, lint ve TypeScript başarılı. Lint sandbox ortamında Expo telemetrisi kapatılarak çalıştırıldı. Fiziksel cihaz/görsel kabul yapılmadı; planın alışveriş listesi ve diğer aşamaları henüz tamamlanmadı. Build, deploy, push, migration ve gerçek AI çağrısı yapılmadı.

## 2026-11-10 — Alışveriş listesinin yerel kaynak uygulaması

Mevcut `/api/shopping-list` sözleşmesi korundu; ayrı `/api/shopping-items` uçları ve kullanıcıya özel RLS tablosu eklendi. Kalem ekleme/düzenleme/işaretleme/silme, sürüm çatışması ve 500 kalem sınırı kaynakta uygulandı. Haftalık plandan kaynak öğünleri gösterilerek seçilen satırlar atomik toplu işlemle eklenir; aynı metin farklı öğünlerde ayrı kalır. Tarif kartından da kullanıcı seçimiyle listeye ekleme yapılır; kiler miktarı varsayılmaz. Belirsiz yazım sonucunda kullanıcıya listeyi kontrol etmesi söylenir; sunucu yazımları henüz idempotent değildir.

Kişisel API tasarımı referansları, TDD, code-reviewer ve adversarial-reviewer ilkeleri ile frontend bileşen durumları kullanıldı. Mobil 163 test/24 suite, backend 70 güvenlik testi ve her iki pakette lint/TypeScript geçti. Geçici Unix socket PostgreSQL üzerinde 10 migration, kullanıcı izolasyonu, sürüm ve toplu işlem sınırı ile sentetik backup/restore provası geçti. Fiziksel cihaz ve gerçek staging entegrasyonu yapılmadı. Kaynak migration ve API deploy edilmediğinden mevcut hosted staging bu yeni listeyi desteklemez; eski APK/OTA değiştirilmedi. Yol haritasındaki pişirme modu, tercihler, çevrimdışı tarifler ve cihaz kabulü açık kalıyor. Yeni build, deploy, uzak migration, push veya gerçek AI çağrısı yapılmadı.

## 2026-11-10 — Pişirme modunun ilk uygulaması

Ortak tarif kartına pişirme modu eklendi: numaralı talimatlar adım adım, numarasız talimatlar özgün metin olarak gösterilir; malzemeler işaretlenebilir. Görsel zamanlayıcı bitiş zamanını kullanır, uygulama yeniden öne geldiğinde süreyi hesaplar ve çalışan zamanlayıcıyla mod kapatılırken uyarır. Ses veya arka plan bildirimi yoktur; bu sınır arayüzde belirtilir. Pişirme ekranı odaktayken ekranı açık tutmak için Expo 58 belgeleriyle doğrulanan, zaten Expo'nun bağımlılık ağacında bulunan `expo-keep-awake` 58.0.3 doğrudan bağımlılık olarak eklendi; odak kaybında serbest bırakılır. Cihazda güç/ekran ve zamanlayıcı kabulü henüz yapılmadı.

Kişisel TDD, emil-design-eng ve design-system durum referansları uygulandı. Mobil 173 test/25 suite, lint, TypeScript ve 19 bağımlılık güvenliği kontrolü geçti. Testler adım geçişi, malzeme işaretleme, tarif değişince sıfırlama, odak kaybı, süre dolumu, uygulamaya dönüş ve kapatma uyarısını kapsıyor. Yeni build/deploy/OTA/uzak migration/gerçek AI çağrısı yok; mevcut native paket yeni kaynak davranışını içermez. Sesli zamanlayıcı, porsiyon ölçekleme, kişiselleştirme ve diğer yol haritası işleri açık.

## 2026-11-10 — Yerel bildirimli pişirme zamanlayıcısı

Görsel zamanlayıcı mevcut Expo Notifications üzerinden cihazda sesli yerel bildirim planlayacak şekilde genişletildi. İzin yalnız başlatma sırasında kontrol edilir; Android için ayrı kanal kullanılır, push token veya backend isteği yapılmaz. Bitiş zamanı ve bildirime ait kimlik SecureStore'da saklanır; pişirme ekranı kapatılsa da zamanlayıcı devam eder. Yeniden açılışta gelecekteki planlı bildirim cihazdaki listeyle karşılaştırılır. Bildirim izni verilmez veya planlama güvenle iptal edilebilecek biçimde başarısız olursa görsel moda düşülür; iptal/plan doğrulaması belirsizse başarı iddia edilmez. Android kesin alarm izni eklenmedi; OS veya cihaz ayarları bildirimi geciktirebilir ya da susturabilir.

Kişisel TDD ve arayüz durum skill'leri kullanıldı. Mobil 182 test/27 suite, lint, TypeScript ve 19 bağımlılık güvenliği kontrolü geçti; izin reddi, eşzamanlı başlatma, kayıt kurtarma, eksik bildirim, planlama/iptal hataları ve seçili kimliğin iptali sentetik olarak test edildi. Fiziksel iOS/Android cihazda ses, arka plan ve kilit ekranı kabulü yapılmadı. Build, deploy, OTA, uzak migration, push token kaydı veya gerçek bildirim gönderimi yapılmadı; mevcut test paketi bu kaynak değişikliğini içermez.
