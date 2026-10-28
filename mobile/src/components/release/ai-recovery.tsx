import { createContext, useCallback, useContext, useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
import { AppState, View } from 'react-native';
import { router } from 'expo-router';
import { apiFetch, ApiError } from '@/lib/api';
import { aiStatusSchema, clearPendingAi, hidePendingAi, loadPendingAi, pendingAiStore, showPendingAi, type AiOperation } from '@/lib/release/ai-recovery';
import { mealPlanSchema, recipeResponseSchema, savedRecipeSchema, visionSchema } from '@/lib/release/contracts';
import { useKitchenInvalidation } from '@/lib/release/kitchen-data';
import { useRelease } from '@/lib/release/state';
import { t, useLocale } from '@/lib/release/locale';
import { Button, Notice } from '@/components/ui';
type Recovered = {
    operation: AiOperation;
    response: unknown;
    key: string;
};
const Context = createContext<{
    result: Recovered | null;
    consume: () => void;
} | null>(null);
export function useRecoveredAi(operation: AiOperation) {
    const context = useContext(Context);
    return context?.result?.operation === operation ? context : null;
}
export function AiRecoveryProvider({ owner, children }: {
    owner: string | null;
    children: ReactNode;
}) {
    useLocale();
    const { refreshMembership } = useRelease(), invalidate = useKitchenInvalidation();
    const current = useSyncExternalStore(pendingAiStore.subscribe, pendingAiStore.getSnapshot, pendingAiStore.getSnapshot);
    const pending = current?.owner === owner ? current : null;
    const [result, setResult] = useState<Recovered | null>(null), [message, setMessage] = useState<string | null>(null), [checking, setChecking] = useState(false);
    const alive = useRef(true), lock = useRef(false), version = useRef(0);
    const invalidateVersion = useCallback(() => { version.current++; }, []);
    useEffect(() => {
        alive.current = true;
        const restore = () => {
            if (!owner || AppState.currentState !== 'active')
                return;
            const revision = version.current;
            void loadPendingAi(owner).then(value => {
                if (alive.current && version.current === revision && value && !pendingAiStore.getSnapshot())
                    showPendingAi(owner, value);
            }).catch(() => { if (alive.current)
                setMessage('The existing AI operation could not be loaded. Please try again.'); });
        };
        restore();
        const app = AppState.addEventListener('change', state => { if (state === 'active')
            restore(); });
        return () => { alive.current = false; invalidateVersion(); app.remove(); if (owner)
            hidePendingAi(owner); };
    }, [owner, invalidateVersion]);
    const consume = useCallback(() => {
        if (!owner || !result)
            return;
        const key = result.key;
        setResult(null);
        void clearPendingAi(owner, key).catch(() => { if (alive.current)
            setMessage('The existing AI operation could not be loaded. Please try again.'); });
    }, [owner, result]);
    async function check() {
        if (!owner || !pending || lock.current || pending.checking)
            return;
        lock.current = true;
        const revision = ++version.current;
        setChecking(true);
        setMessage(null);
        try {
            const status = await apiFetch(`/api/mobile/ai-status?operation=${pending.pending.operation}`, { headers: { 'Idempotency-Key': pending.pending.key } }, aiStatusSchema);
            if (!alive.current || revision !== version.current)
                return;
            if (status.state === 'pending') {
                setMessage('Your AI result is not yet confirmed. Check the existing operation before starting another.');
                return;
            }
            if (status.state === 'not_found' && Date.now() < pending.pending.startedAt + 300000) {
                setMessage('Your AI result is not yet confirmed. Check the existing operation before starting another.');
                return;
            }
            if (status.state === 'not_found' || status.state === 'expired') {
                setMessage(status.state === 'expired' ? 'The result recovery window has expired. Saved recipes and your plan remain available.' : 'No operation was found. A usage credit refund has not been confirmed.');
                await clearPendingAi(owner, pending.pending.key);
                return;
            }
            if (status.status >= 300) {
                setMessage(status.response.creditReturned === true ? 'The AI operation did not complete. Your usage credit was returned.' : 'The AI operation did not complete. Its usage credit could not be confirmed.');
                await clearPendingAi(owner, pending.pending.key);
                void refreshMembership();
                return;
            }
            const operation = pending.pending.operation;
            const schema = operation === 'recipes' ? recipeResponseSchema : operation === 'scan' ? visionSchema : operation === 'modify' ? savedRecipeSchema : mealPlanSchema;
            const value = schema.safeParse(operation === 'modify' ? status.response.recipe : status.response);
            if (!value.success)
                throw new ApiError('Invalid result.', 502, 'invalid_response');
            if (operation === 'plan' || operation === 'regenerate' || operation === 'modify') {
                invalidate?.(operation === 'modify' ? 'recipes' : 'plan');
                await clearPendingAi(owner, pending.pending.key);
                if (alive.current)
                    router.navigate(operation === 'modify' ? '/saved-recipes' : '/meal-plan');
            }
            else {
                setResult({ operation, response: value.data, key: pending.pending.key });
                router.navigate(operation === 'scan' ? '/scan' : '/cook');
            }
            void refreshMembership();
        }
        catch {
            if (alive.current)
                setMessage('Your AI result is not yet confirmed. Check the existing operation before starting another.');
        }
        finally {
            lock.current = false;
            if (alive.current)
                setChecking(false);
        }
    }
    return <Context.Provider value={{ result, consume }}>
    {owner && (pending || message) ? <View className="bg-surface-2 px-5 pb-3 pt-3">
      <Notice title={t(pending?.checking ? 'Checking the existing AI result…' : 'AI operation status')} description={t(message ?? 'Your AI result is not yet confirmed. Check the existing operation before starting another.')}/>
      {pending ? <Button variant="ghost" label={t('Check existing result')} onPress={check} loading={checking} disabled={pending.checking}/> : <Button variant="ghost" label={t('Dismiss message')} onPress={() => setMessage(null)}/>}
    </View> : null}
    {children}
  </Context.Provider>;
}
