import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { recoverAiResult, startPendingAi, loadPendingAi, clearPendingAi, pendingAiStore, aiOperation, type AiStatus } from '@/lib/release/ai-recovery';
import { ApiError } from '@/lib/release/request';
const mockStorage = new Map<string, string>();
jest.mock('@/lib/release/storage', () => ({
    readPreference: async (key: string) => mockStorage.get(key) ?? null,
    writePreference: async (key: string, value: string | null) => { if (value === null)
        mockStorage.delete(key);
    else
        mockStorage.set(key, value); },
}));
const pending = { operation: 'recipes' as const, key: 'fixture-request-key', startedAt: 1000 };
beforeEach(async () => {
    for (const owner of ['a', 'b'])
        await clearPendingAi(owner);
    mockStorage.clear();
});
describe('bounded existing AI result recovery', () => {
    it('reads an existing successful result without generating again', async () => {
        let now = 1000, calls = 0;
        const result = await recoverAiResult(pending, async () => {
            calls++;
            return calls === 1 ? { state: 'pending', deadlineAt: new Date(301000).toISOString() } : { state: 'completed', status: 200, response: { recipe: 'existing' } };
        }, { now: () => now, wait: async (ms) => { now += ms; } });
        expect(result).toEqual({ recipe: 'existing' });
        expect(calls).toBe(2);
    });
    it('never waits beyond five minutes or invents a refund on uncertainty', async () => {
        let now = 1000;
        const read = jest.fn<() => Promise<AiStatus>>(async () => { throw new ApiError('offline', 0, 'offline'); });
        await expect(recoverAiResult(pending, read, { now: () => now, wait: async (ms) => { now += ms; } })).rejects.toMatchObject({ code: 'result_confirmation_pending' });
        expect(now).toBe(301000);
        expect(read.mock.calls.length).toBe(60);
    });
    it('respects an earlier server deadline and never restarts generation', async () => {
        let now = 1000;
        await expect(recoverAiResult(pending, async () => ({ state: 'pending', deadlineAt: new Date(11000).toISOString() }), { now: () => now, wait: async (ms) => { now += ms; } })).rejects.toMatchObject({ code: 'result_confirmation_pending' });
        expect(now).toBe(11000);
    });
    it('returns server-confirmed failure once and distinguishes unknown/expired results', async () => {
        for (const [status, code] of [[{ state: 'completed', status: 504, response: { code: 'ai_result_unavailable', creditReturned: true } }, 'ai_result_unavailable'], [{ state: 'not_found' }, 'ai_job_not_found'], [{ state: 'expired' }, 'request_expired']] as const) {
            let time = 1000;
            await expect(recoverAiResult(pending, async () => status, { now: () => time, wait: async (ms) => { time += ms; } })).rejects.toMatchObject({ code });
        }
    });
    it('cancels on account disposal and rejects malformed status without content leakage', async () => {
        const signal = new AbortController();
        signal.abort();
        const read = jest.fn<() => Promise<AiStatus>>();
        await expect(recoverAiResult(pending, read, { now: () => 1000, signal: signal.signal })).rejects.toMatchObject({ code: 'cancelled' });
        expect(read).not.toHaveBeenCalled();
        let now = 1000;
        await expect(recoverAiResult(pending, async () => ({ private: 'not status' }) as unknown as AiStatus, { now: () => now, wait: async () => { now = 301000; } })).rejects.toMatchObject({ code: 'result_confirmation_pending' });
    });
    it('stores only a per-account opaque pointer and serializes competing starts', async () => {
        const results = await Promise.allSettled([startPendingAi('a', pending), startPendingAi('a', { ...pending, key: 'other-request-key' })]);
        expect(results.map(r => r.status).sort()).toEqual(['fulfilled', 'rejected']);
        expect(await loadPendingAi('b')).toBeNull();
        const stored = JSON.parse(mockStorage.get('ai-pending-a')!);
        expect(Object.keys(stored).sort()).toEqual(['key', 'operation', 'startedAt']);
        expect(stored).not.toHaveProperty('response');
        await clearPendingAi('a', 'other-request-key');
        expect(pendingAiStore.getSnapshot()).not.toBeNull();
        await clearPendingAi('a', pending.key);
        expect(pendingAiStore.getSnapshot()).toBeNull();
    });
    it('maps only the five existing generation routes, not saved content reads/writes', () => {
        expect(aiOperation('/api/recipes', 'POST')).toBe('recipes');
        expect(aiOperation('/api/vision', 'POST')).toBe('scan');
        expect(aiOperation('/api/meal-plan/generate', 'POST')).toBe('plan');
        expect(aiOperation('/api/meal-plan/regenerate-day', 'PATCH')).toBe('regenerate');
        expect(aiOperation('/api/recipes/modify', 'POST')).toBe('modify');
        for (const path of ['/api/recipes/save', '/api/recipes/history', '/api/meal-plan', '/api/pantry'])
            expect(aiOperation(path, 'GET')).toBeNull();
        expect(aiOperation('/api/recipes/save', 'POST')).toBeNull();
    });
});
