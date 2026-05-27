# Developer Toolkit — Mert'in Kişisel Geliştirici Rehberi
> Güncelleme: Mayıs 2026 · Bu dosya yaşayan bir belgedir, projeler büyüdükçe güncelle.

---

## 1. Çalışma Stili Analizi

**Profil:** Full-stack solo geliştirici — frontend + backend + AI + DevOps tek başına yürütüyor.

**Proje tipi:** AI-native SaaS, otomasyon araçları, PWA, içerik siteleri — hepsi Next.js ekosisteminde.

**Öncelik:** Hızlı lansman · Satılabilir ürün · Premium UX · İnovatif AI entegrasyonu.

**Temel Stack:**
- Framework: Next.js 14+ App Router, TypeScript strict
- Styling: Tailwind CSS utility-first + `cn()` helper
- Animasyon: Framer Motion (200-400ms, ease-out)
- Backend & Auth: Supabase (Postgres + Auth + Storage + RLS)
- AI — Görüntü: Gemini API (vision)
- AI — İçerik: Claude API (tarif/metin üretimi)
- Deployment: Vercel
- Package manager: npm

**Çalışma prensipleri:**
- Plan önce, onay al, sonra kod yaz
- Bir seferde bir şey — fazları atlamadan ilerle
- Verification rule: lint → typecheck → build → done
- Dark theme ana tema
- Server Component varsayılan, `"use client"` sadece gerektiğinde

---

## 2. Her Proje İçin Temel GitHub Repoları

### 🏗️ Katman 1 — SaaS Altyapı (Hızlı Lansman)

Yeni bir SaaS başlatırken sıfırdan kurma. Şu ikisinden birini fork'la:

