import { AsyncLocalStorage } from 'node:async_hooks';
type Operation = 'recipes' | 'modify' | 'scan' | 'plan' | 'regenerate';
type Scope = {
    jobId: string;
    operation: Operation;
    attempt: number;
    beforeCall?: (attempt: number, model: string) => Promise<void>;
    afterCall?: (attempt: number, record: Record<string, unknown>) => Promise<void>;
};
const scope = new AsyncLocalStorage<Scope>();
export function observeProviderOperation<T>(jobId: string, operation: Operation, work: () => Promise<T>, hooks: Pick<Scope, 'beforeCall' | 'afterCall'> = {}) {
    return scope.run({ jobId, operation, attempt: 0, ...hooks }, work);
}
const integer = (value: unknown) => typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 ? value : null;
const modelName = (value: unknown) => typeof value === 'string' && /^gemini-[a-z0-9.-]{1,100}$/.test(value) ? value : null;
export async function measureProviderCall<T>(call: () => Promise<T>, requestedModel: string, writer: (record: Record<string, unknown>) => void = record => console.info(JSON.stringify(record)), clock = () => performance.now()): Promise<T> {
    const context = scope.getStore(), attempt = context ? ++context.attempt : 1;
    await context?.beforeCall?.(attempt, requestedModel);
    const started = clock();
    const base = { event: 'ai_provider_attempt', schemaVersion: 1, jobId: context && /^[a-f0-9-]{36}$/i.test(context.jobId) ? context.jobId : null, operation: context?.operation ?? 'unknown', attempt, requestedModel: modelName(requestedModel) };
    const write = async (record: Record<string, unknown>) => {
        try {
            writer(record);
        }
        catch { /* Observability must not change provider execution. */ }
        if (record.phase === 'finished') {
            try {
                await context?.afterCall?.(attempt, record);
            }
            catch { /* Claimed attempt remains durably unknown. */ }
        }
    };
    await write({ ...base, phase: 'started' });
    try {
        const result = await call();
        try {
            const response = (result as {
                response?: {
                    usageMetadata?: Record<string, unknown>;
                    modelVersion?: unknown;
                };
            })?.response;
            const usage = response?.usageMetadata;
            await write({ ...base, phase: 'finished', outcome: 'response', elapsedMs: Math.max(0, Math.round(clock() - started)), resolvedModel: modelName(response?.modelVersion),
                inputTokens: integer(usage?.promptTokenCount), outputTokens: integer(usage?.candidatesTokenCount), thinkingTokens: integer(usage?.thoughtsTokenCount), cachedTokens: integer(usage?.cachedContentTokenCount), totalTokens: integer(usage?.totalTokenCount),
                // No tariff/invoice data is available. Never infer a zero bill from missing metadata.
                estimatedCharge: null, billedCharge: null });
        }
        catch {
            await write({ ...base, phase: 'finished', outcome: 'response', inputTokens: null, outputTokens: null, thinkingTokens: null, cachedTokens: null, totalTokens: null, estimatedCharge: null, billedCharge: null });
        }
        return result;
    }
    catch (error) {
        const status = error && typeof error === 'object' && 'status' in error ? error.status : null;
        await write({ ...base, phase: 'finished', outcome: 'error', elapsedMs: Math.max(0, Math.round(clock() - started)), providerStatus: typeof status === 'number' && status >= 400 && status <= 599 ? status : null, inputTokens: null, outputTokens: null, thinkingTokens: null, cachedTokens: null, totalTokens: null, estimatedCharge: null, billedCharge: null });
        throw error;
    }
}

// Every production Gemini entry point uses this mandatory dispatch boundary.
export async function dispatchProviderCall<T>(call:()=>Promise<T>,model:string):Promise<T> {
    if(!scope.getStore()?.beforeCall)throw new Error('dispatch_not_authorized');
    return measureProviderCall(call,model);
}
