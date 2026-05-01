
-- 1. TENANTS
CREATE TABLE IF NOT EXISTS public.tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  logo_url text,
  primary_color text,
  secondary_color text,
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view tenants" ON public.tenants FOR SELECT USING (true);
CREATE POLICY "Admins can manage tenants" ON public.tenants FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role));

INSERT INTO public.tenants (slug, name, primary_color, secondary_color)
VALUES ('uniben', 'University of Benin', '#D4A017', '#7C3AED')
ON CONFLICT (slug) DO NOTHING;

CREATE TRIGGER update_tenants_updated_at
  BEFORE UPDATE ON public.tenants
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. has_any_role helper
CREATE OR REPLACE FUNCTION public.has_any_role(_user_id uuid, _roles app_role[])
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = ANY(_roles)
  )
$$;

-- 3. Add tenant_id to business tables + index + backfill
DO $$
DECLARE
  uniben_id uuid;
  t text;
BEGIN
  SELECT id INTO uniben_id FROM public.tenants WHERE slug = 'uniben';
  FOR t IN SELECT unnest(ARRAY[
    'profiles','vendor_profiles','rider_profiles','farmer_profiles',
    'meals','orders','order_items','delivery_assignments',
    'chat_rooms','chat_messages','support_tickets','reviews',
    'group_buys','reservations','campus_activities'
  ]) LOOP
    EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.tenants(id)', t);
    EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_tenant_id ON public.%I(tenant_id)', t, t);
    EXECUTE format('UPDATE public.%I SET tenant_id = $1 WHERE tenant_id IS NULL', t) USING uniben_id;
  END LOOP;
END $$;

-- 4. WALLETS
CREATE TABLE IF NOT EXISTS public.wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  tenant_id uuid REFERENCES public.tenants(id),
  balance numeric(14,2) NOT NULL DEFAULT 0 CHECK (balance >= 0),
  currency text NOT NULL DEFAULT 'NGN',
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own wallet" ON public.wallets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins view all wallets" ON public.wallets FOR SELECT
  USING (public.has_any_role(auth.uid(), ARRAY['admin','tenant_admin','super_admin']::app_role[]));

CREATE TRIGGER update_wallets_updated_at
  BEFORE UPDATE ON public.wallets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5. WALLET TRANSACTIONS (immutable ledger)
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id uuid NOT NULL REFERENCES public.wallets(id) ON DELETE RESTRICT,
  tenant_id uuid REFERENCES public.tenants(id),
  type text NOT NULL CHECK (type IN ('credit','debit','hold','release','payout','refund')),
  amount numeric(14,2) NOT NULL CHECK (amount > 0),
  balance_after numeric(14,2) NOT NULL,
  reference text NOT NULL UNIQUE,
  related_order_id uuid,
  related_paystack_ref text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wallet_tx_wallet ON public.wallet_transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_wallet_tx_order ON public.wallet_transactions(related_order_id);

ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own wallet transactions" ON public.wallet_transactions FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.wallets w WHERE w.id = wallet_id AND w.user_id = auth.uid()));
CREATE POLICY "Admins view all wallet transactions" ON public.wallet_transactions FOR SELECT
  USING (public.has_any_role(auth.uid(), ARRAY['admin','tenant_admin','super_admin']::app_role[]));

CREATE OR REPLACE FUNCTION public.prevent_wallet_tx_mutation()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'wallet_transactions are immutable'; END $$;

DROP TRIGGER IF EXISTS no_update_wallet_tx ON public.wallet_transactions;
CREATE TRIGGER no_update_wallet_tx
  BEFORE UPDATE OR DELETE ON public.wallet_transactions
  FOR EACH ROW EXECUTE FUNCTION public.prevent_wallet_tx_mutation();

-- 6. PAYSTACK TRANSACTIONS
CREATE TABLE IF NOT EXISTS public.paystack_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference text NOT NULL UNIQUE,
  user_id uuid NOT NULL,
  tenant_id uuid REFERENCES public.tenants(id),
  amount numeric(14,2) NOT NULL,
  currency text NOT NULL DEFAULT 'NGN',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','success','failed')),
  purpose text NOT NULL CHECK (purpose IN ('wallet_topup','order','payout')),
  raw_response jsonb,
  verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_paystack_tx_user ON public.paystack_transactions(user_id);

ALTER TABLE public.paystack_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own paystack transactions" ON public.paystack_transactions FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "Admins view all paystack transactions" ON public.paystack_transactions FOR SELECT
  USING (public.has_any_role(auth.uid(), ARRAY['admin','tenant_admin','super_admin']::app_role[]));

-- 7. ZONES
CREATE TABLE IF NOT EXISTS public.zones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES public.tenants(id),
  name text NOT NULL,
  polygon jsonb,
  base_fee numeric(10,2) NOT NULL DEFAULT 0,
  per_km_fee numeric(10,2) NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.zones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone view active zones" ON public.zones FOR SELECT USING (active = true);
CREATE POLICY "Admins manage zones" ON public.zones FOR ALL
  USING (public.has_any_role(auth.uid(), ARRAY['admin','tenant_admin','super_admin']::app_role[]));

CREATE TRIGGER update_zones_updated_at
  BEFORE UPDATE ON public.zones
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 8. AUDIT LOGS view alias
CREATE OR REPLACE VIEW public.audit_logs AS
  SELECT id, event_type, actor_id, target_type, target_id, ip_address, metadata, created_at
  FROM public.event_logs;

-- 9. Auto-create wallet on profile creation + backfill
CREATE OR REPLACE FUNCTION public.create_wallet_for_profile()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE uniben_id uuid;
BEGIN
  SELECT id INTO uniben_id FROM public.tenants WHERE slug = 'uniben';
  INSERT INTO public.wallets (user_id, tenant_id)
  VALUES (NEW.id, COALESCE(NEW.tenant_id, uniben_id))
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS create_wallet_on_profile ON public.profiles;
CREATE TRIGGER create_wallet_on_profile
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.create_wallet_for_profile();

INSERT INTO public.wallets (user_id, tenant_id)
SELECT p.id, p.tenant_id FROM public.profiles p
LEFT JOIN public.wallets w ON w.user_id = p.id
WHERE w.id IS NULL;
