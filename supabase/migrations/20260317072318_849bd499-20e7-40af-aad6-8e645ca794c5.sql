
-- Replace overly permissive insert policy with authenticated-only
DROP POLICY "System can insert security events" ON public.security_events;
CREATE POLICY "Authenticated can insert security events"
ON public.security_events FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);
