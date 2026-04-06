-- Add stock tracking to meals
ALTER TABLE public.meals ADD COLUMN stock_quantity integer DEFAULT 100;

-- Add index for quick filtering of in-stock items
CREATE INDEX idx_meals_stock ON public.meals (stock_quantity) WHERE stock_quantity > 0;

-- Function to decrement stock when order items are inserted
CREATE OR REPLACE FUNCTION public.decrement_meal_stock()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.meals
  SET stock_quantity = GREATEST(stock_quantity - NEW.quantity, 0)
  WHERE id = NEW.meal_id AND stock_quantity >= NEW.quantity;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Insufficient stock for meal %', NEW.meal_id;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_decrement_stock
BEFORE INSERT ON public.order_items
FOR EACH ROW
EXECUTE FUNCTION public.decrement_meal_stock();