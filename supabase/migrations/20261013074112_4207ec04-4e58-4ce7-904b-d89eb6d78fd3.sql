ALTER TABLE public.vendor_profiles ADD COLUMN IF NOT EXISTS pickup_lat double precision, ADD COLUMN IF NOT EXISTS pickup_lng double precision, ADD COLUMN IF NOT EXISTS pickup_landmark text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS picked_up_at timestamptz, ADD COLUMN IF NOT EXISTS delivered_at timestamptz;

CREATE OR REPLACE FUNCTION public.get_rider_jobs()
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT COALESCE(jsonb_agg(j ORDER BY j->>'created_at'), '[]'::jsonb) FROM (
    SELECT jsonb_build_object(
      'id', o.id, 'order_number', o.order_number, 'status', o.status, 'rider_id', o.rider_id,
      'delivery_address', o.delivery_address, 'delivery_fee', o.delivery_fee,
      'prep_minutes', o.prep_minutes, 'created_at', o.created_at, 'picked_up_at', o.picked_up_at,
      'vendor_name', vp.business_name, 'pickup_lat', vp.pickup_lat, 'pickup_lng', vp.pickup_lng,
      'pickup_landmark', vp.pickup_landmark,
      'items', (SELECT COALESCE(jsonb_agg(jsonb_build_object('q', oi.quantity, 'name', m.name)), '[]'::jsonb)
                FROM order_items oi JOIN meals m ON m.id = oi.meal_id WHERE oi.order_id = o.id)
    ) j
    FROM orders o LEFT JOIN vendor_profiles vp ON vp.user_id = o.vendor_id
    WHERE has_role(auth.uid(), 'rider') AND (
      (o.status = 'ready' AND o.rider_id IS NULL AND o.payment_status = 'paid')
      OR (o.rider_id = auth.uid() AND o.status IN ('rider_assigned','out_for_delivery'))
    )
  ) s
$$;

CREATE OR REPLACE FUNCTION public.rider_claim_order(_order_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NOT has_role(auth.uid(), 'rider') THEN RAISE EXCEPTION 'Not a rider'; END IF;
  IF EXISTS (SELECT 1 FROM orders WHERE rider_id = auth.uid() AND status IN ('rider_assigned','out_for_delivery')) THEN
    RAISE EXCEPTION 'Finish your current delivery first';
  END IF;
  UPDATE orders SET rider_id = auth.uid(), status = 'rider_assigned'
   WHERE id = _order_id AND status = 'ready' AND rider_id IS NULL AND payment_status = 'paid';
  RETURN FOUND;
END $$;

CREATE OR REPLACE FUNCTION public.rider_advance_order(_order_id uuid)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE s order_status;
BEGIN
  SELECT status INTO s FROM orders WHERE id = _order_id AND rider_id = auth.uid() FOR UPDATE;
  IF s IS NULL THEN RAISE EXCEPTION 'Not your delivery'; END IF;
  IF s = 'rider_assigned' THEN
    UPDATE orders SET status = 'out_for_delivery', picked_up_at = now() WHERE id = _order_id; RETURN 'out_for_delivery';
  ELSIF s = 'out_for_delivery' THEN
    UPDATE orders SET status = 'delivered', delivered_at = now() WHERE id = _order_id;
    UPDATE rider_profiles SET total_deliveries = COALESCE(total_deliveries,0) + 1 WHERE user_id = auth.uid();
    RETURN 'delivered';
  END IF;
  RAISE EXCEPTION 'Order cannot advance from %', s;
END $$;

REVOKE EXECUTE ON FUNCTION public.get_rider_jobs(), public.rider_claim_order(uuid), public.rider_advance_order(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_rider_jobs(), public.rider_claim_order(uuid), public.rider_advance_order(uuid) TO authenticated;