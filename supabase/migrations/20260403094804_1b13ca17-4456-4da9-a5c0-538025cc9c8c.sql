
-- Create registered_members table
CREATE TABLE IF NOT EXISTS public.registered_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  latitude DOUBLE PRECISION DEFAULT 0,
  longitude DOUBLE PRECISION DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  other_details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.registered_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view members" ON public.registered_members
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage members" ON public.registered_members
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can insert own member record" ON public.registered_members
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create landmarks table
CREATE TABLE IF NOT EXISTS public.landmarks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  type TEXT DEFAULT 'general',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.landmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view landmarks" ON public.landmarks
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage landmarks" ON public.landmarks
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Add landmark_passed to rider_locations
ALTER TABLE public.rider_locations ADD COLUMN IF NOT EXISTS landmark_passed TEXT;

-- Enable realtime for rider_locations
ALTER PUBLICATION supabase_realtime ADD TABLE public.rider_locations;
