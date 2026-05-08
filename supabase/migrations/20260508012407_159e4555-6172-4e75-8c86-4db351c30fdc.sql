
-- Rider stats
CREATE OR REPLACE FUNCTION public.get_rider_stats(_user_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'earnings_today', COALESCE((
      SELECT SUM(wt.amount) FROM wallet_transactions wt
      JOIN wallets w ON w.id = wt.wallet_id
      WHERE w.user_id = _user_id AND wt.type = 'credit'
        AND wt.created_at >= date_trunc('day', now())
    ), 0),
    'deliveries_today', COALESCE((
      SELECT COUNT(*) FROM orders
      WHERE rider_id = _user_id AND status = 'delivered'
        AND updated_at >= date_trunc('day', now())
    ), 0),
    'active_delivery_id', (
      SELECT id::text FROM orders
      WHERE rider_id = _user_id AND status NOT IN ('delivered','cancelled')
      LIMIT 1
    ),
    'avg_rating', COALESCE((
      SELECT ROUND(AVG(r.rating)::numeric, 1) FROM reviews r
      JOIN orders o ON o.id = r.order_id
      WHERE o.rider_id = _user_id
    ), 0)
  )
$$;
REVOKE EXECUTE ON FUNCTION public.get_rider_stats(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_rider_stats(uuid) TO authenticated, service_role;

-- Order chart data: last 7 days
CREATE OR REPLACE FUNCTION public.get_order_chart_data(_user_id uuid, _role text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_agg(jsonb_build_object('name', day_label, 'value', cnt) ORDER BY d)
  INTO result
  FROM (
    SELECT
      to_char(d, 'Dy') AS day_label,
      d,
      (
        SELECT COUNT(*) FROM orders o
        WHERE date_trunc('day', o.created_at) = d
          AND (
            (_role = 'student' AND o.buyer_id = _user_id) OR
            (_role IN ('vendor','farmer') AND o.vendor_id = _user_id) OR
            (_role = 'rider' AND o.rider_id = _user_id) OR
            (_role = 'admin')
          )
      ) AS cnt
    FROM generate_series(date_trunc('day', now()) - interval '6 days', date_trunc('day', now()), interval '1 day') AS d
  ) s;
  RETURN COALESCE(result, '[]'::jsonb);
END
$$;
REVOKE EXECUTE ON FUNCTION public.get_order_chart_data(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_order_chart_data(uuid, text) TO authenticated, service_role;

-- Revenue chart data: last 7 days
CREATE OR REPLACE FUNCTION public.get_revenue_chart_data(_user_id uuid, _role text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_agg(jsonb_build_object('name', day_label, 'value', amt) ORDER BY d)
  INTO result
  FROM (
    SELECT
      to_char(d, 'Dy') AS day_label,
      d,
      (
        SELECT COALESCE(SUM(o.total_amount), 0) FROM orders o
        WHERE date_trunc('day', o.created_at) = d
          AND o.payment_status = 'paid'
          AND (
            (_role = 'student' AND o.buyer_id = _user_id) OR
            (_role IN ('vendor','farmer') AND o.vendor_id = _user_id) OR
            (_role = 'rider' AND o.rider_id = _user_id) OR
            (_role = 'admin')
          )
      ) AS amt
    FROM generate_series(date_trunc('day', now()) - interval '6 days', date_trunc('day', now()), interval '1 day') AS d
  ) s;
  RETURN COALESCE(result, '[]'::jsonb);
END
$$;
REVOKE EXECUTE ON FUNCTION public.get_revenue_chart_data(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_revenue_chart_data(uuid, text) TO authenticated, service_role;

-- Recent activity feed
CREATE OR REPLACE FUNCTION public.get_recent_activity(_user_id uuid, _role text)
RETURNS jsonb
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(jsonb_agg(row_to_json(t) ORDER BY (t.created_at) DESC), '[]'::jsonb)
  FROM (
    SELECT
      ('order_' || o.status::text) AS kind,
      ('Order ' || COALESCE(o.order_number, '#') || ' — ' || o.status::text) AS text,
      o.created_at
    FROM orders o
    WHERE
      (_role = 'student' AND o.buyer_id = _user_id) OR
      (_role IN ('vendor','farmer') AND o.vendor_id = _user_id) OR
      (_role = 'rider' AND o.rider_id = _user_id) OR
      (_role = 'admin')
    ORDER BY o.created_at DESC
    LIMIT 8
  ) t
$$;
REVOKE EXECUTE ON FUNCTION public.get_recent_activity(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_recent_activity(uuid, text) TO authenticated, service_role;
