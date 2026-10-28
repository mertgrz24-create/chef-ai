-- Disposable local test schema only. NEVER apply to a real Supabase project.
DO $$ BEGIN
 IF current_database() NOT LIKE 'chef_release_test_%' OR inet_server_addr() IS NOT NULL THEN RAISE EXCEPTION 'Disposable local chef_release_test_* database over Unix socket required';END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='anon') THEN CREATE ROLE anon NOLOGIN;END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN CREATE ROLE authenticated NOLOGIN;END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_roles WHERE rolname='service_role') THEN CREATE ROLE service_role NOLOGIN BYPASSRLS;END IF;
END $$;
CREATE SCHEMA auth;
CREATE TABLE auth.users(id uuid PRIMARY KEY,email text);
CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$SELECT NULLIF(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
GRANT USAGE ON SCHEMA auth,public TO authenticated,anon,service_role;
GRANT EXECUTE ON FUNCTION auth.uid() TO authenticated,anon,service_role;
CREATE TABLE public.profiles(id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,email text,is_premium boolean DEFAULT false,recipe_count_this_month int DEFAULT 0,recipe_count_reset_at timestamptz DEFAULT now(),referral_count int DEFAULT 0,referred_by text,referral_code text,diet_type text);
CREATE TABLE public.recipes(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,name text,ingredients jsonb NOT NULL DEFAULT '[]'::jsonb,instructions text NOT NULL,macros jsonb,diet_context text,image_url text,is_public boolean DEFAULT true,created_at timestamptz DEFAULT now());
CREATE TABLE public.pantry(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,name text NOT NULL,expiry_date date NOT NULL,quantity text,created_at timestamptz DEFAULT now());
CREATE TABLE public.push_tokens(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,token text UNIQUE,platform text,updated_at timestamptz DEFAULT now());
CREATE TABLE public.meal_plans(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,week_start_date date NOT NULL,meals jsonb NOT NULL DEFAULT '[]'::jsonb,created_at timestamptz DEFAULT now(),updated_at timestamptz DEFAULT now(),UNIQUE(user_id,week_start_date));
ALTER TABLE public.pantry ENABLE ROW LEVEL SECURITY;
CREATE POLICY own_pantry ON public.pantry FOR ALL TO authenticated USING(auth.uid()=user_id) WITH CHECK(auth.uid()=user_id);
ALTER TABLE public.meal_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY own_plan ON public.meal_plans FOR ALL TO authenticated USING(auth.uid()=user_id) WITH CHECK(auth.uid()=user_id);
GRANT ALL ON public.meal_plans TO authenticated,service_role;
GRANT ALL ON public.profiles,public.recipes,public.pantry,public.push_tokens TO authenticated,service_role;
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;
CREATE POLICY own_recipes ON public.recipes FOR ALL TO authenticated USING(auth.uid()=user_id) WITH CHECK(auth.uid()=user_id);
CREATE POLICY public_recipes ON public.recipes FOR SELECT TO anon,authenticated USING(is_public);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY own_profile ON public.profiles FOR ALL TO authenticated USING(auth.uid()=id) WITH CHECK(auth.uid()=id);
CREATE FUNCTION public.consume_recipe_credit(int) RETURNS jsonb LANGUAGE sql AS $$SELECT '{}'::jsonb$$;
CREATE FUNCTION public.refund_recipe_credit() RETURNS void LANGUAGE sql AS $$SELECT$$;
INSERT INTO auth.users VALUES('00000000-0000-4000-8000-000000000001','fixture1@example.test'),('00000000-0000-4000-8000-000000000002','fixture2@example.test');
INSERT INTO public.profiles(id,email) SELECT id,email FROM auth.users;

-- Match the real signup trigger (no real users or production contents).
CREATE FUNCTION public.handle_new_user() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$BEGIN INSERT INTO public.profiles(id,email) VALUES(NEW.id,NEW.email);RETURN NEW;END;$$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
CREATE FUNCTION public.rls_auto_enable() RETURNS event_trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$BEGIN NULL;END;$$;
