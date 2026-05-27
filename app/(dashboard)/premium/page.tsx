export default function PremiumPage() {
  const features = [
    { label: 'Aylık tarif limiti', free: '5 tarif', premium: 'Sınırsız' },
    { label: 'Haftalık yemek planı', free: '✓', premium: '✓' },
    { label: 'Alışveriş listesi', free: '✓', premium: '✓' },
    { label: 'Tüketim takibi', free: '✓', premium: '✓' },
    { label: 'Tarif değiştirme', free: '✓', premium: '✓' },
    { label: 'Sağlık uygulaması export', free: '—', premium: '✓' },
    { label: 'Reklamsız deneyim', free: '—', premium: '✓' },
    { label: 'Öncelikli destek', free: '—', premium: '✓' },
  ]

  return (
    <div className="mx-auto max-w-2xl">
      {/* Header */}
      <div className="mb-10 text-center">
        <h1 className="mb-3 text-3xl font-bold text-[var(--text-primary)]">
          Chef-AI Premium 👨‍🍳
        </h1>
        <p className="text-[var(--text-muted)]">
          Mutfağındaki yapay zeka asistanının tüm gücünü aç.
        </p>
      </div>

      {/* Pricing cards */}
      <div className="mb-10 grid gap-4 sm:grid-cols-2">
        {/* Monthly */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-6 shadow-sm">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Aylık</p>
          <div className="mb-4 flex items-end gap-1">
            <span className="text-4xl font-bold text-[var(--text-primary)]">$9.99</span>
            <span className="mb-1 text-sm text-[var(--text-muted)]">/ay</span>
          </div>
          <button
            type="button"
            disabled
            className="w-full rounded-xl py-3 text-sm font-semibold text-[var(--text-muted)] transition border border-[var(--border)] bg-[var(--bg)] disabled:cursor-not-allowed"
          >
            Yakında…
          </button>
        </div>

        {/* Yearly — highlighted */}
        <div className="relative rounded-2xl border-2 p-6 shadow-sm" style={{ borderColor: '#ffa51f', background: 'var(--accent-light)' }}>
          <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-xs font-bold text-white" style={{ backgroundColor: '#ffa51f' }}>
            %33 İndirim
          </span>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-400">Yıllık</p>
          <div className="mb-1 flex items-end gap-1">
            <span className="text-4xl font-bold text-[var(--text-primary)]">$79.99</span>
            <span className="mb-1 text-sm text-[var(--text-muted)]">/yıl</span>
          </div>
          <p className="mb-4 text-xs text-amber-600 dark:text-amber-400">≈ $6.67/ay · 2 ay bedava</p>
          <button
            type="button"
            disabled
            className="w-full rounded-xl py-3 text-sm font-semibold text-[var(--text-muted)] transition border border-amber-300 dark:border-amber-700 bg-[var(--bg-card)] disabled:cursor-not-allowed"
          >
            Yakında…
          </button>
        </div>
      </div>

      {/* Feature comparison table */}
      <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] shadow-sm">
        {/* Table header */}
        <div className="grid grid-cols-3 border-b border-[var(--border)] bg-[var(--bg)] px-5 py-3">
          <span className="text-xs font-semibold text-[var(--text-muted)]">Özellik</span>
          <span className="text-center text-xs font-semibold text-[var(--text-muted)]">Ücretsiz</span>
          <span className="text-center text-xs font-bold" style={{ color: '#ffa51f' }}>Premium</span>
        </div>

        {/* Rows */}
        <ul className="divide-y divide-[var(--border-subtle)]">
          {features.map((f) => (
            <li key={f.label} className="grid grid-cols-3 items-center px-5 py-3.5">
              <span className="text-sm text-[var(--text-secondary)]">{f.label}</span>
              <span className={`text-center text-sm ${f.free === '—' ? 'text-[var(--text-muted)]' : 'text-[var(--text-primary)]'}`}>
                {f.free}
              </span>
              <span className={`text-center text-sm font-semibold ${f.premium === '✓' || f.premium === 'Sınırsız' ? '' : 'text-[var(--text-primary)]'}`} style={{ color: f.premium !== '—' ? '#ffa51f' : undefined }}>
                {f.premium}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <p className="mt-8 text-center text-xs text-[var(--text-muted)]">
        Ödeme sistemi yakında açılacak. Tavsiye programıyla ücretsiz Premium kazan!
      </p>
    </div>
  )
}
