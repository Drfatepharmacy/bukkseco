
-- Update app_role enum
-- We add 'user' and 'super_admin'. 'buyer' remains for compatibility but will be phased out in favor of 'user'.
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'user';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'super_admin';

-- Add role column to profiles table to match requirements
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role public.app_role DEFAULT 'user';

-- Migrate 'buyer' to 'user' in user_roles and profiles
UPDATE public.user_roles SET role = 'user' WHERE role = 'buyer';
UPDATE public.profiles SET role = 'user' WHERE role = 'buyer';

-- Sync profiles.role with user_roles for existing users
UPDATE public.profiles p
SET role = ur.role
FROM public.user_roles ur
WHERE p.id = ur.user_id AND p.role = 'user';

-- Security definer function for role checks
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  ) OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = _user_id AND role = _role
  )
$$;

-- Helper for hierarchy: is user at least an admin?
CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = _user_id AND role IN ('admin', 'super_admin')
  )
$$;

-- Bootstrap ilomuche@gmail.com as super_admin
DO $$
DECLARE
    target_id UUID;
BEGIN
    SELECT id INTO target_id FROM auth.users WHERE email = 'ilomuche@gmail.com';

    IF target_id IS NOT NULL THEN
        -- Ensure user has a profile and correct role
        INSERT INTO public.profiles (id, full_name, email, role)
        VALUES (target_id, 'Super Admin', 'ilomuche@gmail.com', 'super_admin')
        ON CONFLICT (id) DO UPDATE SET role = 'super_admin';

        -- Update user_roles
        INSERT INTO public.user_roles (user_id, role)
        VALUES (target_id, 'super_admin')
        ON CONFLICT (user_id, role) DO NOTHING;

        -- Remove other roles for the super_admin
        DELETE FROM public.user_roles WHERE user_id = target_id AND role != 'super_admin';
    END IF;
END $$;

-- Downgrade all other admins to user
UPDATE public.profiles
SET role = 'user'
WHERE role = 'admin' AND email != 'ilomuche@gmail.com';

UPDATE public.user_roles
SET role = 'user'
WHERE role = 'admin' AND user_id NOT IN (SELECT id FROM auth.users WHERE email = 'ilomuche@gmail.com');

-- SECURITY ENFORCEMENT: Role changes are restricted to super_admin
CREATE OR REPLACE FUNCTION public.check_role_modification_auth()
RETURNS TRIGGER AS $$
BEGIN
    -- Allow initial creation if it's the super_admin email or if the creator is super_admin
    -- When auth.uid() is null, it's likely a system/migration action, which we allow.
    IF auth.uid() IS NULL THEN
        RETURN NEW;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'super_admin'
    ) THEN
        RAISE EXCEPTION 'Unauthorized: Only super_admin can assign or modify roles';
    END IF;

    -- Prevent creating another super_admin even if the requester is a super_admin
    -- (Strictly only one super_admin via bootstrap/email check)
    IF NEW.role = 'super_admin' THEN
        IF (SELECT email FROM auth.users WHERE id = NEW.id) != 'ilomuche@gmail.com' THEN
             RAISE EXCEPTION 'Unauthorized: There can only be one super_admin (ilomuche@gmail.com)';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply triggers to prevent unauthorized role escalation
DROP TRIGGER IF EXISTS tr_restrict_profile_role_update ON public.profiles;
CREATE TRIGGER tr_restrict_profile_role_update
    BEFORE UPDATE OF role ON public.profiles
    FOR EACH ROW
    WHEN (OLD.role IS DISTINCT FROM NEW.role)
    EXECUTE FUNCTION public.check_role_modification_auth();

DROP TRIGGER IF EXISTS tr_restrict_user_roles_changes ON public.user_roles;
CREATE TRIGGER tr_restrict_user_roles_changes
    BEFORE INSERT OR UPDATE OR DELETE ON public.user_roles
    FOR EACH ROW
    EXECUTE FUNCTION public.check_role_modification_auth();

