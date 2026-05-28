'use client'

import { useState } from 'react'
import type { RecipeMacros } from '@/types/recipe'

interface EatButtonProps {
  recipeName: string
  macros?: RecipeMacros
  source?: string
}

export function EatButton({ recipeName, macros, source = 'manual' }: EatButtonProps) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')

  async function handleClick() {
    if (status !== 'idle') return
    setStatus('loading')

    try {
      const res = await fetch('/api/meals-eaten', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipe_name: recipeName,
          calories: macros?.calories,
          protein_g: macros?.protein_g,
          carbs_g: macros?.carbs_g,
          fat_g: macros?.fat_g,
          source,
        }),
      })

      if (res.ok) {
        setStatus('done')
      } else {
        setStatus('error')
        setTimeout(() => setStatus('idle'), 3000)
      }
    } catch {
      setStatus('error')
      setTimeout(() => setStatus('idle'), 3000)
    }
  }

  if (status === 'done') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-xl border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/40 px-4 py-2 text-xs font-semibold text-green-700 dark:text-green-400">
        ✓ Saved
      </span>
    )
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={status === 'loading'}
      className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border)] px-4 py-2 text-xs font-semibold text-[var(--text-secondary)] transition hover:border-green-300 hover:text-green-600 dark:hover:text-green-400 disabled:opacity-50"
    >
      {status === 'loading' ? (
        <>
          <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-gray-300 border-t-transparent" />
          Saving...
        </>
      ) : (
        <>✓ I Ate This</>
      )}
    </button>
  )
}
