import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PhotoAnalyzer } from '@/components/dashboard/photo-analyzer'
import { RecipeGenerator } from '@/components/dashboard/recipe-generator'
import { StatCard } from '@/components/dashboard/stat-card'
import type { Profile } from '@/types/profile'
import type { MealPlanDay } from '@/types/meal-plan'
import type { DailyTotals } from '@/types/meals-eaten'

type RecentRecipe = { id: string; name: string; created_at: string }

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    timeZone: 'America/New_York',
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
  })
}

const DIET_LABELS: Record<string, string> = {
  omnivore: 'Balanced',
  vegan: 'Vegan',
  vegetarian: 'Vegetarian',
  keto: 'Keto',
  gluten_free: 'Gluten-Free',
  dairy_free: 'Dairy-Free',
  paleo: 'Paleo',
}

function dietLabel(dt: string): string {
  return DIET_LABELS[dt] ?? dt
}

function getWeekStartDate(): string {
  const now = new Date()
  const day = now.getDay()
  const diff = day === 0 ? -6 : 1 - day
  const monday = new Date(now)
  monday.setDate(now.getDate() + diff)
  return monday.toISOString().split('T')[0]
}

function getTodayDayKey(): string {
  return new Date()
    .toLocaleDateString('en-US', { timeZone: 'America/New_York', weekday: 'long' })
    .toLowerCase()
}

