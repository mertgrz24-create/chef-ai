-- Isolated empty staging only. All fixture writes roll back. Not an end-to-end auth/API test.
BEGIN;
DO $$ BEGIN IF EXISTS(SELECT 1 FROM auth.users) THEN RAISE EXCEPTION 'Empty staging auth required';END IF;END $$;
INSERT INTO auth.users(id,email) VALUES('00000000-0000-4000-8000-000000000001','fixture1@example.test'),('00000000-0000-4000-8000-000000000002','fixture2@example.test');
-- Client EXECUTE revocation must not break signup's trigger invocation.
INSERT INTO auth.users(id,email) VALUES('00000000-0000-4000-8000-000000000003','signup-fixture@example.test');
DO $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.profiles WHERE id='00000000-0000-4000-8000-000000000003') THEN RAISE EXCEPTION 'signup trigger failed';END IF;
 IF has_function_privilege('anon','public.handle_new_user()','EXECUTE') OR has_function_privilege('authenticated','public.handle_new_user()','EXECUTE') OR has_function_privilege('anon','public.rls_auto_enable()','EXECUTE') OR has_function_privilege('authenticated','public.rls_auto_enable()','EXECUTE') THEN RAISE EXCEPTION 'trigger RPC exposed';END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_proc WHERE oid='public.handle_new_user()'::regprocedure AND proconfig @> ARRAY['search_path=pg_catalog']) THEN RAISE EXCEPTION 'signup search path mutable';END IF;
END $$;
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claim.sub='00000000-0000-4000-8000-000000000001';
DO $$ BEGIN
 BEGIN PERFORM public.consume_recipe_credit(999999);RAISE EXCEPTION 'Legacy credit RPC was callable';EXCEPTION WHEN insufficient_privilege THEN NULL;END;
 BEGIN PERFORM public.refund_recipe_credit();RAISE EXCEPTION 'Refund RPC was callable';EXCEPTION WHEN insufficient_privilege THEN NULL;END;
 BEGIN PERFORM public.begin_mobile_ai(auth.uid(),'recipes','test-key','hash',99999,100,'v1');RAISE EXCEPTION 'Service AI RPC was callable';EXCEPTION WHEN insufficient_privilege THEN NULL;END;
 BEGIN UPDATE profiles SET is_premium=true WHERE id=auth.uid();RAISE EXCEPTION 'Premium was client writable';EXCEPTION WHEN insufficient_privilege THEN NULL;END;
 BEGIN UPDATE profiles SET recipe_count_this_month=0 WHERE id=auth.uid(); -- unchanged is allowed
 EXCEPTION WHEN insufficient_privilege THEN RAISE EXCEPTION 'unchanged values should remain safe';END;
 UPDATE profiles SET diet_type='vegetarian' WHERE id=auth.uid();
 BEGIN INSERT INTO recipes(user_id,name,instructions,is_public)VALUES(auth.uid(),'public','fixture instructions',true);RAISE EXCEPTION 'Public insertion was allowed';EXCEPTION WHEN insufficient_privilege THEN NULL;END;
 INSERT INTO recipes(user_id,name,instructions,is_public)VALUES(auth.uid(),'private','fixture instructions',false);
 BEGIN INSERT INTO recipes(user_id,name,instructions,is_public)VALUES('00000000-0000-4000-8000-000000000002','other','fixture instructions',false);RAISE EXCEPTION 'Cross account insert allowed';EXCEPTION WHEN insufficient_privilege THEN NULL;END;
 BEGIN PERFORM * FROM mobile_memberships;RAISE EXCEPTION 'Membership storage visible';EXCEPTION WHEN insufficient_privilege THEN NULL;END;
 BEGIN INSERT INTO push_tokens(user_id,token)VALUES(auth.uid(),'unverified');RAISE EXCEPTION 'Direct token insertion allowed';EXCEPTION WHEN insufficient_privilege THEN NULL;END;
