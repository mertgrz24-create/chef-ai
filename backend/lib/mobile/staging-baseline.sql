-- Empty, isolated staging bootstrap; never apply to an existing application database.
-- Reconstructed from schema-only production metadata; no production rows are copied.
BEGIN;
DO $$ BEGIN IF EXISTS(SELECT 1 FROM pg_tables WHERE schemaname='public') OR EXISTS(SELECT 1 FROM auth.users) THEN RAISE EXCEPTION 'Empty staging database required'; END IF;END $$;
CREATE TABLE public.pantry (
 id uuid NOT NULL DEFAULT gen_random_uuid(),
 user_id uuid NOT NULL,
 name text NOT NULL,
 expiry_date date NOT NULL,
 quantity text,
 created_at timestamp with time zone NOT NULL DEFAULT now(),
 PRIMARY KEY(id),
 FOREIGN KEY(user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);
ALTER TABLE public.pantry ENABLE ROW LEVEL SECURITY;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.pantry TO authenticated;
GRANT ALL ON public.pantry TO service_role;
CREATE POLICY staging_own_rows ON public.pantry FOR ALL TO authenticated USING(auth.uid()=user_id) WITH CHECK(auth.uid()=user_id);
CREATE TABLE public.profiles (
 id uuid NOT NULL,
 email text,
 daily_calorie_goal integer,
 protein_goal_g integer,
 carbs_goal_g integer,
 fat_goal_g integer,
 water_goal_l numeric(3,1),
 diet_type text,
 goals_updated_at timestamp with time zone,
 created_at timestamp with time zone NOT NULL DEFAULT now(),
 updated_at timestamp with time zone NOT NULL DEFAULT now(),
 recipe_count_this_month integer NOT NULL DEFAULT 0,
 recipe_count_reset_at timestamp with time zone NOT NULL DEFAULT now(),
 is_premium boolean NOT NULL DEFAULT false,
 referral_code text,
 referred_by text,
 referral_count integer NOT NULL DEFAULT 0,
 PRIMARY KEY(id),
 FOREIGN KEY(id) REFERENCES auth.users(id) ON DELETE CASCADE,
 UNIQUE(referral_code)
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
CREATE POLICY staging_own_rows ON public.profiles FOR ALL TO authenticated USING(auth.uid()=id) WITH CHECK(auth.uid()=id);
CREATE TABLE public.recipes (
 id uuid NOT NULL DEFAULT gen_random_uuid(),
 user_id uuid NOT NULL,
 name text NOT NULL,
 ingredients jsonb NOT NULL DEFAULT '[]'::jsonb,
 instructions text NOT NULL,
 macros jsonb,
 diet_context text,
 is_public boolean NOT NULL DEFAULT false,
 created_at timestamp with time zone NOT NULL DEFAULT now(),
 image_url text,
 PRIMARY KEY(id),
 FOREIGN KEY(user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.recipes TO authenticated;
GRANT ALL ON public.recipes TO service_role;
CREATE POLICY staging_own_rows ON public.recipes FOR ALL TO authenticated USING(auth.uid()=user_id) WITH CHECK(auth.uid()=user_id);
CREATE TABLE public.meal_plans (
 id uuid NOT NULL DEFAULT gen_random_uuid(),
 user_id uuid NOT NULL,
 week_start_date date NOT NULL,
 meals jsonb NOT NULL DEFAULT '[]'::jsonb,
 created_at timestamp with time zone NOT NULL DEFAULT now(),
 updated_at timestamp with time zone NOT NULL DEFAULT now(),
 PRIMARY KEY(id),
 FOREIGN KEY(user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
 UNIQUE(user_id,week_start_date)
);
ALTER TABLE public.meal_plans ENABLE ROW LEVEL SECURITY;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.meal_plans TO authenticated;
GRANT ALL ON public.meal_plans TO service_role;
CREATE POLICY staging_own_rows ON public.meal_plans FOR ALL TO authenticated USING(auth.uid()=user_id) WITH CHECK(auth.uid()=user_id);
CREATE TABLE public.meals_eaten (
 id uuid NOT NULL DEFAULT gen_random_uuid(),
 user_id uuid NOT NULL,
 recipe_name text NOT NULL,
 calories integer,
 protein_g integer,
 carbs_g integer,
 fat_g integer,
 eaten_at timestamp with time zone NOT NULL DEFAULT now(),
 source text,
 PRIMARY KEY(id),
 FOREIGN KEY(user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);
ALTER TABLE public.meals_eaten ENABLE ROW LEVEL SECURITY;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.meals_eaten TO authenticated;
GRANT ALL ON public.meals_eaten TO service_role;
CREATE POLICY staging_own_rows ON public.meals_eaten FOR ALL TO authenticated USING(auth.uid()=user_id) WITH CHECK(auth.uid()=user_id);
CREATE TABLE public.push_tokens (
 id uuid NOT NULL DEFAULT gen_random_uuid(),
 user_id uuid NOT NULL,
 token text NOT NULL,
 platform text,
 created_at timestamp with time zone NOT NULL DEFAULT now(),
 updated_at timestamp with time zone NOT NULL DEFAULT now(),
 PRIMARY KEY(id),
 FOREIGN KEY(user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
 UNIQUE(token)
);
ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.push_tokens TO authenticated;
GRANT ALL ON public.push_tokens TO service_role;
CREATE POLICY staging_own_rows ON public.push_tokens FOR ALL TO authenticated USING(auth.uid()=user_id) WITH CHECK(auth.uid()=user_id);
CREATE FUNCTION public.handle_new_user() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$BEGIN INSERT INTO public.profiles(id,email) VALUES(NEW.id,NEW.email); RETURN NEW;END;$$;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
-- V4 security fixes: atomic referral + freemium credit RPCs
-- ⚠️ Run manually in Supabase SQL Editor
--
-- Why: the referral flow must read and update ANOTHER user's profile row
-- (find referrer by code, increment their referral_count), which own-row
-- RLS policies forbid — so /api/referral could never succeed. Both flows
-- also had read-modify-write race conditions. These SECURITY DEFINER
-- functions perform all checks and writes atomically server-side.

-- 1. apply_referral(code) — validates and applies a referral in one transaction
CREATE OR REPLACE FUNCTION public.apply_referral(p_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_my_code text;
  v_referred_by text;
  v_referrer_id uuid;
BEGIN
  IF v_user IS NULL THEN
    RETURN jsonb_build_object('status', 'unauthenticated');
  END IF;

  SELECT referral_code, referred_by INTO v_my_code, v_referred_by
  FROM profiles WHERE id = v_user FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('status', 'no_profile');
  END IF;

  IF v_referred_by IS NOT NULL THEN
    RETURN jsonb_build_object('status', 'already_referred');
  END IF;

  IF v_my_code = p_code THEN
    RETURN jsonb_build_object('status', 'self_referral');
  END IF;

  SELECT id INTO v_referrer_id FROM profiles WHERE referral_code = p_code FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('status', 'invalid_code');
  END IF;

  UPDATE profiles SET referred_by = p_code WHERE id = v_user;
  UPDATE profiles SET referral_count = referral_count + 1 WHERE id = v_referrer_id;

  RETURN jsonb_build_object('status', 'ok');
END;
$$;

REVOKE ALL ON FUNCTION public.apply_referral(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.apply_referral(text) TO authenticated;

-- 2. consume_recipe_credit(limit) — atomic monthly reset + limit check + increment
CREATE OR REPLACE FUNCTION public.consume_recipe_credit(p_limit int)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_count int;
  v_premium boolean;
  v_reset_at timestamptz;
BEGIN
  IF v_user IS NULL THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'unauthenticated');
  END IF;

  SELECT recipe_count_this_month, is_premium, recipe_count_reset_at
  INTO v_count, v_premium, v_reset_at
  FROM profiles WHERE id = v_user FOR UPDATE;

  IF NOT FOUND THEN
    -- No profile row yet: don't block recipe generation
    RETURN jsonb_build_object('allowed', true, 'remaining', p_limit);
  END IF;

  -- Monthly rollover
  IF v_reset_at < date_trunc('month', now()) THEN
    v_count := 0;
    UPDATE profiles
    SET recipe_count_this_month = 0, recipe_count_reset_at = now()
    WHERE id = v_user;
  END IF;

  IF NOT v_premium AND v_count >= p_limit THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'limit_reached');
  END IF;

  UPDATE profiles SET recipe_count_this_month = v_count + 1 WHERE id = v_user;
  RETURN jsonb_build_object('allowed', true, 'remaining', GREATEST(p_limit - v_count - 1, 0));
END;
$$;

REVOKE ALL ON FUNCTION public.consume_recipe_credit(int) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.consume_recipe_credit(int) TO authenticated;

-- 3. refund_recipe_credit() — give the credit back if generation fails after consuming
CREATE OR REPLACE FUNCTION public.refund_recipe_credit()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE profiles
  SET recipe_count_this_month = GREATEST(recipe_count_this_month - 1, 0)
  WHERE id = auth.uid();
$$;

REVOKE ALL ON FUNCTION public.refund_recipe_credit() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.refund_recipe_credit() TO authenticated;

REVOKE ALL ON FUNCTION public.consume_recipe_credit(int),public.refund_recipe_credit() FROM PUBLIC,anon,authenticated;
COMMIT;

