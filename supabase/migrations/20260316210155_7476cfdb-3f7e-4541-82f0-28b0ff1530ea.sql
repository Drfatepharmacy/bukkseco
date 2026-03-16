
-- Event logs table for immutable audit trail
CREATE TABLE public.event_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  actor_id uuid,
  target_type text,
  target_id text,
  metadata jsonb DEFAULT '{}'::jsonb,
  ip_address text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- System settings table for platform configuration
CREATE TABLE public.system_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  description text,
  updated_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- SMS/WhatsApp message logs
CREATE TABLE public.message_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  direction text NOT NULL DEFAULT 'outbound',
  channel text NOT NULL DEFAULT 'sms',
  phone_number text,
  content text NOT NULL,
  parsed_data jsonb,
  status text NOT NULL DEFAULT 'pending',
  user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.event_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_logs ENABLE ROW LEVEL SECURITY;

-- Event logs: only admins/founders can view, system can insert
CREATE POLICY "Admins can view event logs" ON public.event_logs
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated can insert event logs" ON public.event_logs
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- System settings: admins can manage
CREATE POLICY "Admins can manage settings" ON public.system_settings
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can read settings" ON public.system_settings
  FOR SELECT USING (true);

-- Message logs: admins can view all, users can view own
CREATE POLICY "Admins can manage message logs" ON public.message_logs
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view own messages" ON public.message_logs
  FOR SELECT USING (auth.uid() = user_id);

-- Insert default system settings
INSERT INTO public.system_settings (key, value, description) VALUES
  ('platform_lockdown', 'false'::jsonb, 'Emergency lockdown mode'),
  ('commission_rate', '0.05'::jsonb, 'Platform commission percentage'),
  ('delivery_base_fee', '500'::jsonb, 'Base delivery fee in Naira'),
  ('reservation_fee', '500'::jsonb, 'Table reservation booking fee'),
  ('sms_rate_limit', '100'::jsonb, 'Max SMS per hour'),
  ('supported_languages', '["en", "pcm", "ha", "yo", "ig"]'::jsonb, 'Supported languages');
