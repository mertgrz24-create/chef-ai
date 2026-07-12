'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { RecipeCard } from '@/components/recipe-card'
import { RecipeSkeleton } from '@/components/recipe-skeleton'
import type { StructuredRecipe, RecipeMacros } from '@/types/recipe'

type Step = 'idle' | 'previewing' | 'analyzing' | 'ingredients' | 'generating' | 'recipe'

// Mirror the server-side guards in /api/vision so oversized/unsupported files are
// rejected client-side before we build a preview or hit the network.
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_SIZE_BYTES = 10 * 1024 * 1024 // 10 MB

export function PhotoAnalyzer() {
  const [step, setStep] = useState<Step>('idle')
  const [preview, setPreview] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [ingredients, setIngredients] = useState<string[]>([])
  const [recipe, setRecipe] = useState<string | null>(null)
  const [structured, setStructured] = useState<StructuredRecipe | null>(null)
  const [macros, setMacros] = useState<RecipeMacros | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [inputKey, setInputKey] = useState(0)

  const busy = step === 'analyzing' || step === 'generating'

  // Holds the current preview object URL so it can be revoked before being replaced.
  const previewUrlRef = useRef<string | null>(null)

  function updatePreview(url: string | null) {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
    previewUrlRef.current = url
    setPreview(url)
  }

  // Revoke any outstanding object URL when the component unmounts (no leaked blobs).
  useEffect(() => () => {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
  }, [])

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0]
    if (!selected) return

    // Client-side validation (defense-in-depth): the `accept` attribute is only a
    // hint and is trivially bypassable, so re-check type and size here before we read
    // the file into memory. Reject early to avoid a large upload / tab memory blow-up.
    if (!ALLOWED_TYPES.includes(selected.type)) {
      setError('Only JPEG, PNG, or WebP files are accepted.')
      setInputKey((k) => k + 1) // remount input so the same file can be re-picked
      return
    }
    if (selected.size > MAX_SIZE_BYTES) {
      setError('File size exceeds the 10 MB limit.')
      setInputKey((k) => k + 1)
      return
    }

    setFile(selected)
    setIngredients([])
    setRecipe(null)
    setStructured(null)
    setMacros(null)
    setError(null)

    // Preview via an object URL (blob:) rather than a base64 data URL: the browser
    // keeps the file by reference, so it isn't copied into memory, and the value fed
    // to <img src> is a browser-managed URL, not a raw string. File was already
    // type/size-validated above.
    updatePreview(URL.createObjectURL(selected))
    setStep('previewing')
  }

  async function handleAnalyze() {
    if (!file) return

    setStep('analyzing')
    setError(null)

    try {
      const formData = new FormData()
      formData.append('image', file)

      const res = await fetch('/api/vision', { method: 'POST', body: formData })
      const data = await res.json() as { ingredients?: string[]; error?: string }

      if (!res.ok) {
        setError(data.error ?? 'Analysis failed.')
        setStep('previewing')
        return
      }

      setIngredients(data.ingredients ?? [])
      setStep('ingredients')
    } catch {
      setError('Could not reach server.')
      setStep('previewing')
    }
  }

  async function handleGenerateRecipe() {
    if (ingredients.length === 0) return

    setStep('generating')
    setError(null)

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
      }

      if (!res.ok) {
        setError(data.error ?? 'Could not generate recipe.')
        setStep('ingredients')
        return
      }

      setRecipe(data.recipe ?? null)
      setStructured(data.structured ?? null)
      setMacros(data.macros ?? null)
      setStep('recipe')
    } catch {
      setError('Could not reach server.')
      setStep('ingredients')
    }
  }

  function reset() {
    setStep('idle')
    setFile(null)
    updatePreview(null)
    setIngredients([])
    setRecipe(null)
    setStructured(null)
    setMacros(null)
    setError(null)
    setInputKey((k) => k + 1) // remount input to clear its value
  }

  return (
    <div className="mt-8">
      <h2 className="mb-4 text-lg font-semibold text-gray-800">Analyze Photo</h2>

      {/* Hidden file input — label triggers it natively on all browsers/mobile */}
      <input
        key={inputKey}
        id="photo-input"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileChange}
        className="sr-only"
      />

      {/* Upload / Preview area — label click opens file picker without JS */}
      <label
        htmlFor="photo-input"
        className={[
          'block rounded-2xl border-2 border-dashed border-gray-200 bg-white p-4 md:p-8 text-center transition',
          busy ? 'cursor-default opacity-60' : 'cursor-pointer hover:border-amber-300 hover:bg-amber-50/20',
        ].join(' ')}
      >
        {preview ? (
          <img src={preview} alt="Uploaded photo" className="mx-auto max-h-52 rounded-xl object-contain" />
        ) : (
          <div className="flex flex-col items-center gap-3 py-2">
            <span className="text-5xl">📷</span>
            <p className="text-sm font-medium text-gray-500">
              Choose a photo or take one with your camera
            </p>
            <p className="text-xs text-gray-400">JPEG · PNG · WebP · Max 10 MB</p>
          </div>
        )}
      </label>

      {/* Analyze button */}
      {step === 'previewing' && (
        <div className="mt-3 flex flex-col sm:flex-row gap-2">
          <button
            type="button"
            onClick={handleAnalyze}
            className="w-full sm:w-auto rounded-xl px-6 py-3 sm:py-2.5 text-sm font-semibold text-white transition hover:opacity-85 active:scale-[0.98]"
            style={{ backgroundColor: '#ffa51f' }}
          >
            Identify Ingredients →
          </button>
          <button
            type="button"
            onClick={reset}
            className="w-full sm:w-auto rounded-xl px-4 py-3 sm:py-2.5 text-sm text-gray-400 transition hover:text-gray-600"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Analyzing state */}
      {step === 'analyzing' && (
        <p className="mt-3 text-sm text-amber-500 font-medium animate-pulse">
          Analyzing photo…
        </p>
      )}

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.p
            key="error"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="mt-3 text-sm text-red-500"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      {/* Ingredients result */}
      <AnimatePresence>
        {(step === 'ingredients' || step === 'generating' || step === 'recipe') && (
          <motion.div
            key="ingredients"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="mt-6 rounded-2xl border border-gray-100 bg-white p-4 md:p-6 shadow-sm"
          >
            <div className="mb-3 flex items-center gap-2">
              <span className="text-xl">🥦</span>
              <span className="text-sm font-semibold text-gray-700">
                {ingredients.length > 0
                  ? `${ingredients.length} ingredient${ingredients.length !== 1 ? 's' : ''} detected`
                  : 'No ingredients detected'}
              </span>
            </div>

            {ingredients.length > 0 ? (
              <>
                <div className="mb-5 flex flex-wrap gap-2">
                  {ingredients.map((ing) => (
                    <span
                      key={ing}
                      className="rounded-full px-3 py-1 text-sm"
                      style={{ backgroundColor: '#ffa51f18', color: '#b36a00' }}
                    >
                      {ing}
                    </span>
                  ))}
                </div>

                {step === 'ingredients' && (
                  <button
                    type="button"
                    onClick={handleGenerateRecipe}
                    className="w-full sm:w-auto rounded-xl px-6 py-3 sm:py-2.5 text-sm font-semibold text-white transition hover:opacity-85 active:scale-[0.98]"
                    style={{ backgroundColor: '#ffa51f' }}
                  >
                    Generate recipe with these ingredients →
                  </button>
                )}

              </>
            ) : (
              <div>
                <p className="mb-3 text-sm text-gray-400">
                  No food detected in the photo. Try a different image.
                </p>
                <button
                  type="button"
                  onClick={reset}
                  className="text-xs text-gray-400 underline hover:text-gray-600"
                >
                  Upload new photo
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Recipe skeleton while generating */}
      <AnimatePresence>
        {step === 'generating' && <RecipeSkeleton key="skeleton" />}
      </AnimatePresence>

      {/* Recipe result */}
      <AnimatePresence>
        {step === 'recipe' && recipe && (
          <motion.div
            key="recipe"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="mt-4"
          >
            {structured ? (
              <RecipeCard recipe={structured} macros={macros} />
            ) : (
              /* Fallback: AI returned unstructured text */
              <div className="rounded-2xl border border-gray-100 bg-white p-4 md:p-6 shadow-sm">
                <div className="mb-3 flex items-center gap-2">
                  <span className="text-xl">🍽️</span>
                  <span className="text-sm font-semibold text-gray-700">Your recipe is ready</span>
                </div>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
                  {recipe}
                </p>
              </div>
            )}
            <button
              type="button"
              onClick={reset}
              className="mt-4 text-xs text-gray-400 underline hover:text-gray-600"
            >
              Analyze new photo
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
