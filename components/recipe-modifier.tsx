'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Recipe } from '@/types/recipe'

interface RecipeModifierProps {
  recipeId: string
}

export function RecipeModifier({ recipeId }: RecipeModifierProps) {
  const router = useRouter()
  const [instruction, setInstruction] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!instruction.trim() || loading) return

    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/recipes/modify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipeId, instruction: instruction.trim() }),
      })

      const data = (await res.json()) as { recipe?: Recipe; error?: string }

      if (!res.ok) {
        if (res.status === 401) {
          setError('Bu özelliği kullanmak için giriş yapmanız gerekiyor.')
        } else {
          setError(data.error ?? 'Tarif güncellenemedi.')
        }
      } else if (data.recipe?.id) {
        router.push(`/recipe/${data.recipe.id}`)
      }
    } catch {
      setError('Sunucuya ulaşılamadı. Lütfen tekrar deneyin.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mt-8 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5 shadow-sm">
      <h2 className="mb-1 text-base font-semibold text-[var(--text-primary)]">✨ Bu Tarifi Değiştir</h2>
      <p className="mb-4 text-xs text-[var(--text-muted)]">
        Tarifi daha az kalorili, vejetaryen, farklı porsiyon veya başka bir şekle sokabiliriz.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          type="text"
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
          placeholder="Ne değiştirelim? ör: daha az yağlı yap, 4 kişilik yap, vejetaryen versiyonu..."
          disabled={loading}
          className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 py-3 text-sm text-[var(--text-primary)] outline-none transition placeholder:text-[var(--text-muted)] focus:border-amber-400 focus:ring-2 focus:ring-amber-100 dark:focus:ring-amber-900/30 disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={loading || instruction.trim() === ''}
          className="w-full rounded-xl py-3 text-sm font-semibold text-white transition hover:opacity-90 active:scale-[0.98] disabled:opacity-50 sm:w-auto sm:self-start sm:px-6 sm:py-2.5"
          style={{ backgroundColor: '#ffa51f' }}
        >
          {loading ? 'Tarif güncelleniyor...' : 'Uygula →'}
        </button>
      </form>

      {error && (
        <p className="mt-3 text-xs text-red-500">
          {error}{' '}
          {error.includes('giriş') && (
            <a href="/login" className="font-medium underline">
              Giriş yap
            </a>
          )}
        </p>
      )}
    </div>
  )
}
