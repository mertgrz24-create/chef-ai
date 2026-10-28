-- Derived from read-only inspection of the deployed schema on 2026-10-15.
-- Apply on isolated staging and verify signup before production rollout.
BEGIN;
-- Trigger invocation does not need client EXECUTE privileges. Keep the existing body.
ALTER FUNCTION public.handle_new_user() SET search_path = pg_catalog;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
-- This application trigger is invoker-only but also needs a fixed search path.
ALTER FUNCTION public.protect_mobile_profile_fields() SET search_path = pg_catalog;
REVOKE ALL ON FUNCTION public.protect_mobile_profile_fields() FROM PUBLIC, anon, authenticated;
-- Some projects install this DDL event trigger automatically; do not create or replace it.
DO $$ BEGIN
 IF to_regprocedure('public.rls_auto_enable()') IS NOT NULL THEN
  REVOKE ALL ON FUNCTION public.rls_auto_enable() FROM PUBLIC, anon, authenticated;
 END IF;
END $$;
-- apply_referral remains intentionally authenticated, with auth.uid() and row locks.
-- Its SECURITY DEFINER advisor notice requires review, not anonymous exposure.
COMMIT;
