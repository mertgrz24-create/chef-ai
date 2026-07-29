# Chef-AI — Progress Tracker

> Her seans sonu güncellenir. Yarın geri dönüldüğünde "neredeyiz?" sorusunun cevabı buradadır.

## 📍 Şu an neredeyiz?

**Aktif Faz:** V5 — UI redesign ("Mise en Place") + **mobil app'e geçiş** (Expo/React Native)  
**Aktif Mikro-Adım:** ✅ **Repo ikiye bölündü** — bu repo (`chef-ai`) artık sadece mobil app'i içeriyor, web sitesi + API [chef-ai-web](https://github.com/mertgrz24/chef-ai-web) repo'sunda ve Vercel oradan deploy ediyor. Sıradaki: EAS build + store yayını (`mobile/EAS_BUILD.md`)  
**Son güncelleme:** 30 Temmuz 2026  
**Canlı URL:** https://chef-ai-puce-zeta.vercel.app — artık `chef-ai-web` repo'sunun `main`'inden deploy oluyor  
**Bu repo'nun kapsamı:** sadece `mobile/` (+ bu proje günlüğü). Next.js kodu (`app/`, `components/`, `lib/`, `types/`, `public/`, `supabase/`) bu repo'dan tamamen silindi — geçmişi hâlâ `git log`'da duruyor, güncel hali `chef-ai-web`'de.

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
