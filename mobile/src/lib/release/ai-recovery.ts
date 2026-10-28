import { z } from 'zod';
import { ApiError } from './request';
import { readPreference, writePreference } from './storage';
export type AiOperation = 'recipes' | 'modify' | 'scan' | 'plan' | 'regenerate';
const pendingSchema = z.object({
    operation: z.enum(['recipes', 'modify', 'scan', 'plan', 'regenerate']),
    key: z.string().min(8).max(128), startedAt: z.number().finite().positive(),
});
export type PendingAi = z.infer<typeof pendingSchema>;
export const aiStatusSchema = z.discriminatedUnion('state', [
    z.object({ state: z.literal('pending'), deadlineAt: z.string().datetime({ offset: true }) }),
    z.object({ state: z.literal('completed'), status: z.number().int().min(200).max(599), response: z.record(z.string(), z.unknown()) }),
    z.object({ state: z.literal('not_found') }), z.object({ state: z.literal('expired') }),
]);
export type AiStatus = z.infer<typeof aiStatusSchema>;
type Snapshot = {
    owner: string;
    pending: PendingAi;
    checking: boolean;
} | null;
let snapshot: Snapshot = null;
const listeners = new Set<() => void>();
const storageKey = (owner: string) => `ai-pending-${owner}`;
let writes = Promise.resolve();
function persist(owner: string, value: PendingAi | null) {
    const write = writes.catch(() => { }).then(() => writePreference(storageKey(owner), value ? JSON.stringify(value) : null));
    writes = write;
    return write;
}
function publish(next: Snapshot) { snapshot = next; listeners.forEach(fn => fn()); }
export const pendingAiStore = {
    subscribe(fn: () => void) { listeners.add(fn); return () => { listeners.delete(fn); }; },
    getSnapshot: () => snapshot,
};
export function aiOperation(path: string, method: string): AiOperation | null {
    if (method === 'POST' && path === '/api/recipes')
        return 'recipes';
    if (method === 'POST' && path === '/api/recipes/modify')
        return 'modify';
    if (method === 'POST' && path === '/api/vision')
        return 'scan';
    if (method === 'POST' && path === '/api/meal-plan/generate')
        return 'plan';
    if (method === 'PATCH' && path === '/api/meal-plan/regenerate-day')
        return 'regenerate';
    return null;
}
export async function loadPendingAi(owner: string): Promise<PendingAi | null> {
    if (snapshot?.owner === owner)
        return snapshot.pending;
    const raw = await readPreference(storageKey(owner));
    let pending: PendingAi | null = null;
    try {
        pending = raw ? pendingSchema.parse(JSON.parse(raw)) : null;
    }
    catch {
        await persist(owner, null);
    }
    // A pointer cannot retrieve content after the approved 24h recovery window.
    if (pending && Date.now() - pending.startedAt > 86400000 + 300000) {
        await persist(owner, null);
        pending = null;
    }
    return pending;
}
const startingOwners = new Set<string>();
export async function startPendingAi(owner: string, pending: PendingAi) {
    if (startingOwners.has(owner))
        throw new ApiError('AI operation starting.', 409, 'operation_pending');
    startingOwners.add(owner);
    try {
        const existing = await loadPendingAi(owner);
        if (existing)
            throw new ApiError('Check the existing AI result first.', 409, 'operation_pending', existing.key);
        await persist(owner, pending); // no request is sent if pointer storage fails
        publish({ owner, pending, checking: false });
    }
    finally {
        startingOwners.delete(owner);
    }
}
export async function clearPendingAi(owner: string, key?: string) {
    const existing = await loadPendingAi(owner);
    if (key && existing?.key !== key)
        return;
    await persist(owner, null);
    if (snapshot?.owner === owner)
        publish(null);
}
export function showPendingAi(owner: string, pending: PendingAi, checking = false) { publish({ owner, pending, checking }); }
export function hidePendingAi(owner: string) { if (snapshot?.owner === owner)
    publish(null); }
// Safe status reads only. A failed/uncertain POST is NEVER replayed here.
export async function recoverAiResult(pending: PendingAi, read: (signal: AbortSignal) => Promise<AiStatus>, options: {
    now?: () => number;
    wait?: (ms: number) => Promise<void>;
    signal?: AbortSignal;
} = {}): Promise<unknown> {
    const now = options.now ?? Date.now, wait = options.wait ?? (ms => new Promise(resolve => setTimeout(resolve, ms)));
    let deadline = pending.startedAt + 300000, notFound = false;
    while (now() < deadline) {
        if (options.signal?.aborted)
            throw new ApiError('Request cancelled.', 0, 'cancelled', pending.key);
        const controller = new AbortController(), abort = () => controller.abort();
        options.signal?.addEventListener('abort', abort, { once: true });
        const timer = setTimeout(abort, Math.max(1, Math.min(20000, deadline - now())));
        let result: AiStatus | undefined;
        try {
            result = aiStatusSchema.parse(await read(controller.signal));
        }
        catch (error) {
            if (error instanceof ApiError && ([401, 403].includes(error.status) || (error.code === 'cancelled' && !controller.signal.aborted)))
                throw error;
            // Offline/temporary status failure is uncertainty, never a fabricated refund.
        }
        finally {
            clearTimeout(timer);
            options.signal?.removeEventListener('abort', abort);
        }
        if (result?.state === 'completed') {
            if (result.status >= 300)
                throw new ApiError('AI operation failed.', result.status, typeof result.response.code === 'string' ? result.response.code : 'generation_failed', pending.key);
            return result.response;
        }
        if (result?.state === 'expired')
            throw new ApiError('Result recovery expired.', 410, 'request_expired', pending.key);
        if (result)
            notFound = result.state === 'not_found';
        if (result?.state === 'pending')
            deadline = Math.min(deadline, Date.parse(result.deadlineAt));
        if (now() < deadline)
            await wait(Math.min(5000, deadline - now()));
    }
    if (notFound)
        throw new ApiError('Result not found; no refund confirmed.', 404, 'ai_job_not_found', pending.key);
    throw new ApiError('Result not yet confirmed. Check its status.', 0, 'result_confirmation_pending', pending.key);
}
