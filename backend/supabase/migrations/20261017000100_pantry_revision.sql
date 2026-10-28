-- Source only: apply remotely only with explicit approval.
BEGIN;
ALTER TABLE public.pantry ADD COLUMN IF NOT EXISTS revision integer NOT NULL DEFAULT 0;
CREATE OR REPLACE FUNCTION public.bump_pantry_revision() RETURNS trigger
LANGUAGE plpgsql SET search_path=pg_catalog AS $$
BEGIN NEW.revision := OLD.revision + 1; RETURN NEW; END; $$;
REVOKE ALL ON FUNCTION public.bump_pantry_revision() FROM PUBLIC,anon,authenticated;
DROP TRIGGER IF EXISTS pantry_revision_update ON public.pantry;
CREATE TRIGGER pantry_revision_update BEFORE UPDATE ON public.pantry
FOR EACH ROW EXECUTE FUNCTION public.bump_pantry_revision();
COMMIT;
