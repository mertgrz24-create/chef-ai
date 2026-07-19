import { useCallback, useState } from 'react'
import { Pressable, ScrollView, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { type Href, router, useFocusEffect } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '@/lib/auth'
import { apiFetch } from '@/lib/api'
import type { PantryItem } from '@/lib/types'
import { urgencyColor, urgencyOf } from '@/lib/expiry'

// Static, on-brand cooking wisdom — one per day, no API. Fills the screen with
// warmth without adding a feature.
const TIPS = [
  'A squeeze of acid — lemon or vinegar — at the end wakes up almost any dish.',
  'Pat proteins dry before searing. Moisture is the enemy of a good crust.',
  'Salt pasta water like the sea. It is your only shot at seasoning the pasta itself.',
  'Rest meat after cooking so the juices settle back in instead of running out.',
  'Store herbs like flowers: stems in water, a bag over the top. They last twice as long.',
  'Freeze leftover herbs in olive oil in an ice tray — instant flavor cubes.',
  'Taste as you go. The recipe is a map, not the territory.',
]

function tipOfDay(): string {
  const start = Date.UTC(new Date().getUTCFullYear(), 0, 0)
  const day = Math.floor((Date.now() - start) / 86_400_000)
  return TIPS[day % TIPS.length]
}

function QuickAction({
  icon,
  title,
  subtitle,
  href,
}: {
  icon: keyof typeof Ionicons.glyphMap
  title: string
  subtitle: string
  href: Href
}) {
  return (
    <Pressable
      onPress={() => router.navigate(href)}
      className="flex-1 rounded-2xl border border-chalk/10 bg-chalk/[0.03] p-4"
    >
      <View className="mb-6 h-11 w-11 items-center justify-center rounded-xl bg-zest">
        <Ionicons name={icon} size={22} color="#17180F" />
      </View>
      <Text className="font-sans text-[15px] text-chalk">{title}</Text>
      <Text className="mt-0.5 font-mono text-[11px] text-[#8fa093]">{subtitle}</Text>
    </Pressable>
  )
}

export default function Today() {
  const { session } = useAuth()
  const firstName = session?.user.email?.split('@')[0] ?? 'chef'

  const [pantry, setPantry] = useState<PantryItem[] | null>(null)

  useFocusEffect(
    useCallback(() => {
      apiFetch<{ items: PantryItem[] }>('/api/pantry')
        .then(({ items }) => setPantry(items))
        .catch(() => setPantry([]))
    }, [])
  )

  const expiringSoon = (pantry ?? []).filter((i) => {
    const u = urgencyOf(i.expiry_date)
    return u === 'expired' || u === 'urgent'
  })

  return (
    <View className="flex-1 bg-pantry">
      <SafeAreaView className="flex-1" edges={['top']}>
        <ScrollView contentContainerClassName="px-6 pb-28 pt-6" showsVerticalScrollIndicator={false}>
          <Text className="font-mono text-[11px] tracking-[2px] text-zest">AI KITCHEN DECISION ENGINE</Text>
          <Text className="mt-1.5 font-sans text-[13px] text-[#8fa093]">Hello, {firstName}</Text>

          <Text className="mt-4 font-display text-[32px] leading-[36px] text-chalk">
            Tonight&apos;s dinner is already in your <Text className="text-zest">fridge.</Text>
          </Text>

          {/* pantry count */}
          <View className="mt-8 flex-row gap-3">
            <View className="flex-1 rounded-2xl border border-chalk/10 bg-chalk/[0.03] p-4">
              <Text className="font-display text-[32px] text-chalk">{pantry?.length ?? '—'}</Text>
              <Text className="mt-0.5 font-mono text-[10px] tracking-[1.5px] text-[#8fa093]">
                IN PANTRY
              </Text>
            </View>
            <View className="flex-1 rounded-2xl border p-4" style={{ borderColor: expiringSoon.length ? '#E8623D55' : '#f5f6f11a' }}>
              <Text
                className="font-display text-[32px]"
                style={{ color: expiringSoon.length ? '#F0913D' : '#F5F6F1' }}
              >
                {pantry ? expiringSoon.length : '—'}
              </Text>
              <Text className="mt-0.5 font-mono text-[10px] tracking-[1.5px] text-[#8fa093]">
                EXPIRING SOON
              </Text>
            </View>
          </View>

          {/* expiring list */}
          {expiringSoon.length > 0 ? (
            <>
              <Text className="mb-2.5 mt-8 font-mono text-[10px] tracking-[2px] text-[#8fa093]">
                COOK THESE BEFORE THEY GO
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {expiringSoon.map((item) => (
                  <View
                    key={item.id}
                    className="flex-row items-center gap-2 rounded-full border border-chalk/20 px-3 py-1.5"
                  >
                    <View
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: urgencyColor(urgencyOf(item.expiry_date)) }}
                    />
                    <Text className="font-mono text-[12px] text-[#e4e8dd]">{item.name}</Text>
                  </View>
                ))}
              </View>
            </>
          ) : null}

          {/* quick actions */}
          <Text className="mb-2.5 mt-8 font-mono text-[10px] tracking-[2px] text-[#8fa093]">
            QUICK ACTIONS
          </Text>
          <View className="flex-row gap-3">
            <QuickAction icon="scan" title="Scan your fridge" subtitle="PHOTO → ITEMS" href="/scan" />
            <QuickAction icon="flame" title="Cook something" subtitle="ITEMS → RECIPE" href="/cook" />
          </View>

          {/* meal plan entry — lives here, not in the tab bar */}
          <Pressable
            onPress={() => router.navigate('/meal-plan')}
            className="mt-3 flex-row items-center rounded-2xl border border-chalk/10 bg-chalk/[0.03] p-4"
          >
            <View className="mr-3 h-11 w-11 items-center justify-center rounded-xl bg-zest">
              <Ionicons name="calendar" size={20} color="#17180F" />
            </View>
            <View className="flex-1">
              <Text className="font-sans text-[15px] text-chalk">This week&apos;s meal plan</Text>
              <Text className="font-mono text-[11px] text-[#8fa093]">7 days, planned for you</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#8fa093" />
          </Pressable>

          {/* kitchen tip — a ticket, for warmth */}
          <View className="mt-8 overflow-hidden rounded-2xl bg-surface">
            <View className="flex-row items-center justify-between bg-ink px-4 py-2.5">
              <Text className="font-mono text-[11px] tracking-widest text-chalk">KITCHEN TIP</Text>
              <Ionicons name="bulb" size={13} color="#CDF23E" />
            </View>
            <Text className="px-5 py-4 font-sans text-[14px] leading-[21px] text-ink-2">
              {tipOfDay()}
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  )
}
