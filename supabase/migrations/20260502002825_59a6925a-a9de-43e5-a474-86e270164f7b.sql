
-- Seed default commission splits (vendor 85%, rider 10%, platform 5%)
INSERT INTO public.system_settings (key, value, description) VALUES
  ('settlement_splits', '{"vendor": 0.85, "rider": 0.10, "platform": 0.05}'::jsonb, 'Order settlement percentage splits')
ON CONFLICT (key) DO NOTHING;

-- Ensure tenants have a platform wallet user (use tenant.id as the synthetic owner)
-- We model the platform float as a wallet keyed by tenant via user_id = tenants.id
-- Create a platform wallet per tenant if missing
INSERT INTO public.wallets (user_id, tenant_id, status, currency, balance)
SELECT t.id, t.id, 'active', 'NGN', 0
FROM public.tenants t
WHERE NOT EXISTS (
  SELECT 1 FROM public.wallets w WHERE w.user_id = t.id
);

-- Atomic settlement RPC: debits buyer, credits vendor + rider + platform.
-- All four updates + four ledger inserts happen in a single transaction.
CREATE OR REPLACE FUNCTION public.settle_order_payment(
  _order_id uuid,
  _buyer_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ord RECORD;
  splits jsonb;
  vendor_pct numeric;
  rider_pct numeric;
  platform_pct numeric;
  buyer_wallet RECORD;
  vendor_wallet RECORD;
  rider_wallet RECORD;
  platform_wallet RECORD;
  goods_amount numeric;
  delivery_amount numeric;
  vendor_share numeric;
  rider_share numeric;
  platform_share numeric;
  new_buyer_balance numeric;
  ref_base text;
BEGIN
  -- Load order (locked)
  SELECT id, buyer_id, vendor_id, rider_id, total_amount, delivery_fee,
         payment_status, tenant_id, order_number
  INTO ord
  FROM public.orders
  WHERE id = _order_id
  FOR UPDATE;

  IF ord IS NULL THEN
    RAISE EXCEPTION 'Order % not found', _order_id;
  END IF;
  IF ord.buyer_id <> _buyer_id THEN
    RAISE EXCEPTION 'Buyer mismatch';
  END IF;
  IF ord.payment_status = 'paid' THEN
    RETURN jsonb_build_object('status', 'already_paid');
  END IF;

  -- Splits config
  SELECT value INTO splits FROM public.system_settings WHERE key = 'settlement_splits';
  vendor_pct   := COALESCE((splits->>'vendor')::numeric, 0.85);
  rider_pct    := COALESCE((splits->>'rider')::numeric, 0.10);
  platform_pct := COALESCE((splits->>'platform')::numeric, 0.05);

  delivery_amount := COALESCE(ord.delivery_fee, 0);
  goods_amount    := ord.total_amount - delivery_amount;

  -- Vendor gets vendor_pct of goods
  vendor_share := round(goods_amount * vendor_pct, 2);
  -- Rider gets full delivery_fee + rider_pct of goods (only if assigned)
  rider_share := CASE
    WHEN ord.rider_id IS NOT NULL THEN round(goods_amount * rider_pct, 2) + delivery_amount
    ELSE 0
  END;
  -- Platform gets the remainder so totals always reconcile
  platform_share := ord.total_amount - vendor_share - rider_share;

  -- Lock wallets
  SELECT * INTO buyer_wallet FROM public.wallets WHERE user_id = ord.buyer_id FOR UPDATE;
  IF buyer_wallet IS NULL THEN RAISE EXCEPTION 'Buyer wallet missing'; END IF;
  IF buyer_wallet.balance < ord.total_amount THEN
    RAISE EXCEPTION 'Insufficient wallet balance';
  END IF;

  SELECT * INTO vendor_wallet FROM public.wallets WHERE user_id = ord.vendor_id FOR UPDATE;
  IF vendor_wallet IS NULL THEN RAISE EXCEPTION 'Vendor wallet missing'; END IF;

  IF ord.rider_id IS NOT NULL THEN
    SELECT * INTO rider_wallet FROM public.wallets WHERE user_id = ord.rider_id FOR UPDATE;
    IF rider_wallet IS NULL THEN RAISE EXCEPTION 'Rider wallet missing'; END IF;
  END IF;

  SELECT * INTO platform_wallet FROM public.wallets
    WHERE user_id = ord.tenant_id FOR UPDATE;
  IF platform_wallet IS NULL THEN RAISE EXCEPTION 'Platform wallet missing'; END IF;

  ref_base := 'STL-' || COALESCE(ord.order_number, _order_id::text);

  -- 1) Debit buyer
  new_buyer_balance := buyer_wallet.balance - ord.total_amount;
  UPDATE public.wallets SET balance = new_buyer_balance, updated_at = now()
    WHERE id = buyer_wallet.id;
  INSERT INTO public.wallet_transactions
    (wallet_id, tenant_id, type, amount, balance_after, reference, related_order_id, metadata)
  VALUES
    (buyer_wallet.id, buyer_wallet.tenant_id, 'debit', ord.total_amount, new_buyer_balance,
     ref_base || '-BUY', _order_id,
     jsonb_build_object('description', 'Order payment', 'order_number', ord.order_number));

  -- 2) Credit vendor
  UPDATE public.wallets SET balance = balance + vendor_share, updated_at = now()
    WHERE id = vendor_wallet.id;
  INSERT INTO public.wallet_transactions
    (wallet_id, tenant_id, type, amount, balance_after, reference, related_order_id, metadata)
  VALUES
    (vendor_wallet.id, vendor_wallet.tenant_id, 'credit', vendor_share,
     vendor_wallet.balance + vendor_share, ref_base || '-VND', _order_id,
     jsonb_build_object('description', 'Vendor payout', 'order_number', ord.order_number,
                       'gross', goods_amount, 'pct', vendor_pct));

  -- 3) Credit rider (if any)
  IF ord.rider_id IS NOT NULL AND rider_share > 0 THEN
    UPDATE public.wallets SET balance = balance + rider_share, updated_at = now()
      WHERE id = rider_wallet.id;
    INSERT INTO public.wallet_transactions
      (wallet_id, tenant_id, type, amount, balance_after, reference, related_order_id, metadata)
    VALUES
      (rider_wallet.id, rider_wallet.tenant_id, 'credit', rider_share,
       rider_wallet.balance + rider_share, ref_base || '-RDR', _order_id,
       jsonb_build_object('description', 'Rider payout', 'order_number', ord.order_number,
                         'delivery_fee', delivery_amount, 'pct', rider_pct));
  END IF;

  -- 4) Credit platform
  IF platform_share <> 0 THEN
    UPDATE public.wallets SET balance = balance + platform_share, updated_at = now()
      WHERE id = platform_wallet.id;
    INSERT INTO public.wallet_transactions
      (wallet_id, tenant_id, type, amount, balance_after, reference, related_order_id, metadata)
    VALUES
      (platform_wallet.id, platform_wallet.tenant_id, 'credit', platform_share,
       platform_wallet.balance + platform_share, ref_base || '-PLT', _order_id,
       jsonb_build_object('description', 'Platform commission', 'order_number', ord.order_number,
                         'pct', platform_pct));
  END IF;

  -- Mark order paid
  UPDATE public.orders
  SET payment_status = 'paid',
      payment_reference = ref_base,
      updated_at = now()
  WHERE id = _order_id;

  RETURN jsonb_build_object(
    'status', 'success',
    'order_id', _order_id,
    'total', ord.total_amount,
    'vendor_share', vendor_share,
    'rider_share', rider_share,
    'platform_share', platform_share,
    'buyer_balance', new_buyer_balance
  );
END;
$$;

-- Allow authenticated users to call it; the function self-validates buyer ownership
REVOKE ALL ON FUNCTION public.settle_order_payment(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.settle_order_payment(uuid, uuid) TO authenticated, service_role;
