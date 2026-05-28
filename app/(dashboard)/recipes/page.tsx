import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Recipe } from '@/types/recipe'

type RecipeSummary = Pick<Recipe, 'id' | 'name' | 'macros' | 'created_at'>

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    timeZone: 'America/New_York',
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
  })
}

export default async function RecipesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data } = await supabase
    .from('recipes')
    .select('id, name, macros, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20)

  const recipes = (data ?? []) as RecipeSummary[]

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold text-[var(--text-primary)]">My Recipes</h1>
      <p className="mb-8 text-sm text-[var(--text-muted)]">Your saved recipes.</p>

      {recipes.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[var(--border)] bg-[var(--bg-card)] py-20 text-center">
          <span className="mb-4 text-5xl">📋</span>
          <h2 className="mb-2 text-base font-semibold text-[var(--text-secondary)]">No saved recipes yet</h2>
          <p className="max-w-xs text-sm text-[var(--text-muted)]">
            Generate a recipe from the dashboard and click &quot;Save &amp; Share&quot;.
          </p>
          <Link
            href="/dashboard"
            className="mt-6 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 active:scale-[0.98]"
            style={{ backgroundColor: '#ffa51f' }}
          >
            Generate Recipe →
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {recipes.map((r) => (
            <div
              key={r.id}
              className="flex items-center gap-4 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] px-4 py-3 shadow-sm"
            >
              {/* Info */}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-[var(--text-primary)]">{r.name}</p>
                <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-[var(--text-muted)]">
                  <span>{formatDate(r.created_at)}</span>
                  {r.macros && (
                    <>
                      <span>🔥 {r.macros.calories} kcal</span>
                      <span>💪 {r.macros.protein_g}g protein</span>
                    </>
                  )}
                </div>
              </div>

              <Link
                href={`/recipe/${r.id}`}
                className="flex-shrink-0 text-xs font-medium text-amber-500 transition hover:underline"
              >
                🔗 Share
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
