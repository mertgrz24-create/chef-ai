BEGIN;
CREATE TABLE IF NOT EXISTS public.mobile_analytics_daily (
 day date NOT NULL,event text NOT NULL CHECK(event IN ('onboarding_completed','first_ingredient_added','scan_completed','recipe_generated','recipe_saved','plan_created','paywall_opened','restore_completed')),
 version text NOT NULL CHECK(length(version)<=20),platform text NOT NULL CHECK(platform IN ('ios','android','web')),locale text NOT NULL CHECK(locale IN ('tr','en')),result text NOT NULL CHECK(result IN ('success','failure')),count bigint NOT NULL DEFAULT 1,
 PRIMARY KEY(day,event,version,platform,locale,result)
);
ALTER TABLE public.mobile_analytics_daily ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.mobile_analytics_daily FROM PUBLIC,anon,authenticated;
GRANT ALL ON public.mobile_analytics_daily TO service_role;
CREATE OR REPLACE FUNCTION public.record_mobile_analytics(p_event text,p_version text,p_platform text,p_locale text,p_result text)
RETURNS boolean LANGUAGE sql SECURITY DEFINER SET search_path=public AS $$
 INSERT INTO mobile_analytics_daily(day,event,version,platform,locale,result) VALUES((now() AT TIME ZONE 'UTC')::date,p_event,p_version,p_platform,p_locale,p_result)
 ON CONFLICT(day,event,version,platform,locale,result) DO UPDATE SET count=mobile_analytics_daily.count+1 RETURNING true;
$$;
REVOKE ALL ON FUNCTION public.record_mobile_analytics(text,text,text,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.record_mobile_analytics(text,text,text,text,text) TO service_role;
COMMIT;
