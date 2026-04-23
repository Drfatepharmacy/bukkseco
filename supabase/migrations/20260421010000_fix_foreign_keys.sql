-- Fix foreign key relationships to link with profiles table instead of auth.users
-- This enables Postgrest to recognize the relationship for joined queries on the profiles table

-- vendor_profiles
ALTER TABLE public.vendor_profiles
DROP CONSTRAINT IF EXISTS vendor_profiles_user_id_fkey,
ADD CONSTRAINT vendor_profiles_user_id_fkey
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- user_roles
ALTER TABLE public.user_roles
DROP CONSTRAINT IF EXISTS user_roles_user_id_fkey,
ADD CONSTRAINT user_roles_user_id_fkey
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- farmer_profiles
ALTER TABLE public.farmer_profiles
DROP CONSTRAINT IF EXISTS farmer_profiles_user_id_fkey,
ADD CONSTRAINT farmer_profiles_user_id_fkey
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- rider_profiles
ALTER TABLE public.rider_profiles
DROP CONSTRAINT IF EXISTS rider_profiles_user_id_fkey,
ADD CONSTRAINT rider_profiles_user_id_fkey
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
