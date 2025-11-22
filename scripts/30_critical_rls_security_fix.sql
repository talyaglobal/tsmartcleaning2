-- CRITICAL SECURITY FIX: Enable Row Level Security and Create Proper Policies
-- This script addresses urgent security gaps by enabling RLS on all critical tables
-- and creating comprehensive security policies

-- =========================
-- 1. ENABLE ROW LEVEL SECURITY ON ALL CRITICAL TABLES
-- =========================

-- Core user and business tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Service-related tables
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_availability ENABLE ROW LEVEL SECURITY;

-- Payment-related tables (check if they exist first)
DO $$
BEGIN
  IF to_regclass('public.payments') IS NOT NULL THEN
    ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
  END IF;
  
  IF to_regclass('public.invoice_payments') IS NOT NULL THEN
    ALTER TABLE public.invoice_payments ENABLE ROW LEVEL SECURITY;
  END IF;
END$$;

-- =========================
-- 2. CRITICAL POLICIES - Users Table
-- =========================

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Anyone can view provider profiles" ON public.users;

-- Users can only see their own data OR provider profiles that are public
CREATE POLICY user_own_data ON public.users FOR ALL USING (
  auth.uid() = id OR (role = 'provider' AND id IN (
    SELECT user_id FROM public.provider_profiles WHERE id IS NOT NULL
  ))
);

-- =========================
-- 3. CRITICAL POLICIES - Bookings Table
-- =========================

-- Drop existing policies that might be too permissive
DROP POLICY IF EXISTS "Customers can view their own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Providers can view their assigned bookings" ON public.bookings;
DROP POLICY IF EXISTS "Customers can create bookings" ON public.bookings;
DROP POLICY IF EXISTS "Customers can update their pending bookings" ON public.bookings;
DROP POLICY IF EXISTS "Providers can update their assigned bookings" ON public.bookings;

-- Comprehensive booking access policy
CREATE POLICY booking_access ON public.bookings FOR ALL USING (
  -- Customer can access their own bookings
  auth.uid() = customer_id OR
  -- Provider can access bookings assigned to them
  (provider_id IS NOT NULL AND auth.uid() IN (
    SELECT user_id FROM public.provider_profiles WHERE id = provider_id
  )) OR
  -- Admin can access all bookings (if user has admin role)
  auth.uid() IN (
    SELECT id FROM public.users WHERE role = 'admin'
  )
);

-- =========================
-- 4. CRITICAL POLICIES - Provider Profiles
-- =========================

-- Drop potentially insecure policies
DROP POLICY IF EXISTS "Anyone can view provider profiles" ON public.provider_profiles;
DROP POLICY IF EXISTS "Providers can update their own profile" ON public.provider_profiles;
DROP POLICY IF EXISTS "Providers can insert their own profile" ON public.provider_profiles;

-- Provider profiles - public read, owner write
CREATE POLICY provider_profiles_policy ON public.provider_profiles FOR ALL USING (
  -- Anyone can view provider profiles (for marketplace)
  true
) WITH CHECK (
  -- Only the provider or admin can modify
  auth.uid() = user_id OR auth.uid() IN (
    SELECT id FROM public.users WHERE role = 'admin'
  )
);

-- =========================
-- 5. CRITICAL POLICIES - Companies Table
-- =========================

DO $$
BEGIN
  IF to_regclass('public.companies') IS NOT NULL THEN
    -- Company members and admins can access company data
    CREATE POLICY company_access_policy ON public.companies FOR ALL USING (
      -- Company owners/admins can access
      id IN (
        SELECT company_id FROM public.user_companies 
        WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
      ) OR
      -- System admins can access all companies
      auth.uid() IN (
        SELECT id FROM public.users WHERE role = 'admin'
      )
    );
  END IF;
END$$;

-- =========================
-- 6. CRITICAL POLICIES - Payment Tables
-- =========================

DO $$
BEGIN
  IF to_regclass('public.payments') IS NOT NULL THEN
    -- Only transaction participants can see payment data
    CREATE POLICY payments_access_policy ON public.payments FOR ALL USING (
      -- Customer can see their payments
      auth.uid() IN (
        SELECT customer_id FROM public.bookings WHERE id = booking_id
      ) OR
      -- Provider can see their payments
      auth.uid() IN (
        SELECT pp.user_id FROM public.provider_profiles pp
        JOIN public.bookings b ON b.provider_id = pp.id
        WHERE b.id = booking_id
      ) OR
      -- Admin can see all payments
      auth.uid() IN (
        SELECT id FROM public.users WHERE role = 'admin'
      )
    );
  END IF;
  
  IF to_regclass('public.invoice_payments') IS NOT NULL THEN
    CREATE POLICY invoice_payments_access_policy ON public.invoice_payments FOR ALL USING (
      -- Only company members can access invoice payments
      auth.uid() IN (
        SELECT user_id FROM public.user_companies uc
        JOIN public.invoices i ON i.company_id = uc.company_id
        WHERE i.id = invoice_id
      ) OR
      -- Admin access
      auth.uid() IN (
        SELECT id FROM public.users WHERE role = 'admin'
      )
    );
  END IF;