END $$;
SET LOCAL request.jwt.claim.sub='00000000-0000-4000-8000-000000000002';
DO $$ BEGIN IF EXISTS(SELECT 1 FROM recipes WHERE name='private') THEN RAISE EXCEPTION 'Private recipe leaked';END IF;END $$;
RESET ROLE;
INSERT INTO mobile_consents VALUES('00000000-0000-4000-8000-000000000001','ai','v1',true,'en',now());
SET LOCAL ROLE service_role;
DO $$ DECLARE u uuid:='00000000-0000-4000-8000-000000000001';job jsonb;other jsonb;i int;result jsonb;
BEGIN
 job:=begin_mobile_ai(u,'recipes','request-1','hash',10,100,'wrong');IF job->>'code'<>'consent_required' THEN RAISE EXCEPTION 'consent not enforced';END IF;
 job:=begin_mobile_ai(u,'recipes','request-1','hash',10,100,'v1');IF job->>'code'<>'started' THEN RAISE EXCEPTION 'first reservation failed: %',job;END IF;
 other:=begin_mobile_ai(u,'scan','request-2','hash',10,100,'v1');IF other->>'code'<>'operation_pending' THEN RAISE EXCEPTION 'concurrent kind bypass';END IF;
 IF NOT finish_mobile_ai((job->>'id')::uuid,u,'{"recipe":"ok"}',200) THEN RAISE EXCEPTION 'completion failed';END IF;
 other:=begin_mobile_ai(u,'recipes','request-1','hash',10,100,'v1');IF other->>'code'<>'replay' THEN RAISE EXCEPTION 'replay failed';END IF;
 other:=begin_mobile_ai(u,'recipes','request-1','different',10,100,'v1');IF other->>'code'<>'idempotency_conflict' THEN RAISE EXCEPTION 'payload mismatch bypass';END IF;
 -- Move fixture attempts past the short rate window to test the monthly cap independently.
 FOR i IN 2..10 LOOP UPDATE mobile_ai_jobs SET created_at=now()-interval '16 minutes';job:=begin_mobile_ai(u,'recipes','request-'||i,'hash',10,100,'v1');IF job->>'code'<>'started' THEN RAISE EXCEPTION 'quota reservation failed: %',job;END IF;PERFORM finish_mobile_ai((job->>'id')::uuid,u,'{}',200);END LOOP;
 UPDATE mobile_ai_jobs SET created_at=now()-interval '16 minutes';job:=begin_mobile_ai(u,'recipes','request-11','hash',10,100,'v1');IF job->>'code'<>'limit_reached' THEN RAISE EXCEPTION 'monthly cap bypass';END IF;
 job:=begin_mobile_ai(u,'scan','failed-request','hash',10,100,'v1');PERFORM finish_mobile_ai((job->>'id')::uuid,u,'{}',500);IF finish_mobile_ai((job->>'id')::uuid,u,'{}',500) THEN RAISE EXCEPTION 'double refund accepted';END IF;
 IF (SELECT used FROM mobile_ai_usage WHERE user_id=u AND kind='scans')<>0 THEN RAISE EXCEPTION 'refund incorrect';END IF;
 FOR i IN 1..10 LOOP IF submit_mobile_report(u,'scan',null,0,null,'report-'||i,'hash')<>'ok' THEN RAISE EXCEPTION 'report rejected';END IF;END LOOP;
 IF submit_mobile_report(u,'scan',null,0,null,'report-11','hash')<>'rate_limited' THEN RAISE EXCEPTION 'report rate bypass';END IF;
 IF submit_mobile_report(u,'scan',null,0,null,'report-1','hash')<>'ok' THEN RAISE EXCEPTION 'report replay failed';END IF;
 IF submit_mobile_report(u,'scan',null,0,null,'report-1','other')<>'conflict' THEN RAISE EXCEPTION 'report mismatch bypass';END IF;
 PERFORM apply_mobile_membership(u,'new',300,'free','expired',now());result:=apply_mobile_membership(u,'old',200,'premium','active',now()+interval '1 month');IF result->>'plan'<>'free' THEN RAISE EXCEPTION 'out of order grant accepted';END IF;
 result:=apply_mobile_membership(u,'new',400,'premium','active',now()+interval '1 month');IF result->>'plan'<>'free' THEN RAISE EXCEPTION 'duplicate event granted';END IF;
 PERFORM record_mobile_analytics('recipe_saved','1.0.0','ios','en','success');PERFORM record_mobile_analytics('recipe_saved','1.0.0','ios','en','success');IF(SELECT count FROM mobile_analytics_daily WHERE event='recipe_saved')<>2 THEN RAISE EXCEPTION 'aggregate failed';END IF;
END $$;
RESET ROLE;
-- Cascade removes account data, retaining only intentionally anonymous aggregates.
DELETE FROM auth.users WHERE id='00000000-0000-4000-8000-000000000001';
DO $$ BEGIN IF EXISTS(SELECT 1 FROM mobile_ai_jobs) OR EXISTS(SELECT 1 FROM mobile_memberships) OR EXISTS(SELECT 1 FROM mobile_content_reports) THEN RAISE EXCEPTION 'account cascade incomplete';END IF;END $$;
SELECT 'staging_role_rls_quota_membership_checks_passed' AS result;
ROLLBACK;
