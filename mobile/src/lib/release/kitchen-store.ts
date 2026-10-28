import type { MealPlan, PantryItem } from '@/lib/types';
import type { SavedRecipe } from './contracts';
import { localDay, localWeek } from './recommendations';
export type Resource = 'pantry' | 'recipes' | 'plan';
export type KitchenData = {
    pantry: PantryItem[];
    recipes: SavedRecipe[];
    plan: MealPlan | null;
};
type Part<T> = {
    data: T | null;
    loading: boolean;
    loaded: boolean;
    error: boolean;
};
export type KitchenSnapshot = {
    [K in Resource]: Part<KitchenData[K]>;
} & {
    day: string;
    week: string;
};
export class KitchenStore {
    private listeners = new Set<() => void>();
    private generation = { pantry: 0, recipes: 0, plan: 0 };
    private pending = new Map<Resource, {
        generation: number;
        promise: Promise<void>;
    }>();
    private live = true;
    private state: KitchenSnapshot;
    constructor(private reader: <K extends Resource>(key: K) => Promise<KitchenData[K]>, now = new Date()) {
        const part = () => ({ data: null, loading: false, loaded: false, error: false });
        this.state = { pantry: part(), recipes: part(), plan: part(), day: localDay(now), week: localWeek(now) };
    }
    subscribe = (listener: () => void) => { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; };
    snapshot = () => this.state;
    private emit() { for (const listener of this.listeners)
        listener(); }
    async load(key: Resource) {
        if (!this.live)
            return;
        const generation = this.generation[key];
        const previous = this.pending.get(key);
        if (previous?.generation === generation)
            return previous.promise;
        this.state = { ...this.state, [key]: { ...this.state[key], loading: true } };
        this.emit();
        const promise = (async () => {
            try {
                const data = await this.reader(key);
                if (this.live && generation === this.generation[key])
                    this.state = { ...this.state, [key]: { data, loading: false, loaded: true, error: false } };
            }
            catch {
                if (this.live && generation === this.generation[key])
                    this.state = { ...this.state, [key]: { ...this.state[key], loading: false, error: true } };
            }
            finally {
                if (this.pending.get(key)?.generation === generation)
                    this.pending.delete(key);
                if (this.live && generation === this.generation[key])
                    this.emit();
            }
        })();
        this.pending.set(key, { generation, promise });
        return promise;
    }
    refresh = async () => { await Promise.all((['pantry', 'recipes', 'plan'] as const).map(key => this.load(key))); };
    invalidate = (key: Resource) => { this.generation[key]++; this.state = { ...this.state, [key]: { ...this.state[key], loaded: false } }; this.emit(); };
    tick = (now = new Date()) => {
        const day = localDay(now), week = localWeek(now);
        if (day === this.state.day && week === this.state.week)
            return;
        const refreshPlan = week !== this.state.week && (this.state.plan.loaded || !!this.state.plan.data);
        if (week !== this.state.week) {
            this.generation.plan++;
            this.state = { ...this.state, plan: { data: null, loading: false, loaded: false, error: false } };
        }
        this.state = { ...this.state, day, week };
        this.emit();
        if (refreshPlan)
            void this.load('plan');
    };
    activate = () => { this.live = true; };
    dispose = () => { this.live = false; this.listeners.clear(); for (const key of ['pantry', 'recipes', 'plan'] as const)
        this.generation[key]++; };
}
