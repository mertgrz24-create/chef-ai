import { describe, it, expect } from '@jest/globals';
import { recommendations, ingredientName, localWeek } from '@/lib/release/recommendations';
import { KitchenStore, type KitchenData } from '@/lib/release/kitchen-store';
import type { SavedRecipe } from '@/lib/release/contracts';
import type { PantryItem, MealPlan } from '@/lib/types';
const now = new Date('2026-10-17T12:00:00');
const recipe = (id: string, ingredients = ['tomato']): SavedRecipe => ({ id, name: id, ingredients, instructions: 'Simmer ' + id, macros: null, is_public: false, created_at: '' });
const stock = (name: string, date: string | null = '2026-10-19'): PantryItem => ({ id: name, name, quantity: null, expiry_date: date, created_at: '', revision: 0 });
const plan = (minutes: number | undefined = 20, week = '2026-10-12'): MealPlan => ({ id: 'plan', user_id: 'a', week_start_date: week, created_at: '', updated_at: '', meals: [{ day: 'monday', breakfast: { ...recipe('breakfast'), macros: undefined, prep_time_min: minutes, cook_time_min: minutes === undefined ? undefined : 5 }, dinner: { ...recipe('dinner', ['egg']), macros: undefined, prep_time_min: 40, cook_time_min: 5 } }] });
describe('B — deterministic existing-content recommendations', () => {
    it('matches audited TR/EN names without substituting milk products', () => {
        expect(ingredientName(' 2 cups FLOUR ')).toBe('flour');
        expect(ingredientName('1 su bardağı un')).toBe('flour');
        expect(ingredientName('süt')).not.toBe(ingredientName('almond milk'));
        expect(recommendations([recipe('r', ['milk'])], null, [stock('badem sütü')], 'pantry', now).items).toHaveLength(0);
    });
    it('rejects expired/today/invalid dates; undated stock has no urgency', () => {
        for (const date of ['2026-10-16', '2026-10-17', '2026-02-30'])
            expect(recommendations([recipe('r')], null, [stock('tomato', date)], 'pantry', now).items).toHaveLength(0);
        const result = recommendations([recipe('r')], null, [stock('domates', null)], 'pantry', now);
        expect(result.items[0]).toMatchObject({ matches: 1, urgent: 0 });
    });
    it('does not treat zero matches as pantry recommendations', () => {
        const result = recommendations([recipe('r')], null, [stock('egg')], 'pantry', now);
        expect(result.items).toHaveLength(0);
        expect(result.empty).toBe('no_matches');
    });
    it('distinguishes missing time from known times above 30 minutes', () => {
        expect(recommendations([recipe('r')], null, [], 'quick', now).empty).toBe('unknown_time');
        const p = plan(40);
        expect(recommendations([], p, [], 'quick', now)).toMatchObject({ empty: 'no_quick', items: [] });
        expect(recommendations([], plan(), [], 'quick', now).items.map(r => r.recipe.name)).toEqual(['breakfast']);
        const partial = plan();
        delete partial.meals[0].breakfast.cook_time_min;
        expect(recommendations([], partial, [], 'quick', now).items).toHaveLength(0);
    });
    it('keeps empty-pantry content honest and never pads or merges solely by name', () => {
        const a = recipe('a'), b = { ...recipe('b', ['egg']), name: 'a' };
        const result = recommendations([a, { ...a, id: 'copy' }, b], null, [], 'pantry', now);
        expect(result.items).toHaveLength(2);
        expect(result.items.every(r => r.matches === 0)).toBe(true);
    });
    it('ignores plans from another week and recomputes at day/week rollover', () => {
        expect(localWeek(now)).toBe('2026-10-12');
        expect(recommendations([], plan(), [], 'pantry', new Date('2026-10-19T12:00:00')).items).toHaveLength(0);
        const r = recipe('r'), p = [stock('tomato', '2026-10-18')];
        expect(recommendations([r], null, p, 'pantry', now).items).toHaveLength(1);
        expect(recommendations([r], null, p, 'pantry', new Date('2026-10-18T12:00:00')).items).toHaveLength(0);
    });
});
describe('C — account-scoped memory freshness', () => {
    it('refreshes ingredient, saved-recipe and plan mutations without downloads on filtering', async () => {
        let reads = 0;
        const data: KitchenData = { pantry: [stock('egg')], recipes: [recipe('a')], plan: null };
        const store = new KitchenStore(async (key) => { reads++; return data[key]; }, now);
        await store.refresh();
        expect(reads).toBe(3);
        for (const mode of ['pantry', 'quick', 'pantry'] as const)
            recommendations(store.snapshot().recipes.data!, store.snapshot().plan.data, store.snapshot().pantry.data!, mode, now);
        expect(reads).toBe(3);
        data.pantry = [stock('tomato')];
        store.invalidate('pantry');
        await store.load('pantry');
        expect(recommendations(store.snapshot().recipes.data!, null, store.snapshot().pantry.data!, 'pantry', now).items).toHaveLength(1);
        data.recipes=[...data.recipes,recipe('new')];
        store.invalidate('recipes');
        await store.load('recipes');
        expect(store.snapshot().recipes.data).toHaveLength(2);
        data.plan = plan();
        store.invalidate('plan');
        await store.load('plan');
        expect(store.snapshot().plan.data?.id).toBe('plan');
    });
    it('discards stale responses and never carries account A content into B', async () => {
        let finish!: (value: PantryItem[]) => void;
        const a = new KitchenStore(async (key) => (key === 'pantry' ? await new Promise<PantryItem[]>(resolve => { finish = resolve; }) : null) as never, now);
        const pending = a.load('pantry');
        a.dispose();
        const b = new KitchenStore(async () => [] as never, now);
        finish([stock('private-a')]);
        await pending;
        expect(a.snapshot().pantry.data).toBeNull();
        expect(b.snapshot().pantry.data).toBeNull();
    });
    it('retains successful content on read failure and refreshes a loaded plan at the next week', async () => {
        let fail = false, reads = 0;
        const store = new KitchenStore(async (key) => { reads++; if (fail)
            throw Error('offline'); return (key === 'plan' ? plan() : []) as never; }, now);
        await store.load('plan');
        fail = true;
        await store.load('plan');
        expect(store.snapshot().plan).toMatchObject({ error: true, data: { id: 'plan' } });
        fail = false;
        const before = reads;
        store.tick(new Date('2026-10-19T00:00:00'));
        await store.load('plan');
        expect(reads).toBe(before + 1);
        expect(store.snapshot().week).toBe('2026-10-19');
    });
});
it('C invalidation rejects an older in-flight read after a confirmed change', async () => {
    let release!: (v: PantryItem[]) => void, calls = 0;
    const store = new KitchenStore(async (key) => {
        if (key !== 'pantry')
            return null as never;
        calls++;
        if (calls === 1)
            return await new Promise<PantryItem[]>(resolve => { release = resolve; }) as never;
        return [stock('new')] as never;
    }, now);
    const older = store.load('pantry');
    store.invalidate('pantry');
    await store.load('pantry');
    release([stock('old')]);
    await older;
    expect(store.snapshot().pantry.data?.[0].name).toBe('new');
});

it('B deduplicates sources while retaining verified timing from the weekly plan',()=>{
 const saved=recipe('same'),p=plan()
 p.meals[0].breakfast={name:saved.name,ingredients:saved.ingredients,instructions:saved.instructions,prep_time_min:5,cook_time_min:10}
 const result=recommendations([saved],p,[],'quick',now)
 expect(result.items).toHaveLength(1)
 expect(result.items[0]).toMatchObject({source:'plan',minutes:15})
})
