-- Add missing group buy columns to meals table
ALTER TABLE public.meals ADD COLUMN IF NOT EXISTS group_buy_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE public.meals ADD COLUMN IF NOT EXISTS group_buy_min_qty INTEGER DEFAULT 5;
ALTER TABLE public.meals ADD COLUMN IF NOT EXISTS group_buy_discount_percent NUMERIC DEFAULT 10;

-- Add subtotal column to orders table if missing
-- Note: It is also present in 20260413120000_extend_schema.sql, but we add IF NOT EXISTS for safety
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS subtotal NUMERIC;

-- Ensure existing meals have these defaults if they were null
UPDATE public.meals SET group_buy_enabled = FALSE WHERE group_buy_enabled IS NULL;
UPDATE public.meals SET group_buy_min_qty = 5 WHERE group_buy_min_qty IS NULL;
UPDATE public.meals SET group_buy_discount_percent = 10 WHERE group_buy_discount_percent IS NULL;
