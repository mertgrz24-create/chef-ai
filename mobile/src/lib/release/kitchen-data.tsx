import { createContext, useContext, useEffect, useState, useSyncExternalStore, type ReactNode } from 'react';
import { AppState } from 'react-native';
import { apiFetch, ApiError } from '@/lib/api';
import { recipeHistory } from './recipes';
import { KitchenStore, type KitchenData, type Resource } from './kitchen-store';
const Context = createContext<KitchenStore | null>(null);
export function KitchenDataProvider({ children }: {
    children: ReactNode;
}) {
    const [store] = useState(() => new KitchenStore(async <K extends Resource>(key: K): Promise<KitchenData[K]> => {
        if (key === 'pantry')
            return (await apiFetch<{
                items: KitchenData['pantry'];
            }>('/api/pantry')).items as KitchenData[K];
        if (key === 'recipes')
            return (await recipeHistory()).recipes as KitchenData[K];
        try {
            return (await apiFetch<{
                plan: KitchenData['plan'];
            }>('/api/meal-plan')).plan as KitchenData[K];
        }
        catch (error) {
            if (error instanceof ApiError && error.status === 404)
                return null as KitchenData[K];
            throw error;
        }
    }));
    useEffect(() => {
        store.activate();
        const timer = setInterval(() => store.tick(), 30000);
        const app = AppState.addEventListener('change', state => { if (state === 'active') {
            store.tick();
            const s = store.snapshot();
            if (s.pantry.loaded || s.recipes.loaded || s.plan.loaded)
                void store.refresh();
        } });
        return () => { clearInterval(timer); app.remove(); store.dispose(); };
    }, [store]);
    return <Context.Provider value={store}>{children}</Context.Provider>;
}
export function useKitchen() {
    const store = useContext(Context);
    if (!store)
        throw new Error('KitchenDataProvider missing');
    const snapshot = useSyncExternalStore(store.subscribe, store.snapshot, store.snapshot);
    return { store, snapshot };
}
// Reusable mutation surfaces can also live outside the signed-in content provider.
export function useKitchenInvalidation() {
    const store = useContext(Context);
    return store?.invalidate;
}
