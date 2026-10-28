\set ON_ERROR_STOP on
-- Only a disposable local database; no AI provider or real user is involved.
DO $$ BEGIN
 IF current_database() NOT LIKE 'chef_release_test_%' OR inet_server_addr() IS NOT NULL THEN
  RAISE EXCEPTION 'Disposable local database over Unix socket required';
 END IF;
END $$;
BEGIN;
DELETE FROM public.mobile_ai_daily_attempts;
DELETE FROM public.mobile_ai_jobs;
DO $$
DECLARE a uuid:=gen_random_uuid();b uuid:=gen_random_uuid();c uuid:=gen_random_uuid();
 j jsonb;r jsonb;today date:=(now() AT TIME ZONE 'UTC')::date;
BEGIN
 INSERT INTO auth.users(id,email) VALUES(a,'cap-a@example.invalid'),(b,'cap-b@example.invalid'),(c,'cap-c@example.invalid');
 INSERT INTO public.mobile_consents(user_id,scope,version,accepted,locale)
 VALUES(a,'ai','cap-v1',true,'en'),(b,'ai','cap-v1',true,'en'),(c,'ai','cap-v1',true,'en');
 -- Invalid and denied reservations cannot consume the global cap.
 r:=public.begin_mobile_ai_v2(a,'recipes','invalid','hash',10,NULL,'cap-v1');
 IF r->>'code'<>'configuration' THEN RAISE EXCEPTION 'null cap accepted';END IF;
 r:=public.begin_mobile_ai_v2(a,'recipes','denied','hash',10,2,'wrong-version');
 IF r->>'code'<>'consent_required' OR EXISTS(SELECT 1 FROM public.mobile_ai_daily_attempts) THEN RAISE EXCEPTION 'denied reservation counted';END IF;
 j:=public.begin_mobile_ai_v2(a,'recipes','first','hash',10,2,'cap-v1');
 IF j->>'code'<>'started' THEN RAISE EXCEPTION 'first reservation failed';END IF;
 IF NOT public.claim_mobile_ai_attempt((j->>'id')::uuid,a,1,'gemini-fixture') THEN RAISE EXCEPTION 'dispatch denied';END IF;
 PERFORM public.finish_mobile_ai((j->>'id')::uuid,a,'{"code":"generation_failed"}',500);
 IF (SELECT used FROM public.mobile_ai_usage WHERE user_id=a AND kind='recipes')<>0 THEN RAISE EXCEPTION 'monthly refund lost';END IF;
 r:=public.begin_mobile_ai_v2(a,'recipes','first','hash',10,2,'cap-v1');
 IF r->>'code'<>'replay' OR (SELECT attempts FROM public.mobile_ai_daily_attempts WHERE day=today)<>1 THEN RAISE EXCEPTION 'replay charged twice';END IF;
 r:=public.begin_mobile_ai_v2(a,'recipes','first','different',10,2,'cap-v1');
 IF r->>'code'<>'idempotency_conflict' THEN RAISE EXCEPTION 'key conflict missed';END IF;
 j:=public.begin_mobile_ai_v2(b,'scan','second','hash',10,2,'cap-v1');
 IF j->>'code'<>'started' THEN RAISE EXCEPTION 'second reservation failed';END IF;
 IF NOT public.claim_mobile_ai_attempt((j->>'id')::uuid,b,1,'gemini-fixture') THEN RAISE EXCEPTION 'second dispatch denied';END IF;
 PERFORM public.finish_mobile_ai((j->>'id')::uuid,b,'{"items":[]}',200);
 -- Cleanup of content does not lower the anonymous daily total.
 DELETE FROM public.mobile_ai_jobs WHERE user_id IN(a,b);
 DELETE FROM auth.users WHERE id IN(a,b);
 IF (SELECT attempts FROM public.mobile_ai_daily_attempts WHERE day=today)<>2 THEN RAISE EXCEPTION 'cleanup/delete reset global cap';END IF;
 r:=public.begin_mobile_ai_v2(c,'plan','new-account','hash',10,2,'cap-v1');
 IF r->>'code'<>'rate_limited' THEN RAISE EXCEPTION 'new account bypassed daily cap';END IF;
 -- A past UTC day cannot block the next day. Daily counter stores no user/content columns.
 DELETE FROM public.mobile_ai_daily_attempts;
 INSERT INTO public.mobile_ai_daily_attempts VALUES(today-1,100000);
 j:=public.begin_mobile_ai_v2(c,'plan','fresh-day','hash',10,2,'cap-v1');
 IF NOT public.claim_mobile_ai_attempt((j->>'id')::uuid,c,1,'gemini-fixture') THEN RAISE EXCEPTION 'fresh dispatch denied';END IF;
 IF j->>'code'<>'started' OR (SELECT attempts FROM public.mobile_ai_daily_attempts WHERE day=today)<>1 THEN RAISE EXCEPTION 'UTC day bucket failed';END IF;
 IF (SELECT count(*) FROM information_schema.columns WHERE table_schema='public' AND table_name='mobile_ai_daily_attempts')<>2 THEN RAISE EXCEPTION 'unexpected identifying ledger fields';END IF;
 IF has_table_privilege('anon','public.mobile_ai_daily_attempts','SELECT') OR has_table_privilege('authenticated','public.mobile_ai_daily_attempts','SELECT') OR has_table_privilege('service_role','public.mobile_ai_daily_attempts','UPDATE') THEN RAISE EXCEPTION 'ledger privileges too broad';END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_class WHERE oid='public.mobile_ai_daily_attempts'::regclass AND relrowsecurity) THEN RAISE EXCEPTION 'ledger RLS missing';END IF;
END $$;
SET LOCAL ROLE authenticated;
DO $$ BEGIN
 BEGIN PERFORM public.begin_mobile_ai_v2(gen_random_uuid(),'recipes','client','hash',10,100000,'cap-v1');RAISE EXCEPTION 'client cap override allowed';EXCEPTION WHEN insufficient_privilege THEN NULL;END;
 BEGIN PERFORM attempts FROM public.mobile_ai_daily_attempts;RAISE EXCEPTION 'client ledger read allowed';EXCEPTION WHEN insufficient_privilege THEN NULL;END;
END $$;
RESET ROLE;
ROLLBACK;
\echo Durable daily cap lifecycle, replay, cleanup, deletion, UTC day and role checks passed; rolled back.
