-- Approved lifecycle: 5 minute deadline; 24h payload / 30d tombstone / 90d attempts.
-- Source only until explicitly authorized for remote rollout.
BEGIN;
SELECT pg_advisory_xact_lock(hashtextextended('ai:global',0));
ALTER TABLE public.mobile_ai_jobs ADD COLUMN deadline_at timestamptz;
ALTER TABLE public.mobile_ai_jobs ADD COLUMN settled_at timestamptz;
ALTER TABLE public.mobile_ai_jobs ADD COLUMN attempt_limit integer;
UPDATE public.mobile_ai_jobs SET deadline_at=created_at+interval '5 minutes',
 settled_at=CASE WHEN status<>'pending' THEN created_at ELSE NULL END;
ALTER TABLE public.mobile_ai_jobs ALTER COLUMN deadline_at SET NOT NULL;
ALTER TABLE public.mobile_ai_jobs ALTER COLUMN deadline_at SET DEFAULT now()+interval '5 minutes';
CREATE INDEX mobile_ai_jobs_deadline ON public.mobile_ai_jobs(deadline_at) WHERE status='pending';

CREATE TABLE public.mobile_ai_provider_attempts (
 job_id uuid NOT NULL, attempt integer NOT NULL CHECK(attempt>0),
 started_at timestamptz NOT NULL DEFAULT now(), finished_at timestamptz,
 requested_model text, resolved_model text, outcome text CHECK(outcome IN ('response','error')),
 input_tokens bigint CHECK(input_tokens>=0),output_tokens bigint CHECK(output_tokens>=0),
 thinking_tokens bigint CHECK(thinking_tokens>=0),cached_tokens bigint CHECK(cached_tokens>=0),
 total_tokens bigint CHECK(total_tokens>=0),provider_status integer CHECK(provider_status BETWEEN 400 AND 599),
 PRIMARY KEY(job_id,attempt)
);
-- Opaque job IDs only: no account, request/response, email, image or invoice data.
CREATE INDEX mobile_ai_attempt_retention ON public.mobile_ai_provider_attempts(started_at);
ALTER TABLE public.mobile_ai_provider_attempts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.mobile_ai_provider_attempts FROM PUBLIC,anon,authenticated,service_role;

-- Called under the same global lock by every lifecycle function. No double refund.
CREATE FUNCTION public.expire_mobile_ai(p_id uuid) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE j public.mobile_ai_jobs%ROWTYPE;
BEGIN
 PERFORM pg_advisory_xact_lock(hashtextextended('ai:global',0));
 SELECT * INTO j FROM public.mobile_ai_jobs WHERE id=p_id FOR UPDATE;
 IF FOUND AND j.status='pending' AND j.deadline_at<=clock_timestamp() THEN
  UPDATE public.mobile_ai_usage SET used=GREATEST(used-1,0)
   WHERE user_id=j.user_id AND kind=j.kind AND period=date_trunc('month',j.created_at AT TIME ZONE 'UTC')::date;
  UPDATE public.mobile_ai_jobs SET status='failed',http_status=504,
   response='{"code":"ai_result_unavailable","creditReturned":true}'::jsonb,
   settled_at=clock_timestamp(),expires_at=clock_timestamp()+interval '24 hours' WHERE id=j.id;
 END IF;
END;$$;

