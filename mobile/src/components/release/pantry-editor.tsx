import { useEffect, useRef, useState, type RefObject, type ComponentRef } from 'react';
import { Modal, Text, View } from 'react-native';
import { apiFetch, ApiError } from '@/lib/api';
import type { PantryItem } from '@/lib/types';
import { isCalendarDate } from '@/lib/release/meal-plan';
import { useReducedMotion } from '@/theme/use-reduced-motion';
import { useModalFocus } from '@/theme/use-modal-focus';
import { isoInDays } from '@/lib/expiry';
import { t, useLocale } from '@/lib/release/locale';
import { Button, Chip, Field, Notice, ScreenHeader, ScreenScroll } from '@/components/ui';
export function PantryEditor({ item, offline, onSaved, onCancel, returnFocus }: {
    item: PantryItem;
    returnFocus?: RefObject<ComponentRef<typeof View> | null>;
    offline: boolean;
    onSaved: (item: PantryItem) => void;
    onCancel: () => void;
}) {
    useLocale();
    const reduced = useReducedMotion();
    const {heading: headingRef, onShow: onModalShow, onDismiss: onModalDismiss} = useModalFocus(true, returnFocus, true);
    const [name, setName] = useState(item.name), [quantity, setQuantity] = useState(item.quantity ?? ''), [date, setDate] = useState(item.expiry_date ?? '');
    const [revision, setRevision] = useState(item.revision), [busy, setBusy] = useState(false), [error, setError] = useState<string | null>(null), [conflict, setConflict] = useState(false);
    const lock = useRef(false), live = useRef(true);
    useEffect(() => { live.current = true; return () => { live.current = false; }; }, []);
    const valid = !!name.trim() && name.length <= 200 && quantity.length <= 100 && isCalendarDate(date) && revision !== undefined;
    async function save() {
        if (lock.current || offline || !valid)
            return;
        lock.current = true;
        setBusy(true);
        setError(null);
        try {
            const { item: updated } = await apiFetch<{
                item: PantryItem;
            }>(`/api/pantry/${item.id}`, { method: 'PATCH', body: JSON.stringify({ name: name.trim(), quantity: quantity.trim() || null, expiry_date: date, expectedRevision: revision }) });
            if (live.current)
                onSaved(updated);
        }
        catch (e) {
            if (live.current) {
                setConflict(e instanceof ApiError && e.status === 409);
                setError(e instanceof ApiError && e.status === 409 ? 'This ingredient changed elsewhere. Reload its revision and review your entries.' : 'Changes could not be saved. Your entries are kept.');
            }
        }
        finally {
            lock.current = false;
            if (live.current)
                setBusy(false);
        }
    }
    async function reload() {
        if (lock.current || offline)
            return;
        lock.current = true;
        setBusy(true);
        try {
            const { items } = await apiFetch<{
                items: PantryItem[];
            }>('/api/pantry');
            const latest = items.find(row => row.id === item.id);
            if (!latest || latest.revision === undefined)
                throw new Error('unavailable');
            if (live.current) {
                setRevision(latest.revision);
                setConflict(false);
                setError('Latest revision loaded. Review your entries before saving.');
            }
        }
        catch {
            if (live.current)
                setError('The latest ingredient could not load. Your entries are kept.');
        }
        finally {
            lock.current = false;
            if (live.current)
                setBusy(false);
        }
    }
    return <Modal visible animationType={reduced?'none':'slide'} onShow={onModalShow} onDismiss={onModalDismiss} presentationStyle="pageSheet" onRequestClose={() => { if (!busy) {
        live.current = false;
        onCancel();
    } }}>
    <View style={{flex:1}} accessibilityViewIsModal><ScreenScroll><View ref={headingRef} accessible accessibilityRole="header" accessibilityLabel={t('Edit ingredient')}><ScreenHeader title={t('Edit ingredient')}/></View>
      <Field label={t('Ingredient')} value={name} onChangeText={setName} maxLength={200} editable={!busy}/>
      <Field label={t('Quantity')} value={quantity} onChangeText={setQuantity} maxLength={100} editable={!busy}/>
      <Field label={t('Expiry date (YYYY-MM-DD)')} value={date} onChangeText={setDate} maxLength={10} editable={!busy} placeholder="YYYY-MM-DD" hint={t('Shortcuts are estimates, not dates read from packaging.')}/>
      <View className="my-4 flex-row flex-wrap gap-2">{[3, 7, 14, 30].map(days => <Chip key={days} active={date === isoInDays(days)} label={t('%{count} days', { count: days })} onPress={() => setDate(isoInDays(days))} disabled={busy}/>)}</View>
      {date && !isCalendarDate(date) ? <Text className="mb-3 font-sans text-body-sm text-error-ink">{t('Enter a valid calendar date.')}</Text> : null}
      {error ? <Notice title={t(error)}/> : null}
      {conflict ? <Button label={t('Reload ingredient')} variant="ghost" onPress={reload} disabled={offline || busy}/> : null}
      <Button label={t('Save changes')} onPress={save} disabled={!valid || offline} loading={busy}/>
      <View className="mt-3"><Button label={t('Cancel')} variant="ghost" disabled={busy} onPress={() => { live.current = false; onCancel(); }}/></View>
    </ScreenScroll></View>
  </Modal>;
}
