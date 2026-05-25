import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { PhotoAnalyzer } from '@/components/dashboard/photo-analyzer'
import { RecipeGenerator } from '@/components/dashboard/recipe-generator'
import { StatCard } from '@/components/dashboard/stat-card'
import type { Profile } from '@/types/profile'
import type { MealPlanDay } from '@/types/meal-plan'
import type { DailyTotals } from '@/types/meals-eaten'

type RecentRecipe = { id: string; name: string; created_at: string }

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('tr-TR', {
    timeZone: 'Europe/Istanbul',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

const DIET_LABELS: Record<string, string> = {
  omnivore: 'Normal',
  vegan: 'Vegan',
  vegetarian: 'Vejetaryen',
  keto: 'Keto',
  gluten_free: 'Glutensiz',
  dairy_free: 'Sütsüz',
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
    .toLocaleDateString('en-US', { timeZone: 'Europe/Istanbul', weekday: 'long' })
    .toLowerCase()
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [
    { data: pantryItems },
    { data: profileData },
    savedCountResult,
    { data: recentData },
    { data: mealPlanData },
  ] = await Promise.all([
    supabase.from('pantry').select('expiry_date').eq('user_id', user!.id),
    supabase
      .from('profiles')
      .select('daily_calorie_goal, protein_goal_g, carbs_goal_g, fat_goal_g, water_goal_l, daily_steps_goal, current_weight_kg, target_weight_kg, diet_type')
      .eq('id', user!.id)
      .single(),
    supabase.from('recipes').select('*', { count: 'exact', head: true }).eq('user_id', user!.id),
    supabase
      .from('recipes')
      .select('id, name, created_at')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('meal_plans')
      .select('meals')
      .eq('user_id', user!.id)
      .eq('week_start_date', getWeekStartDate())
      .single(),
  ])

  const savedCount = (savedCountResult.count as number | null) ?? 0
  const recentRecipes = (recentData ?? []) as RecentRecipe[]

  // Fetch today's meals — table may not exist yet if migration hasn't been run
  type MealEatenRow = { calories: number | null; protein_g: number | null; carbs_g: number | null; fat_g: number | null }
  let todayMeals: MealEatenRow[] = []
  const { data: todayMealsRaw } = await supabase
    .from('meals_eaten')
    .select('calories, protein_g, carbs_g, fat_g')
    .eq('user_id', user!.id)
    .gte('eaten_at', new Date().toISOString().split('T')[0])
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
    { label: 'Kilerimde malzeme', value: pantryCount, icon: '🥦' },
    { label: 'Kayıtlı tarif', value: savedCount, icon: '📋' },
    { label: 'İsraf uyarısı', value: wasteAlertCount, icon: '⚠️' },
  ]

  const profile = profileData as Profile | null

  type GoalItem = { icon: string; label: string; value: string }
  const goalItems: GoalItem[] = profile
    ? ([
        profile.daily_calorie_goal !== null
          ? { icon: '🔥', label: 'Kalori', value: `${profile.daily_calorie_goal} kcal` }
          : null,
        profile.protein_goal_g !== null
          ? { icon: '💪', label: 'Protein', value: `${profile.protein_goal_g} g` }
          : null,
        profile.carbs_goal_g !== null
          ? { icon: '🍚', label: 'Karb', value: `${profile.carbs_goal_g} g` }
          : null,
        profile.fat_goal_g !== null
          ? { icon: '🧈', label: 'Yağ', value: `${profile.fat_goal_g} g` }
          : null,
        profile.water_goal_l !== null
          ? { icon: '🌊', label: 'Su', value: `${profile.water_goal_l} litre` }
          : null,
        profile.daily_steps_goal !== null
          ? { icon: '👟', label: 'Adım', value: `${profile.daily_steps_goal.toLocaleString('tr-TR')} adım` }
          : null,
        profile.current_weight_kg !== null
          ? { icon: '⚖️', label: 'Mevcut Kilo', value: `${profile.current_weight_kg} kg` }
          : null,
        profile.target_weight_kg !== null
          ? { icon: '🎯', label: 'Hedef Kilo', value: `${profile.target_weight_kg} kg` }
          : null,
        profile.diet_type !== null
          ? { icon: '🥗', label: 'Diyet', value: dietLabel(profile.diet_type!) }
          : null,
      ] as (GoalItem | null)[]).filter((g): g is GoalItem => g !== null)
    : []

  return (
    <div>
      <h1 className="mb-8 text-2xl font-bold text-[var(--text-primary)]">
        Merhaba, {user?.email} 👋
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
              <div className="text-3xl font-bold text-red-600 dark:text-red-400">{expiredCount} ürün</div>
              <div className="mt-1 text-sm text-red-400 dark:text-red-500">Tüketim Tarihi Geçmiş</div>
            </div>
          </Link>
        )}
      </div>

      {/* Hedeflerim */}
      <div className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">🎯 Hedeflerim</h2>
          <Link href="/profile" className="text-xs text-amber-500 hover:underline">
            Düzenle →
          </Link>
        </div>

        {goalItems.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-[var(--border)] bg-[var(--bg-card)] p-6 text-center">
            <p className="text-sm text-[var(--text-muted)]">
              Henüz hedef girilmemiş.{' '}
              <Link href="/profile" className="text-amber-500 hover:underline">
                Hedeflerini belirle →
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

      {/* Geçmiş Tariflerim */}
      {recentRecipes.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-4 text-lg font-semibold text-[var(--text-primary)]">📋 Geçmiş Tariflerim</h2>
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
                  🔗 Paylaş
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bugünkü Tüketim — only show when there are records */}
      {todayMeals.length > 0 && (
        <div className="mt-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">📊 Bugünkü Tüketim</h2>
          </div>
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5 shadow-sm">
            <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
              <span>🔥 <span className="font-semibold text-[var(--text-primary)]">{todayTotals.calories} kcal</span></span>
              <span>💪 <span className="font-semibold text-[var(--text-primary)]">{todayTotals.protein_g}g</span> <span className="text-[var(--text-muted)]">protein</span></span>
              <span>🍚 <span className="font-semibold text-[var(--text-primary)]">{todayTotals.carbs_g}g</span> <span className="text-[var(--text-muted)]">karb</span></span>
              <span>🧈 <span className="font-semibold text-[var(--text-primary)]">{todayTotals.fat_g}g</span> <span className="text-[var(--text-muted)]">yağ</span></span>
            </div>
            {profile?.daily_calorie_goal != null && (
              <p className="mt-3 text-xs text-[var(--text-muted)]">
                Hedefin:{' '}
                <span className="font-medium text-[var(--text-secondary)]">{profile.daily_calorie_goal} kcal</span>
                {' — '}Bugün:{' '}
                <span className="font-medium text-[var(--text-secondary)]">{todayTotals.calories} kcal</span>
                {todayTotals.calories < profile.daily_calorie_goal && (
                  <span className="ml-1 text-amber-600 dark:text-amber-400">
                    ({profile.daily_calorie_goal - todayTotals.calories} kaldı)
                  </span>
                )}
                {todayTotals.calories >= profile.daily_calorie_goal && (
                  <span className="ml-1 text-green-600 dark:text-green-400">(Hedefe ulaştın! ✓)</span>
                )}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Bu Haftaki Planın */}
      <div className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">🗓️ Bu Haftaki Planın</h2>
          <Link href="/meal-plan" className="text-xs text-amber-500 hover:underline">
            Tüm Planı Gör →
          </Link>
        </div>

        {todayMeal ? (
          <div className="divide-y divide-[var(--border-subtle)] rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] shadow-sm">
            <div className="flex items-center gap-3 px-5 py-3.5">
              <span className="text-lg">🌅</span>
              <span className="w-16 flex-shrink-0 text-xs font-medium text-[var(--text-muted)]">Kahvaltı</span>
              <span className="text-sm font-medium text-[var(--text-primary)]">{todayMeal.breakfast.name}</span>
            </div>
            <div className="flex items-center gap-3 px-5 py-3.5">
              <span className="text-lg">🌙</span>
              <span className="w-16 flex-shrink-0 text-xs font-medium text-[var(--text-muted)]">Akşam</span>
              <span className="text-sm font-medium text-[var(--text-primary)]">{todayMeal.dinner.name}</span>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border-2 border-dashed border-[var(--border)] bg-[var(--bg-card)] p-6 text-center">
            <p className="text-sm text-[var(--text-muted)]">
              Haftalık plan oluşturulmamış.{' '}
              <Link href="/meal-plan" className="text-amber-500 hover:underline">
                Haftalık planı oluştur →
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
