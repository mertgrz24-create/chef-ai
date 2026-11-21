BEGIN;
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000001',true);
INSERT INTO public.shopping_items(id,user_id,name) VALUES ('00000000-0000-4000-8000-000000000099','00000000-0000-4000-8000-000000000001','tomato');
UPDATE public.shopping_items SET name='milk', revision=99 WHERE id='00000000-0000-4000-8000-000000000099' AND revision=0;
DO $$ BEGIN
  IF (SELECT revision FROM public.shopping_items WHERE id='00000000-0000-4000-8000-000000000099') <> 1 THEN RAISE EXCEPTION 'revision not server owned'; END IF;
END $$;
SELECT set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000002',true);
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM public.shopping_items WHERE id='00000000-0000-4000-8000-000000000099') THEN RAISE EXCEPTION 'other user can read'; END IF;
  UPDATE public.shopping_items SET name='other' WHERE id='00000000-0000-4000-8000-000000000099';
  IF FOUND THEN RAISE EXCEPTION 'other user can update'; END IF;
  DELETE FROM public.shopping_items WHERE id='00000000-0000-4000-8000-000000000099';
  IF FOUND THEN RAISE EXCEPTION 'other user can delete'; END IF;
END $$;
SELECT set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000001',true);
INSERT INTO public.shopping_items(user_id,name)
  SELECT '00000000-0000-4000-8000-000000000001', 'fixture-' || n FROM generate_series(1,498) AS n;
DO $$ BEGIN
  BEGIN
    INSERT INTO public.shopping_items(user_id,name) VALUES
      ('00000000-0000-4000-8000-000000000001','batch-a'),
      ('00000000-0000-4000-8000-000000000001','batch-b');
    RAISE EXCEPTION 'expected limit failure';
  EXCEPTION WHEN check_violation THEN NULL; END;
  IF (SELECT count(*) FROM public.shopping_items) <> 499 THEN RAISE EXCEPTION 'batch was partially inserted'; END IF;
END $$;
ROLLBACK;
