BEGIN;
-- Remove client-controlled quotas and unlimited refund calls, including legacy overload.
REVOKE ALL ON FUNCTION public.consume_recipe_credit(int) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.refund_recipe_credit() FROM PUBLIC,anon,authenticated;
REVOKE INSERT ON public.profiles FROM anon,authenticated;
CREATE OR REPLACE FUNCTION public.protect_mobile_profile_fields() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF current_user IN ('anon','authenticated') AND (
 NEW.id IS DISTINCT FROM OLD.id OR NEW.email IS DISTINCT FROM OLD.email OR
 NEW.is_premium IS DISTINCT FROM OLD.is_premium OR NEW.recipe_count_this_month IS DISTINCT FROM OLD.recipe_count_this_month OR
 NEW.recipe_count_reset_at IS DISTINCT FROM OLD.recipe_count_reset_at OR NEW.referral_count IS DISTINCT FROM OLD.referral_count OR
 NEW.referred_by IS DISTINCT FROM OLD.referred_by OR (OLD.referral_code IS NOT NULL AND NEW.referral_code IS DISTINCT FROM OLD.referral_code)) THEN
 RAISE EXCEPTION 'Server-managed profile fields' USING ERRCODE='42501'; END IF;
 RETURN NEW;
END;$$;
DROP TRIGGER IF EXISTS protect_mobile_profile_fields ON public.profiles;
CREATE TRIGGER protect_mobile_profile_fields BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.protect_mobile_profile_fields();
CREATE TABLE IF NOT EXISTS public.mobile_ai_usage (
 user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,period date NOT NULL,kind text NOT NULL,used integer NOT NULL CHECK(used>=0),PRIMARY KEY(user_id,period,kind)
);
CREATE TABLE IF NOT EXISTS public.mobile_ai_jobs (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 operation text NOT NULL,kind text NOT NULL,request_key text NOT NULL,request_hash text NOT NULL,
 status text NOT NULL CHECK(status IN ('pending','succeeded','failed')),response jsonb,http_status integer,
 created_at timestamptz NOT NULL DEFAULT now(),expires_at timestamptz NOT NULL DEFAULT now()+interval '24 hours',UNIQUE(user_id,operation,request_key)
);
CREATE INDEX IF NOT EXISTS mobile_ai_jobs_user_date ON public.mobile_ai_jobs(user_id,created_at);
CREATE INDEX IF NOT EXISTS mobile_ai_jobs_created ON public.mobile_ai_jobs(created_at);
CREATE INDEX IF NOT EXISTS mobile_ai_jobs_expiry ON public.mobile_ai_jobs(expires_at);
ALTER TABLE public.mobile_ai_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mobile_ai_jobs ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.mobile_ai_usage,public.mobile_ai_jobs FROM PUBLIC,anon,authenticated;
GRANT ALL ON public.mobile_ai_usage,public.mobile_ai_jobs TO service_role;
CREATE OR REPLACE FUNCTION public.begin_mobile_ai(p_user uuid,p_operation text,p_key text,p_hash text,p_limit int,p_global int,p_consent text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE job mobile_ai_jobs%ROWTYPE;v_kind text;v_used int;v_period date:=date_trunc('month',now() AT TIME ZONE 'UTC')::date;
BEGIN
 IF p_operation NOT IN ('recipes','modify','scan','plan','regenerate') OR p_limit<1 OR p_limit>10000 OR p_global<1 OR p_global>100000 THEN RETURN jsonb_build_object('code','configuration'); END IF;
 v_kind:=CASE WHEN p_operation IN ('recipes','modify') THEN 'recipes' WHEN p_operation='scan' THEN 'scans' ELSE 'plans' END;
 -- Quotas and concurrency are global across operation types for this account.
 PERFORM pg_advisory_xact_lock(hashtextextended('ai:global',0));
 IF NOT EXISTS(SELECT 1 FROM mobile_consents WHERE user_id=p_user AND accepted AND version=p_consent) THEN RETURN jsonb_build_object('code','consent_required');END IF;
 SELECT * INTO job FROM mobile_ai_jobs WHERE user_id=p_user AND operation=p_operation AND request_key=p_key;
 IF FOUND THEN
  IF job.request_hash<>p_hash THEN RETURN jsonb_build_object('code','idempotency_conflict');END IF;
  IF job.expires_at<=now() THEN RETURN jsonb_build_object('code','request_expired');END IF;
  IF job.status='pending' THEN RETURN jsonb_build_object('code','operation_pending');END IF;
  RETURN jsonb_build_object('code','replay','response',job.response,'status',job.http_status);
 END IF;
 IF EXISTS(SELECT 1 FROM mobile_ai_jobs WHERE user_id=p_user AND status='pending' AND created_at>now()-interval '10 minutes') THEN RETURN jsonb_build_object('code','operation_pending');END IF;
 IF (SELECT count(*) FROM mobile_ai_jobs WHERE user_id=p_user AND created_at>now()-interval '15 minutes')>=5 OR
 (SELECT count(*) FROM mobile_ai_jobs WHERE created_at>=date_trunc('day',now() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC')>=p_global THEN RETURN jsonb_build_object('code','rate_limited');END IF;
 INSERT INTO mobile_ai_usage VALUES(p_user,v_period,v_kind,0) ON CONFLICT DO NOTHING;
 SELECT used INTO v_used FROM mobile_ai_usage WHERE user_id=p_user AND period=v_period AND kind=v_kind FOR UPDATE;
 IF v_used>=p_limit THEN RETURN jsonb_build_object('code','limit_reached');END IF;
 UPDATE mobile_ai_usage SET used=used+1 WHERE user_id=p_user AND period=v_period AND kind=v_kind;
 INSERT INTO mobile_ai_jobs(user_id,operation,kind,request_key,request_hash,status) VALUES(p_user,p_operation,v_kind,p_key,p_hash,'pending') RETURNING * INTO job;
 RETURN jsonb_build_object('code','started','id',job.id);
END;$$;
CREATE OR REPLACE FUNCTION public.finish_mobile_ai(p_id uuid,p_user uuid,p_response jsonb,p_status int)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE job mobile_ai_jobs%ROWTYPE;
BEGIN
 SELECT * INTO job FROM mobile_ai_jobs WHERE id=p_id AND user_id=p_user FOR UPDATE;
 IF NOT FOUND OR job.status<>'pending' THEN RETURN false;END IF;
 IF p_status<100 OR p_status>599 OR octet_length(p_response::text)>200000 THEN RETURN false;END IF;
 UPDATE mobile_ai_jobs SET status=CASE WHEN p_status BETWEEN 200 AND 299 THEN 'succeeded' ELSE 'failed' END,response=p_response,http_status=p_status WHERE id=p_id;
 IF p_status NOT BETWEEN 200 AND 299 THEN UPDATE mobile_ai_usage SET used=GREATEST(used-1,0) WHERE user_id=p_user AND period=date_trunc('month',job.created_at AT TIME ZONE 'UTC')::date AND kind=job.kind;END IF;
 RETURN true;
END;$$;
REVOKE ALL ON FUNCTION public.begin_mobile_ai(uuid,text,text,text,int,int,text),public.finish_mobile_ai(uuid,uuid,jsonb,int) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.begin_mobile_ai(uuid,text,text,text,int,int,text),public.finish_mobile_ai(uuid,uuid,jsonb,int) TO service_role;
COMMIT;
