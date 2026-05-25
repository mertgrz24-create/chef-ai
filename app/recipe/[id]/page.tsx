import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { CookingModeButton } from '@/components/cooking-mode-button'
import { RecipeModifier } from '@/components/recipe-modifier'
import { EatButton } from '@/components/eat-button'
import type { Recipe } from '@/types/recipe'

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('tr-TR', {
    timeZone: 'Europe/Istanbul',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export default async function PublicRecipePage({ params }: { params: { id: string } }) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('recipes')
    .select('*')
    .eq('id', params.id)
    .single()

  if (error || !data) notFound()

  const recipe = data as Recipe
  if (!recipe.is_public) notFound()

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      {/* Header */}
      <header className="border-b border-[var(--border)] bg-[var(--bg-card)] px-4 py-4">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <Link href="/" className="text-xl font-bold" style={{ color: '#ffa51f' }}>
            ChefAI
          </Link>
          <Link href="/dashboard" className="text-sm text-[var(--text-muted)] transition hover:text-[var(--text-secondary)]">
            ← Dashboard
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-2xl px-4 py-8">
        <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] shadow-sm">
          {/* Hero image */}
          {recipe.image_url ? (
            <div className="relative h-56 w-full">
              <Image
                src={recipe.image_url}
                alt={recipe.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 672px"
                priority
              />
            </div>
          ) : (
            <div className="flex h-40 items-center justify-center bg-gradient-to-br from-amber-100 to-orange-200 dark:from-amber-900/30 dark:to-orange-900/20">
              <span className="text-5xl">🍽️</span>
            </div>
          )}

          <div className="p-6">
            <h1 className="mb-1 text-2xl font-bold text-[var(--text-primary)]">{recipe.name}</h1>
            <p className="mb-6 text-xs text-[var(--text-muted)]">{formatDate(recipe.created_at)}</p>

            {/* Ingredients */}
            <div className="mb-6">
              <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-[var(--text-primary)]">
                <span>📝</span> Malzemeler
              </h2>
              <ul className="space-y-1.5">
                {recipe.ingredients.map((ing, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-[var(--text-secondary)]">
                    <span
                      className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full"
                      style={{ backgroundColor: '#ffa51f' }}
                    />
                    {ing}
                  </li>
                ))}
              </ul>
            </div>

            {/* Instructions */}
            <div className="mb-6">
              <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-[var(--text-primary)]">
                <span>👨‍🍳</span> Hazırlık
              </h2>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--text-secondary)]">
                {recipe.instructions}
              </p>
            </div>

            {/* Macros */}
            {recipe.macros && (
              <div className="mb-6 flex flex-wrap gap-x-4 gap-y-1 rounded-xl border border-[var(--accent-border)] bg-[var(--accent-light)] px-4 py-3 text-xs text-[var(--text-secondary)]">
                <span>🔥 <span className="font-semibold text-[var(--text-primary)]">{recipe.macros.calories} kcal</span></span>
                <span>💪 <span className="font-semibold text-[var(--text-primary)]">{recipe.macros.protein_g}g</span> protein</span>
                <span>🍚 <span className="font-semibold text-[var(--text-primary)]">{recipe.macros.carbs_g}g</span> karb</span>
                <span>🧈 <span className="font-semibold text-[var(--text-primary)]">{recipe.macros.fat_g}g</span> yağ</span>
              </div>
            )}

            {/* Action buttons */}
            <div className="mb-4 flex flex-wrap gap-2">
              <CookingModeButton
                recipeName={recipe.name}
                instructions={recipe.instructions}
              />
              <EatButton
                recipeName={recipe.name}
                macros={recipe.macros}
                source="recipe"
              />
            </div>

            {/* CTA */}
            <Link
              href="/dashboard"
              className="block w-full rounded-xl py-3 text-center text-sm font-semibold text-white transition hover:opacity-90 active:scale-[0.98]"
              style={{ backgroundColor: '#ffa51f' }}
            >
              Sen de dene →
            </Link>
          </div>
        </div>

        {/* Recipe modifier */}
        <RecipeModifier recipeId={recipe.id} />

        <p className="mt-6 text-center text-xs text-[var(--text-muted)]">
          Bu tarif{' '}
          <Link href="/" className="font-medium hover:underline" style={{ color: '#ffa51f' }}>
            ChefAI
          </Link>{' '}
          ile üretildi
        </p>
      </main>
    </div>
  )
}
