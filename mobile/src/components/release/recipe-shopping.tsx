import { useEffect, useRef, useState } from 'react'
import { Text, View } from 'react-native'
import { router } from 'expo-router'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { PressableScale } from '@/components/ui/pressable-scale'
import { apiFetch } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { t, useLocale } from '@/lib/release/locale'
import { useRelease } from '@/lib/release/state'

const responseSchema = z.object({ items: z.array(z.object({ id: z.string().uuid(), name: z.string(), checked: z.boolean(), revision: z.number().int().nonnegative(), created_at: z.string() })).max(100) })

export function RecipeShopping({ ingredients }: { ingredients: string[] }) {
  const { session } = useAuth()
  return <RecipeShoppingContent key={`${session?.user.id ?? ''}:${JSON.stringify(ingredients)}`} owner={session?.user.id} ingredients={ingredients} />
}

function RecipeShoppingContent({ ingredients, owner }: { ingredients: string[]; owner?: string }) {
  useLocale()
  const { offline } = useRelease()
  const [open, setOpen] = useState(false), [selected, setSelected] = useState<Set<number>>(new Set())
  const [busy, setBusy] = useState(false), [outcome, setOutcome] = useState<'success' | 'uncertain' | null>(null)
  const lock = useRef(false), mounted = useRef(true)
  useEffect(() => { mounted.current = true; return () => { mounted.current = false } }, [])
  async function add() {
    if (lock.current || offline || !owner || !selected.size || outcome) return
    lock.current = true; setBusy(true)
    const names = ingredients.filter((_, index) => selected.has(index))
    try {
      const result = await apiFetch('/api/shopping-items/batch', { method: 'POST', expectedUserId: owner, body: JSON.stringify({ names }) }, responseSchema)
      if (result.items.length !== names.length) throw new Error('incomplete_response')
      if (mounted.current) { setOutcome('success'); setSelected(new Set()) }
    } catch { if (mounted.current) setOutcome('uncertain') }
    finally { lock.current = false; if (mounted.current) setBusy(false) }
  }
  return <View className="mt-5 gap-3">
    {!open ? <Button label={t('Choose ingredients for shopping')} variant="ghost" onPress={() => setOpen(true)} disabled={offline || !owner} /> : null}
    {open && !outcome ? <>
      <Text className="font-sans text-label text-muted">{t('Check your pantry and quantities. Select up to 100 ingredients.')}</Text>
      {ingredients.map((name, index) => <PressableScale key={`${name}-${index}`} accessibilityRole="checkbox" accessibilityLabel={t('Select %{name}', { name })} accessibilityState={{ checked: selected.has(index), disabled: busy }} disabled={busy} onPress={() => setSelected(previous => { const next = new Set(previous); if (next.has(index)) next.delete(index); else if (next.size < 100) next.add(index); return next })} className="rounded-xl border border-line p-3">
        <Text className="font-sans text-body-sm text-pantry">{selected.has(index) ? '✓ ' : '○ '}{name}</Text>
      </PressableScale>)}
      <Button label={t('Add selected ingredients')} onPress={() => void add()} disabled={busy || offline || !selected.size} />
      <Button label={t('Cancel')} variant="ghost" onPress={() => { setOpen(false); setSelected(new Set()) }} disabled={busy} />
    </> : null}
    {outcome ? <><Text accessibilityLiveRegion="polite" className="font-sans text-body-sm text-secondary">{t(outcome === 'success' ? 'Ingredients added to your shopping list.' : 'Change could not be confirmed. Check the shopping list before trying again.')}</Text><Button label={t('Open shopping list')} variant="ghost" onPress={() => router.navigate('/shopping-list')} /></> : null}
  </View>
}
