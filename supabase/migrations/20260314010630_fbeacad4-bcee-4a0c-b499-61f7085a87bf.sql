
-- Storage bucket for food images
INSERT INTO storage.buckets (id, name, public) VALUES ('food-images', 'food-images', true);

-- Storage policies for food images
CREATE POLICY "Anyone can view food images" ON storage.objects FOR SELECT USING (bucket_id = 'food-images');
CREATE POLICY "Authenticated users can upload food images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'food-images' AND auth.role() = 'authenticated');
CREATE POLICY "Users can update own food images" ON storage.objects FOR UPDATE USING (bucket_id = 'food-images' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete own food images" ON storage.objects FOR DELETE USING (bucket_id = 'food-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Meals table (vendor food listings)
CREATE TABLE public.meals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2) NOT NULL CHECK (price > 0),
  category TEXT,
  image_url TEXT,
  is_available BOOLEAN NOT NULL DEFAULT true,
  rating_avg NUMERIC(3,2) DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Orders table
CREATE TYPE public.order_status AS ENUM ('pending', 'confirmed', 'preparing', 'rider_assigned', 'out_for_delivery', 'delivered', 'cancelled');

CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT NOT NULL UNIQUE,
  buyer_id UUID NOT NULL REFERENCES auth.users(id),
  vendor_id UUID NOT NULL REFERENCES auth.users(id),
  rider_id UUID REFERENCES auth.users(id),
  status order_status NOT NULL DEFAULT 'pending',
  total_amount NUMERIC(10,2) NOT NULL CHECK (total_amount >= 0),
  delivery_address TEXT,
  delivery_fee NUMERIC(10,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Order items
CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  meal_id UUID NOT NULL REFERENCES public.meals(id),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ratings / Reviews
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id),
  reviewer_id UUID NOT NULL REFERENCES auth.users(id),
  vendor_id UUID NOT NULL REFERENCES auth.users(id),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(order_id, reviewer_id)
);

-- Group buys
CREATE TYPE public.group_buy_status AS ENUM ('active', 'completed', 'expired', 'cancelled');

CREATE TABLE public.group_buys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_id UUID NOT NULL REFERENCES public.meals(id),
  creator_id UUID NOT NULL REFERENCES auth.users(id),
  title TEXT NOT NULL,
  original_price NUMERIC(10,2) NOT NULL,
  group_price NUMERIC(10,2) NOT NULL,
  min_participants INTEGER NOT NULL CHECK (min_participants >= 2),
  current_participants INTEGER NOT NULL DEFAULT 1,
  status group_buy_status NOT NULL DEFAULT 'active',
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.group_buy_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_buy_id UUID NOT NULL REFERENCES public.group_buys(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(group_buy_id, user_id)
);

-- Health tips
CREATE TABLE public.health_tips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_buys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_buy_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_tips ENABLE ROW LEVEL SECURITY;

-- Meals RLS
CREATE POLICY "Anyone can view available meals" ON public.meals FOR SELECT USING (true);
CREATE POLICY "Vendors can insert own meals" ON public.meals FOR INSERT WITH CHECK (auth.uid() = vendor_id);
CREATE POLICY "Vendors can update own meals" ON public.meals FOR UPDATE USING (auth.uid() = vendor_id);
CREATE POLICY "Vendors can delete own meals" ON public.meals FOR DELETE USING (auth.uid() = vendor_id);
CREATE POLICY "Admins can manage all meals" ON public.meals FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Orders RLS
CREATE POLICY "Buyers can view own orders" ON public.orders FOR SELECT USING (auth.uid() = buyer_id);
CREATE POLICY "Vendors can view their orders" ON public.orders FOR SELECT USING (auth.uid() = vendor_id);
CREATE POLICY "Riders can view assigned orders" ON public.orders FOR SELECT USING (auth.uid() = rider_id);
CREATE POLICY "Buyers can create orders" ON public.orders FOR INSERT WITH CHECK (auth.uid() = buyer_id);
CREATE POLICY "Vendors can update order status" ON public.orders FOR UPDATE USING (auth.uid() = vendor_id);
CREATE POLICY "Riders can update assigned orders" ON public.orders FOR UPDATE USING (auth.uid() = rider_id);
CREATE POLICY "Admins can manage all orders" ON public.orders FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Order items RLS
CREATE POLICY "Users can view own order items" ON public.order_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_items.order_id AND (orders.buyer_id = auth.uid() OR orders.vendor_id = auth.uid() OR orders.rider_id = auth.uid()))
);
CREATE POLICY "Buyers can insert order items" ON public.order_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_items.order_id AND orders.buyer_id = auth.uid())
);
CREATE POLICY "Admins can manage order items" ON public.order_items FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Reviews RLS
CREATE POLICY "Anyone can view reviews" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Buyers can create reviews" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = reviewer_id);
CREATE POLICY "Admins can manage reviews" ON public.reviews FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Group buys RLS
CREATE POLICY "Anyone can view active group buys" ON public.group_buys FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create group buys" ON public.group_buys FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Creators can update own group buys" ON public.group_buys FOR UPDATE USING (auth.uid() = creator_id);
CREATE POLICY "Admins can manage group buys" ON public.group_buys FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Group buy participants RLS
CREATE POLICY "Anyone can view participants" ON public.group_buy_participants FOR SELECT USING (true);
CREATE POLICY "Authenticated users can join" ON public.group_buy_participants FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can leave" ON public.group_buy_participants FOR DELETE USING (auth.uid() = user_id);

-- Health tips RLS
CREATE POLICY "Anyone can view active tips" ON public.health_tips FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage tips" ON public.health_tips FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Updated_at triggers
CREATE TRIGGER update_meals_updated_at BEFORE UPDATE ON public.meals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to generate order numbers
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
  NEW.order_number := 'BKS-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER set_order_number BEFORE INSERT ON public.orders FOR EACH ROW EXECUTE FUNCTION public.generate_order_number();

-- Function to update meal rating when review is added
CREATE OR REPLACE FUNCTION public.update_meal_rating()
RETURNS TRIGGER AS $$
DECLARE
  meal_id_val UUID;
BEGIN
  -- Get meal_id from the order
  SELECT oi.meal_id INTO meal_id_val
  FROM public.order_items oi
  WHERE oi.order_id = NEW.order_id
  LIMIT 1;
  
  IF meal_id_val IS NOT NULL THEN
    UPDATE public.meals SET
      rating_avg = (SELECT AVG(r.rating) FROM public.reviews r JOIN public.order_items oi ON oi.order_id = r.order_id WHERE oi.meal_id = meal_id_val),
      rating_count = (SELECT COUNT(*) FROM public.reviews r JOIN public.order_items oi ON oi.order_id = r.order_id WHERE oi.meal_id = meal_id_val)
    WHERE id = meal_id_val;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_review_created AFTER INSERT ON public.reviews FOR EACH ROW EXECUTE FUNCTION public.update_meal_rating();

-- Increment group buy participants
CREATE OR REPLACE FUNCTION public.increment_group_participants()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.group_buys 
  SET current_participants = current_participants + 1,
      status = CASE WHEN current_participants + 1 >= min_participants THEN 'completed'::group_buy_status ELSE status END
  WHERE id = NEW.group_buy_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_participant_joined AFTER INSERT ON public.group_buy_participants FOR EACH ROW EXECUTE FUNCTION public.increment_group_participants();
