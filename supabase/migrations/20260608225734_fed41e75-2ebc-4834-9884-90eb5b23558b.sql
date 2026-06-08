
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chat_participants_room_id_fkey') THEN
    ALTER TABLE public.chat_participants
      ADD CONSTRAINT chat_participants_room_id_fkey
      FOREIGN KEY (room_id) REFERENCES public.chat_rooms(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chat_participants_user_id_fkey') THEN
    ALTER TABLE public.chat_participants
      ADD CONSTRAINT chat_participants_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chat_messages_room_id_fkey') THEN
    ALTER TABLE public.chat_messages
      ADD CONSTRAINT chat_messages_room_id_fkey
      FOREIGN KEY (room_id) REFERENCES public.chat_rooms(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chat_messages_sender_id_fkey') THEN
    ALTER TABLE public.chat_messages
      ADD CONSTRAINT chat_messages_sender_id_fkey
      FOREIGN KEY (sender_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'vendor_profiles_user_id_fkey') THEN
    ALTER TABLE public.vendor_profiles
      ADD CONSTRAINT vendor_profiles_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_roles_user_id_fkey') THEN
    ALTER TABLE public.user_roles
      ADD CONSTRAINT user_roles_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'meals_vendor_id_fkey') THEN
    ALTER TABLE public.meals
      ADD CONSTRAINT meals_vendor_id_fkey
      FOREIGN KEY (vendor_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_chat_participants_user ON public.chat_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_participants_room ON public.chat_participants(room_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_room ON public.chat_messages(room_id);
CREATE INDEX IF NOT EXISTS idx_meals_vendor ON public.meals(vendor_id);
