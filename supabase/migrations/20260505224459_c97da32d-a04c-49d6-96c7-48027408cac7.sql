-- chat-attachments bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-attachments', 'chat-attachments', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated can view chat attachments"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'chat-attachments');

CREATE POLICY "Users can upload own chat attachments"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'chat-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own chat attachments"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'chat-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Realtime
DO $$
BEGIN
  PERFORM 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='orders';
  IF NOT FOUND THEN ALTER PUBLICATION supabase_realtime ADD TABLE public.orders; END IF;
  PERFORM 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='wallets';
  IF NOT FOUND THEN ALTER PUBLICATION supabase_realtime ADD TABLE public.wallets; END IF;
  PERFORM 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='wallet_transactions';
  IF NOT FOUND THEN ALTER PUBLICATION supabase_realtime ADD TABLE public.wallet_transactions; END IF;
  PERFORM 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='group_buys';
  IF NOT FOUND THEN ALTER PUBLICATION supabase_realtime ADD TABLE public.group_buys; END IF;
  PERFORM 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='group_buy_participants';
  IF NOT FOUND THEN ALTER PUBLICATION supabase_realtime ADD TABLE public.group_buy_participants; END IF;
  PERFORM 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='chat_rooms';
  IF NOT FOUND THEN ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_rooms; END IF;
END $$;