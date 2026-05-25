'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import type { Recipe, RecipeMacros } from '@/types/recipe'

type ParsedRecipe = {
  name: string
  ingredients: string[]
  instructions: string
}

function parseFormattedRecipe(text: string): ParsedRecipe | null {
  const lines = text.split('\n')

  const nameLine = lines.find((l) => l.trimStart().startsWith('🍽️'))
  if (!nameLine) return null
  const name = nameLine.replace(/🍽️\s*/, '').trim()
  if (!name) return null

  const ingredients = lines
    .filter((l) => l.trimStart().startsWith('•'))
    .map((l) => l.replace(/•\s*/, '').trim())
    .filter(Boolean)

  const hazirlikIdx = lines.findIndex((l) => l.includes('👨‍🍳'))
  const instructions =
    hazirlikIdx >= 0 ? lines.slice(hazirlikIdx + 1).join('\n').trim() : ''

  return { name, ingredients, instructions }
}

export function RecipeGenerator() {
  const router = useRouter()
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [recipe, setRecipe] = useState<string | null>(null)
  const [macros, setMacros] = useState<RecipeMacros | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [imageUrl, setImageUrl] = useState<string | null>(null)

  const [parsedRecipe, setParsedRecipe] = useState<ParsedRecipe | null>(null)
  const [savedRecipeId, setSavedRecipeId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [shareMessage, setShareMessage] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)

  // Modify state
  const [modifyInput, setModifyInput] = useState('')
  const [modifying, setModifying] = useState(false)
  const [modifyError, setModifyError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const ingredients = input
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)

    if (ingredients.length === 0) return

    setLoading(true)
    setRecipe(null)
    setMacros(null)
    setError(null)
    setImageUrl(null)
    setSavedRecipeId(null)
    setShareMessage(null)
    setSaveError(null)
    setParsedRecipe(null)
    setModifyInput('')
    setModifyError(null)

    try {
      const res = await fetch('/api/recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ingredients }),
      })

      const data = await res.json() as {
        recipe?: string
        macros?: RecipeMacros | null
        error?: string
      }

      if (!res.ok) {
        setError(data.error ?? 'Bir hata oluştu.')
      } else {
        const text = data.recipe ?? null
        setRecipe(text)
        setMacros(data.macros ?? null)

        if (text) {
          const parsed = parseFormattedRecipe(text)
          setParsedRecipe(
            parsed ?? {
              name: ingredients[0]
                ? `${ingredients[0].charAt(0).toUpperCase()}${ingredients[0].slice(1)} tarifi`
                : 'Chef-AI Tarifi',
              ingredients,
              instructions: text,
            }
          )
        }
      }
    } catch {
      setError('Sunucuya ulaşılamadı. Lütfen tekrar deneyin.')
    } finally {
      setLoading(false)
    }
  }

  // Save without triggering share — returns the saved recipe id or null
  async function autoSave(): Promise<string | null> {
    if (!parsedRecipe) return null
    if (savedRecipeId) return savedRecipeId

    setSaving(true)
    setSaveError(null)
    try {
      const res = await fetch('/api/recipes/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: parsedRecipe.name,
          ingredients: parsedRecipe.ingredients,
          instructions: parsedRecipe.instructions,
          macros: macros ?? undefined,
        }),
      })
      const data = await res.json() as { recipe?: Recipe; error?: string }
      if (!res.ok || !data.recipe?.id) {
        setSaveError(data.error ?? 'Kaydetme başarısız.')
        return null
      }
      setSavedRecipeId(data.recipe.id)
      if (data.recipe.image_url) setImageUrl(data.recipe.image_url)
      router.refresh()
      return data.recipe.id
    } catch {
      setSaveError('Sunucuya ulaşılamadı.')
      return null
    } finally {
      setSaving(false)
    }
  }

  async function handleSave() {
    if (!recipe || !parsedRecipe) return

    if (savedRecipeId) {
      await triggerShare(savedRecipeId)
      return
    }

    const id = await autoSave()
    if (id) await triggerShare(id)
  }

  async function triggerShare(id: string) {
    const url = `${window.location.origin}/recipe/${id}`
    const shareData = {
      title: parsedRecipe?.name ?? 'Chef-AI Tarifi',
      text: 'Chef-AI ile ürettiğim tarife bak!',
      url,
    }

    if (navigator.share) {
      try {
        await navigator.share(shareData)
        return
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return
      }
    }

    try {
      await navigator.clipboard.writeText(url)
      setShareMessage('Link kopyalandı ✓')
      setTimeout(() => setShareMessage(null), 3000)
    } catch {
      setSaveError(`Panoya kopyalanamadı — link: ${url}`)
    }
  }

  async function handleModify(e: React.FormEvent) {
    e.preventDefault()
    if (!modifyInput.trim() || !parsedRecipe || modifying) return

    setModifying(true)
    setModifyError(null)

    // Ensure recipe is saved first
    let recipeId = savedRecipeId
    if (!recipeId) {
      recipeId = await autoSave()
      if (!recipeId) {
        setModifying(false)
        return
      }
    }

    try {
      const res = await fetch('/api/recipes/modify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipeId, instruction: modifyInput.trim() }),
      })
      const data = (await res.json()) as { recipe?: Recipe; error?: string }
      if (res.ok && data.recipe?.id) {
        router.push(`/recipe/${data.recipe.id}`)
      } else {
        setModifyError(data.error ?? 'Tarif değiştirilemedi.')
      }
    } catch {
      setModifyError('Sunucuya ulaşılamadı.')
    } finally {
      setModifying(false)
    }
  }

  function resetRecipe() {
    setRecipe(null)
    setMacros(null)
    setInput('')
    setImageUrl(null)
    setSavedRecipeId(null)
    setShareMessage(null)
    setSaveError(null)
    setParsedRecipe(null)
    setModifyInput('')
    setModifyError(null)
  }

  return (
    <div className="mt-8">
      <h2 className="mb-4 text-lg font-semibold text-[var(--text-primary)]">Tarif Üret</h2>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Malzemeleri virgülle ayır: tavuk, soğan, sarımsak…"
          disabled={loading}
          className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-muted)] focus:border-amber-400 focus:ring-2 focus:ring-amber-100 dark:focus:ring-amber-900/30 disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={loading || input.trim() === ''}
          className="w-full sm:self-start sm:w-auto rounded-xl px-6 py-3 sm:py-2.5 text-sm font-semibold text-white transition hover:opacity-85 active:scale-[0.98] disabled:opacity-50"
          style={{ backgroundColor: '#ffa51f' }}
        >
          {loading ? 'Tarif üretiliyor…' : 'Tarif Üret →'}
        </button>
      </form>

      <AnimatePresence>
        {error && (
          <motion.p
            key="error"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="mt-4 text-sm text-red-500"
          >
            {error}
          </motion.p>
        )}

        {recipe && (
          <motion.div
            key="recipe"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="mt-6 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] shadow-sm"
          >
            {/* Recipe image */}
            {imageUrl ? (
              <div className="relative h-48 w-full">
                <Image
                  src={imageUrl}
                  alt={parsedRecipe?.name ?? 'Tarif görseli'}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 600px"
                />
              </div>
            ) : (
              <div className="h-32 w-full bg-gradient-to-br from-amber-100 to-orange-200 dark:from-amber-900/30 dark:to-orange-900/20 flex items-center justify-center">
                <span className="text-4xl">🍽️</span>
              </div>
            )}

            <div className="p-6">
              <div className="mb-3 flex items-center gap-2">
                <span className="text-sm font-semibold text-[var(--text-secondary)]">Tarifiniz hazır</span>
              </div>

              <p className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--text-secondary)]">
                {recipe}
              </p>

              {macros && (
                <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 border-t border-[var(--border-subtle)] pt-4 text-xs text-[var(--text-muted)]">
                  <span>🔥 <span className="font-semibold text-[var(--text-primary)]">{macros.calories} kcal</span></span>
                  <span>💪 <span className="font-semibold text-[var(--text-primary)]">{macros.protein_g}g</span> protein</span>
                  <span>🍚 <span className="font-semibold text-[var(--text-primary)]">{macros.carbs_g}g</span> karb</span>
                  <span>🧈 <span className="font-semibold text-[var(--text-primary)]">{macros.fat_g}g</span> yağ</span>
                </div>
              )}

              {/* Save & Share */}
              <div className="mt-4 border-t border-[var(--border-subtle)] pt-4">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
                  style={{ backgroundColor: '#ffa51f' }}
                >
                  {saving
                    ? 'Kaydediliyor…'
                    : savedRecipeId
                    ? '🔗 Tekrar Paylaş'
                    : '🔗 Kaydet & Paylaş'}
                </button>

                {shareMessage && (
                  <p className="mt-2 text-xs font-medium text-green-600">{shareMessage}</p>
                )}
                {saveError && (
                  <p className="mt-2 text-xs text-red-500">{saveError}</p>
                )}
              </div>

              <button
                type="button"
                onClick={resetRecipe}
                className="mt-4 text-xs text-[var(--text-muted)] underline hover:text-[var(--text-secondary)]"
              >
                Yeni tarif üret
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ✨ Modify section — shown after a recipe is generated */}
      <AnimatePresence>
        {recipe && (
          <motion.div
            key="modify"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut', delay: 0.1 }}
            className="mt-4 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5 shadow-sm"
          >
            <h3 className="mb-1 text-sm font-semibold text-[var(--text-primary)]">✨ Bu Tarifi Değiştir</h3>
            <p className="mb-3 text-xs text-[var(--text-muted)]">
              Daha az kalorili, vejetaryen, farklı porsiyon… istediğin değişikliği yaz.
            </p>
            <form onSubmit={handleModify} className="flex flex-col gap-2">
              <input
                type="text"
                value={modifyInput}
                onChange={(e) => setModifyInput(e.target.value)}
                placeholder="ör: daha az yağlı yap, 4 kişilik yap, vejetaryen versiyonu…"
                disabled={modifying || saving}
                className="rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 py-2.5 text-sm text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-muted)] focus:border-amber-400 focus:ring-2 focus:ring-amber-100 dark:focus:ring-amber-900/30 disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={modifying || saving || modifyInput.trim() === ''}
                className="self-start rounded-xl px-5 py-2 text-sm font-semibold text-white transition hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
                style={{ backgroundColor: '#ffa51f' }}
              >
                {modifying ? 'Tarif güncelleniyor...' : 'Uygula →'}
              </button>
            </form>
            {modifyError && (
              <p className="mt-2 text-xs text-red-500">{modifyError}</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
