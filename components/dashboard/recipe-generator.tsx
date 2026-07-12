'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { RecipeCard } from '@/components/recipe-card'
import { RecipeSkeleton } from '@/components/recipe-skeleton'
import { useToast } from '@/components/toast'
import type { Recipe, RecipeMacros, StructuredRecipe } from '@/types/recipe'

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
  const { toast } = useToast()
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [recipe, setRecipe] = useState<string | null>(null)
  const [structured, setStructured] = useState<StructuredRecipe | null>(null)
  const [macros, setMacros] = useState<RecipeMacros | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [imageUrl, setImageUrl] = useState<string | null>(null)

  const [parsedRecipe, setParsedRecipe] = useState<ParsedRecipe | null>(null)
  const [savedRecipeId, setSavedRecipeId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  // Modify state
  const [modifyInput, setModifyInput] = useState('')
  const [modifying, setModifying] = useState(false)
  const [modifyError, setModifyError] = useState<string | null>(null)

  // Freemium limit state
  const [limitReached, setLimitReached] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const ingredients = input
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)

    if (ingredients.length === 0) return

    setLoading(true)
    setRecipe(null)
    setStructured(null)
    setMacros(null)
    setError(null)
    setImageUrl(null)
    setSavedRecipeId(null)
    setSaveError(null)
    setParsedRecipe(null)
    setModifyInput('')
    setModifyError(null)
    setLimitReached(false)

    try {
      const res = await fetch('/api/recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ingredients }),
      })

      const data = await res.json() as {
        recipe?: string
        structured?: StructuredRecipe | null
        macros?: RecipeMacros | null
        error?: string
        message?: string
      }

      if (res.status === 403 && data.error === 'limit_reached') {
        setLimitReached(true)
      } else if (!res.ok) {
        setError(data.error ?? 'Something went wrong.')
      } else {
        const text = data.recipe ?? null
        setRecipe(text)
        setStructured(data.structured ?? null)
        setMacros(data.macros ?? null)

        if (data.structured) {
          // Structured payload is the source of truth for saving
          setParsedRecipe({
            name: data.structured.name,
            ingredients: data.structured.ingredients,
            instructions: data.structured.instructions,
          })
        } else if (text) {
          const parsed = parseFormattedRecipe(text)
          setParsedRecipe(
            parsed ?? {
              name: ingredients[0]
                ? `${ingredients[0].charAt(0).toUpperCase()}${ingredients[0].slice(1)} recipe`
                : 'Chef-AI Recipe',
              ingredients,
              instructions: text,
            }
          )
        }
      }
    } catch {
      setError('Could not reach server. Please try again.')
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
        setSaveError(data.error ?? 'Save failed.')
        toast(data.error ?? 'Could not save recipe.', 'error')
        return null
      }
      setSavedRecipeId(data.recipe.id)
      if (data.recipe.image_url) setImageUrl(data.recipe.image_url)
      router.refresh()
      return data.recipe.id
    } catch {
      setSaveError('Could not reach server.')
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
      title: parsedRecipe?.name ?? 'Chef-AI Recipe',
      text: 'Check out this recipe I made with Chef-AI!',
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
      toast('Link copied to clipboard', 'success')
    } catch {
      // Keep this inline and persistent — the user needs to copy the URL manually
      setSaveError(`Could not copy to clipboard — link: ${url}`)
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
        setModifyError(data.error ?? 'Could not modify recipe.')
      }
    } catch {
      setModifyError('Could not reach server.')
    } finally {
      setModifying(false)
    }
  }

  function resetRecipe() {
    setRecipe(null)
    setStructured(null)
    setMacros(null)
    setInput('')
    setImageUrl(null)
    setSavedRecipeId(null)
    setSaveError(null)
    setParsedRecipe(null)
    setModifyInput('')
    setModifyError(null)
    setLimitReached(false)
  }

  return (
    <div className="mt-8">
      <h2 className="mb-4 text-lg font-semibold text-[var(--text-primary)]">Generate Recipe</h2>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Separate ingredients with commas: chicken, onion, garlic…"
          disabled={loading}
          className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-muted)] focus:border-amber-400 focus:ring-2 focus:ring-amber-100 dark:focus:ring-amber-900/30 disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={loading || input.trim() === ''}
          className="w-full sm:self-start sm:w-auto rounded-xl px-6 py-3 sm:py-2.5 text-sm font-semibold text-white transition hover:opacity-85 active:scale-[0.98] disabled:opacity-50"
          style={{ backgroundColor: '#ffa51f' }}
        >
          {loading ? 'Generating recipe…' : 'Generate Recipe →'}
        </button>
      </form>

      <AnimatePresence>
        {limitReached && (
          <motion.div
            key="limit"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="mt-4 rounded-2xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 p-5"
          >
            <p className="mb-3 text-sm font-semibold text-amber-800 dark:text-amber-300">
              You&apos;ve used all 10 free recipes this month 🎉
            </p>
            <p className="mb-4 text-xs text-amber-700 dark:text-amber-400">
              Upgrade to Premium for unlimited recipes, meal plans, and more.
            </p>
            <a
              href="/premium"
              className="inline-block rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
              style={{ backgroundColor: '#ffa51f' }}
            >
              Go Premium →
            </a>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {loading && <RecipeSkeleton key="skeleton" />}

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
            className="mt-6"
          >
            {structured ? (
              <RecipeCard recipe={structured} macros={macros} imageUrl={imageUrl} />
            ) : (
              /* Fallback: AI returned unstructured text */
              <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] shadow-sm">
                {imageUrl ? (
                  <div className="relative h-48 w-full">
                    <Image
                      src={imageUrl}
                      alt={parsedRecipe?.name ?? 'Recipe image'}
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
                    <span className="text-sm font-semibold text-[var(--text-secondary)]">Your recipe is ready</span>
                  </div>

                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--text-secondary)]">
                    {recipe}
                  </p>

                  {macros && (
                    <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 border-t border-[var(--border-subtle)] pt-4 text-xs text-[var(--text-muted)]">
                      <span>🔥 <span className="font-semibold text-[var(--text-primary)]">{macros.calories} kcal</span></span>
                      <span>💪 <span className="font-semibold text-[var(--text-primary)]">{macros.protein_g}g</span> protein</span>
                      <span>🍚 <span className="font-semibold text-[var(--text-primary)]">{macros.carbs_g}g</span> carbs</span>
                      <span>🧈 <span className="font-semibold text-[var(--text-primary)]">{macros.fat_g}g</span> fat</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Actions — below the card */}
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
                style={{ backgroundColor: '#ffa51f' }}
              >
                {saving
                  ? 'Saving…'
                  : savedRecipeId
                  ? '🔗 Share Again'
                  : '🔗 Save & Share'}
              </button>

              <button
                type="button"
                onClick={resetRecipe}
                className="text-xs text-[var(--text-muted)] underline hover:text-[var(--text-secondary)]"
              >
                Generate new recipe
              </button>
            </div>

            {saveError && (
              <p className="mt-2 text-xs text-red-500">{saveError}</p>
            )}
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
            <h3 className="mb-1 text-sm font-semibold text-[var(--text-primary)]">✨ Modify This Recipe</h3>
            <p className="mb-3 text-xs text-[var(--text-muted)]">
              Lower calorie, vegetarian, different serving size… describe what you&apos;d like.
            </p>
            <form onSubmit={handleModify} className="flex flex-col gap-2">
              <input
                type="text"
                value={modifyInput}
                onChange={(e) => setModifyInput(e.target.value)}
                placeholder="e.g. make it lower fat, serve 4 people, vegetarian version…"
                disabled={modifying || saving}
                className="rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 py-2.5 text-sm text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-muted)] focus:border-amber-400 focus:ring-2 focus:ring-amber-100 dark:focus:ring-amber-900/30 disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={modifying || saving || modifyInput.trim() === ''}
                className="self-start rounded-xl px-5 py-2 text-sm font-semibold text-white transition hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
                style={{ backgroundColor: '#ffa51f' }}
              >
                {modifying ? 'Updating recipe...' : 'Apply →'}
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
