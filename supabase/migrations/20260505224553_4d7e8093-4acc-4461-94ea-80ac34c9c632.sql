ALTER TABLE public.meals
  ADD COLUMN IF NOT EXISTS group_buy_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS group_buy_min_qty integer NOT NULL DEFAULT 5,
  ADD COLUMN IF NOT EXISTS group_buy_discount_percent integer NOT NULL DEFAULT 10;

ALTER TABLE public.vendor_profiles
  ADD COLUMN IF NOT EXISTS delivery_multiplier numeric NOT NULL DEFAULT 1.0;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS username text;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS subtotal numeric;

-- FKs so PostgREST can resolve embedded selects
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='orders_buyer_id_fkey') THEN
    ALTER TABLE public.orders ADD CONSTRAINT orders_buyer_id_fkey FOREIGN KEY (buyer_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='orders_vendor_id_fkey') THEN
    ALTER TABLE public.orders ADD CONSTRAINT orders_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='orders_rider_id_fkey') THEN
    ALTER TABLE public.orders ADD CONSTRAINT orders_rider_id_fkey FOREIGN KEY (rider_id) REFERENCES public.profiles(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='vendor_profiles_user_id_fkey') THEN
    ALTER TABLE public.vendor_profiles ADD CONSTRAINT vendor_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='meals_vendor_id_fkey') THEN
    ALTER TABLE public.meals ADD CONSTRAINT meals_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Stub RPC for read receipts (no read_by column yet; safe no-op)
CREATE OR REPLACE FUNCTION public.mark_messages_as_read(message_ids uuid[], user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  UPDATE public.chat_messages
  SET read_at = COALESCE(read_at, now())
  WHERE id = ANY(message_ids)
    AND sender_id <> user_id;
END;
$$;