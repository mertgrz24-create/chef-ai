import { useCallback, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useFocusEffect } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { apiFetch } from '@/lib/api'
import type { PantryItem } from '@/lib/types'
import { expiryLabel, urgencyColor, urgencyOf } from '@/lib/expiry'

const EXPIRY_PRESETS = [
  { label: '3d', days: 3 },
  { label: '1w', days: 7 },
  { label: '2w', days: 14 },
  { label: '1mo', days: 30 },
]

function isoInDays(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

export default function Pantry() {
  const [items, setItems] = useState<PantryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [name, setName] = useState('')
  const [quantity, setQuantity] = useState('')
  const [presetDays, setPresetDays] = useState(7)
  const [adding, setAdding] = useState(false)

  const load = useCallback(async () => {
    try {
      const { items } = await apiFetch<{ items: PantryItem[] }>('/api/pantry')
      setItems(items)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load pantry.')
    } finally {
      setLoading(false)
    }
  }, [])

  // Refetch whenever the tab regains focus so counts stay current.
  useFocusEffect(
    useCallback(() => {
      load()
    }, [load])
  )

  async function add() {
    if (!name.trim() || adding) return
    setAdding(true)
    try {
      const { item } = await apiFetch<{ item: PantryItem }>('/api/pantry', {
        method: 'POST',
        body: JSON.stringify({
          name: name.trim(),
          expiry_date: isoInDays(presetDays),
          quantity: quantity.trim() || undefined,
        }),
      })
      // Insert then re-sort by expiry (API returns list sorted asc).
      setItems((prev) =>
        [...prev, item].sort((a, b) => (a.expiry_date ?? '').localeCompare(b.expiry_date ?? ''))
      )
      setName('')
      setQuantity('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not add item.')
    } finally {
      setAdding(false)
    }
  }

  async function remove(id: string) {
    const prev = items
    setItems((cur) => cur.filter((i) => i.id !== id)) // optimistic
    try {
      await apiFetch(`/api/pantry/${id}`, { method: 'DELETE' })
    } catch {
      setItems(prev) // roll back
    }
  }

  return (
    <View className="flex-1 bg-pantry">
      <SafeAreaView className="flex-1" edges={['top']}>
        <View className="px-6 pt-6">
          <Text className="font-mono text-[11px] tracking-[2px] text-zest">YOUR PANTRY</Text>
          <Text className="mt-2 font-display text-[30px] text-chalk">
            What&apos;s in the fridge?
          </Text>
        </View>

        {/* add bar */}
        <View className="mx-6 mt-5 rounded-2xl border border-chalk/15 bg-chalk/5 p-4">
          <View className="flex-row gap-2">
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Add an ingredient"
              placeholderTextColor="#5f7267"
              className="flex-1 font-sans text-[15px] text-chalk"
              onSubmitEditing={add}
              returnKeyType="done"
            />
            <TextInput
              value={quantity}
              onChangeText={setQuantity}
              placeholder="qty"
              placeholderTextColor="#5f7267"
              className="w-14 font-mono text-[13px] text-chalk"
            />
          </View>
          <View className="mt-3 flex-row items-center justify-between">
            <View className="flex-row gap-1.5">
              {EXPIRY_PRESETS.map((p) => {
                const active = p.days === presetDays
                return (
                  <Pressable
                    key={p.label}
                    onPress={() => setPresetDays(p.days)}
                    className={`rounded-full border px-2.5 py-1 ${
                      active ? 'border-zest bg-zest' : 'border-chalk/20'
                    }`}
                  >
                    <Text
                      className={`font-mono text-[11px] ${active ? 'text-ink' : 'text-[#8fa093]'}`}
                    >
                      {p.label}
                    </Text>
                  </Pressable>
                )
              })}
            </View>
            <Pressable
              onPress={add}
              disabled={!name.trim() || adding}
              className={`rounded-full bg-zest px-4 py-1.5 ${!name.trim() || adding ? 'opacity-50' : ''}`}
            >
              {adding ? (
                <ActivityIndicator size="small" color="#17180F" />
              ) : (
                <Text className="font-mono-bold text-[12px] text-ink">ADD</Text>
              )}
            </Pressable>
          </View>
        </View>

        {loading ? (
          <ActivityIndicator className="mt-10" color="#CDF23E" />
        ) : (
          <FlatList
            data={items}
            keyExtractor={(i) => i.id}
            contentContainerClassName="px-6 pb-28 pt-4"
            ListEmptyComponent={
              <Text className="mt-10 text-center font-sans text-[14px] text-[#8fa093]">
                {error ?? 'Your pantry is empty. Add what you have above.'}
              </Text>
            }
            renderItem={({ item }) => {
              const urgency = urgencyOf(item.expiry_date)
              return (
                <View className="mb-2.5 flex-row items-center rounded-xl border border-chalk/10 bg-chalk/[0.03] px-4 py-3.5">
                  <View
                    className="mr-3 h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: urgencyColor(urgency) }}
                  />
                  <View className="flex-1">
                    <Text className="font-sans text-[15px] text-chalk">
                      {item.name}
                      {item.quantity ? (
                        <Text className="font-mono text-[12px] text-[#8fa093]">  ·  {item.quantity}</Text>
                      ) : null}
                    </Text>
                  </View>
                  <Text
                    className="mr-3 font-mono text-[11px]"
                    style={{ color: urgencyColor(urgency) }}
                  >
                    {expiryLabel(item.expiry_date)}
                  </Text>
                  <Pressable onPress={() => remove(item.id)} hitSlop={10}>
                    <Ionicons name="trash-outline" size={18} color="#5f7267" />
                  </Pressable>
                </View>
              )
            }}
          />
        )}
      </SafeAreaView>
    </View>
  )
}
