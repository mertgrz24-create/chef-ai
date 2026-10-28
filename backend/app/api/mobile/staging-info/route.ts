// Internal test information only. Never a substitute for production legal pages.
export const dynamic = 'force-dynamic'

export async function GET() {
  if (
    process.env.MOBILE_ENVIRONMENT !== 'staging' ||
    process.env.NEXT_PUBLIC_SUPABASE_URL !==
      'https://vcyqtbzhfanbpclfhibv.supabase.co'
  )
    return new Response('Not found', { status: 404 })

  const aiEnabled = process.env.MOBILE_AI_READY === 'true'
  const aiTr = aiEnabled
    ? 'AI yalnızca uygulamada ayrı aktarım izni verdikten sonra çalışır. Malzeme metni ve onayladığınız fotoğraf Google Gemini’ye gönderilir. Ücretsiz hizmette Google girdileri/çıktıları ürün geliştirme ve insan incelemesinde kullanabilir; kişisel, gizli veya hassas veri göndermeyin. Sağlayıcının kesin saklama süresi bu testte doğrulanmamıştır. Sunucuda sonuçlar tekrar istek kontrolü için saklanır; otomatik temizlik zamanlayıcısı henüz açık değildir. Hesap silme kendi uygulama verilerinizi kaldırır; Google’ın bağımsız saklama kurallarını değiştirmez.'
    : 'Bu ortamda AI aktarımı kapalıdır.'
  const aiEn = aiEnabled
    ? 'AI requires separate in-app transfer consent. Ingredient text and approved photos are sent to Google Gemini. On unpaid services Google may use inputs/outputs for product improvement and human review. Do not submit personal, confidential or sensitive data. Exact provider retention has not been verified for this test. Server results are stored for request replay; automatic cleanup scheduling is not yet enabled. Account deletion removes your app data, not data independently retained by Google.'
    : 'AI transfer is disabled in this test environment.'
  return new Response(
    `CHEF-AI — STAGING / KONTROLLÜ TEST

Bu ortam yalnızca 18 yaş üstü davetli test kullanıcıları içindir. Mağaza sürümü değildir. Bu sayfa üretim gizlilik politikası veya kullanım sözleşmesi değildir; yayıncı bilgileri ve hukuki metinler henüz tamamlanmamıştır.

Gizlilik: Giriş hesabı Supabase Auth'ta, eklediğiniz kiler/plan/kayıtlı tarifler ayrı staging veritabanında tutulur. Yalnızca sentetik test verileri kullanın; hassas bilgi veya kişisel fotoğraf yüklemeyin. Test ortamı sıfırlanabilir. Uygulama kapanması sunucudaki kayıtları silmez.

${aiTr}

Satın alma, push ve kullanım analitiği bu ortamda kapalıdır. Bunların başarıyla test edildiği varsayılmamalıdır. Gerçek ödeme yapmayın.

Destek: Bu testi başlatan Chef-AI geliştirme sohbetine ekran adı, hata ve yeniden üretme adımlarını gönderin. Parola, oturum bağlantısı veya token göndermeyin.

Hesap silme: Uygulamada Profile > Delete account onay akışını kullanın. Silinen test hesabıyla tekrar giriş yapılamaz. Test verilerini saklama veya yedekleme garantisi yoktur.

ENGLISH
Invited adults (18+) only. This is an internal staging environment, not a store release. This notice is not a production privacy policy or terms of service; publisher details and legal documents are pending.
Authentication uses Supabase Auth. Pantry, plans and saved recipes use a separate staging database. Use synthetic test data only; do not upload sensitive information or personal photos. Test data may be reset. Closing the app does not delete server records.
${aiEn}
Purchases, push and usage analytics are disabled. Do not make real payments. Report issues in the Chef-AI development conversation without passwords or tokens. To delete your test account, use Profile > Delete account in the app. No test-data retention or backup guarantee is provided.
`,
    {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
        'X-Robots-Tag': 'noindex, nofollow',
      },
    },
  )
}
