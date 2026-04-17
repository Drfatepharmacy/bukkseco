-- Extend meals table
ALTER TABLE public.meals ADD COLUMN IF NOT EXISTS unit text;
ALTER TABLE public.meals ADD COLUMN IF NOT EXISTS requires_takeaway boolean DEFAULT false;
ALTER TABLE public.meals ADD COLUMN IF NOT EXISTS takeaway_unit_type text;

-- Extend vendor_profiles table
ALTER TABLE public.vendor_profiles ADD COLUMN IF NOT EXISTS delivery_multiplier numeric DEFAULT 1.0;

-- Extend orders table
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS subtotal numeric;
