-- Add search policies for messaging
CREATE POLICY "Anyone can view vendor profiles for search"
ON public.vendor_profiles
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Anyone can view user roles for search"
ON public.user_roles
FOR SELECT
TO authenticated
USING (true);
