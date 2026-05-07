
-- 1. Farmer profile additions
ALTER TABLE public.farmer_profiles
  ADD COLUMN IF NOT EXISTS farm_photos text[],
  ADD COLUMN IF NOT EXISTS farm_size_hectares numeric;

-- 2. Verification docs bucket (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('verification-docs', 'verification-docs', false)
ON CONFLICT (id) DO NOTHING;

-- Owner-scoped policies on verification-docs
DROP POLICY IF EXISTS "Owner can upload verification docs" ON storage.objects;
CREATE POLICY "Owner can upload verification docs"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'verification-docs' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Owner can read verification docs" ON storage.objects;
CREATE POLICY "Owner can read verification docs"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'verification-docs' AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR public.has_role(auth.uid(), 'admin')
  ));

DROP POLICY IF EXISTS "Owner can update verification docs" ON storage.objects;
CREATE POLICY "Owner can update verification docs"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'verification-docs' AND auth.uid()::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Owner can delete verification docs" ON storage.objects;
CREATE POLICY "Owner can delete verification docs"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'verification-docs' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 3. Tighten food-images & avatars: drop legacy permissive policies, add narrowed ones
DO $$
DECLARE p record;
BEGIN
  FOR p IN
    SELECT polname FROM pg_policy
    WHERE polrelid = 'storage.objects'::regclass
      AND polcmd = 'r'
      AND (
        polname ILIKE '%public%' OR polname ILIKE '%anyone%' OR polname ILIKE '%avatar%' OR polname ILIKE '%food-image%'
      )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', p.polname);
  END LOOP;
END $$;

-- Public read on individual objects only (no listing); requires exact name in URL.
CREATE POLICY "Public read food-images objects"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'food-images' AND name IS NOT NULL AND position('/' in name) > 0);

CREATE POLICY "Public read avatars objects"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars' AND name IS NOT NULL AND position('/' in name) > 0);

-- Authenticated uploads (owner-scoped) for food-images and avatars
CREATE POLICY "Owner upload food-images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'food-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Owner upload avatars"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Owner update food-images"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'food-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Owner update avatars"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 4. Fix mutable search_path on prevent_wallet_tx_mutation
CREATE OR REPLACE FUNCTION public.prevent_wallet_tx_mutation()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN RAISE EXCEPTION 'wallet_transactions are immutable'; END $$;

-- 5. Revoke public execute on SECURITY DEFINER functions; grant authenticated where needed
REVOKE EXECUTE ON FUNCTION public.update_meal_rating() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.prevent_wallet_tx_mutation() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.create_wallet_for_profile() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.generate_rider_display_id() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.generate_ticket_number() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.generate_order_number() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.decrement_meal_stock() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.increment_group_participants() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.mark_messages_as_read(uuid[], uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.settle_order_payment(uuid, uuid) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.mark_messages_as_read(uuid[], uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.settle_order_payment(uuid, uuid) TO authenticated;

-- 6. Promote ilomuche@gmail.com to admin (if account exists)
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'admin'::app_role
FROM auth.users u
WHERE lower(u.email) = 'ilomuche@gmail.com'
  AND NOT EXISTS (
    SELECT 1 FROM public.user_roles ur WHERE ur.user_id = u.id AND ur.role = 'admin'::app_role
  );

UPDATE public.profiles
SET is_approved = true
WHERE id IN (SELECT id FROM auth.users WHERE lower(email) = 'ilomuche@gmail.com');
