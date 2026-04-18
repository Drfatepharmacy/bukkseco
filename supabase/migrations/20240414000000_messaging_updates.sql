-- Add username to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_idx ON public.profiles (username);

-- Update chat_messages table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'attachment_type') THEN
        CREATE TYPE public.attachment_type AS ENUM ('image', 'file');
    END IF;
END $$;

ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS read_by UUID[] DEFAULT '{}';
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS attachment_type public.attachment_type;
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS attachment_url TEXT;

-- Ensure indexes for performance
CREATE INDEX IF NOT EXISTS chat_messages_room_id_idx ON public.chat_messages (room_id);
CREATE INDEX IF NOT EXISTS chat_participants_user_id_idx ON public.chat_participants (user_id);

-- Storage Bucket for chat attachments
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-attachments', 'chat-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies
CREATE POLICY "Anyone can view chat attachments" ON storage.objects
    FOR SELECT USING (bucket_id = 'chat-attachments');

CREATE POLICY "Authenticated users can upload chat attachments" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'chat-attachments' AND
        auth.role() = 'authenticated'
    );

-- RLS Policies for Chat
ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Room access: if you are a participant
CREATE OR REPLACE FUNCTION public.is_chat_participant(_room_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.chat_participants
        WHERE room_id = _room_id AND user_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Chat Rooms policies
DROP POLICY IF EXISTS "Users can view rooms they are part of" ON public.chat_rooms;
CREATE POLICY "Users can view rooms they are part of" ON public.chat_rooms
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.chat_participants
            WHERE room_id = public.chat_rooms.id AND user_id = auth.uid()
        )
    );

-- RPC for marking messages as read (appending to uuid array)
CREATE OR REPLACE FUNCTION public.mark_messages_as_read(message_ids UUID[], user_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE public.chat_messages
    SET read_by = array_append(read_by, user_id)
    WHERE id = ANY(message_ids)
    AND NOT (user_id = ANY(read_by));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Chat Participants policies
DROP POLICY IF EXISTS "Users can view participants of their rooms" ON public.chat_participants;
CREATE POLICY "Users can view participants of their rooms" ON public.chat_participants
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.chat_participants AS p
            WHERE p.room_id = public.chat_participants.room_id AND p.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can join rooms" ON public.chat_participants;
CREATE POLICY "Users can join rooms" ON public.chat_participants
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Chat Messages policies
DROP POLICY IF EXISTS "Users can view messages in their rooms" ON public.chat_messages;
CREATE POLICY "Users can view messages in their rooms" ON public.chat_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.chat_participants
            WHERE room_id = public.chat_messages.room_id AND user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can send messages to their rooms" ON public.chat_messages;
CREATE POLICY "Users can send messages to their rooms" ON public.chat_messages
    FOR INSERT WITH CHECK (
        auth.uid() = sender_id AND
        EXISTS (
            SELECT 1 FROM public.chat_participants
            WHERE room_id = public.chat_messages.room_id AND user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can update read status" ON public.chat_messages;
CREATE POLICY "Users can update read status" ON public.chat_messages
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.chat_participants
            WHERE room_id = public.chat_messages.room_id AND user_id = auth.uid()
        )
    ) WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.chat_participants
            WHERE room_id = public.chat_messages.room_id AND user_id = auth.uid()
        )
    );