-- Ensure single super_admin constraint at DB level
CREATE UNIQUE INDEX IF NOT EXISTS one_super_admin_idx ON public.profiles (role) WHERE (role = 'super_admin');

-- Update handle_new_user trigger to be more secure
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    assigned_role public.app_role;
BEGIN
    -- Determine role from metadata, but block privileged roles
    assigned_role := (NEW.raw_user_meta_data->>'role')::public.app_role;

    -- Default to 'user' if role is invalid or privileged
    IF assigned_role IS NULL OR assigned_role IN ('admin', 'super_admin') THEN
        assigned_role := 'user';
    END IF;

    -- Bootstrap super_admin if email matches
    IF NEW.email = 'ilomuche@gmail.com' THEN
        assigned_role := 'super_admin';
    END IF;

    INSERT INTO public.profiles (id, full_name, email, role, is_approved)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
      COALESCE(NEW.email, ''),
      assigned_role,
      (assigned_role = 'user') -- Auto-approve 'user' role
    );

    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, assigned_role);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Update RLS Policies to include super_admin
-- We will modify existing policies to use is_admin() where applicable or explicitly include super_admin

-- Profiles RLS updates
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
CREATE POLICY "Admins can update all profiles" ON public.profiles
  FOR UPDATE USING (public.is_admin(auth.uid()));

-- User roles RLS updates
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
CREATE POLICY "Admins can view all roles" ON public.user_roles
  FOR SELECT USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;
CREATE POLICY "Admins can manage all roles" ON public.user_roles
  FOR ALL USING (public.has_role(auth.uid(), 'super_admin')); -- Only super_admin can manage roles now

-- Vendor profiles RLS updates
DROP POLICY IF EXISTS "Admins can manage vendor profiles" ON public.vendor_profiles;
CREATE POLICY "Admins can manage vendor profiles" ON public.vendor_profiles
  FOR ALL USING (public.is_admin(auth.uid()));

-- Farmer profiles RLS updates
DROP POLICY IF EXISTS "Admins can manage farmer profiles" ON public.farmer_profiles;
CREATE POLICY "Admins can manage farmer profiles" ON public.farmer_profiles
  FOR ALL USING (public.is_admin(auth.uid()));

-- Rider profiles RLS updates
DROP POLICY IF EXISTS "Admins can manage rider profiles" ON public.rider_profiles;
CREATE POLICY "Admins can manage rider profiles" ON public.rider_profiles
  FOR ALL USING (public.is_admin(auth.uid()));

-- Update OTHER table policies that used 'admin' role directly
DROP POLICY IF EXISTS "Admins can manage all meals" ON public.meals;
CREATE POLICY "Admins can manage all meals" ON public.meals FOR ALL USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can manage all orders" ON public.orders;
CREATE POLICY "Admins can manage all orders" ON public.orders FOR ALL USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can manage order items" ON public.order_items;
CREATE POLICY "Admins can manage order items" ON public.order_items FOR ALL USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can manage reviews" ON public.reviews;
CREATE POLICY "Admins can manage reviews" ON public.reviews FOR ALL USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can manage group buys" ON public.group_buys;
CREATE POLICY "Admins can manage group buys" ON public.group_buys FOR ALL USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can manage tips" ON public.health_tips;
CREATE POLICY "Admins can manage tips" ON public.health_tips FOR ALL USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can view all locations" ON public.rider_locations;
CREATE POLICY "Admins can view all locations" ON public.rider_locations FOR SELECT USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins manage all deliveries" ON public.delivery_assignments;
CREATE POLICY "Admins manage all deliveries" ON public.delivery_assignments FOR ALL USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins manage reservations" ON public.reservations;
CREATE POLICY "Admins manage reservations" ON public.reservations FOR ALL USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins manage activities" ON public.campus_activities;
CREATE POLICY "Admins manage activities" ON public.campus_activities FOR ALL USING (public.is_admin(auth.uid()));
