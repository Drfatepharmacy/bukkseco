
-- Function to get student dashboard statistics
CREATE OR REPLACE FUNCTION get_student_stats(_user_id UUID)
RETURNS JSON AS $$
DECLARE
    total_orders_month INTEGER;
    active_deliveries INTEGER;
    avg_rating NUMERIC;
    total_savings NUMERIC;
BEGIN
    -- Orders this month
    SELECT count(*) INTO total_orders_month
    FROM orders
    WHERE buyer_id = _user_id
    AND created_at >= date_trunc('month', now());

    -- Active deliveries
    SELECT count(*) INTO active_deliveries
    FROM orders
    WHERE buyer_id = _user_id
    AND status IN ('pending', 'confirmed', 'preparing', 'rider_assigned', 'out_for_delivery');

    -- Average rating (rating given by this student)
    SELECT COALESCE(avg(rating), 0) INTO avg_rating
    FROM reviews
    WHERE reviewer_id = _user_id;

    -- Total savings (approximate calculation from group buys)
    -- This assumes order_items.unit_price is the price paid, and meals.price is original (not strictly true if price changed)
    -- A better way might be to look at group_buys table if linked, but let's use a simple diff for now if we had that data.
    -- For now, let's just return a mock or a placeholder if the data isn't fully there.
    -- Actually, let's try to calculate it from group_buy_participants and group_buys
    SELECT COALESCE(sum(gb.original_price - gb.group_price), 0) INTO total_savings
    FROM group_buy_participants gbp
    JOIN group_buys gb ON gb.id = gbp.group_buy_id
    WHERE gbp.user_id = _user_id
    AND gb.status = 'completed';

    RETURN json_build_object(
        'orders_this_month', total_orders_month,
        'active_deliveries', active_deliveries,
        'avg_rating', round(avg_rating, 1),
        'total_savings', total_savings
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to handle group buy participation and status updates
CREATE OR REPLACE FUNCTION handle_group_buy_participation()
RETURNS TRIGGER AS $$
DECLARE
    min_qty INTEGER;
    current_qty INTEGER;
BEGIN
    -- Get min participants required
    SELECT min_participants INTO min_qty FROM group_buys WHERE id = NEW.group_buy_id;

    -- Count current participants
    SELECT count(*) INTO current_qty FROM group_buy_participants WHERE group_buy_id = NEW.group_buy_id;

    -- If threshold reached, mark as completed
    IF current_qty >= min_qty THEN
        UPDATE group_buys SET status = 'completed' WHERE id = NEW.group_buy_id AND status = 'active';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_group_buy_participation ON group_buy_participants;
CREATE TRIGGER on_group_buy_participation
AFTER INSERT ON group_buy_participants
FOR EACH ROW EXECUTE FUNCTION handle_group_buy_participation();

-- Function to get chart data (orders per day for last 7 days)
CREATE OR REPLACE FUNCTION get_order_chart_data(_user_id UUID DEFAULT NULL, _role TEXT DEFAULT NULL)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_agg(t) INTO result
    FROM (
        SELECT
            to_char(d, 'Dy') as label,
            (
                SELECT count(*)
                FROM orders o
                WHERE date_trunc('day', o.created_at) = d
                AND (
                    _role IS NULL
                    OR (_role = 'student' AND o.buyer_id = _user_id)
                    OR (_role = 'vendor' AND o.vendor_id = _user_id)
                    OR (_role = 'rider' AND o.rider_id = _user_id)
                    OR (_role = 'admin')
                )
            ) as value
        FROM generate_series(
            date_trunc('day', now() - interval '6 days'),
            date_trunc('day', now()),
            interval '1 day'
        ) d
        ORDER BY d
    ) t;

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get revenue chart data (revenue per month for last 6 months)
CREATE OR REPLACE FUNCTION get_revenue_chart_data(_user_id UUID DEFAULT NULL, _role TEXT DEFAULT NULL)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_agg(t) INTO result
    FROM (
        SELECT
            to_char(m, 'Mon') as label,
            (
                SELECT COALESCE(sum(o.total_amount), 0)
                FROM orders o
                WHERE date_trunc('month', o.created_at) = m
                AND o.status = 'delivered'
                AND (
                    _role IS NULL
                    OR (_role = 'student' AND o.buyer_id = _user_id) -- Spending for students
                    OR (_role = 'vendor' AND o.vendor_id = _user_id)
                    OR (_role = 'rider' AND o.rider_id = _user_id)
                    OR (_role = 'admin')
                )
            ) as value
        FROM generate_series(
            date_trunc('month', now() - interval '5 months'),
            date_trunc('month', now()),
            interval '1 month'
        ) m
        ORDER BY m
    ) t;

    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get vendor dashboard statistics
CREATE OR REPLACE FUNCTION get_vendor_stats(_user_id UUID)
RETURNS JSON AS $$
DECLARE
    total_revenue NUMERIC;
    active_orders INTEGER;
    menu_items INTEGER;
    avg_rating NUMERIC;
BEGIN
    -- Total Revenue
    SELECT COALESCE(sum(total_amount - COALESCE(delivery_fee, 0)), 0) INTO total_revenue
    FROM orders
    WHERE vendor_id = _user_id
    AND status = 'delivered';

    -- Active Orders
    SELECT count(*) INTO active_orders
    FROM orders
    WHERE vendor_id = _user_id
    AND status NOT IN ('delivered', 'cancelled');

    -- Menu Items
    SELECT count(*) INTO menu_items
    FROM meals
    WHERE vendor_id = _user_id;

    -- Average Rating
    SELECT COALESCE(avg(rating), 0) INTO avg_rating
    FROM reviews
    WHERE vendor_id = _user_id;

    RETURN json_build_object(
        'total_revenue', total_revenue,
        'active_orders', active_orders,
        'menu_items', menu_items,
        'avg_rating', round(avg_rating, 1)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get rider dashboard statistics
CREATE OR REPLACE FUNCTION get_rider_stats(_user_id UUID)
RETURNS JSON AS $$
DECLARE
    earnings_today NUMERIC;
    deliveries_today INTEGER;
    active_delivery_id UUID;
    avg_rating NUMERIC;
BEGIN
    -- Earnings Today (sum of delivery fees for delivered orders)
    SELECT COALESCE(sum(delivery_fee), 0) INTO earnings_today
    FROM orders
    WHERE rider_id = _user_id
    AND status = 'delivered'
    AND updated_at >= date_trunc('day', now());

    -- Deliveries Today
    SELECT count(*) INTO deliveries_today
    FROM orders
    WHERE rider_id = _user_id
    AND status = 'delivered'
    AND updated_at >= date_trunc('day', now());

    -- Active Delivery
    SELECT id INTO active_delivery_id
    FROM orders
    WHERE rider_id = _user_id
    AND status IN ('rider_assigned', 'out_for_delivery')
    LIMIT 1;

    -- Rating (Rider rating isn't explicitly in reviews table yet, but we can assume it might be added or use a dummy)
    -- For now, let's just return 5.0 or something if not found
    avg_rating := 5.0;

    RETURN json_build_object(
        'earnings_today', earnings_today,
        'deliveries_today', deliveries_today,
        'active_delivery_id', active_delivery_id,
        'avg_rating', avg_rating
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get admin dashboard statistics
CREATE OR REPLACE FUNCTION get_admin_stats()
RETURNS JSON AS $$
DECLARE
    total_users INTEGER;
    platform_revenue NUMERIC;
    pending_approvals INTEGER;
    active_orders INTEGER;
BEGIN
    -- Total Users
    SELECT count(*) INTO total_users FROM profiles;

    -- Platform Revenue (Total of all orders delivered)
    SELECT COALESCE(sum(total_amount), 0) INTO platform_revenue
    FROM orders
    WHERE status = 'delivered';

    -- Pending Approvals (Vendors, Farmers, Riders)
    SELECT (
        (SELECT count(*) FROM vendor_profiles WHERE is_approved = false) +
        (SELECT count(*) FROM farmer_profiles WHERE is_approved = false) +
        (SELECT count(*) FROM rider_profiles WHERE is_approved = false)
    ) INTO pending_approvals;

    -- Active Orders
    SELECT count(*) INTO active_orders
    FROM orders
    WHERE status NOT IN ('delivered', 'cancelled');

    RETURN json_build_object(
        'total_users', total_users,
        'platform_revenue', platform_revenue,
        'pending_approvals', pending_approvals,
        'active_orders', active_orders
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
