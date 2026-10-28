-- Staging-only operational schedule. Requires explicit remote rollout authorization.
BEGIN;
DO $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM supabase_migrations.schema_migrations WHERE name='staging_ai_lifecycle_rollout_pause') THEN RAISE EXCEPTION 'Staging rollout marker required';END IF;
END $$;
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
SELECT cron.schedule('chef-ai-staging-ai-cleanup','0 * * * *',$job$SELECT public.cleanup_mobile_ai(); DELETE FROM cron.job_run_details WHERE jobid=(SELECT jobid FROM cron.job WHERE jobname='chef-ai-staging-ai-cleanup') AND end_time<now()-interval '90 days';$job$);
COMMIT;
