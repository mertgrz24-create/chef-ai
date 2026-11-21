import { Recommendations } from '@/components/release/recommendations'
import { useKitchen } from '@/lib/release/kitchen-data'
import { useRelease } from '@/lib/release/state'
import { t, useLocale } from '@/lib/release/locale'
import { useCallback, useState } from 'react'
import { Text, View } from 'react-native'
import { router, useFocusEffect } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '@/lib/auth'
import { expiryLabel, urgencyOf } from '@/lib/expiry'
import {
  Button,
  Notice,
  PressableScale,
  Row,
  ScreenScroll,
  SectionLabel,
  Skeleton,
} from '@/components/ui'
import { colors } from '@/theme/tokens'
const TIPS = [
  'Finish a dish with lemon or vinegar to brighten its flavor.',
  'Dry ingredients brown better. Pat them dry before they hit the pan.',
  'Save a little pasta water to bring a sauce together.',
  'Let cooked meat rest before slicing.',
  'Keep herbs in a glass of water in the fridge.',
  'Freeze extra herbs in olive oil for another day.',
  'Taste before serving, then adjust salt and acidity.',
]
export default function Today() {
  useLocale()
  const { offline } = useRelease()
  const { session } = useAuth()
  const [tip] = useState(
    () => TIPS[Math.floor(Date.now() / 86400000) % TIPS.length],
  )
  const {store,snapshot}=useKitchen()
  const pantry=snapshot.pantry.data, error=snapshot.pantry.error, loading=snapshot.pantry.loading
  const load=store.refresh
  useFocusEffect(
    useCallback(() => {
      if (!offline) void load()
    }, [load, offline]),
  )
  const needsAttention = (pantry ?? []).filter((item) =>
    ['expired', 'urgent'].includes(urgencyOf(item.expiry_date) ?? ''),
  )
  const name = session?.user.email?.split('@')[0] ?? 'chef'
  return (
    <ScreenScroll>
      <View className="mb-7 flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <View className="h-8 w-8 items-center justify-center rounded-xl bg-pantry">
            <Ionicons name="restaurant-outline" size={16} color={colors.zest} />
          </View>
          <Text className="font-display text-display-sm text-pantry">
            {t('ChefAI')}
          </Text>
        </View>
        <PressableScale
          onPress={() => router.navigate('/profile')}
          accessibilityLabel={t('Open profile')}
          className="h-11 w-11 items-center justify-center rounded-full border border-line bg-panel"
        >
          <Ionicons name="person-outline" size={20} color={colors.pantry} />
        </PressableScale>
      </View>
      <Text className="font-sans text-body-sm text-muted">
        {t('Hello,')} {name}
      </Text>
      <Text
        accessibilityRole="header"
        className="mb-6 mt-1 font-display text-display-xl tracking-tight text-pantry"
      >
        {t('Your kitchen, today.')}
      </Text>
      {error ? (
        <Notice
          title={t('Your pantry couldn\u2019t load')}
          description={t('Check your connection and try again.')}
          action={loading ? undefined : { label: 'Try again', onPress: load }}
        />
      ) : null}
      <PressableScale
        onPress={() => router.navigate('/cook')}
        accessibilityLabel={t('Cook something with your ingredients')}
        className="overflow-hidden rounded-3xl bg-pantry p-5"
      >
        <View className="flex-row items-center justify-between">
          <View className="rounded-lg bg-chalk/10 px-3 py-1.5">
            <Text className="font-sans text-meta text-chalk">
              {t('Made from what you have')}
            </Text>
          </View>
          <Ionicons name="flame-outline" size={28} color={colors.zest} />
        </View>
        <Text className="mt-6 font-display text-display-lg text-chalk">
          {t('What\u2019s for dinner?')}
        </Text>
        <Text className="mt-2 max-w-[260px] font-sans text-body-sm text-chalk-2">
          {t('Pick a few ingredients.')}
          {'\n'}
          {t('Find a recipe that puts them to use.')}
        </Text>
        <View className="mt-6 min-h-11 flex-row items-center justify-between rounded-xl bg-zest px-4 py-3">
          <Text className="font-sans-bold text-body-sm text-pantry">
            {t('Let\u2019s cook')}
          </Text>
          <Ionicons name="arrow-forward" size={19} color={colors.pantry} />
        </View>
      </PressableScale>
      <View className="mt-5 flex-row items-center border-b border-line pb-5">
        {pantry === null && loading ? (
          <View className="flex-1">
            <Skeleton className="h-12" />
          </View>
        ) : (
          <>
            <View className="flex-1">
              <Text className="font-display text-display-md text-pantry">
                {pantry?.length ?? '—'}
                <Text className="font-sans text-label text-muted">
                  {' '}
                  {t('in your pantry')}
                </Text>
              </Text>
            </View>
            <View className="h-7 w-px bg-line" />
            <View className="flex-1 pl-5">
              <Text className="font-display text-display-md text-pantry">
                {pantry ? needsAttention.length : '—'}
                <Text className="font-sans text-label text-muted">
                  {' '}
                  {t('to check soon')}
                </Text>
              </Text>
            </View>
          </>
        )}
      </View>
      <Recommendations />
      <SectionLabel>
        {pantry?.length === 0 ? 'Start with what you have' : 'Use these first'}
      </SectionLabel>
      {needsAttention.length ? (
        <View className="rounded-2xl bg-panel px-4">
          {needsAttention.slice(0, 3).map((item, index) => (
            <View
              key={item.id}
              className={`flex-row items-center gap-3 py-3.5 ${index ? 'border-t border-line' : ''}`}
            >
              <View className="h-9 w-9 items-center justify-center rounded-xl bg-surface-2">
                <Ionicons name="leaf-outline" size={18} color={colors.pantry} />
              </View>
              <Text className="min-w-0 flex-1 font-sans-bold text-body-sm text-pantry">
                {item.name}
              </Text>
              <Text className="font-sans text-meta text-warm-ink">
                {expiryLabel(item.expiry_date)}
              </Text>
            </View>
          ))}
          <PressableScale
            onPress={() => router.navigate('/pantry')}
            className="min-h-11 flex-row items-center justify-between border-t border-line py-3"
            accessibilityLabel={t('View pantry')}
          >
            <Text className="font-sans-bold text-label text-pantry">
              {t('View pantry')}
            </Text>
            <Ionicons name="arrow-forward" size={16} color={colors.pantry} />
          </PressableScale>
        </View>
      ) : (
        <View className="rounded-2xl bg-panel p-4">
          <Text className="mb-4 font-sans text-body-sm text-secondary">
            {t(
              pantry?.length === 0
                ? 'Scan your fridge or add a few ingredients to get started.'
                : pantry
                  ? 'Nothing needs using right away. Keep your pantry up to date as you cook.'
                  : 'Load your pantry to see which ingredients to check first.',
            )}
          </Text>
          <Button
            label={t('Open pantry')}
            variant="ghost"
            onPress={() => router.navigate('/pantry')}
          />
        </View>
      )}
      <View className="mt-5 border-b border-line pb-2">
        <Row
          icon={
            <Ionicons name="scan-outline" size={21} color={colors.pantry} />
          }
          title={t('Scan your fridge')}
          subtitle="A photo is a good place to start"
          onPress={() => router.navigate('/scan')}
          right={
            <Ionicons name="arrow-forward" size={18} color={colors.pantry} />
          }
        />
        <Row
          icon={
            <Ionicons name="calendar-outline" size={21} color={colors.pantry} />
          }
          title={t('This week\u2019s meal plan')}
          subtitle="Breakfast & dinner, all week"
          onPress={() => router.navigate('/meal-plan')}
          right={
            <Ionicons name="arrow-forward" size={18} color={colors.pantry} />
          }
        />
        <Row
          icon={<Ionicons name="basket-outline" size={21} color={colors.pantry} />}
          title={t('Shopping list')}
          subtitle={t('Keep your shopping in one place.')}
          onPress={() => router.navigate('/shopping-list')}
          right={<Ionicons name="arrow-forward" size={18} color={colors.pantry} />}
        />
      </View>
      <View className="mt-6 flex-row items-start gap-3">
        <Ionicons name="bulb-outline" size={18} color={colors.pantry} />
        <View className="flex-1">
          <Text className="mb-1 font-sans-bold text-label text-pantry">
            {t('A note for your kitchen')}
          </Text>
          <Text className="font-sans text-body-sm text-muted">{t(tip)}</Text>
        </View>
      </View>
    </ScreenScroll>
  )
}
