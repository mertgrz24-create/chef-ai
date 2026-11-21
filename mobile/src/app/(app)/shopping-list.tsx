import { useCallback, useRef, useState } from 'react'
import { Text, View } from 'react-native'
import { router, useFocusEffect } from 'expo-router'
import { z } from 'zod'
import { Button, Field, LoadingRows, Notice, PressableScale, ScreenHeader, ScreenScroll } from '@/components/ui'
import { apiFetch } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { t, useLocale } from '@/lib/release/locale'
import { useRelease } from '@/lib/release/state'
import { mealPlanSchema } from '@/lib/release/contracts'

const itemSchema = z.object({ id: z.string().uuid(), name: z.string().min(1).max(300), checked: z.boolean(), revision: z.number().int().nonnegative(), created_at: z.string() })
const listSchema = z.object({ items: z.array(itemSchema).max(500) })
const responseSchema = z.object({ item: itemSchema })
type Item = z.infer<typeof itemSchema>
type Choice = { name: string; source: string }

export default function ShoppingList() {
  useLocale()
  const { session } = useAuth(), { offline } = useRelease()
  const owner = session?.user.id
  const [items, setItems] = useState<Item[]>([]), [name, setName] = useState('')
  const [editing, setEditing] = useState<string | null>(null), [draft, setDraft] = useState('')
  const [displayOwner, setDisplayOwner] = useState<string | undefined>(undefined)
  const [choices, setChoices] = useState<Choice[] | null>(null), [selected, setSelected] = useState<Set<number>>(new Set())
  const [loading, setLoading] = useState(true), [busy, setBusy] = useState(false), [error, setError] = useState<string | null>(null)
  const active = useRef(false), operation = useRef(false), version = useRef(0), currentOwner = useRef<string | undefined>(undefined)
  const load = useCallback(async () => {
    if (!owner || operation.current || offline) return
    const current = ++version.current
    setLoading(true)
    try {
      const result = await apiFetch('/api/shopping-items', { expectedUserId: owner }, listSchema)
      if (active.current && current === version.current) { setItems(result.items); setError(null) }
    } catch {
      if (active.current && current === version.current) setError('Shopping list could not load. Try again.')
    } finally { if (active.current && current === version.current) setLoading(false) }
  }, [owner, offline])
  const latestLoad = useRef(load)
  useFocusEffect(useCallback(() => {
    active.current = true
    latestLoad.current = load
    if (currentOwner.current !== owner) {
      currentOwner.current = owner; setItems([]); setName(''); setDraft(''); setEditing(null); setChoices(null); setSelected(new Set()); setError(null); setBusy(false); setDisplayOwner(owner)
    }
    if (!offline) void load(); else setLoading(false)
    return () => { active.current = false; version.current++ }
  }, [load, offline, owner]))

  async function change(action: (current: () => boolean) => Promise<void>) {
    if (operation.current || !owner || offline || loading || error) return
    operation.current = true; const requestVersion = ++version.current; setBusy(true)
    const current = () => active.current && version.current === requestVersion
    try { await action(current) } catch {
      if (current()) setError('Change could not be confirmed. Refresh the list before trying again.')
    } finally {
      operation.current = false
      if (current()) setBusy(false)
      else if (active.current) { setBusy(false); void latestLoad.current() }
    }
  }
  function add() {
    if (!name.trim() || name.length > 300) return
    const value = name.trim()
    void change(async current => {
      const result = await apiFetch('/api/shopping-items', { method: 'POST', expectedUserId: owner, body: JSON.stringify({ name: value }) }, responseSchema)
      if (current()) { setItems(previous => [...previous, result.item]); setName('') }
    })
  }
  function update(item: Item, nextName: string, checked: boolean) {
    if (!nextName.trim() || nextName.length > 300) return
    void change(async current => {
      const result = await apiFetch(`/api/shopping-items/${item.id}`, { method: 'PATCH', expectedUserId: owner, body: JSON.stringify({ name: nextName.trim(), checked, expectedRevision: item.revision }) }, responseSchema)
      if (current()) { setItems(previous => previous.map(row => row.id === item.id ? result.item : row)); setEditing(null) }
    })
  }
  function remove(item: Item) {
    void change(async current => {
      await apiFetch(`/api/shopping-items/${item.id}?revision=${item.revision}`, { method: 'DELETE', expectedUserId: owner })
      if (current()) { setItems(previous => previous.filter(row => row.id !== item.id)); if (editing === item.id) setEditing(null) }
    })
  }
  function choosePlan() {
    void change(async current => {
      const { plan } = await apiFetch('/api/meal-plan', { expectedUserId: owner }, mealPlanSchema)
      const found: Choice[] = []
      for (const day of plan.meals) for (const meal of [day.breakfast, day.dinner]) for (const ingredient of meal.ingredients) {
        found.push({ name: ingredient.trim(), source: meal.name })
      }
      if (current()) { setChoices(found); setSelected(new Set()) }
    })
  }
  function addSelected() {
    if (!choices || selected.size === 0 || selected.size > 100) return
    const names = choices.filter((_, index) => selected.has(index)).map(choice => choice.name)
    void change(async current => {
      const result = await apiFetch('/api/shopping-items/batch', { method: 'POST', expectedUserId: owner, body: JSON.stringify({ names }) }, listSchema)
      if (result.items.length !== names.length) throw new Error('incomplete_response')
      if (current()) { setItems(previous => [...previous, ...result.items]); setChoices(null); setSelected(new Set()) }
    })
  }
  return <ScreenScroll>
    <ScreenHeader eyebrow={t('YOUR KITCHEN')} title={t('Shopping list')} description={t('Keep your shopping in one place.')} onBack={() => router.navigate('/')} />
    {offline ? <Notice title={t('You’re offline')} description={t('Connect to load or change your shopping list.')} /> : null}
    {error ? <Notice title={t(error)} action={offline || busy ? undefined : { label: t('Refresh list'), onPress: load }} /> : null}
    <View className="my-4 gap-3"><Field label={t('Item')} value={displayOwner === owner ? name : ''} onChangeText={setName} maxLength={300} /><Button label={t('Add item')} onPress={add} disabled={busy || loading || offline || !!error || !name.trim()} /></View>
    <Button label={t('Choose from weekly menu')} variant="ghost" onPress={choosePlan} disabled={busy || loading || offline || !!error} />
    {choices ? <View className="my-4 gap-3 rounded-2xl bg-panel p-4">
      <Text accessibilityRole="header" className="font-sans-bold text-body text-pantry">{t('Choose ingredients to add')}</Text>
      <Text className="font-sans text-label text-muted">{t('Check your pantry and quantities. Select up to 100 ingredients.')}</Text>
      {choices.map((choice, index) => <PressableScale key={`${choice.name}-${index}`} accessibilityRole="checkbox" accessibilityState={{ checked: selected.has(index), disabled: busy }} accessibilityLabel={t('Select %{name} from %{meal}', { name: choice.name, meal: choice.source })} disabled={busy} onPress={() => setSelected(previous => { const next = new Set(previous); if (next.has(index)) next.delete(index); else if (next.size < 100) next.add(index); return next })} className="rounded-xl border border-line p-3">
        <Text className="font-sans-bold text-body-sm text-pantry">{selected.has(index) ? '✓ ' : '○ '}{choice.name}</Text>
        <Text className="mt-1 font-sans text-label text-muted">{choice.source}</Text>
      </PressableScale>)}
      <Button label={t('Add selected ingredients')} onPress={addSelected} disabled={busy || offline || !!error || selected.size === 0} />
      <Button label={t('Cancel')} variant="ghost" onPress={() => { setChoices(null); setSelected(new Set()) }} disabled={busy} />
    </View> : null}
    {loading ? <LoadingRows /> : null}
    {!loading && !items.length && !error ? <Text className="my-4 font-sans text-body text-secondary">{t('Your shopping list is empty.')}</Text> : null}
    {(displayOwner === owner ? items : []).map(item => <View key={item.id} className="mb-3 gap-3 rounded-2xl bg-panel p-4">
      {editing === item.id ? <Field label={t('Edit item')} value={draft} onChangeText={setDraft} maxLength={300} /> : <Text className="font-sans-bold text-body text-pantry">{item.name}</Text>}
      <Button label={t(item.checked ? 'Mark as needed' : 'Mark as bought')} variant="ghost" onPress={() => update(item, item.name, !item.checked)} disabled={busy || offline || !!error || editing !== null} />
      {editing === item.id ? <><Button label={t('Save changes')} onPress={() => update(item, draft, item.checked)} disabled={busy || offline || !!error || !draft.trim()} /><Button label={t('Cancel')} variant="ghost" onPress={() => setEditing(null)} disabled={busy} /></> : <Button label={t('Edit item')} variant="ghost" onPress={() => { setEditing(item.id); setDraft(item.name) }} disabled={busy || offline || !!error || editing !== null} />}
      <Button label={t('Remove item')} variant="danger" onPress={() => remove(item)} disabled={busy || offline || !!error || editing !== null} />
    </View>)}
  </ScreenScroll>
}