END$$;

-- =========================
-- 7. SECURE POLICIES - Other Critical Tables
-- =========================

-- Addresses - users can only see their own addresses
DROP POLICY IF EXISTS "Users can view their own addresses" ON public.addresses;
DROP POLICY IF EXISTS "Users can insert their own addresses" ON public.addresses;
DROP POLICY IF EXISTS "Users can update their own addresses" ON public.addresses;
DROP POLICY IF EXISTS "Users can delete their own addresses" ON public.addresses;

CREATE POLICY addresses_user_access ON public.addresses FOR ALL USING (
  auth.uid() = user_id OR auth.uid() IN (
    SELECT id FROM public.users WHERE role = 'admin'
  )
);

-- Transactions - secure access
DROP POLICY IF EXISTS "Customers can view their own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Providers can view their transactions" ON public.transactions;

CREATE POLICY transactions_secure_access ON public.transactions FOR ALL USING (
  -- Customer access to their transactions
  auth.uid() = customer_id OR
  -- Provider access to their transactions
  auth.uid() IN (
    SELECT user_id FROM public.provider_profiles WHERE id = provider_id
  ) OR
  -- Admin access
  auth.uid() IN (
    SELECT id FROM public.users WHERE role = 'admin'
  )
);

-- Reviews - public read, restricted write
DROP POLICY IF EXISTS "Anyone can view reviews" ON public.reviews;
DROP POLICY IF EXISTS "Customers can create reviews for their completed bookings" ON public.reviews;
DROP POLICY IF EXISTS "Customers can update their own reviews" ON public.reviews;
DROP POLICY IF EXISTS "Providers can respond to their reviews" ON public.reviews;

CREATE POLICY reviews_secure_policy ON public.reviews FOR ALL USING (
  -- Anyone can read reviews
  true
) WITH CHECK (
  -- Only customer who made booking can create/edit review
  auth.uid() = customer_id OR
  -- Provider can respond to reviews about them
  auth.uid() IN (
    SELECT user_id FROM public.provider_profiles WHERE id = provider_id
  ) OR
  -- Admin access
  auth.uid() IN (
    SELECT id FROM public.users WHERE role = 'admin'
  )
);

-- Notifications - users see only their own
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;

CREATE POLICY notifications_user_access ON public.notifications FOR ALL USING (
  auth.uid() = user_id OR auth.uid() IN (
    SELECT id FROM public.users WHERE role = 'admin'
  )
);

-- Services - public read, admin write
DROP POLICY IF EXISTS "Anyone can view active services" ON public.services;

CREATE POLICY services_public_read_admin_write ON public.services FOR ALL USING (
  -- Anyone can view active services
  is_active = true OR auth.uid() IN (
    SELECT id FROM public.users WHERE role = 'admin'
  )
) WITH CHECK (
  -- Only admin can modify services
  auth.uid() IN (
    SELECT id FROM public.users WHERE role = 'admin'
  )
);

-- Provider Services - public read, provider/admin write
DROP POLICY IF EXISTS "Anyone can view provider services" ON public.provider_services;
DROP POLICY IF EXISTS "Providers can manage their own services" ON public.provider_services;

CREATE POLICY provider_services_secure_access ON public.provider_services FOR ALL USING (
  -- Anyone can view provider services
  true
) WITH CHECK (
  -- Only the provider or admin can modify
  auth.uid() IN (
    SELECT user_id FROM public.provider_profiles WHERE id = provider_id
  ) OR auth.uid() IN (
    SELECT id FROM public.users WHERE role = 'admin'
  )
);

-- Provider Availability - public read, provider write
DROP POLICY IF EXISTS "Anyone can view provider availability" ON public.provider_availability;
DROP POLICY IF EXISTS "Providers can manage their own availability" ON public.provider_availability;

CREATE POLICY provider_availability_secure_access ON public.provider_availability FOR ALL USING (
  -- Anyone can view availability for booking purposes
  true
) WITH CHECK (
  -- Only the provider or admin can modify
  auth.uid() IN (
    SELECT user_id FROM public.provider_profiles WHERE id = provider_id
  ) OR auth.uid() IN (
    SELECT id FROM public.users WHERE role = 'admin'
  )
);

-- =========================
-- 8. VERIFICATION QUERIES
-- =========================

-- This will show which tables now have RLS enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND rowsecurity = true
ORDER BY tablename;

-- This will show all active policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- =========================
-- SECURITY HARDENING COMPLETE
-- =========================

COMMENT ON TABLE public.users IS 'RLS enabled - users can only access their own data or public provider profiles';
COMMENT ON TABLE public.bookings IS 'RLS enabled - customers and providers can only access their own bookings';
COMMENT ON TABLE public.provider_profiles IS 'RLS enabled - public read access, owner write access';
COMMENT ON TABLE public.companies IS 'RLS enabled - company members and admins only';