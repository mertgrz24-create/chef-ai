BEGIN;
CREATE TABLE IF NOT EXISTS public.mobile_memberships (
 user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
 plan text NOT NULL CHECK(plan IN ('free','premium')),status text NOT NULL CHECK(status IN ('active','grace','hold','expired')),
 expires_at timestamptz,revision bigint NOT NULL,verified_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.mobile_membership_events (
 event_id text NOT NULL,user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,created_at timestamptz NOT NULL DEFAULT now(),PRIMARY KEY(event_id,user_id)
);
ALTER TABLE public.mobile_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mobile_membership_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.mobile_memberships,public.mobile_membership_events FROM PUBLIC,anon,authenticated;
GRANT ALL ON public.mobile_memberships,public.mobile_membership_events TO service_role;
CREATE OR REPLACE FUNCTION public.apply_mobile_membership(p_user uuid,p_event text,p_revision bigint,p_plan text,p_status text,p_expiry timestamptz)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 PERFORM pg_advisory_xact_lock(hashtextextended('membership:'||p_user::text,0));
 IF EXISTS(SELECT 1 FROM mobile_membership_events WHERE event_id=p_event AND user_id=p_user) THEN RETURN (SELECT jsonb_build_object('plan',plan,'status',status,'expiresAt',expires_at,'revision',revision) FROM mobile_memberships WHERE user_id=p_user);END IF;
 INSERT INTO mobile_memberships(user_id,plan,status,expires_at,revision) VALUES(p_user,p_plan,p_status,p_expiry,p_revision)
 ON CONFLICT(user_id) DO UPDATE SET plan=EXCLUDED.plan,status=EXCLUDED.status,expires_at=EXCLUDED.expires_at,revision=EXCLUDED.revision,verified_at=now() WHERE mobile_memberships.revision<EXCLUDED.revision;
 INSERT INTO mobile_membership_events VALUES(p_event,p_user,now());RETURN (SELECT jsonb_build_object('plan',plan,'status',status,'expiresAt',expires_at,'revision',revision) FROM mobile_memberships WHERE user_id=p_user);
END;$$;
REVOKE ALL ON FUNCTION public.apply_mobile_membership(uuid,text,bigint,text,text,timestamptz) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.apply_mobile_membership(uuid,text,bigint,text,text,timestamptz) TO service_role;
CREATE TABLE IF NOT EXISTS public.mobile_processor_deletions(user_id uuid NOT NULL,provider text NOT NULL CHECK(provider='revenuecat'),created_at timestamptz NOT NULL DEFAULT now(),PRIMARY KEY(user_id,provider));
ALTER TABLE public.mobile_processor_deletions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.mobile_processor_deletions FROM PUBLIC,anon,authenticated;
GRANT ALL ON public.mobile_processor_deletions TO service_role;
COMMIT;
