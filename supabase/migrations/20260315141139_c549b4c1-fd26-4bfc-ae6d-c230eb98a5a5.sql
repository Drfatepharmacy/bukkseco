
-- Rider locations for proximity matching
CREATE TABLE public.rider_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  latitude double precision NOT NULL DEFAULT 0,
  longitude double precision NOT NULL DEFAULT 0,
  is_available boolean NOT NULL DEFAULT true,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.rider_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Riders can manage own location" ON public.rider_locations FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all locations" ON public.rider_locations FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Authenticated can view available riders" ON public.rider_locations FOR SELECT USING (is_available = true);

-- Add display_id and speed to rider_profiles
ALTER TABLE public.rider_profiles ADD COLUMN IF NOT EXISTS display_id text UNIQUE;
ALTER TABLE public.rider_profiles ADD COLUMN IF NOT EXISTS avg_speed numeric DEFAULT 0;
ALTER TABLE public.rider_profiles ADD COLUMN IF NOT EXISTS total_deliveries integer DEFAULT 0;

-- Generate unique rider display IDs
CREATE OR REPLACE FUNCTION public.generate_rider_display_id()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
BEGIN
  NEW.display_id := 'RDR-' || LPAD(FLOOR(RANDOM() * 100000)::TEXT, 5, '0');
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_rider_display_id BEFORE INSERT ON public.rider_profiles
FOR EACH ROW WHEN (NEW.display_id IS NULL) EXECUTE FUNCTION generate_rider_display_id();

-- Delivery assignments
CREATE TYPE public.delivery_status AS ENUM ('searching', 'offered', 'accepted', 'picked_up', 'delivered', 'cancelled');

CREATE TABLE public.delivery_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id),
  rider_id uuid,
  rider_display_id text,
  status delivery_status NOT NULL DEFAULT 'searching',
  search_radius numeric NOT NULL DEFAULT 2,
  pickup_lat double precision,
  pickup_lng double precision,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  accepted_at timestamp with time zone,
  delivered_at timestamp with time zone
);
ALTER TABLE public.delivery_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Riders can view offered deliveries" ON public.delivery_assignments FOR SELECT USING (status = 'offered' OR rider_id = auth.uid());
CREATE POLICY "Riders can accept deliveries" ON public.delivery_assignments FOR UPDATE USING (status = 'offered' OR rider_id = auth.uid());
CREATE POLICY "System can create assignments" ON public.delivery_assignments FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins manage all deliveries" ON public.delivery_assignments FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

ALTER PUBLICATION supabase_realtime ADD TABLE public.delivery_assignments;

-- Table reservations
CREATE TYPE public.reservation_status AS ENUM ('pending', 'confirmed', 'cancelled', 'completed');

CREATE TABLE public.reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  vendor_id uuid NOT NULL,
  reservation_date date NOT NULL,
  time_slot text NOT NULL,
  party_size integer NOT NULL DEFAULT 1,
  booking_fee numeric NOT NULL DEFAULT 500,
  status reservation_status NOT NULL DEFAULT 'pending',
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own reservations" ON public.reservations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create reservations" ON public.reservations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can cancel own" ON public.reservations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Vendors can view their reservations" ON public.reservations FOR SELECT USING (auth.uid() = vendor_id);
CREATE POLICY "Vendors can update reservations" ON public.reservations FOR UPDATE USING (auth.uid() = vendor_id);
CREATE POLICY "Admins manage reservations" ON public.reservations FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Chat system
CREATE TYPE public.chat_room_type AS ENUM ('direct', 'group');

CREATE TABLE public.chat_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type chat_room_type NOT NULL DEFAULT 'direct',
  name text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.chat_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  joined_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(room_id, user_id)
);
ALTER TABLE public.chat_participants ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES public.chat_rooms(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  content text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_chat_participant(_user_id uuid, _room_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = 'public' AS $$
  SELECT EXISTS (SELECT 1 FROM public.chat_participants WHERE user_id = _user_id AND room_id = _room_id)
$$;

CREATE POLICY "Participants can view rooms" ON public.chat_rooms FOR SELECT USING (is_chat_participant(auth.uid(), id));
CREATE POLICY "Authenticated can create rooms" ON public.chat_rooms FOR INSERT WITH CHECK (true);

CREATE POLICY "Participants can view participants" ON public.chat_participants FOR SELECT USING (is_chat_participant(auth.uid(), room_id));
CREATE POLICY "Can add participants" ON public.chat_participants FOR INSERT WITH CHECK (auth.uid() = user_id OR is_chat_participant(auth.uid(), room_id));
CREATE POLICY "Can leave rooms" ON public.chat_participants FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Participants can view messages" ON public.chat_messages FOR SELECT USING (is_chat_participant(auth.uid(), room_id));
CREATE POLICY "Participants can send messages" ON public.chat_messages FOR INSERT WITH CHECK (auth.uid() = sender_id AND is_chat_participant(auth.uid(), room_id));

ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;

-- Campus activity feed
CREATE TABLE public.campus_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  category text DEFAULT 'general',
  posted_by uuid NOT NULL,
  image_url text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.campus_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active activities" ON public.campus_activities FOR SELECT USING (is_active = true);
CREATE POLICY "Authenticated can post activities" ON public.campus_activities FOR INSERT WITH CHECK (auth.uid() = posted_by);
CREATE POLICY "Authors can update own" ON public.campus_activities FOR UPDATE USING (auth.uid() = posted_by);
CREATE POLICY "Admins manage activities" ON public.campus_activities FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

ALTER PUBLICATION supabase_realtime ADD TABLE public.campus_activities;
