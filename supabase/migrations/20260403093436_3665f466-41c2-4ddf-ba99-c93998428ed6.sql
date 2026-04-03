-- Allow authenticated users to view profiles for chat search
CREATE POLICY "Authenticated can view profiles for chat"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);