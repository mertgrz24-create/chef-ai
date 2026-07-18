import { useCallback, useState } from 'react'
import { Pressable, ScrollView, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router, useFocusEffect } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '@/lib/auth'
import { apiFetch } from '@/lib/api'
import type { PantryItem } from '@/lib/types'
import { urgencyColor, urgencyOf } from '@/lib/expiry'

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

          {/* meal plan entry — lives here, not in the tab bar */}
          <Pressable
            onPress={() => router.navigate('/meal-plan')}
            className="mt-8 flex-row items-center rounded-2xl border border-chalk/10 bg-chalk/[0.03] p-4"
          >
            <View className="mr-3 h-10 w-10 items-center justify-center rounded-xl bg-zest">
              <Ionicons name="calendar" size={20} color="#17180F" />
            </View>
            <View className="flex-1">
              <Text className="font-sans text-[15px] text-chalk">This week&apos;s meal plan</Text>
              <Text className="font-mono text-[11px] text-[#8fa093]">7 days, planned for you</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#8fa093" />
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </View>
  )
}