// UTC instant of today's midnight in ET — matches /api/meals-eaten
function getTodayStart(): string {
  const now = new Date()
  const wallClock = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }))
  const msSinceMidnight =
    wallClock.getHours() * 3600_000 +
    wallClock.getMinutes() * 60_000 +
    wallClock.getSeconds() * 1000
  return new Date(now.getTime() - msSinceMidnight).toISOString()
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Layout also guards, but pages render in parallel with layouts —
  // without this, an unauthenticated request throws on user.id below
  if (!user) redirect('/login')

  const [
    { data: pantryItems },
    { data: profileData },
    savedCountResult,
    { data: recentData },
    { data: mealPlanData },
  ] = await Promise.all([
    supabase.from('pantry').select('expiry_date').eq('user_id', user.id),
    supabase
      .from('profiles')
      .select('daily_calorie_goal, protein_goal_g, carbs_goal_g, fat_goal_g, water_goal_l, daily_steps_goal, current_weight_kg, target_weight_kg, diet_type, is_premium, recipe_count_this_month')
      .eq('id', user.id)
      .single(),
    supabase.from('recipes').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
    supabase
      .from('recipes')
      .select('id, name, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('meal_plans')
      .select('meals')
      .eq('user_id', user.id)
      .eq('week_start_date', getWeekStartDate())
      .single(),
  ])

  const savedCount = (savedCountResult.count as number | null) ?? 0
  const recentRecipes = (recentData ?? []) as RecentRecipe[]

  type MealEatenRow = { calories: number | null; protein_g: number | null; carbs_g: number | null; fat_g: number | null }
  let todayMeals: MealEatenRow[] = []
  const { data: todayMealsRaw } = await supabase
    .from('meals_eaten')
    .select('calories, protein_g, carbs_g, fat_g')
    .eq('user_id', user.id)
    .gte('eaten_at', getTodayStart())
  todayMeals = (todayMealsRaw ?? []) as MealEatenRow[]

  const todayTotals = todayMeals.reduce<DailyTotals>(
    (acc, m) => ({
      calories: acc.calories + (m.calories ?? 0),
      protein_g: acc.protein_g + (m.protein_g ?? 0),
      carbs_g: acc.carbs_g + (m.carbs_g ?? 0),
      fat_g: acc.fat_g + (m.fat_g ?? 0),
    }),
    { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 }
  )

  const todayMeal = mealPlanData
    ? ((mealPlanData.meals as MealPlanDay[]).find((d) => d.day === getTodayDayKey()) ?? null)
    : null

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const sevenDaysLater = new Date(today)
  sevenDaysLater.setDate(today.getDate() + 7)

  const pantryCount = pantryItems?.length ?? 0
  const wasteAlertCount = pantryItems?.filter((item) => {
    const expiry = new Date(item.expiry_date)
    return expiry >= today && expiry <= sevenDaysLater
  }).length ?? 0
  const expiredCount = pantryItems?.filter((item) => {
    const expiry = new Date(item.expiry_date)
    return expiry < today
  }).length ?? 0

  const stats = [
    { label: 'Pantry items', value: pantryCount, icon: '🥦' },
    { label: 'Saved recipes', value: savedCount, icon: '📋' },
    { label: 'Expiring soon', value: wasteAlertCount, icon: '⚠️' },
  ]

  const profile = profileData as Profile | null

  type GoalItem = { icon: string; label: string; value: string }
  const goalItems: GoalItem[] = profile
    ? ([
        profile.daily_calorie_goal !== null
          ? { icon: '🔥', label: 'Calories', value: `${profile.daily_calorie_goal} kcal` }
          : null,
        profile.protein_goal_g !== null
          ? { icon: '💪', label: 'Protein', value: `${profile.protein_goal_g} g` }
          : null,
        profile.carbs_goal_g !== null
          ? { icon: '🍚', label: 'Carbs', value: `${profile.carbs_goal_g} g` }
          : null,
        profile.fat_goal_g !== null
          ? { icon: '🧈', label: 'Fat', value: `${profile.fat_goal_g} g` }
          : null,
        profile.water_goal_l !== null
          ? { icon: '🌊', label: 'Water', value: `${profile.water_goal_l} L` }
          : null,
        profile.daily_steps_goal !== null
          ? { icon: '👟', label: 'Steps', value: `${profile.daily_steps_goal.toLocaleString('en-US')} steps` }
          : null,
        profile.current_weight_kg !== null
          ? { icon: '⚖️', label: 'Current Weight', value: `${profile.current_weight_kg} kg` }
          : null,
        profile.target_weight_kg !== null
          ? { icon: '🎯', label: 'Target Weight', value: `${profile.target_weight_kg} kg` }
          : null,
        profile.diet_type !== null
          ? { icon: '🥗', label: 'Diet', value: dietLabel(profile.diet_type!) }
          : null,
      ] as (GoalItem | null)[]).filter((g): g is GoalItem => g !== null)
    : []

  return (
    <div>
      <h1 className="mb-8 text-2xl font-bold text-[var(--text-primary)]">
        Hello, {user?.email} 👋
      </h1>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.label} icon={stat.icon} value={stat.value} label={stat.label} />
        ))}

        {expiredCount > 0 && (
          <Link href="/pantry" className="block">
            <div className="rounded-2xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 p-6 shadow-sm transition hover:bg-red-100 dark:hover:bg-red-950/50">
              <div className="mb-3 text-3xl">🗑️</div>
              <div className="text-3xl font-bold text-red-600 dark:text-red-400">{expiredCount} items</div>
              <div className="mt-1 text-sm text-red-400 dark:text-red-500">Expired</div>
            </div>
          </Link>
        )}
      </div>

      {/* My Goals */}
      <div className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">🎯 My Goals</h2>
          <Link href="/profile" className="text-xs text-amber-500 hover:underline">
            Edit →
          </Link>
        </div>

        {goalItems.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-[var(--border)] bg-[var(--bg-card)] p-6 text-center">
            <p className="text-sm text-[var(--text-muted)]">
              No goals set yet.{' '}
              <Link href="/profile" className="text-amber-500 hover:underline">
                Set your goals →
              </Link>
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {goalItems.map((g) => (
              <div
                key={g.label}
                className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4 shadow-sm"
              >
                <div className="mb-1 text-xl">{g.icon}</div>
                <div className="text-sm font-semibold text-[var(--text-primary)]">{g.value}</div>
                <div className="mt-0.5 text-xs text-[var(--text-muted)]">{g.label}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recipe Usage (freemium) */}
      {profile && (
        <div className="mt-6">
          {profile.is_premium ? (
            <div className="flex items-center gap-2 rounded-2xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 px-5 py-3">
              <span className="text-lg">✨</span>
              <span className="text-sm font-semibold text-amber-700 dark:text-amber-400">Premium member</span>
              <span className="ml-1 text-xs text-amber-600 dark:text-amber-500">— Unlimited recipes</span>
            </div>
          ) : (
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] px-5 py-4 shadow-sm">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm text-[var(--text-secondary)]">
                  This month: <span className="font-semibold text-[var(--text-primary)]">{profile.recipe_count_this_month ?? 0}/10</span> recipes used
                </span>
                <Link href="/premium" className="text-xs font-medium text-amber-500 hover:underline">
                  Go Premium →
                </Link>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--border)]">
                <div
                  className="h-2 rounded-full transition-all"
                  style={{
                    width: `${Math.min(100, ((profile.recipe_count_this_month ?? 0) / 10) * 100)}%`,
                    backgroundColor: (profile.recipe_count_this_month ?? 0) >= 10 ? '#ef4444' : '#ffa51f',
                  }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Recent Recipes */}
      {recentRecipes.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-4 text-lg font-semibold text-[var(--text-primary)]">📋 Recent Recipes</h2>
          <div className="divide-y divide-[var(--border-subtle)] rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] shadow-sm">
            {recentRecipes.map((r) => (
              <div key={r.id} className="flex items-center justify-between px-5 py-3.5">
                <div className="min-w-0 flex-1 pr-4">
                  <p className="truncate text-sm font-medium text-[var(--text-primary)]">{r.name}</p>
                  <p className="text-xs text-[var(--text-muted)]">{formatDate(r.created_at)}</p>
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
        </div>
      )}

      {/* Today's Intake — only show when there are records */}
      {todayMeals.length > 0 && (
        <div className="mt-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">📊 Today&apos;s Intake</h2>
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5 shadow-sm">
            <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
              <span>🔥 <span className="font-semibold text-[var(--text-primary)]">{todayTotals.calories} kcal</span></span>
              <span>💪 <span className="font-semibold text-[var(--text-primary)]">{todayTotals.protein_g}g</span> <span className="text-[var(--text-muted)]">protein</span></span>
              <span>🍚 <span className="font-semibold text-[var(--text-primary)]">{todayTotals.carbs_g}g</span> <span className="text-[var(--text-muted)]">carbs</span></span>
              <span>🧈 <span className="font-semibold text-[var(--text-primary)]">{todayTotals.fat_g}g</span> <span className="text-[var(--text-muted)]">fat</span></span>
            </div>
            {profile?.daily_calorie_goal != null && (
              <p className="mt-3 text-xs text-[var(--text-muted)]">
                Goal:{' '}
                <span className="font-medium text-[var(--text-secondary)]">{profile.daily_calorie_goal} kcal</span>
                {' — '}Today:{' '}
                <span className="font-medium text-[var(--text-secondary)]">{todayTotals.calories} kcal</span>
                {todayTotals.calories < profile.daily_calorie_goal && (
                  <span className="ml-1 text-amber-600 dark:text-amber-400">
                    ({profile.daily_calorie_goal - todayTotals.calories} remaining)
                  </span>
                )}
                {todayTotals.calories >= profile.daily_calorie_goal && (
                  <span className="ml-1 text-green-600 dark:text-green-400">(Goal reached! ✓)</span>
                )}
              </p>
            )}
          </div>
        </div>
      )}

      {/* This Week's Plan */}
      <div className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">🗓️ This Week&apos;s Plan</h2>
          <Link href="/meal-plan" className="text-xs text-amber-500 hover:underline">
            View Full Plan →
          </Link>
        </div>

        {todayMeal ? (
          <div className="divide-y divide-[var(--border-subtle)] rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] shadow-sm">
            <div className="flex items-center gap-3 px-5 py-3.5">
              <span className="text-lg">🌅</span>
              <span className="w-20 flex-shrink-0 text-xs font-medium text-[var(--text-muted)]">Breakfast</span>
              <span className="text-sm font-medium text-[var(--text-primary)]">{todayMeal.breakfast.name}</span>
            </div>
            <div className="flex items-center gap-3 px-5 py-3.5">
              <span className="text-lg">🌙</span>
              <span className="w-20 flex-shrink-0 text-xs font-medium text-[var(--text-muted)]">Dinner</span>
              <span className="text-sm font-medium text-[var(--text-primary)]">{todayMeal.dinner.name}</span>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border-2 border-dashed border-[var(--border)] bg-[var(--bg-card)] p-6 text-center">
            <p className="text-sm text-[var(--text-muted)]">
              No weekly plan created.{' '}
              <Link href="/meal-plan" className="text-amber-500 hover:underline">
                Create your meal plan →
              </Link>
            </p>
          </div>
        )}
      </div>

      <PhotoAnalyzer />
      <RecipeGenerator />
    </div>
  )
}
