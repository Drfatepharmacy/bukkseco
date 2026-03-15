
-- Fix overly permissive INSERT on delivery_assignments
DROP POLICY "System can create assignments" ON public.delivery_assignments;
CREATE POLICY "Authenticated can create assignments" ON public.delivery_assignments FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Fix overly permissive INSERT on chat_rooms
DROP POLICY "Authenticated can create rooms" ON public.chat_rooms;
CREATE POLICY "Authenticated can create rooms" ON public.chat_rooms FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
