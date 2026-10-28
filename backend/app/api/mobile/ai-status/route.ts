import { NextResponse } from 'next/server';
import { authenticated, failure } from '@/lib/mobile/service';
import { createAdminClient } from '@/lib/supabase/admin';
import { isObject, requestKey } from '@/lib/mobile/validation';
// Read/reconcile the caller's existing operation. Never dispatches AI.
export async function GET(request: Request) {
    const { user } = await authenticated();
    if (!user)
        return failure('unauthenticated', 401);
    const operation = new URL(request.url).searchParams.get('operation');
    const key = requestKey(request.headers.get('Idempotency-Key'));
    if (!key || !operation || !['recipes', 'modify', 'scan', 'plan', 'regenerate'].includes(operation))
        return failure('invalid_body', 400);
    const { data, error } = await createAdminClient().rpc('mobile_ai_status', {
        p_user: user.id, p_operation: operation, p_key: key,
    });
    if (error || !isObject(data) || !['not_found', 'pending', 'completed', 'expired'].includes(String(data.state)))
        return failure('result_confirmation_failed');
    return NextResponse.json(data, { headers: { 'Cache-Control': 'no-store' } });
}
