-- Source only; remote application requires separate authorization.
BEGIN;
CREATE TABLE public.shopping_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (length(btrim(name)) BETWEEN 1 AND 300),
  checked boolean NOT NULL DEFAULT false,
  revision integer NOT NULL DEFAULT 0 CHECK (revision >= 0),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX shopping_items_owner_created ON public.shopping_items(user_id, created_at);
ALTER TABLE public.shopping_items ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.shopping_items FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shopping_items TO authenticated;
GRANT ALL ON public.shopping_items TO service_role;
CREATE POLICY shopping_items_owner ON public.shopping_items FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE FUNCTION public.shopping_items_guard() RETURNS trigger LANGUAGE plpgsql SET search_path = public, pg_catalog AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM pg_advisory_xact_lock(hashtextextended('shopping-items:' || NEW.user_id::text, 0));
    IF (SELECT count(*) FROM public.shopping_items WHERE user_id = NEW.user_id) >= 500 THEN
      RAISE EXCEPTION 'shopping list limit reached' USING ERRCODE = '23514';
    END IF;
    NEW.revision := 0;
  ELSE
    NEW.user_id := OLD.user_id;
    NEW.created_at := OLD.created_at;
    NEW.revision := OLD.revision + 1;
  END IF;
  RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION public.shopping_items_guard() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER shopping_items_guard BEFORE INSERT OR UPDATE ON public.shopping_items
  FOR EACH ROW EXECUTE FUNCTION public.shopping_items_guard();
COMMIT;
