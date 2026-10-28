import { PantryEditor } from '@/components/release/pantry-editor'
import { useKitchenInvalidation } from '@/lib/release/kitchen-data'
import { t, useLocale } from '@/lib/release/locale'
import { useCallback, useRef, useState, type ComponentRef } from 'react'
import {
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Text,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { router, useFocusEffect } from 'expo-router'
import { apiFetch } from '@/lib/api'
import type { PantryItem } from '@/lib/types'
import { expiryLabel, isoInDays, urgencyColor, urgencyOf } from '@/lib/expiry'
import {
  Button,
  Chip,
  EmptyState,
  Field,
  LoadingRows,
  Notice,
  MotionView,
  PressableScale,
  Screen,
  ScreenHeader,
} from '@/components/ui'
import { colors } from '@/theme/tokens'
import { useRelease } from '@/lib/release/state'
const EXPIRY_PRESETS = [
  { label: '3 days', days: 3 },
  { label: '1 week', days: 7 },
  { label: '2 weeks', days: 14 },
  { label: '1 month', days: 30 },
]
export default function Pantry() {
  useLocale()
  const invalidate=useKitchenInvalidation()
  const { offline, track } = useRelease()
  const [editing,setEditing]=useState<PantryItem|null>(null)
  const [rowMotion,setRowMotion]=useState<Record<string,number>>({})
  const [exiting,setExiting]=useState<Set<string>>(new Set())
  const editTrigger = useRef<ComponentRef<typeof View>>(null)
  const editRefs = useRef(new Map<string,ComponentRef<typeof View>>())
  const [showAdd, setShowAdd] = useState(false)
  const operation = useRef(false)
  const requestVersion = useRef(0)
  const [items, setItems] = useState<PantryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [quantity, setQuantity] = useState('')
  const [presetDays, setPresetDays] = useState(7)
  const [adding, setAdding] = useState(false)
  const [removing, setRemoving] = useState<string | null>(null)
  function highlight(id:string){setRowMotion(previous=>({...previous,[id]:(previous[id]??0)+1}))}
  function finishRemoval(id:string){
    setItems(previous=>previous.filter(row=>row.id!==id))
    setExiting(previous=>{const next=new Set(previous);next.delete(id);return next})
    setRowMotion(previous=>{const next={...previous};delete next[id];return next})
  }
  const load = useCallback(async () => {
    if (operation.current) return
    const version = ++requestVersion.current
    setLoading(true)
    try {
      const { items } = await apiFetch<{
        items: PantryItem[]
      }>('/api/pantry')
      if (version !== requestVersion.current) return
      setItems(items)
      const currentIds = new Set(items.map(item=>item.id))
      setExiting(previous=>new Set([...previous].filter(id=>currentIds.has(id))))
      setRowMotion(previous=>Object.fromEntries(Object.entries(previous).filter(([id])=>currentIds.has(id))))
      setLoadError(false)
    } catch {
      if (version === requestVersion.current) setLoadError(true)
    } finally {
      if (version === requestVersion.current) setLoading(false)
    }
  }, [])
  useFocusEffect(
    useCallback(() => {
      if (!offline) void load()
    }, [load, offline]),
  )
  async function add() {
    if (!name.trim() || operation.current || loading || offline) return
    operation.current = true
    ++requestVersion.current
    setLoading(false)
    setAdding(true)
    setError(null)
    setNotice(null)
    try {
      const { item } = await apiFetch<{
        item: PantryItem
      }>('/api/pantry', {
        method: 'POST',
        body: JSON.stringify({
          name: name.trim(),
          expiry_date: isoInDays(presetDays),
          quantity: quantity.trim() || undefined,
        }),
      })
      setItems((prev) =>
        [...prev, item].sort((a, b) =>
          (a.expiry_date ?? '9999').localeCompare(b.expiry_date ?? '9999'),
        ),
      )
      highlight(item.id)
      invalidate?.('pantry')
      setNotice(`${item.name} ${t('added to your pantry.')}`)
      if (items.length === 0) void track('first_ingredient_added')
      setName('')
      setQuantity('')
      setShowAdd(false)
      Keyboard.dismiss()
    } catch {
      setError(
        'Couldn’t add this ingredient. Your entry is still here; please try again.',
      )
    } finally {
      setAdding(false)
      operation.current = false
    }
  }
  async function remove(item: PantryItem) {
    if (operation.current || loading || offline || exiting.has(item.id)) return
    operation.current = true
    ++requestVersion.current
    setLoading(false)
    setRemoving(item.id)
    setError(null)
    setNotice(null)
    // Keep the row visible until confirmed, so failures never look like success.
    try {
      await apiFetch(`/api/pantry/${item.id}`, { method: 'DELETE' })
      setExiting(previous=>new Set(previous).add(item.id))
      invalidate?.('pantry')
      setNotice(t('%{name} removed.', { name: item.name }))
    } catch {
      setError(
        t('Couldn’t remove %{name}. Please try again.', { name: item.name }),
      )
    } finally {
      setRemoving(null)
      operation.current = false
    }
  }
  return (
    <Screen>
      <SafeAreaView className="flex-1" edges={['top', 'left', 'right']}>
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <FlatList
            data={items}
            keyExtractor={(i) => i.id}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            contentContainerClassName="px-5 pb-8 pt-6"
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={
              <View className="bg-canvas pb-4">
                <ScreenHeader
                  eyebrow={t('YOUR INGREDIENTS')}
                  title={t('Pantry')}
                  description={t('%{count} ingredients, ready to use.', {
                    count: items.length,
                  })}
                  action={
                    <PressableScale
                      onPress={() => setShowAdd(!showAdd)}
                      accessibilityLabel={
                        showAdd ? 'Close ingredient form' : 'Add an ingredient'
                      }
                      accessibilityState={{ expanded: showAdd }}
                      className="h-12 w-12 items-center justify-center rounded-2xl bg-pantry"
                    >
                      <Ionicons
                        name={showAdd ? 'close' : 'add'}
                        size={24}
                        color={colors.chalk}
                      />
                    </PressableScale>
                  }
                />
                {items.some(item=>item.revision===undefined)?<Notice tone="info" title={t('Editing requires the server update. Adding and removing still work.')}/>:null}
                {showAdd ? (
                  <View className="mt-4 rounded-3xl bg-panel p-4">
                    <View className="flex-row items-start gap-3">
                      <View className="min-w-0 flex-1">
                        <Field
                          label={t('Ingredient')}
                          value={name}
                          onChangeText={setName}
                          placeholder={t('e.g. tomatoes')}
                          returnKeyType="done"
                          onSubmitEditing={add}
                          editable={!adding && !loading}
                        />
                      </View>
                      <View className="w-20">
                        <Field
                          label={t('Quantity')}
                          value={quantity}
                          onChangeText={setQuantity}
                          placeholder={t('e.g. 2')}
                          editable={!adding && !loading}
                        />
                      </View>
                    </View>
                    <Text className="mb-2 mt-3 font-sans text-label text-secondary">
                      {t('Use within')}
                    </Text>
                    <View className="flex-row flex-wrap gap-2">
                      {EXPIRY_PRESETS.map((p) => (
                        <Chip
                          key={p.days}
                          label={p.label}
                          size="sm"
                          active={p.days === presetDays}
                          onPress={() => setPresetDays(p.days)}
                          disabled={adding}
                        />
                      ))}
                    </View>
                    <View className="mt-3">
                      <Button
                        label={t('Add ingredient')}
                        loadingLabel={t('Adding ingredient\u2026')}
                        onPress={add}
                        loading={adding}
                        disabled={
                          !name.trim() || !!removing || loading || offline
                        }
                      />
                    </View>
                  </View>
                ) : null}
                {loadError ? (
                  <Notice
                    title={t('Your pantry couldn\u2019t load')}
                    description={t(
                      'Check your connection. Any ingredients shown may be out of date.',
                    )}
                    action={
                      loading
                        ? undefined
                        : { label: 'Try again', onPress: load }
                    }
                  />
                ) : null}
              </View>
            }
            ListEmptyComponent={
              loading ? (
                <LoadingRows />
              ) : loadError ? undefined : (
                <EmptyState
                  icon="file-tray-outline"
                  title={t('Your pantry is empty')}
                  description={t(
                    'Tap + to add what you have, or scan a photo to fill it faster.',
                  )}
                  action={{
                    label: 'Scan your fridge',
                    onPress: () => router.navigate('/scan'),
                  }}
                />
              )
            }
            renderItem={({ item }) => {
              const urgency = urgencyOf(item.expiry_date)
              return (
                <MotionView animate={!!rowMotion[item.id]||exiting.has(item.id)} transitionKey={rowMotion[item.id]??0} visible={!exiting.has(item.id)} onEntered={()=>setRowMotion(previous=>{if(previous[item.id]!==rowMotion[item.id])return previous;const next={...previous};delete next[item.id];return next})} onExited={()=>finishRemoval(item.id)} style={{marginBottom:8}}><View className="flex-row items-center gap-3 rounded-2xl bg-panel p-4">
                  <View
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: urgencyColor(urgency) }}
                  />
                  <View className="min-w-0 flex-1">
                    <Text className="font-sans text-body text-content">
                      {item.name}
                    </Text>
                    {item.quantity ? (
                      <Text className="mt-0.5 font-sans text-label text-secondary">
                        {item.quantity}
                      </Text>
                    ) : null}
                    <Text
                      className="mt-1 font-sans text-label"
                      style={{
                        color:
                          urgency === 'expired'
                            ? colors['error-ink']
                            : urgency === 'soon' || urgency === 'urgent'
                              ? colors['warm-ink']
                              : colors.muted,
                      }}
                    >
                      {expiryLabel(item.expiry_date)}
                    </Text>
                  </View>
                  <PressableScale nativeRef={node=>{if(node)editRefs.current.set(item.id,node);else editRefs.current.delete(item.id)}} onPress={()=>{editTrigger.current=editRefs.current.get(item.id)??null;setEditing(item)}} disabled={exiting.has(item.id)||item.revision===undefined||!!removing||adding||loading||offline} accessibilityLabel={t('Edit %{name}',{name:item.name})} className="h-11 w-11 items-center justify-center rounded-full border border-line">
                    <Ionicons name="pencil-outline" size={20} color={colors.pantry}/>
                  </PressableScale>
                  <PressableScale
                    onPress={() => remove(item)}
                    disabled={exiting.has(item.id)||!!removing || adding || loading || offline}
                    accessibilityLabel={
                      removing === item.id
                        ? t('Removing %{name}', { name: item.name })
                        : t('Remove %{name}', { name: item.name })
                    }
                    accessibilityState={{ busy: removing === item.id }}
                    className="h-11 w-11 items-center justify-center rounded-full border border-line"
                  >
                    <Ionicons
                      name={
                        removing === item.id
                          ? 'hourglass-outline'
                          : 'trash-outline'
                      }
                      size={20}
                      color={colors.muted}
                    />
                  </PressableScale>
                </View></MotionView>
              )
            }}
          />
          {error || notice ? (
            <View className="px-5 pb-3">
              <MotionView transitionKey={error??notice??''}><Notice
                title={error ?? notice ?? ''}
                tone={error ? 'error' : 'success'}
                onDismiss={() => {
                  setError(null)
                  setNotice(null)
                }}
              /></MotionView>
            </View>
          ) : null}
        </KeyboardAvoidingView>
      </SafeAreaView>
      {editing?<PantryEditor key={editing.id} item={editing} returnFocus={editTrigger} offline={offline} onCancel={()=>setEditing(null)} onSaved={updated=>{
        setItems(prev=>prev.map(row=>row.id===updated.id?updated:row).sort((a,b)=>(a.expiry_date??'9999').localeCompare(b.expiry_date??'9999')))
        highlight(updated.id);invalidate?.('pantry');setEditing(null);setNotice(t('Ingredient updated.'))
      }}/>:null}
    </Screen>
  )
}
