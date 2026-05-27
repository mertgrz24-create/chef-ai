'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import type { Profile } from '@/types/profile'

const inputCls =
  'w-full rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-muted)] focus:border-amber-400 focus:ring-2 focus:ring-amber-100 dark:focus:ring-amber-900/30 disabled:opacity-60'
const labelCls = 'mb-1.5 block text-sm font-medium text-[var(--text-secondary)]'
const sectionCls = 'rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-6 shadow-sm'
const headingCls = 'mb-5 flex items-center gap-2 text-base font-semibold text-[var(--text-primary)]'

const DIET_OPTIONS = [
  { label: 'Normal', value: 'omnivore' },
  { label: 'Vegan', value: 'vegan' },
  { label: 'Vejetaryen', value: 'vegetarian' },
  { label: 'Keto', value: 'keto' },
  { label: 'Glutensiz', value: 'gluten_free' },
  { label: 'Diğer', value: 'other' },
]

const PRESET_DIET_VALUES = new Set(['omnivore', 'vegan', 'vegetarian', 'keto', 'gluten_free'])

type FormState = {
  full_name: string
  daily_calorie_goal: string
  protein_goal_g: string
  carbs_goal_g: string
  fat_goal_g: string
  water_goal_l: string
  daily_steps_goal: string
  current_weight_kg: string
  target_weight_kg: string
  diet_type_preset: string
  diet_type_custom: string
}

const EMPTY_FORM: FormState = {
  full_name: '',
  daily_calorie_goal: '',
  protein_goal_g: '',
  carbs_goal_g: '',
  fat_goal_g: '',
  water_goal_l: '',
  daily_steps_goal: '',
  current_weight_kg: '',
  target_weight_kg: '',
  diet_type_preset: '',
  diet_type_custom: '',
}

function profileToForm(profile: Profile): FormState {
  const dt = profile.diet_type ?? ''
  return {
    full_name: profile.full_name ?? '',
    daily_calorie_goal: profile.daily_calorie_goal?.toString() ?? '',
    protein_goal_g: profile.protein_goal_g?.toString() ?? '',
    carbs_goal_g: profile.carbs_goal_g?.toString() ?? '',
    fat_goal_g: profile.fat_goal_g?.toString() ?? '',
    water_goal_l: profile.water_goal_l?.toString() ?? '',
    daily_steps_goal: profile.daily_steps_goal?.toString() ?? '',
    current_weight_kg: profile.current_weight_kg?.toString() ?? '',
    target_weight_kg: profile.target_weight_kg?.toString() ?? '',
    diet_type_preset: dt === '' ? '' : PRESET_DIET_VALUES.has(dt) ? dt : 'other',
    diet_type_custom: PRESET_DIET_VALUES.has(dt) ? '' : dt,
  }
}

function parseNum(val: string): number | null {
  if (val.trim() === '') return null
  const n = parseFloat(val)
  return isNaN(n) ? null : n
}

