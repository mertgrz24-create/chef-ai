BEGIN;
REVOKE INSERT,UPDATE ON public.push_tokens FROM anon,authenticated;
CREATE TABLE IF NOT EXISTS public.mobile_push_deliveries (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),token_id uuid NOT NULL REFERENCES public.push_tokens(id) ON DELETE CASCADE,
 local_day date NOT NULL,status text NOT NULL DEFAULT 'claimed' CHECK(status IN ('claimed','accepted','receipt_ok','unknown','error')),
 ticket_id text,created_at timestamptz NOT NULL DEFAULT now(),UNIQUE(token_id,local_day)
);
ALTER TABLE public.mobile_push_deliveries ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.mobile_push_deliveries FROM PUBLIC,anon,authenticated;
GRANT ALL ON public.mobile_push_deliveries TO service_role;
CREATE OR REPLACE FUNCTION public.claim_mobile_expiry_push()
RETURNS TABLE(delivery_id uuid,token_id uuid,token text,locale text)
LANGUAGE sql SECURITY DEFINER SET search_path=public AS $$
 WITH claimed AS (
 INSERT INTO mobile_push_deliveries(token_id,local_day)
 SELECT t.id,(now() AT TIME ZONE t.time_zone)::date FROM push_tokens t
 WHERE t.enabled AND NOT EXISTS(SELECT 1 FROM mobile_push_deliveries d WHERE d.token_id=t.id AND d.local_day=(now() AT TIME ZONE t.time_zone)::date) AND EXTRACT(hour FROM now() AT TIME ZONE t.time_zone)=9
 AND EXISTS(SELECT 1 FROM pantry p WHERE p.user_id=t.user_id AND p.expiry_date::text=((now() AT TIME ZONE t.time_zone)::date+1)::text)
 ORDER BY t.id LIMIT 100
 ON CONFLICT(token_id,local_day) DO NOTHING RETURNING id,token_id)
 SELECT c.id,t.id,t.token,t.locale FROM claimed c JOIN push_tokens t ON t.id=c.token_id;
$$;
REVOKE ALL ON FUNCTION public.claim_mobile_expiry_push() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.claim_mobile_expiry_push() TO service_role;
COMMIT;
