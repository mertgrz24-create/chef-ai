-- Review/apply on staging first. Never run automatically against production.
BEGIN;
ALTER TABLE public.recipes ALTER COLUMN is_public SET DEFAULT false;
ALTER TABLE public.recipes ADD COLUMN IF NOT EXISTS save_request_key text;
ALTER TABLE public.recipes ADD COLUMN IF NOT EXISTS save_request_hash text;
CREATE UNIQUE INDEX IF NOT EXISTS recipes_private_request_key ON public.recipes(user_id,save_request_key) WHERE save_request_key IS NOT NULL;
DROP POLICY IF EXISTS "Mobile private inserts" ON public.recipes;
CREATE POLICY "Mobile private inserts" ON public.recipes AS RESTRICTIVE FOR INSERT TO authenticated WITH CHECK(auth.uid()=user_id AND is_public=false);
DROP POLICY IF EXISTS "Mobile private updates" ON public.recipes;
CREATE POLICY "Mobile private updates" ON public.recipes AS RESTRICTIVE FOR UPDATE TO authenticated USING(auth.uid()=user_id) WITH CHECK(auth.uid()=user_id AND is_public=false);
-- Existing public recipes are NOT silently migrated. Operator must decide retention/unpublishing.
CREATE TABLE IF NOT EXISTS public.mobile_consents (
 user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 scope text NOT NULL CHECK(scope='ai'), version text NOT NULL CHECK(length(version) BETWEEN 1 AND 100),
 accepted boolean NOT NULL, locale text NOT NULL CHECK(locale IN ('tr','en')), updated_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(user_id,scope)
);
CREATE TABLE IF NOT EXISTS public.mobile_content_reports (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 source text NOT NULL CHECK(source IN ('recipe','meal-plan','scan')),result_id uuid,
 category integer NOT NULL CHECK(category BETWEEN 0 AND 3),details text CHECK(length(details)<=1000),created_at timestamptz NOT NULL DEFAULT now(),
 request_key text NOT NULL,request_hash text NOT NULL,UNIQUE(user_id,request_key)
);
CREATE INDEX IF NOT EXISTS mobile_reports_user_date ON public.mobile_content_reports(user_id,created_at);
ALTER TABLE public.mobile_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mobile_content_reports ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.mobile_consents,public.mobile_content_reports FROM PUBLIC,anon,authenticated;
GRANT ALL ON public.mobile_consents,public.mobile_content_reports TO service_role;
ALTER TABLE public.push_tokens ADD COLUMN IF NOT EXISTS locale text NOT NULL DEFAULT 'en';
ALTER TABLE public.push_tokens ADD COLUMN IF NOT EXISTS time_zone text NOT NULL DEFAULT 'UTC';
ALTER TABLE public.push_tokens ADD COLUMN IF NOT EXISTS enabled boolean NOT NULL DEFAULT false;
-- Legacy tokens require a new explicit opt-in; no language/timezone is guessed for delivery.
CREATE OR REPLACE FUNCTION public.submit_mobile_report(p_user uuid,p_source text,p_result uuid,p_category int,p_details text,p_key text,p_hash text)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE existing_hash text;
BEGIN
 PERFORM pg_advisory_xact_lock(hashtextextended('report:'||p_user::text,0));
 SELECT request_hash INTO existing_hash FROM mobile_content_reports WHERE user_id=p_user AND request_key=p_key;
 IF FOUND THEN RETURN CASE WHEN existing_hash=p_hash THEN 'ok' ELSE 'conflict' END; END IF;
 IF (SELECT count(*) FROM mobile_content_reports WHERE user_id=p_user AND created_at>now()-interval '1 hour')>=10 THEN RETURN 'rate_limited'; END IF;
 INSERT INTO mobile_content_reports(user_id,source,result_id,category,details,request_key,request_hash) VALUES(p_user,p_source,p_result,p_category,p_details,p_key,p_hash);
 RETURN 'ok';
END;$$;
REVOKE ALL ON FUNCTION public.submit_mobile_report(uuid,text,uuid,int,text,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.submit_mobile_report(uuid,text,uuid,int,text,text,text) TO service_role;
COMMIT;