CREATE FUNCTION public.begin_mobile_ai_v2(p_user uuid,p_operation text,p_key text,p_hash text,p_limit int,p_global int,p_consent text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE j public.mobile_ai_jobs%ROWTYPE; v_kind text; v_used int;
 v_period date:=(date_trunc('month',now() AT TIME ZONE 'UTC'))::date; old_id uuid;
BEGIN
 IF p_user IS NULL OR p_operation IS NULL OR p_limit IS NULL OR p_global IS NULL OR p_key IS NULL OR p_hash IS NULL OR p_consent IS NULL OR p_key='' OR p_hash='' OR p_consent='' OR p_operation NOT IN ('recipes','modify','scan','plan','regenerate') OR p_limit<1 OR p_limit>10000 OR p_global<1 OR p_global>100000 THEN RETURN jsonb_build_object('code','configuration');END IF;
 v_kind:=CASE WHEN p_operation IN ('recipes','modify') THEN 'recipes' WHEN p_operation='scan' THEN 'scans' ELSE 'plans' END;
 PERFORM pg_advisory_xact_lock(hashtextextended('ai:global',0));
 IF NOT EXISTS(SELECT 1 FROM public.mobile_consents WHERE user_id=p_user AND accepted AND version=p_consent) THEN RETURN jsonb_build_object('code','consent_required');END IF;
 FOR old_id IN SELECT id FROM public.mobile_ai_jobs WHERE user_id=p_user AND status='pending' AND deadline_at<=clock_timestamp() LOOP
  PERFORM public.expire_mobile_ai(old_id);
 END LOOP;
 SELECT * INTO j FROM public.mobile_ai_jobs WHERE user_id=p_user AND operation=p_operation AND request_key=p_key;
 IF FOUND THEN
  IF j.request_hash<>p_hash THEN RETURN jsonb_build_object('code','idempotency_conflict');END IF;
  IF j.status='pending' THEN RETURN jsonb_build_object('code','operation_pending','deadlineAt',j.deadline_at);END IF;
  IF j.expires_at<=clock_timestamp() OR j.response IS NULL THEN RETURN jsonb_build_object('code','request_expired');END IF;
  RETURN jsonb_build_object('code','replay','response',j.response,'status',j.http_status);
 END IF;
 IF EXISTS(SELECT 1 FROM public.mobile_ai_jobs WHERE user_id=p_user AND status='pending') THEN RETURN jsonb_build_object('code','operation_pending');END IF;
 IF (SELECT count(*) FROM public.mobile_ai_jobs WHERE user_id=p_user AND created_at>now()-interval '15 minutes')>=5 OR
  COALESCE((SELECT attempts FROM public.mobile_ai_daily_attempts WHERE day=(clock_timestamp() AT TIME ZONE 'UTC')::date),0)>=p_global THEN RETURN jsonb_build_object('code','rate_limited');END IF;
 INSERT INTO public.mobile_ai_usage VALUES(p_user,v_period,v_kind,0) ON CONFLICT DO NOTHING;
 SELECT used INTO v_used FROM public.mobile_ai_usage WHERE user_id=p_user AND period=v_period AND kind=v_kind FOR UPDATE;
 IF v_used>=p_limit THEN RETURN jsonb_build_object('code','limit_reached');END IF;
 UPDATE public.mobile_ai_usage SET used=used+1 WHERE user_id=p_user AND period=v_period AND kind=v_kind;
 INSERT INTO public.mobile_ai_jobs(user_id,operation,kind,request_key,request_hash,status,attempt_limit)
 VALUES(p_user,p_operation,v_kind,p_key,p_hash,'pending',p_global) RETURNING * INTO j;
 RETURN jsonb_build_object('code','started','id',j.id,'deadlineAt',j.deadline_at);
END;$$;

-- Old backend deployments cannot start unmetered work after this migration.
CREATE OR REPLACE FUNCTION public.begin_mobile_ai(p_user uuid,p_operation text,p_key text,p_hash text,p_limit int,p_global int,p_consent text)
RETURNS jsonb LANGUAGE sql SECURITY DEFINER SET search_path=pg_catalog AS $$
 SELECT jsonb_build_object('code','policy_update_required');
$$;

-- Permission is consumed BEFORE each real SDK dispatch, including existing retry.
-- Ambiguous permission acknowledgments fail closed; never dispatch speculatively.
CREATE FUNCTION public.claim_mobile_ai_attempt(p_id uuid,p_user uuid,p_attempt int,p_model text) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE j public.mobile_ai_jobs%ROWTYPE; d date;
BEGIN
 PERFORM pg_advisory_xact_lock(hashtextextended('ai:global',0));
 PERFORM public.expire_mobile_ai(p_id);
 SELECT * INTO j FROM public.mobile_ai_jobs WHERE id=p_id AND user_id=p_user FOR UPDATE;
 IF NOT FOUND OR j.status<>'pending' OR j.attempt_limit IS NULL OR p_attempt IS NULL OR p_attempt<1 OR p_model IS NULL OR p_model !~ '^gemini-[a-z0-9.-]{1,100}$' THEN RETURN false;END IF;
 IF p_attempt<>(SELECT COALESCE(max(attempt),0)+1 FROM public.mobile_ai_provider_attempts WHERE job_id=p_id) THEN RETURN false;END IF;
 d:=(clock_timestamp() AT TIME ZONE 'UTC')::date;
 IF COALESCE((SELECT attempts FROM public.mobile_ai_daily_attempts WHERE day=d),0)>=j.attempt_limit THEN RETURN false;END IF;
 INSERT INTO public.mobile_ai_provider_attempts(job_id,attempt,requested_model) VALUES(p_id,p_attempt,p_model);
 INSERT INTO public.mobile_ai_daily_attempts(day,attempts) VALUES(d,1)
 ON CONFLICT(day) DO UPDATE SET attempts=public.mobile_ai_daily_attempts.attempts+1;
 RETURN true;
END;$$;

CREATE FUNCTION public.record_mobile_ai_attempt(p_id uuid,p_attempt int,p_metadata jsonb) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
BEGIN
 UPDATE public.mobile_ai_provider_attempts SET finished_at=clock_timestamp(),
  outcome=CASE WHEN p_metadata->>'outcome' IN ('response','error') THEN p_metadata->>'outcome' ELSE NULL END,
  resolved_model=CASE WHEN p_metadata->>'resolvedModel' ~ '^gemini-[a-z0-9.-]{1,100}$' THEN p_metadata->>'resolvedModel' ELSE NULL END,
  input_tokens=CASE WHEN p_metadata->>'inputTokens' ~ '^\d{1,15}$' THEN (p_metadata->>'inputTokens')::bigint ELSE NULL END,
  output_tokens=CASE WHEN p_metadata->>'outputTokens' ~ '^\d{1,15}$' THEN (p_metadata->>'outputTokens')::bigint ELSE NULL END,
  thinking_tokens=CASE WHEN p_metadata->>'thinkingTokens' ~ '^\d{1,15}$' THEN (p_metadata->>'thinkingTokens')::bigint ELSE NULL END,
  cached_tokens=CASE WHEN p_metadata->>'cachedTokens' ~ '^\d{1,15}$' THEN (p_metadata->>'cachedTokens')::bigint ELSE NULL END,
  total_tokens=CASE WHEN p_metadata->>'totalTokens' ~ '^\d{1,15}$' THEN (p_metadata->>'totalTokens')::bigint ELSE NULL END,
  provider_status=CASE WHEN p_metadata->>'providerStatus' ~ '^[45]\d\d$' THEN (p_metadata->>'providerStatus')::int ELSE NULL END
 WHERE job_id=p_id AND attempt=p_attempt AND finished_at IS NULL;
END;$$;

-- Atomic application writes + confirmed result + credit settlement. No late write.
CREATE FUNCTION public.complete_mobile_ai(p_id uuid,p_user uuid,p_response jsonb,p_status int) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE j public.mobile_ai_jobs%ROWTYPE; payload jsonb:=p_response; row_data jsonb; success boolean;
BEGIN
 PERFORM pg_advisory_xact_lock(hashtextextended('ai:global',0));
 PERFORM public.expire_mobile_ai(p_id);
 SELECT * INTO j FROM public.mobile_ai_jobs WHERE id=p_id AND user_id=p_user FOR UPDATE;
 IF NOT FOUND OR j.status<>'pending' THEN RETURN jsonb_build_object('code','not_pending');END IF;
 IF p_status IS NULL OR p_status<200 OR p_status>599 THEN RETURN jsonb_build_object('code','invalid_result');END IF;
 IF payload IS NULL OR jsonb_typeof(payload)<>'object' OR octet_length(payload::text)>200000 THEN p_status:=502;payload:='{"code":"invalid_ai_output"}'::jsonb;END IF;
 success:=p_status BETWEEN 200 AND 299;
 IF success THEN
  -- Nested block rolls back an unsuccessful application write before refunding.
  BEGIN
   IF j.operation IN ('plan','regenerate') THEN
    IF jsonb_typeof(payload#>'{plan,meals}') IS DISTINCT FROM 'array' OR payload#>>'{plan,week_start_date}' IS NULL THEN RAISE EXCEPTION 'invalid plan';END IF;
    IF j.operation='plan' THEN
     INSERT INTO public.meal_plans(user_id,week_start_date,meals,updated_at)
      VALUES(j.user_id,(payload#>>'{plan,week_start_date}')::date,payload#>'{plan,meals}',clock_timestamp())
      ON CONFLICT(user_id,week_start_date) DO UPDATE SET meals=EXCLUDED.meals,updated_at=EXCLUDED.updated_at
      RETURNING to_jsonb(meal_plans.*) INTO row_data;
    ELSE
     UPDATE public.meal_plans SET meals=payload#>'{plan,meals}',updated_at=clock_timestamp()
      WHERE user_id=j.user_id AND id=(payload#>>'{plan,id}')::uuid AND week_start_date=(payload#>>'{plan,week_start_date}')::date
      RETURNING to_jsonb(meal_plans.*) INTO row_data;
     IF row_data IS NULL THEN RAISE EXCEPTION 'plan missing';END IF;
    END IF;
    payload:=jsonb_build_object('plan',row_data);
   ELSIF j.operation='modify' THEN
    INSERT INTO public.recipes(user_id,name,ingredients,instructions,macros,image_url,is_public)
     VALUES(j.user_id,payload#>>'{recipe,name}',payload#>'{recipe,ingredients}',payload#>>'{recipe,instructions}',
      NULLIF(payload#>'{recipe,macros}','null'::jsonb),payload#>>'{recipe,image_url}',false)
     RETURNING to_jsonb(recipes.*) INTO row_data;
    payload:=jsonb_build_object('recipe',row_data);
   END IF;
   IF clock_timestamp()>=j.deadline_at THEN RAISE EXCEPTION 'deadline elapsed';END IF;
  EXCEPTION WHEN OTHERS THEN
   success:=false;
   IF clock_timestamp()>=j.deadline_at THEN p_status:=504;payload:='{"code":"ai_result_unavailable"}'::jsonb;
   ELSE p_status:=500;payload:='{"code":"result_storage_failed"}'::jsonb;END IF;
  END;
 END IF;
 payload:=payload||jsonb_build_object('resultId',j.id);
 IF NOT success THEN
  UPDATE public.mobile_ai_usage SET used=GREATEST(used-1,0) WHERE user_id=j.user_id AND kind=j.kind AND period=date_trunc('month',j.created_at AT TIME ZONE 'UTC')::date;
  payload:=payload||'{"creditReturned":true}'::jsonb;
 END IF;
 UPDATE public.mobile_ai_jobs SET status=CASE WHEN success THEN 'succeeded' ELSE 'failed' END,
  response=payload,http_status=p_status,settled_at=clock_timestamp(),expires_at=clock_timestamp()+interval '24 hours' WHERE id=j.id;
 RETURN jsonb_build_object('code','completed','response',payload,'status',p_status);
END;$$;

-- Preserve service-only legacy signature, routed through the same fence/settlement.
CREATE OR REPLACE FUNCTION public.finish_mobile_ai(p_id uuid,p_user uuid,p_response jsonb,p_status int) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
BEGIN RETURN (public.complete_mobile_ai(p_id,p_user,p_response,p_status)->>'code')='completed';END;$$;

CREATE FUNCTION public.reconcile_mobile_ai_user(p_user uuid) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE job_id uuid;
BEGIN
 PERFORM pg_advisory_xact_lock(hashtextextended('ai:global',0));
 FOR job_id IN SELECT id FROM public.mobile_ai_jobs WHERE user_id=p_user AND status='pending' AND deadline_at<=clock_timestamp() LOOP PERFORM public.expire_mobile_ai(job_id);END LOOP;
END;$$;

CREATE FUNCTION public.mobile_ai_status(p_user uuid,p_operation text,p_key text) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE j public.mobile_ai_jobs%ROWTYPE;
BEGIN
 PERFORM pg_advisory_xact_lock(hashtextextended('ai:global',0));
 SELECT * INTO j FROM public.mobile_ai_jobs WHERE user_id=p_user AND operation=p_operation AND request_key=p_key;
 IF NOT FOUND THEN RETURN jsonb_build_object('state','not_found');END IF;
 PERFORM public.expire_mobile_ai(j.id);
 SELECT * INTO j FROM public.mobile_ai_jobs WHERE id=j.id;
 IF j.status='pending' THEN RETURN jsonb_build_object('state','pending','deadlineAt',j.deadline_at);END IF;
 IF j.expires_at<=clock_timestamp() OR j.response IS NULL THEN RETURN jsonb_build_object('state','expired');END IF;
 RETURN jsonb_build_object('state','completed','response',j.response,'status',j.http_status);
END;$$;

CREATE FUNCTION public.cleanup_mobile_ai() RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
DECLARE job_id uuid;
BEGIN
 PERFORM pg_advisory_xact_lock(hashtextextended('ai:global',0));
 FOR job_id IN SELECT id FROM public.mobile_ai_jobs WHERE status='pending' AND deadline_at<=clock_timestamp() LOOP PERFORM public.expire_mobile_ai(job_id);END LOOP;
 UPDATE public.mobile_ai_jobs SET response=NULL WHERE status<>'pending' AND expires_at<=clock_timestamp() AND response IS NOT NULL;
 DELETE FROM public.mobile_ai_jobs WHERE status<>'pending' AND settled_at<clock_timestamp()-interval '30 days';
 DELETE FROM public.mobile_ai_provider_attempts WHERE started_at<clock_timestamp()-interval '90 days';
 DELETE FROM public.mobile_ai_daily_attempts WHERE day<=(clock_timestamp() AT TIME ZONE 'UTC')::date-90;
 RETURN '{"ok":true}'::jsonb;
END;$$;

-- Erase still-linkable telemetry before the account->job cascade. Daily totals
-- remain anonymous and must not be lowered by deleting an account.
CREATE FUNCTION public.delete_mobile_ai_account_metrics() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
BEGIN
 DELETE FROM public.mobile_ai_provider_attempts WHERE job_id IN (SELECT id FROM public.mobile_ai_jobs WHERE user_id=OLD.id);
 RETURN OLD;
END;$$;
CREATE TRIGGER mobile_ai_account_metrics BEFORE DELETE ON auth.users
 FOR EACH ROW EXECUTE FUNCTION public.delete_mobile_ai_account_metrics();
REVOKE ALL ON FUNCTION public.delete_mobile_ai_account_metrics() FROM PUBLIC,anon,authenticated,service_role;

REVOKE ALL ON FUNCTION public.begin_mobile_ai_v2(uuid,text,text,text,int,int,text),public.expire_mobile_ai(uuid),public.claim_mobile_ai_attempt(uuid,uuid,int,text),public.record_mobile_ai_attempt(uuid,int,jsonb),public.complete_mobile_ai(uuid,uuid,jsonb,int),public.mobile_ai_status(uuid,text,text),public.cleanup_mobile_ai(),public.reconcile_mobile_ai_user(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.begin_mobile_ai_v2(uuid,text,text,text,int,int,text),public.claim_mobile_ai_attempt(uuid,uuid,int,text),public.record_mobile_ai_attempt(uuid,int,jsonb),public.complete_mobile_ai(uuid,uuid,jsonb,int),public.mobile_ai_status(uuid,text,text),public.cleanup_mobile_ai(),public.reconcile_mobile_ai_user(uuid) TO service_role;
COMMIT;
