'use client'

import { useState } from 'react'
import Image from 'next/image'
import type { StructuredRecipe, RecipeMacros } from '@/types/recipe'

interface RecipeCardProps {
  recipe: StructuredRecipe
  macros?: RecipeMacros | null
  imageUrl?: string | null
}

// Split the instructions string into steps, stripping "1." / "1)" prefixes
function parseSteps(instructions: string): string[] {
  const lines = instructions.split('\n').map((l) => l.trim()).filter(Boolean)
  const numbered = lines.filter((l) => /^\d+[.)]\s/.test(l))
  if (numbered.length >= 2) {
    return numbered.map((l) => l.replace(/^\d+[.)]\s*/, '').trim()).filter(Boolean)
  }
  return lines.length > 0 ? lines : [instructions.trim()]
}

function Badge({ icon, children }: { icon: string; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-[var(--accent-border)] bg-[var(--accent-light)] px-2.5 py-1 text-xs font-medium text-[var(--text-secondary)]">
      <span aria-hidden>{icon}</span>
      {children}
    </span>
  )
}

export function RecipeCard({ recipe, macros, imageUrl }: RecipeCardProps) {
  const steps = parseSteps(recipe.instructions)
  const [checked, setChecked] = useState<boolean[]>(() => recipe.ingredients.map(() => false))

  function toggle(index: number) {
    setChecked((prev) => prev.map((c, i) => (i === index ? !c : c)))
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] shadow-sm">
      {imageUrl && (
        <div className="relative h-48 w-full">
          <Image
            src={imageUrl}
            alt={recipe.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 600px"
          />
        </div>
      )}

      <div className="p-6">
        {/* Header */}
        <h3 className="text-xl font-bold text-[var(--text-primary)]">🍽️ {recipe.name}</h3>

        {(recipe.prep_time_min !== undefined ||
          recipe.cook_time_min !== undefined ||
          recipe.servings !== undefined) && (
          <div className="mt-3 flex flex-wrap gap-2">
            {recipe.prep_time_min !== undefined && (
              <Badge icon="🔪">Prep {recipe.prep_time_min} min</Badge>
            )}
            {recipe.cook_time_min !== undefined && (
              <Badge icon="⏱">Cook {recipe.cook_time_min} min</Badge>
            )}
            {recipe.servings !== undefined && (
              <Badge icon="🍴">Serves {recipe.servings}</Badge>
            )}
          </div>
        )}

        {/* Ingredients checklist */}
        <div className="mt-6">
          <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--text-muted)]">
            📝 Ingredients
          </h4>
          <ul className="space-y-1">
            {recipe.ingredients.map((ing, i) => (
              <li key={i}>
                <label className="flex cursor-pointer items-start gap-2.5 rounded-lg px-2 py-1.5 text-sm transition hover:bg-[var(--accent-light)]">
                  <input
                    type="checkbox"
                    checked={checked[i] ?? false}
                    onChange={() => toggle(i)}
                    className="mt-0.5 h-4 w-4 shrink-0 rounded border-[var(--border)] accent-[#ffa51f]"
                  />
                  <span
                    className={
                      checked[i]
                        ? 'text-[var(--text-muted)] line-through'
                        : 'text-[var(--text-secondary)]'
                    }
                  >
                    {ing}
                  </span>
                </label>
              </li>
            ))}
          </ul>
        </div>

        {/* Numbered steps */}
        <div className="mt-6">
          <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--text-muted)]">
            👨‍🍳 Instructions
          </h4>
          <ol className="space-y-3">
            {steps.map((step, i) => (
              <li key={i} className="flex gap-3">
                <span
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                  style={{ backgroundColor: '#ffa51f' }}
                >
                  {i + 1}
                </span>
                <p className="pt-0.5 text-sm leading-relaxed text-[var(--text-secondary)]">{step}</p>
              </li>
            ))}
          </ol>
        </div>

        {/* Chef's note */}
        {recipe.chefs_note && (
          <div className="mt-6 rounded-xl border border-[var(--accent-border)] bg-[var(--accent-light)] px-4 py-3">
            <p className="text-sm text-[var(--text-secondary)]">
              <span className="font-semibold text-[var(--text-primary)]">💡 Chef&apos;s Note:</span>{' '}
              {recipe.chefs_note}
            </p>
          </div>
        )}

        {/* Macros */}
        {macros && (
          <div className="mt-6 flex flex-wrap gap-x-4 gap-y-1 border-t border-[var(--border-subtle)] pt-4 text-xs text-[var(--text-muted)]">
            <span>🔥 <span className="font-semibold text-[var(--text-primary)]">{macros.calories} kcal</span></span>
            <span>💪 <span className="font-semibold text-[var(--text-primary)]">{macros.protein_g}g</span> protein</span>
            <span>🍚 <span className="font-semibold text-[var(--text-primary)]">{macros.carbs_g}g</span> carbs</span>
            <span>🧈 <span className="font-semibold text-[var(--text-primary)]">{macros.fat_g}g</span> fat</span>
            {macros.fiber_g !== undefined && (
              <span>🌾 <span className="font-semibold text-[var(--text-primary)]">{macros.fiber_g}g</span> fiber</span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
