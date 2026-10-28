\set ON_ERROR_STOP on
DO $$ BEGIN IF current_database() NOT LIKE 'chef_release_test_%' OR inet_server_addr() IS NOT NULL THEN RAISE EXCEPTION 'Disposable local database required';END IF;END $$;
BEGIN;
DELETE FROM public.mobile_ai_jobs; DELETE FROM public.mobile_ai_daily_attempts;
DO $$
#variable_conflict use_variable
DECLARE u uuid:='00000000-0000-4000-8000-000000000001';other uuid:='00000000-0000-4000-8000-000000000002';
 j jsonb;r jsonb;id uuid;before_used int; old_month date:=(date_trunc('month',now() AT TIME ZONE 'UTC')-interval '1 month')::date;
BEGIN
 IF public.begin_mobile_ai(u,'recipes','legacy','hash',10,2,'lifecycle')->>'code'<>'policy_update_required' THEN RAISE EXCEPTION 'legacy backend could dispatch without per-call guard';END IF;
 INSERT INTO public.mobile_consents(user_id,scope,version,accepted,locale) VALUES(u,'ai','lifecycle',true,'en'),(other,'ai','lifecycle',true,'en') ON CONFLICT(user_id,scope) DO UPDATE SET accepted=true,version='lifecycle';
 j:=public.begin_mobile_ai_v2(u,'recipes','lifecycle','hash',10,2,'lifecycle');id:=(j->>'id')::uuid;
 IF j->>'code'<>'started' OR abs(extract(epoch FROM ((j->>'deadlineAt')::timestamptz-now()))-300)>1 THEN RAISE EXCEPTION 'five minute deadline missing';END IF;
 IF EXISTS(SELECT 1 FROM public.mobile_ai_daily_attempts) THEN RAISE EXCEPTION 'reservation counted as dispatch';END IF;
 IF NOT public.claim_mobile_ai_attempt(id,u,1,'gemini-fixture') THEN RAISE EXCEPTION 'first dispatch denied';END IF;
 IF public.claim_mobile_ai_attempt(id,u,1,'gemini-fixture') THEN RAISE EXCEPTION 'duplicate dispatch permission';END IF;
 IF public.claim_mobile_ai_attempt(id,other,2,'gemini-fixture') THEN RAISE EXCEPTION 'foreign attempt allowed';END IF;
 IF NOT public.claim_mobile_ai_attempt(id,u,2,'gemini-fixture') THEN RAISE EXCEPTION 'existing retry uncounted';END IF;
 IF public.claim_mobile_ai_attempt(id,u,3,'gemini-fixture') THEN RAISE EXCEPTION 'global cap bypassed';END IF;
 IF (SELECT attempts FROM public.mobile_ai_daily_attempts WHERE day=(now() AT TIME ZONE 'UTC')::date)<>2 THEN RAISE EXCEPTION 'expected two provider permits';END IF;
 PERFORM public.record_mobile_ai_attempt(id,1,'{"outcome":"error","providerStatus":503}');
 PERFORM public.record_mobile_ai_attempt(id,2,'{"outcome":"response","inputTokens":12,"outputTokens":3,"totalTokens":15,"private":"not stored"}');
 IF (SELECT input_tokens FROM public.mobile_ai_provider_attempts WHERE job_id=id AND attempt=1) IS NOT NULL THEN RAISE EXCEPTION 'missing tokens became zero';END IF;
 r:=public.complete_mobile_ai(id,u,'{"recipe":"fixture"}',200);
 IF r->>'code'<>'completed' OR (SELECT used FROM public.mobile_ai_usage WHERE user_id=u AND kind='recipes')<>1 THEN RAISE EXCEPTION 'two attempts consumed two user credits';END IF;
 r:=public.complete_mobile_ai(id,u,'{}',500);IF r->>'code'<>'not_pending' THEN RAISE EXCEPTION 'settled job refunded again';END IF;
 IF public.mobile_ai_status(other,'recipes','lifecycle')->>'state'<>'not_found' THEN RAISE EXCEPTION 'status leaked account';END IF;
 IF public.mobile_ai_status(u,'recipes','lifecycle')->>'state'<>'completed' THEN RAISE EXCEPTION 'result not recoverable';END IF;
 DELETE FROM public.mobile_ai_daily_attempts;
 -- Deadline settlement refunds once, frees all-operation lock and fences late writes.
 j:=public.begin_mobile_ai_v2(u,'plan','late-plan','hash',10,100,'lifecycle');id:=(j->>'id')::uuid;
 IF public.begin_mobile_ai_v2(u,'scan','blocked','hash',10,100,'lifecycle')->>'code'<>'operation_pending' THEN RAISE EXCEPTION 'cross-kind lock lost';END IF;
 UPDATE public.mobile_ai_jobs SET deadline_at=clock_timestamp()-interval '1 second' WHERE mobile_ai_jobs.id=id;
 r:=public.mobile_ai_status(u,'plan','late-plan');
 IF r#>>'{response,creditReturned}'<>'true' OR r#>>'{response,code}'<>'ai_result_unavailable' THEN RAISE EXCEPTION 'deadline did not refund';END IF;
 r:=public.complete_mobile_ai(id,u,'{"plan":{"week_start_date":"2099-01-05","meals":[]}}',200);
 IF r->>'code'<>'not_pending' OR EXISTS(SELECT 1 FROM public.meal_plans WHERE user_id=u AND week_start_date='2099-01-05') THEN RAISE EXCEPTION 'late plan wrote after refund';END IF;
 PERFORM public.mobile_ai_status(u,'plan','late-plan');
 IF (SELECT used FROM public.mobile_ai_usage WHERE user_id=u AND kind='plans')<>0 THEN RAISE EXCEPTION 'double or absent refund';END IF;
 j:=public.begin_mobile_ai_v2(u,'plan','valid-plan','hash',10,100,'lifecycle');id:=(j->>'id')::uuid;
 r:=public.complete_mobile_ai(id,u,'{"plan":{"week_start_date":"2099-01-05","meals":[]}}',201);
 IF r->>'status'<>'201' OR r#>>'{response,plan,id}' IS NULL OR NOT EXISTS(SELECT 1 FROM public.meal_plans WHERE user_id=u AND week_start_date='2099-01-05') THEN RAISE EXCEPTION 'atomic plan/result commit failed';END IF;
 -- Older request cannot overwrite the new plan or result after settlement.
 r:=public.complete_mobile_ai(id,u,'{"plan":{"week_start_date":"2099-01-05","meals":["late"]}}',200);
 IF r->>'code'<>'not_pending' OR (SELECT meals FROM public.meal_plans WHERE user_id=u AND week_start_date='2099-01-05')<>'[]'::jsonb THEN RAISE EXCEPTION 'duplicate plan overwrite';END IF;
 UPDATE public.mobile_ai_jobs SET created_at=now()-interval '16 minutes';
 -- Failed application write rolls back before refund, no false successful result.
 j:=public.begin_mobile_ai_v2(u,'regenerate','bad-write','hash',10,100,'lifecycle');id:=(j->>'id')::uuid;
 r:=public.complete_mobile_ai(id,u,'{"plan":{"id":"00000000-0000-4000-8000-000000000099","week_start_date":"2099-01-05","meals":[]}}',200);
 IF r->>'status'<>'500' OR r#>>'{response,creditReturned}'<>'true' THEN RAISE EXCEPTION 'failed write consumed credit';END IF;
 -- Month rollover: return the reservation to its original month only.
 j:=public.begin_mobile_ai_v2(u,'scan','old-month','hash',10,100,'lifecycle');id:=(j->>'id')::uuid;
 UPDATE public.mobile_ai_jobs SET created_at=old_month::timestamp AT TIME ZONE 'UTC',deadline_at=clock_timestamp()-interval '1 second' WHERE mobile_ai_jobs.id=id;
 INSERT INTO public.mobile_ai_usage(user_id,period,kind,used) VALUES(u,old_month,'scans',1) ON CONFLICT(user_id,period,kind) DO UPDATE SET used=1;
 SELECT used INTO before_used FROM public.mobile_ai_usage WHERE user_id=u AND kind='scans' AND period=(date_trunc('month',now() AT TIME ZONE 'UTC'))::date;
 PERFORM public.mobile_ai_status(u,'scan','old-month');
 IF (SELECT used FROM public.mobile_ai_usage WHERE user_id=u AND kind='scans' AND period=old_month)<>0 OR (SELECT used FROM public.mobile_ai_usage WHERE user_id=u AND kind='scans' AND period=(date_trunc('month',now() AT TIME ZONE 'UTC'))::date)<>before_used THEN RAISE EXCEPTION 'refund crossed calendar month job=% before=% rows=%',j,before_used,(SELECT jsonb_agg(to_jsonb(x)) FROM public.mobile_ai_usage x WHERE user_id=u AND kind='scans');END IF;
 -- 24h access cutoff independent of cleanup, then content redaction with tombstone.
 UPDATE public.mobile_ai_jobs SET expires_at=now()-interval '1 second' WHERE request_key='lifecycle' AND user_id=u;
 IF public.mobile_ai_status(u,'recipes','lifecycle')->>'state'<>'expired' THEN RAISE EXCEPTION 'expired full response exposed';END IF;
 PERFORM public.cleanup_mobile_ai();
 IF EXISTS(SELECT 1 FROM public.mobile_ai_jobs WHERE request_key='lifecycle' AND user_id=u AND response IS NOT NULL) THEN RAISE EXCEPTION '24h payload not cleared';END IF;
 IF public.begin_mobile_ai_v2(u,'recipes','lifecycle','hash',10,100,'lifecycle')->>'code'<>'request_expired' THEN RAISE EXCEPTION 'tombstone recreated AI job';END IF;
 UPDATE public.mobile_ai_jobs SET settled_at=now()-interval '31 days' WHERE request_key='lifecycle' AND user_id=u;
 UPDATE public.mobile_ai_provider_attempts SET started_at=now()-interval '91 days' WHERE attempt=1;
 PERFORM public.cleanup_mobile_ai();
 IF EXISTS(SELECT 1 FROM public.mobile_ai_jobs WHERE request_key='lifecycle' AND user_id=u) OR EXISTS(SELECT 1 FROM public.mobile_ai_provider_attempts WHERE started_at<now()-interval '90 days') THEN RAISE EXCEPTION 'retention failed';END IF;
 IF NOT EXISTS(SELECT 1 FROM public.mobile_ai_provider_attempts WHERE attempt=2) THEN RAISE EXCEPTION '30d job cleanup removed 90d metrics';END IF;
 INSERT INTO public.mobile_ai_daily_attempts VALUES((now() AT TIME ZONE 'UTC')::date-90,4);
 PERFORM public.cleanup_mobile_ai();
 IF EXISTS(SELECT 1 FROM public.mobile_ai_daily_attempts WHERE day<=(now() AT TIME ZONE 'UTC')::date-90) THEN RAISE EXCEPTION 'daily aggregate retention failed';END IF;
END;$$;
SET LOCAL ROLE authenticated;
DO $$ BEGIN
 BEGIN PERFORM public.claim_mobile_ai_attempt(gen_random_uuid(),auth.uid(),1,'gemini-fixture');RAISE EXCEPTION 'client dispatched';EXCEPTION WHEN insufficient_privilege THEN NULL;END;
 BEGIN PERFORM public.complete_mobile_ai(gen_random_uuid(),auth.uid(),'{}',200);RAISE EXCEPTION 'client settled';EXCEPTION WHEN insufficient_privilege THEN NULL;END;
 BEGIN PERFORM * FROM public.mobile_ai_provider_attempts;RAISE EXCEPTION 'metrics exposed';EXCEPTION WHEN insufficient_privilege THEN NULL;END;
 BEGIN PERFORM public.cleanup_mobile_ai();RAISE EXCEPTION 'client cleanup';EXCEPTION WHEN insufficient_privilege THEN NULL;END;
END;$$;
RESET ROLE;
ROLLBACK;
\echo AI dispatch cap, lifecycle, refund, late-write fencing, recovery, retention and ownership passed.