// Extracted to avoid component-inside-render anti-pattern
function NumberInput({
  value,
  onChange,
  suffix,
  step,
  disabled,
}: {
  value: string
  onChange: (v: string) => void
  suffix: string
  step?: string
  disabled?: boolean
}) {
  return (
    <div className="relative">
      <input
        type="number"
        min="0"
        step={step ?? '1'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="—"
        disabled={disabled}
        className={`${inputCls} pr-16`}
      />
      <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-[var(--text-muted)]">
        {suffix}
      </span>
    </div>
  )
}

export default function ProfilePage() {
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)

  // Profile data (for referral + premium status)
  const [profile, setProfile] = useState<Profile | null>(null)

  // Health export
  const [exporting, setExporting] = useState(false)

  // Referral copy
  const [copied, setCopied] = useState(false)

  const applyReferral = useCallback(async (p: Profile) => {
    if (p.referred_by) return
    const ref = localStorage.getItem('chef_ref')
    if (!ref) return
    try {
      await fetch('/api/referral', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: ref }),
      })
      localStorage.removeItem('chef_ref')
    } catch {
      // non-fatal
    }
  }, [])

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch('/api/profile')
        const data = (await res.json()) as { profile?: Profile; error?: string }
        if (!res.ok) {
          setFetchError(data.error ?? 'Profil yüklenemedi.')
        } else if (data.profile) {
          setForm(profileToForm(data.profile))
          setProfile(data.profile)
          void applyReferral(data.profile)
        }
      } catch {
        setFetchError('Sunucuya ulaşılamadı.')
      } finally {
        setLoading(false)
      }
    })()
  }, [applyReferral])

  function set(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setMessage(null)

    const diet_type =
      form.diet_type_preset === 'other'
        ? form.diet_type_custom.trim() || null
        : form.diet_type_preset || null

    const payload = {
      full_name: form.full_name.trim() || null,
      daily_calorie_goal: parseNum(form.daily_calorie_goal),
      protein_goal_g: parseNum(form.protein_goal_g),
      carbs_goal_g: parseNum(form.carbs_goal_g),
      fat_goal_g: parseNum(form.fat_goal_g),
      water_goal_l: parseNum(form.water_goal_l),
      daily_steps_goal: parseNum(form.daily_steps_goal),
      current_weight_kg: parseNum(form.current_weight_kg),
      target_weight_kg: parseNum(form.target_weight_kg),
      diet_type,
    }

    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = (await res.json()) as { profile?: Profile; error?: string }

      if (!res.ok) {
        setMessage({ ok: false, text: data.error ?? 'Kaydetme başarısız.' })
      } else {
        setMessage({ ok: true, text: 'Hedefler kaydedildi ✓' })
        if (data.profile) {
          setForm(profileToForm(data.profile))
          setProfile(data.profile)
        }
      }
    } catch {
      setMessage({ ok: false, text: 'Sunucuya ulaşılamadı. Lütfen tekrar deneyin.' })
    } finally {
      setSaving(false)
    }
  }

  async function handleExport() {
    setExporting(true)
    try {
      const res = await fetch('/api/health-export')
      if (!res.ok) return
      const data = await res.json() as { exports: unknown[] }
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'chef-ai-health-export.json'
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      // silently ignore
    } finally {
      setExporting(false)
    }
  }

  async function handleCopyCode() {
    if (!profile?.referral_code) return
    const shareUrl = `https://chef-ai-puce-zeta.vercel.app/signup?ref=${profile.referral_code}`
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      // silently ignore
    }
  }

  if (loading) {
    return (
      <div>
        <h1 className="mb-2 text-2xl font-bold text-[var(--text-primary)]">Profil</h1>
        <p className="mb-8 text-sm text-[var(--text-muted)]">Diyet hedeflerin ve hesap ayarların.</p>
        <div className="flex items-center justify-center py-20">
          <p className="text-sm text-[var(--text-muted)]">Yükleniyor…</p>
        </div>
      </div>
    )
  }

  if (fetchError) {
    return (
      <div>
        <h1 className="mb-2 text-2xl font-bold text-[var(--text-primary)]">Profil</h1>
        <p className="mb-8 text-sm text-[var(--text-muted)]">Diyet hedeflerin ve hesap ayarların.</p>
        <div className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 p-4 text-sm text-red-600 dark:text-red-400">
          {fetchError}
        </div>
      </div>
    )
  }

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold text-[var(--text-primary)]">Profil</h1>
      <p className="mb-8 text-sm text-[var(--text-muted)]">Diyet hedeflerin ve hesap ayarların.</p>

      <form onSubmit={handleSubmit} className="flex max-w-2xl flex-col gap-6">
        {/* Section 1 — Beslenme Hedefleri */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className={sectionCls}
        >
          <h2 className={headingCls}>
            <span>🎯</span> Beslenme Hedefleri
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelCls}>Günlük Kalori</label>
              <NumberInput
                value={form.daily_calorie_goal}
                onChange={(v) => set('daily_calorie_goal', v)}
                suffix="kcal"
                disabled={saving}
              />
            </div>
            <div>
              <label className={labelCls}>Protein</label>
              <NumberInput
                value={form.protein_goal_g}
                onChange={(v) => set('protein_goal_g', v)}
                suffix="g"
                disabled={saving}
              />
            </div>
            <div>
              <label className={labelCls}>Karbonhidrat</label>
              <NumberInput
                value={form.carbs_goal_g}
                onChange={(v) => set('carbs_goal_g', v)}
                suffix="g"
                disabled={saving}
              />
            </div>
            <div>
              <label className={labelCls}>Yağ</label>
              <NumberInput
                value={form.fat_goal_g}
                onChange={(v) => set('fat_goal_g', v)}
                suffix="g"
                disabled={saving}
              />
            </div>
          </div>
        </motion.div>

        {/* Section 2 — Aktivite */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut', delay: 0.05 }}
          className={sectionCls}
        >
          <h2 className={headingCls}>
            <span>💧</span> Aktivite
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelCls}>Günlük Su</label>
              <NumberInput
                value={form.water_goal_l}
                onChange={(v) => set('water_goal_l', v)}
                suffix="litre"
                step="0.5"
                disabled={saving}
              />
            </div>
            <div>
              <label className={labelCls}>Günlük Adım</label>
              <NumberInput
                value={form.daily_steps_goal}
                onChange={(v) => set('daily_steps_goal', v)}
                suffix="adım"
                disabled={saving}
              />
            </div>
          </div>
        </motion.div>

        {/* Section 3 — Kilo Takibi */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut', delay: 0.1 }}
          className={sectionCls}
        >
          <h2 className={headingCls}>
            <span>⚖️</span> Kilo Takibi
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelCls}>Mevcut Kilo</label>
              <NumberInput
                value={form.current_weight_kg}
                onChange={(v) => set('current_weight_kg', v)}
                suffix="kg"
                step="0.1"
                disabled={saving}
              />
            </div>
            <div>
              <label className={labelCls}>Hedef Kilo</label>
              <NumberInput
                value={form.target_weight_kg}
                onChange={(v) => set('target_weight_kg', v)}
                suffix="kg"
                step="0.1"
                disabled={saving}
              />
            </div>
          </div>
        </motion.div>

        {/* Section 4 — Diyet Tercihi */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut', delay: 0.15 }}
          className={sectionCls}
        >
          <h2 className={headingCls}>
            <span>🥗</span> Diyet Tercihi
          </h2>
          <div className="flex flex-col gap-4">
            <div>
              <label className={labelCls}>Görünen Ad</label>
              <input
                type="text"
                value={form.full_name}
                onChange={(e) => set('full_name', e.target.value)}
                placeholder="Adınız"
                disabled={saving}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Diyet Tipi</label>
              <select
                value={form.diet_type_preset}
                onChange={(e) => set('diet_type_preset', e.target.value)}
                disabled={saving}
                className={inputCls}
              >
                <option value="">Seçiniz</option>
                {DIET_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            {form.diet_type_preset === 'other' && (
              <div>
                <label className={labelCls}>Diyet Tipinizi Yazın</label>
                <input
                  type="text"
                  value={form.diet_type_custom}
                  onChange={(e) => set('diet_type_custom', e.target.value)}
                  placeholder="ör. Akdeniz diyeti"
                  disabled={saving}
                  className={inputCls}
                />
              </div>
            )}
          </div>
        </motion.div>

        {/* Geri bildirim mesajı */}
        {message && (
          <div
            className={`rounded-xl border px-4 py-3 text-sm font-medium ${
              message.ok
                ? 'border-green-200 dark:border-green-900/50 bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400'
                : 'border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Kaydet butonu */}
        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-xl py-3 text-sm font-semibold text-white transition active:scale-95 disabled:opacity-60"
          style={{ backgroundColor: '#ffa51f' }}
        >
          {saving ? 'Kaydediliyor…' : 'Hedefleri Kaydet'}
        </button>
      </form>

      {/* Health Export */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut', delay: 0.2 }}
        className={`mt-6 max-w-2xl ${sectionCls}`}
      >
        <h2 className={headingCls}>
          <span>📱</span> Sağlık Uygulaması Export
        </h2>
        <p className="mb-4 text-sm text-[var(--text-muted)]">
          Son 30 günün tüketim verisini Apple Health / Google Fit&apos;e aktarabilirsin.
        </p>
        <button
          type="button"
          onClick={() => { void handleExport() }}
          disabled={exporting}
          className="rounded-xl border border-[var(--border)] px-5 py-2.5 text-sm font-semibold text-[var(--text-secondary)] transition hover:border-amber-300 hover:text-amber-600 dark:hover:text-amber-400 disabled:opacity-50"
        >
          {exporting ? 'İndiriliyor…' : '📥 Apple Health / Google Fit\'e Aktar'}
        </button>
        <p className="mt-3 text-xs text-[var(--text-muted)]">
          İndirilen JSON dosyasını sağlık uygulamanıza aktarabilirsiniz.
        </p>
      </motion.div>

      {/* Referral */}
      {profile?.referral_code && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut', delay: 0.25 }}
          className={`mt-6 max-w-2xl ${sectionCls}`}
        >
          <h2 className={headingCls}>
            <span>🎁</span> Arkadaşını Davet Et
          </h2>

          {/* Code display */}
          <div className="mb-4 flex items-center gap-3">
            <span className="rounded-xl border-2 border-dashed border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/30 px-5 py-3 text-xl font-bold tracking-widest text-amber-700 dark:text-amber-300">
              {profile.referral_code}
            </span>
            <button
              type="button"
              onClick={() => { void handleCopyCode() }}
              className="rounded-xl border border-[var(--border)] px-4 py-2.5 text-sm font-medium text-[var(--text-secondary)] transition hover:border-amber-300 hover:text-amber-600 dark:hover:text-amber-400"
            >
              {copied ? '✓ Kopyalandı' : '📋 Kodu Kopyala'}
            </button>
          </div>

          <p className="mb-2 text-sm text-[var(--text-muted)]">
            Paylaşım linki:{' '}
            <span className="font-mono text-xs text-[var(--text-secondary)]">
              chef-ai-puce-zeta.vercel.app/signup?ref={profile.referral_code}
            </span>
          </p>

          <div className="mt-4 flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 py-3">
            <span className="text-lg">👥</span>
            <span className="text-sm text-[var(--text-secondary)]">
              Davet ettiğin kişi sayısı:{' '}
              <span className="font-bold text-[var(--text-primary)]">{profile.referral_count ?? 0} kişi</span>
            </span>
          </div>

          <p className="mt-3 text-xs text-[var(--text-muted)]">
            Davet ettiğin her 3 kişi için 1 ay Premium kazan! <span className="italic">(yakında)</span>
          </p>
        </motion.div>
      )}
    </div>
  )
}
