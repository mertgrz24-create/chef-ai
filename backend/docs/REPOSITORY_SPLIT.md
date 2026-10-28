> Güncel durum: backend artık aynı uygulama reposunda `chef-ai/backend/` altındadır. Aşağıdaki üç repo kayıtları tarihsel; aktif rehber `docs/MONOREPO.md`.

# Repo ayrımı — 16 Ekim 2026

## Değişiklik

`chef-ai-web` çalışma ağacındaki kaydedilmemiş güvenlik/AI düzeltmeleri dahil 105 kaynak/ayar dosyası ayrı `chef-ai-backend` reposuna kopyalandı ve SHA-256 ile karşılaştırıldı. Liste `source-transfer-2026-10-16.json` içinde. Bu dosya taşıma öncesi kopyanın kanıtıdır; sonradan düzenlenen paket adı, AGENTS ve işletim belgelerinin son hash'i değildir. Önceki Git geçmişi web reposunda korunur; yeni backend başlangıç snapshot'ı, kaynak commit bilgisini içerir. Git geçmişinden sır taşınmaz.

API route'ları, servis kütüphaneleri, tipler, migration'lar, e-posta şablonları ve public recipe ürünü backend'e taşındı. Landing page, statik invite sayfası, görseller ve animasyon yardımcıları web'de kaldı. Ortak görünen küçük sunum yardımcıları bağımsız kopyadır; repo'lar arasında dosya import'u, symlink veya npm file dependency yoktur.

Gerçek `.env.local` yalnız backend'de, Git dışında ve 0600. Web `.env.example` yalnız public mağaza adresleri içerir. Web kaynaklarından API cron'ları, Supabase/AI sunucu kütüphaneleri ve bağımlılıkları kaldırıldı. Önceki kök ayar dosyalarının özel kurtarma kopyaları `~/.config/chef-ai/repository-split-backups/` altındadır; otomatik dotenv alanında değildir.

## Çalışan staging

- Mevcut staging Vercel projesi ve adresi korunur; Supabase veritabanı/redirect/anahtarları değişmez.
- Dağıtımdaki kaynak snapshot'ı önceki yayındır; bu oturumda deploy/build yoktur. Yeni backend'in yayına geçtiği iddia edilmez.
- Sonraki staging deploy'u yalnız bu backend çalışma ağacından ve doğru proje ID'si kontrol edilerek yapılmalı. Git otomatik dağıtım bağlantıları değiştirilmedi.
- Mevcut APK hosted staging'e gider. Yerel backend'i kullanması için yeni build yapılmadı.
- Yerel API development sunucusu artık backend reposundan 127.0.0.1:3000'de çalışır. Web geliştirme portu3001 olarak ayrılır.
- Customer production, web canlı yayını ve mobil mağaza paketleri değiştirilmedi. Tanıtım reposunun API'siz sürümünü yayınlamadan önce eski production API tüketicileri ve public recipe URL'leri için ayrı geçiş gerekir.

## Geri dönüş

1. Mevcut hosted staging deployment'ını silme; aynı artefakt bu taşıma boyunca hizmet verir.
2. Yerel sorun halinde yalnız backend development sunucusunu durdur. API kaynaklarının değişmeden taşınan kopyası bu repoda; eski web kök ayarları özel kurtarma klasöründe bulunur. Gerekiyorsa dosyaları kontrollü geri kopyala; Git reset/clean ile kullanıcının diğer değişikliklerini silme.
3. Env kurtarmasında yalnız backend staging `.env.local` kullanılır. Production dotenv arşivi yerel ortama geri getirilmez.
4. İlerideki deployment geri dönüşü mevcut bilinen iyi staging deployment alias'ını korumakla yapılır; yeni deploy yetkisi bu taşımanın parçası değildir.

## Açık kapılar

Branded SMTP/yasal bilgiler, abonelik/restore, push, native cihaz/beta/mağaza kapıları, gerçek authenticated DAST ve kalıcı maliyet defteri önceki listelerdeki durumuyla sürer. HawkScan kullanıcı tarafından ücret nedeniyle reddedilmişti; bu taşıma için ücretli hesap/deneme açılmadı, tarama yapılmış sayılmadı.


## Ayrım sonrası doğrulama

- Backend temiz `npm ci` kurulumu ve bağımlılık güvenlik yaması geçti. TypeScript hatasız; lint 0 hata/önceden mevcut 4 uyarı. Mevcut36 güvenlik testi geçti.
- Tanıtım sitesi sunucu dotenv olmadan3001'de ana sayfa ve statik davet200; eski API yolları 404. TypeScript/lint hatasız.
- Bağımsız yerel backend3000'de config200/AI+TR hazır; kimliksiz API istekleri401. Yerel/hosted staging arasında8 sentetik giriş, profil, kiler yazma-okuma ve hesap silme/oturum reddi kontrolü geçti. Geçici hesap ve kayıt temizlendi. AI üretim çağrısı tekrarlanmadı. Kanıt: `docs/split-integration-evidence-2026-10-16.json`.
- Backend, web ve mobil kaynak/erişilebilir yerel Git geçmişi Gitleaks taramasında0 bulgu. Özel ignoreddotenv kaynak taramasına dahil değildir; dosya izinleri/konumu ayrıca doğrulandı. DAST değildir.
- Backend GitHub'da **özel** repo: https://github.com/mertgrz24/chef-ai-backend . Başlangıç kaynağı sır taramasından sonra gönderildi. Web ve mobildeki mevcut çalışma ağacı değişiklikleri commit/push edilmedi; web remote otomatik build'i tetiklenmedi. Git indekslerindeki kullanıcı işleri sıfırlanmadı.
- HawkScan anahtarı yok; kullanıcının ücretli kurulumu reddetme tercihi korundu. Yeni DAST sonucu veya tam güvenlik onayı yok.
- Mevcut hosted deployment ve installed APK değişmedi; yeni build/deploy yok.
