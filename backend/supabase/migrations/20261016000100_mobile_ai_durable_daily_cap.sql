-- Anonymous daily operation reservations survive account cascades and job cleanup.
-- This is an operation-attempt cap, not a provider invoice/token-cost ledger.
BEGIN;
-- Serialize the cutover with old and new reservation callers.
SELECT pg_advisory_xact_lock(hashtextextended('ai:global',0));
CREATE TABLE IF NOT EXISTS public.mobile_ai_daily_attempts (
 day date PRIMARY KEY,
 attempts bigint NOT NULL CHECK(attempts>=0)
);
ALTER TABLE public.mobile_ai_daily_attempts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.mobile_ai_daily_attempts FROM PUBLIC,anon,authenticated,service_role;
GRANT SELECT ON public.mobile_ai_daily_attempts TO service_role;
-- Recover only surviving records; deleted historical attempts cannot be reconstructed.
INSERT INTO public.mobile_ai_daily_attempts(day,attempts)
 SELECT (created_at AT TIME ZONE 'UTC')::date,count(*) FROM public.mobile_ai_jobs
 GROUP BY (created_at AT TIME ZONE 'UTC')::date
 ON CONFLICT(day) DO UPDATE SET attempts=GREATEST(public.mobile_ai_daily_attempts.attempts,EXCLUDED.attempts);
CREATE OR REPLACE FUNCTION public.begin_mobile_ai(p_user uuid,p_operation text,p_key text,p_hash text,p_limit int,p_global int,p_consent text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE job public.mobile_ai_jobs%ROWTYPE;v_kind text;v_used int;v_period date:=date_trunc('month',now() AT TIME ZONE 'UTC')::date;v_day date:=(now() AT TIME ZONE 'UTC')::date;
BEGIN
 IF p_user IS NULL OR p_operation IS NULL OR p_limit IS NULL OR p_global IS NULL OR p_key IS NULL OR p_hash IS NULL OR p_consent IS NULL OR p_key='' OR p_hash='' OR p_consent='' OR p_operation NOT IN ('recipes','modify','scan','plan','regenerate') OR p_limit<1 OR p_limit>10000 OR p_global<1 OR p_global>100000 THEN RETURN jsonb_build_object('code','configuration'); END IF;
 v_kind:=CASE WHEN p_operation IN ('recipes','modify') THEN 'recipes' WHEN p_operation='scan' THEN 'scans' ELSE 'plans' END;
 -- Quotas and concurrency are global across operation types for this account.
 PERFORM pg_advisory_xact_lock(hashtextextended('ai:global',0));
 IF NOT EXISTS(SELECT 1 FROM public.mobile_consents WHERE user_id=p_user AND accepted AND version=p_consent) THEN RETURN jsonb_build_object('code','consent_required');END IF;
 SELECT * INTO job FROM public.mobile_ai_jobs WHERE user_id=p_user AND operation=p_operation AND request_key=p_key;
 IF FOUND THEN
  IF job.request_hash<>p_hash THEN RETURN jsonb_build_object('code','idempotency_conflict');END IF;
  IF job.expires_at<=now() THEN RETURN jsonb_build_object('code','request_expired');END IF;
  IF job.status='pending' THEN RETURN jsonb_build_object('code','operation_pending');END IF;
  RETURN jsonb_build_object('code','replay','response',job.response,'status',job.http_status);
 END IF;
 IF EXISTS(SELECT 1 FROM public.mobile_ai_jobs WHERE user_id=p_user AND status='pending' AND created_at>now()-interval '10 minutes') THEN RETURN jsonb_build_object('code','operation_pending');END IF;
 IF (SELECT count(*) FROM public.mobile_ai_jobs WHERE user_id=p_user AND created_at>now()-interval '15 minutes')>=5 OR
 COALESCE((SELECT attempts FROM public.mobile_ai_daily_attempts WHERE day=v_day),0)>=p_global THEN RETURN jsonb_build_object('code','rate_limited');END IF;
 INSERT INTO public.mobile_ai_usage VALUES(p_user,v_period,v_kind,0) ON CONFLICT DO NOTHING;
 SELECT used INTO v_used FROM public.mobile_ai_usage WHERE user_id=p_user AND period=v_period AND kind=v_kind FOR UPDATE;
 IF v_used>=p_limit THEN RETURN jsonb_build_object('code','limit_reached');END IF;
 UPDATE public.mobile_ai_usage SET used=used+1 WHERE user_id=p_user AND period=v_period AND kind=v_kind;
 INSERT INTO public.mobile_ai_jobs(user_id,operation,kind,request_key,request_hash,status) VALUES(p_user,p_operation,v_kind,p_key,p_hash,'pending') RETURNING * INTO job;
 -- Never refund this anonymous global reservation on failure, deletion or job cleanup.
 INSERT INTO public.mobile_ai_daily_attempts(day,attempts) VALUES(v_day,1)
 ON CONFLICT(day) DO UPDATE SET attempts=public.mobile_ai_daily_attempts.attempts+1;
 RETURN jsonb_build_object('code','started','id',job.id);
END;$$;
REVOKE ALL ON FUNCTION public.begin_mobile_ai(uuid,text,text,text,int,int,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.begin_mobile_ai(uuid,text,text,text,int,int,text) TO service_role;
COMMIT;