**[ixartz/SaaS-Boilerplate](https://github.com/ixartz/SaaS-Boilerplate)**
En kapsamlı açık kaynak SaaS starter. 100-300 saat kurulum zamanı kazandırır.
- Stack: Next.js + Clerk Auth + Stripe + Drizzle ORM + i18n + Sentry + testing
- Ne zaman: Kurumsal, multi-tenant SaaS projeleri için

**[adrianhajdin/saas-template](https://github.com/adrianhajdin/saas-template)**
Daha temiz, daha minimal. Supabase'e alışkınsın, burası daha doğal hissediyor.
- Stack: Next.js + Supabase + Clerk
- Ne zaman: Hızlı MVP, kişisel projeler için

**[KolbySisk/next-supabase-stripe-starter](https://github.com/KolbySisk/next-supabase-stripe-starter)**
Next.js + Supabase + Stripe + shadcn/ui. Ödeme sistemi eklemek istediğinde referans.

---

### 🤖 Katman 2 — AI & Agent Framework (Rekabetten Ayıracak Olan)

**[Mastra](https://github.com/mastra-ai/mastra)** ⭐ 22k+ stars · $22M Series A
TypeScript AI agent framework. 2026'nın en güçlü seçeneği.
- 40+ AI modeline tek interface (Claude, Gemini, OpenAI)
- Built-in RAG, agent memory, tool calling, workflow builder
- Next.js first-class entegrasyon, Vercel'e native deploy
- Ne zaman: AI ağır projeler, agent'lı ürünler, otomasyon araçları

**[Vercel AI SDK v6](https://ai-sdk.dev/docs/introduction)**
Her AI projesinde kullanılması gereken temel katman.
- `streamText` + Server Actions kombinasyonu artık standart
- Multi-model routing (aynı endpoint'ten Claude veya Gemini'ye yönlendirme)
- Streaming, tool calling, type-safe
- Ne zaman: Her AI içeren Next.js projesinde

**[anthropics/anthropic-cookbook](https://github.com/anthropics/anthropic-cookbook)**
Anthropic'in resmi tarif defteri. Prompt caching, streaming, tool use, RAG çalışan örnekleri.
- Ne zaman: Claude API'yi derinlemesine kullanmak istediğinde

---

### 🎨 Katman 3 — UI Sistemi (Her Projede Aynı Tasarım Kalitesi)

**[shadcn/ui](https://ui.shadcn.com/)**
2026 Next.js production standardı. Bileşeni projeye kopyalarsın, tamamen senin olur.
- Kopyala-yapıştır felsefesi: dependency yok, override savaşı yok
- App Router'da `"use client"` direktiflerini otomatik algılar
- Ne zaman: Her yeni projede başlangıç noktası

**[Magic UI](https://github.com/topics/magic-ui)** ⭐ 19k+ stars
shadcn/ui üzerine 50+ animasyonlu bileşen.
- Stack: TypeScript + Next.js + Tailwind CSS + Framer Motion
- Ne zaman: SaaS landing page, tarif kartı paylaşımı, hero animasyonları

**[Aceternity UI](https://ui.aceternity.com/components)**
200+ dark-tema bileşen, Framer Motion entegre.
- Ne zaman: Premium dashboard görünümü, app UI polish

---

### ⚡ Katman 4 — Otomasyon (AI Araç Satarken)

**[VoltAgent](https://github.com/VoltAgent/voltagent)**
TypeScript AI Agent Engineering Platform. Agent orchestration için.
- Ne zaman: Arka planda çalışan otomasyon araçları yaparken

**[Dify](https://github.com/langgenius/dify)**
No-code/low-code AI workflow builder.
- Ne zaman: Müşteriye teslim edilebilir otomasyon aracı yaparken veya kendi ürünlerine "AI workflow" eklerken

---

### 🚦 Proje Başlarken Hangi Katmanı Seçersin?

| Proje Tipi | Altyapı | AI Katmanı | UI |
|---|---|---|---|
| Klasik SaaS | adrianhajdin/saas-template | Vercel AI SDK | shadcn/ui + Magic UI |
| AI-heavy SaaS | ixartz/SaaS-Boilerplate | Mastra + Vercel AI SDK | Aceternity UI |
| Hızlı MVP | adrianhajdin/saas-template | Vercel AI SDK | shadcn/ui |
| Otomasyon aracı | — | Mastra + VoltAgent | — |
| İçerik sitesi | ixartz/Next-js-Boilerplate | — | shadcn/ui + Magic UI |

---

## 3. Tasarım Skill'leri — Claude Code için

> Bu skill'ler Claude Code CLI'de çalışır (`~/.claude/skills/`). Cowork'ta değil.

Claude default'ta vasat tasarım üretir çünkü eğitim verisindeki ortalamayı taklit eder. Bu üç skill bunu kırar.

### Skill 01 — Motion (Emil Kowalski Prensipleri)
**Çözdüğü problem:** Animasyon hissi, easing, süre, performance.

Claude'un default animasyonları: linear easing, 500ms+ süre, gereksiz bounce → amatör hissi.
Bu skill: ease-out giriş, ease-in çıkış, 300ms altında UI animasyonları, GPU-dostu transform/opacity.

```bash
git clone https://github.com/kylezantos/design-motion-principles
cp -r design-motion-principles ~/.claude/skills/
```

İki mod:
- **Build:** Yeni component yaparken doğru süre + easing seçimi
- **Audit:** Mevcut animasyonları tara, "burada linear ease yanlış" diye raporla

**Ne zaman kullan:** Modal, hover-state, sayfa geçişleri, dropdown gibi interactive UI var.

---

### Skill 02 — Impeccable Design (Paul Bakaus)
**Çözdüğü problem:** Layout, tipografi, renk, hiyerarşi.

15k+ star. 23 komut, 27 anti-pattern kuralı. Anthropic'in resmi frontend-design skill'ini genişletiyor.

```bash
npx skills add pbakaus/impeccable
# veya
git clone https://github.com/pbakaus/impeccable ~/.claude/skills/impeccable
```

En kritik 5 komut:
- `/layout` — Spacing ve hiyerarşi tarar, "squint test" yapar
- `/typeset` — Font seçimi, boyut hiyerarşisi, scale düzeltir
- `/colorize` — Renk paleti, kontrast, WCAG kontrolü
- `/bolder` + `/quieter` — Tasarımın tonunu ayarla
- `/delight` — Micro-interaction ve detay önerisi

> **Chef-AI ve app projeleri için → Product modu seç** (brand değil). Fixed scale, dashboard UI için uygun.

**Ne zaman kullan:** "Bitti mi acaba?" hissini yaşadığında. Her feature sonrası.

---

### Skill 03 — Taste Skill (Gerçek Referans)
**Çözdüğü problem:** Genel estetik, art direction, "ortalama" hissini kırma.

```bash
git clone https://github.com/Leonxlnx/taste-skill ~/.claude/skills/taste-skill
```

Nasıl çalışır: "Landing yap" dediğinde Claude doğrudan kod yazmaz. Önce 3-4 referans seçer, analiz eder, sonra ona yakın bir şey çıkarır.

Üç varyant:
- **Default:** Premium çıktı, belirli stile saplanmıyor. Genel ürünler için başlangıç.
- **Calm/Expensive:** Yumuşak kontrast, bol whitespace. Premium marka siteleri.
- **Editorial:** Kısıtlı renk, keskin yapı. Dashboard ve app UI için.

**Ne zaman kullan:** Sıfırdan yeni sayfa veya bölüm tasarlarken.

---

### Üç Skill'i Birlikte Kullanmak

```
Taste  →  ne yapacağını söyler (estetik yön)
Impeccable  →  nasıl yapacağını söyler (kural ve oran)
Motion  →  nasıl hissettireceğini söyler (hareket)
```

**Kurulum sırası:** Önce Impeccable → bir hafta kullan → Taste ekle → bir hafta kullan → Motion ekle.
Üçünü aynı gün kurma. Çakışma olursa Impeccable galip gelir.

---

## 4. Hybrid Workflow Optimizasyonu

### Problem: Token Nerede Kayboluyor?

```
❌ Her Claude Code oturumu başında CLAUDE.md baştan okunuyor
❌ Chat'te planladığını Claude Code'a tekrar açıklıyorsun
❌ Context %80+ dolunca "context rot" başlıyor ama fark etmiyorsun
❌ Aynı şeyi farklı oturumlarda tekrar tekrar anlatıyorsun
```

---

### Çözüm 1 — Chat → Claude Code Köprüsü: TASK.md

**En büyük kazanım buradan geliyor.**

Mevcut akış (verimsiz):
```
Chat'te planla → Claude Code'a tekrar anlat → token israfı
```

Yeni akış:
```
Chat'te planla → "Bunu TASK.md formatında yaz" de → 
Claude Code'da "TASK.md'i oku ve uygula" → bitti
```

Proje dosya yapısı:
```
CLAUDE.md      ← proje anayasası (her oturumda okunur)
TASK.md        ← o anlık görev (chat'ten gelir, her seferinde üzerine yazılır)
HANDOVER.md    ← oturumlar arası köprü (aşağıda detay)
PROGRESS.md    ← ne bitti (zaten var, devam et)
```

---

### Çözüm 2 — CLAUDE.md'i Token Verimli Hale Getir

Anthropic'in önerisi: **200 satır altında tut.** Her token CLAUDE.md'de, konuşmada kullanamadığın bir token.

Şu an CLAUDE.md'den çıkarılabilecekler:
- V1-V4 versiyon yol haritası tablosu → PROGRESS.md'e taşı
- "Phase X'teyim" notu tek satır olsun
- Uzun açıklama ve gerekçeler → sadece kuralı bırak, gerekçeyi sil
- Tekrar eden örnek ve açıklamalar → bir kural, bir cümle

Kural: **CLAUDE.md sadece Claude Code'un her oturumda kesinlikle bilmesi gerekenler.**
Tarih, gerekçe, vizyon, yol haritası → PROGRESS.md veya ayrı dokümana.

---

### Çözüm 3 — Claude Code İçi Context Yönetimi

**`/compact` komutu — %60 dolulukta çalıştır, %90'da değil.**

Context dolunca Claude'un kalitesi düşüyor ama kod çıkmaya devam ediyor — "context rot." Fark etmek zor. Eşik: **%60.**

Kompakt çalıştırırken ne söyle:
```
/compact et. Koru: değiştirilen dosyalar, önemli kararlar, açık TODOlar.
Sil: exploration, deneme yanılma, hata mesajları.
```

Ne zaman ne kullanırsın:

| Durum | Komut |
|---|---|
| Uzun oturum, aynı feature devam | `/compact` |
| Feature bitti, yeni konuya geçiyorsun | `/clear` |
| Belirli bir noktadan özetlemek | `Esc + Esc` → checkpoint seç |

Kadans: Her büyük milestone sonrası veya 30-45 dakikalık aktif çalışma sonrası `/compact`.

---

### Çözüm 4 — Oturumlar Arası Köprü: HANDOVER.md

Her oturum sonu Claude Code'a söyle:
```
HANDOVER.md'i güncelle:
- Neredeyiz (hangi feature, hangi dosya)
- Ne çalışıyor
- Açık kalan sorunlar
- Bir sonraki adım
```

Yeni oturumu açınca:
```
HANDOVER.md'i oku ve devam et.
```

`CLAUDE.md` (proje anayasası) + `HANDOVER.md` (nerede kaldın) birlikte tam resmi veriyor.
Proje context'ini sıfırdan anlatmıyorsun.

---

### Çözüm 5 — Chat ile Claude Code'un Net Görev Dağılımı

| Claude Chat (Cowork/web) | Claude Code (VS Code terminal) |
|---|---|
| Mimari kararlar | Implementation |
| "Bunu nasıl yapmalıyım?" | "Şunu yap" |
| Araştırma ve planlama | Dosya okuma ve yazma |
| Spec yazma (TASK.md) | TASK.md'i uygulama |
| Kod review | Test ve doğrulama |
| Uzun tartışmalar | Kısa, hedefli komutlar |

**Altın kural:** Claude Code'a asla açıklama yapma. TASK.md ver, o okusun.

---

### Beklenen Kazanım

Bu değişikliklerle benzer workflow'u optimize eden geliştiriciler %60-70 token azalması raporluyor.

Senin için en büyük iki kazanım:
1. **TASK.md handoff** — Chat planını spec'e dönüştür, Claude Code sadece onu uygulasın
2. **CLAUDE.md kırpma** — Her oturumda taşınan gereksiz context'i sil

---

## 5. Hızlı Referans Kartı

### Yeni Proje Başlarken Karar Ağacı

```
"Bu sadece SaaS mı?"
  → adrianhajdin/saas-template + shadcn/ui + Vercel AI SDK

"AI ağır mı olacak?"
  → ixartz/SaaS-Boilerplate + Mastra + Vercel AI SDK + Aceternity UI

"Hızlı MVP mi?"
  → adrianhajdin/saas-template + Magic UI

"Otomasyon aracı mı satıyorum?"
  → Mastra + VoltAgent

"İçerik sitesi mi?"
  → ixartz/Next-js-Boilerplate + shadcn/ui + Magic UI
```

### Günlük Workflow Akışı

```
1. HANDOVER.md'i oku
2. TASK.md'i oluştur (Chat'te planla)
3. Claude Code'a "TASK.md'i uygula" de
4. %60 context → /compact (koru: dosyalar + kararlar + TODOlar)
5. Feature bitti → HANDOVER.md'i güncelle
6. Yeni konu → /clear
```

### Claude Code Skill Kurulum Sırası

```
Hafta 1: Impeccable → npx skills add pbakaus/impeccable
Hafta 2: Taste Skill → git clone taste-skill ~/.claude/skills/
Hafta 3: Motion → git clone design-motion-principles ~/.claude/skills/
```

---

_Bu dosya yaşayan bir belgedir. Yeni proje ekledikçe, yeni tool keşfettikçe güncelle._
_Son güncelleme: Mayıs 2026_
