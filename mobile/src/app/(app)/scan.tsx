import { useState } from 'react'
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Image } from 'expo-image'
import { router } from 'expo-router'
import * as ImagePicker from 'expo-image-picker'
import { Ionicons } from '@expo/vector-icons'
import { ApiError, apiFetch, apiUpload } from '@/lib/api'
import type { PantryItem } from '@/lib/types'
import { isoInDays } from '@/lib/expiry'

type Phase = 'idle' | 'analyzing' | 'results'

export default function Scan() {
  const [phase, setPhase] = useState<Phase>('idle')
  const [preview, setPreview] = useState<string | null>(null)
  const [detected, setDetected] = useState<string[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function pick(source: 'camera' | 'library') {
    setError(null)

    const perm =
      source === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!perm.granted) {
      Alert.alert('Permission needed', `Chef-AI needs ${source} access to read your ingredients.`)
      return
    }

    const opts: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 0.6 }
    const result =
      source === 'camera'
        ? await ImagePicker.launchCameraAsync(opts)
        : await ImagePicker.launchImageLibraryAsync(opts)

    if (result.canceled || !result.assets[0]) return
    const asset = result.assets[0]
    setPreview(asset.uri)
    analyze(asset)
  }

  async function analyze(asset: ImagePicker.ImagePickerAsset) {
    setPhase('analyzing')
    setError(null)
    try {
      const form = new FormData()
      // React Native's FormData file shape: { uri, name, type }.
      form.append('image', {
        uri: asset.uri,
        name: asset.fileName ?? 'fridge.jpg',
        type: asset.mimeType ?? 'image/jpeg',
      } as unknown as Blob)

      const { ingredients } = await apiUpload<{ ingredients: string[] }>('/api/vision', form)
      setDetected(ingredients)
      setSelected(new Set(ingredients))
      setPhase('results')
    } catch (e) {
      setError(
        e instanceof ApiError && e.status === 500
          ? 'Could not read that photo. Try a clearer shot of your ingredients.'
          : e instanceof Error
            ? e.message
            : 'Something went wrong.'
      )
      setPhase('idle')
    }
  }

  function toggle(name: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })
  }

  async function addToPantry() {
    const names = [...selected]
    if (names.length === 0 || saving) return
    setSaving(true)
    try {
      // Vision-detected items get a sensible default expiry the user can edit
      // later on the Pantry screen.
      await Promise.all(
        names.map((name) =>
          apiFetch<{ item: PantryItem }>('/api/pantry', {
            method: 'POST',
            body: JSON.stringify({ name, expiry_date: isoInDays(7) }),
          })
        )
      )
      reset()
      router.navigate('/pantry')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not add to pantry.')
    } finally {
      setSaving(false)
    }
  }

  function reset() {
    setPhase('idle')
    setPreview(null)
    setDetected([])
    setSelected(new Set())
    setError(null)
  }

  return (
    <View className="flex-1 bg-pantry">
      <SafeAreaView className="flex-1" edges={['top']}>
        <ScrollView contentContainerClassName="px-6 pb-28 pt-6" showsVerticalScrollIndicator={false}>
          <Text className="font-mono text-[11px] tracking-[2px] text-zest">SNAP YOUR FRIDGE</Text>
          <Text className="mt-2 font-display text-[30px] text-chalk">Let the camera read it.</Text>

          {/* preview */}
          {preview ? (
            <Image
              source={{ uri: preview }}
              style={{ width: '100%', height: 240, borderRadius: 16, marginTop: 20 }}
              contentFit="cover"
            />
          ) : (
            <View className="mt-5 h-60 items-center justify-center rounded-2xl border border-dashed border-chalk/20">
              <Ionicons name="camera-outline" size={40} color="#5f7267" />
              <Text className="mt-2 font-sans text-[13px] text-[#8fa093]">
                No photo yet
              </Text>
            </View>
          )}

          {error ? <Text className="mt-4 font-sans text-[13px] text-clay">{error}</Text> : null}

          {phase === 'analyzing' ? (
            <View className="mt-6 items-center">
              <ActivityIndicator color="#CDF23E" />
              <Text className="mt-3 font-sans text-[13px] text-[#8fa093]">
                Reading your ingredients…
              </Text>
            </View>
          ) : null}

          {/* results */}
          {phase === 'results' ? (
            <>
              <Text className="mb-2.5 mt-6 font-mono text-[10px] tracking-[2px] text-[#8fa093]">
                FOUND {detected.length} — TAP TO DESELECT
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {detected.map((name) => {
                  const on = selected.has(name)
                  return (
                    <Pressable
                      key={name}
                      onPress={() => toggle(name)}
                      className={`rounded-full border px-3 py-1.5 ${on ? 'border-zest bg-zest' : 'border-chalk/20'}`}
                    >
                      <Text className={`font-mono text-[12px] ${on ? 'text-ink' : 'text-[#8fa093] line-through'}`}>
                        {name}
                      </Text>
                    </Pressable>
                  )
                })}
              </View>

              <Pressable
                onPress={addToPantry}
                disabled={selected.size === 0 || saving}
                className={`mt-6 h-13 items-center justify-center rounded-full bg-zest ${selected.size === 0 || saving ? 'opacity-50' : ''}`}
                style={{ height: 52 }}
              >
                {saving ? (
                  <ActivityIndicator color="#17180F" />
                ) : (
                  <Text className="font-mono-bold text-[13px] tracking-wide text-ink">
                    ADD {selected.size} TO PANTRY →
                  </Text>
                )}
              </Pressable>
              <Pressable onPress={reset} className="mt-3 items-center py-2">
                <Text className="font-mono text-[12px] tracking-wide text-[#8fa093]">RETAKE</Text>
              </Pressable>
            </>
          ) : null}

          {/* capture actions */}
          {phase === 'idle' ? (
            <View className="mt-6 gap-3">
              <Pressable
                onPress={() => pick('camera')}
                className="h-13 flex-row items-center justify-center gap-2 rounded-full bg-zest"
                style={{ height: 52 }}
              >
                <Ionicons name="camera" size={18} color="#17180F" />
                <Text className="font-mono-bold text-[13px] tracking-wide text-ink">TAKE A PHOTO</Text>
              </Pressable>
              <Pressable
                onPress={() => pick('library')}
                className="h-13 flex-row items-center justify-center gap-2 rounded-full border border-chalk/25"
                style={{ height: 52 }}
              >
                <Ionicons name="images-outline" size={18} color="#F5F6F1" />
                <Text className="font-mono-bold text-[13px] tracking-wide text-chalk">
                  CHOOSE FROM LIBRARY
                </Text>
              </Pressable>

              {/* for-best-results tips — fills the idle space, improves accuracy */}
              <View className="mt-8">
                <Text className="mb-3 font-mono text-[10px] tracking-[2px] text-[#8fa093]">
                  FOR BEST RESULTS
                </Text>
                {[
                  'Good light — open the fridge door and shoot straight on',
                  'Spread items out so labels and shapes are visible',
                  'One clear photo beats a blurry close-up',
                ].map((tip) => (
                  <View key={tip} className="mb-2.5 flex-row items-start gap-2.5">
                    <Ionicons name="checkmark-circle" size={16} color="#CDF23E" style={{ marginTop: 1 }} />
                    <Text className="flex-1 font-sans text-[13px] leading-[19px] text-[#c3c8ba]">
                      {tip}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </View>
  )
}
