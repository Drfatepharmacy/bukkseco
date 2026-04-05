ALTER TABLE public.orders ADD COLUMN payment_reference text;
ALTER TABLE public.orders ADD COLUMN payment_status text DEFAULT 'pending';