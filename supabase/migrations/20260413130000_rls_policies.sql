-- RLS Policies for Vendor and Admin

-- Allow vendors to update their own profiles (including delivery multiplier)
CREATE POLICY "Vendors can update their own profiles"
ON public.vendor_profiles
FOR UPDATE
USING (auth.uid() = user_id);

-- Allow admins to see all vendor profiles
CREATE POLICY "Admins can see all vendor profiles"
ON public.vendor_profiles
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.user_roles
  WHERE user_id = auth.uid() AND role = 'admin'
));

-- Allow admins to update any vendor profile (for approval/suspension)
CREATE POLICY "Admins can update any vendor profile"
ON public.vendor_profiles
FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM public.user_roles
  WHERE user_id = auth.uid() AND role = 'admin'
));

-- Ensure meals can be managed by their vendors
CREATE POLICY "Vendors can manage their own meals"
ON public.meals
FOR ALL
USING (auth.uid() = vendor_id);

-- Allow everyone to see available meals
CREATE POLICY "Anyone can see available meals"
ON public.meals
FOR SELECT
USING (is_available = true);
