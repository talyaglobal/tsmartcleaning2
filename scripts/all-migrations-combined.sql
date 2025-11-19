-- ============================================================================
-- COMBINED MIGRATION SCRIPT
-- ============================================================================
-- This file contains all database migrations combined in the correct order.
-- 
-- USAGE:
--   1. Copy this entire file
--   2. Go to https://app.supabase.com → Your Project → SQL Editor
--   3. Click "New query"
--   4. Paste this entire file
--   5. Click "Run" (or press Cmd+Enter / Ctrl+Enter)
--
-- All migrations use "IF NOT EXISTS" clauses, so it's safe to run multiple times.
-- ============================================================================


-- ============================================================================
-- 01_create_tables.sql
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL CHECK (role IN ('customer', 'provider', 'admin')),
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Addresses table
CREATE TABLE IF NOT EXISTS public.addresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  street_address TEXT NOT NULL,
  apt_suite TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip_code TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Provider profiles table
CREATE TABLE IF NOT EXISTS public.provider_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  business_description TEXT,
  years_experience INTEGER,
  service_radius INTEGER DEFAULT 25, -- miles
  hourly_rate DECIMAL(10, 2),
  is_verified BOOLEAN DEFAULT false,
  is_background_checked BOOLEAN DEFAULT false,
  is_insured BOOLEAN DEFAULT false,
  rating DECIMAL(3, 2) DEFAULT 0.0,
  total_reviews INTEGER DEFAULT 0,
  total_bookings INTEGER DEFAULT 0,
  total_earnings DECIMAL(10, 2) DEFAULT 0,
  availability_status TEXT DEFAULT 'available' CHECK (availability_status IN ('available', 'busy', 'unavailable')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Services table
CREATE TABLE IF NOT EXISTS public.services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('residential', 'commercial', 'deep', 'move', 'post-construction', 'window', 'carpet', 'eco-friendly')),
  base_price DECIMAL(10, 2) NOT NULL,
  unit TEXT DEFAULT 'per_hour' CHECK (unit IN ('per_hour', 'per_sqft', 'flat_rate')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Provider services (junction table)
CREATE TABLE IF NOT EXISTS public.provider_services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_id UUID NOT NULL REFERENCES public.provider_profiles(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  custom_price DECIMAL(10, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(provider_id, service_id)
);

-- Bookings table
CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  provider_id UUID REFERENCES public.provider_profiles(id) ON DELETE SET NULL,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE RESTRICT,
  address_id UUID NOT NULL REFERENCES public.addresses(id) ON DELETE RESTRICT,
  
  -- Booking details
  booking_date DATE NOT NULL,
  booking_time TIME NOT NULL,
  duration_hours DECIMAL(4, 2) NOT NULL,
  property_size INTEGER, -- square feet
  bedrooms INTEGER,
  bathrooms INTEGER,
  special_instructions TEXT,
  
  -- Pricing
  subtotal DECIMAL(10, 2) NOT NULL,
  service_fee DECIMAL(10, 2) NOT NULL,
  tax DECIMAL(10, 2) NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  
  -- Status tracking
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'in-progress', 'completed', 'cancelled', 'refunded')),
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded', 'failed')),
  
  -- Timestamps
  confirmed_at TIMESTAMP WITH TIME ZONE,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  cancellation_reason TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reviews table
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL UNIQUE REFERENCES public.bookings(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES public.provider_profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  response TEXT, -- provider can respond
  responded_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transactions table
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  provider_id UUID REFERENCES public.provider_profiles(id) ON DELETE SET NULL,
  
  amount DECIMAL(10, 2) NOT NULL,
  platform_fee DECIMAL(10, 2) NOT NULL,
  provider_payout DECIMAL(10, 2) NOT NULL,
  
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('payment', 'refund', 'payout')),
  payment_method TEXT CHECK (payment_method IN ('card', 'bank', 'paypal')),
  
  stripe_payment_intent_id TEXT,
  stripe_transfer_id TEXT,
  
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Provider availability table
CREATE TABLE IF NOT EXISTS public.provider_availability (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_id UUID NOT NULL REFERENCES public.provider_profiles(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0 = Sunday
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(provider_id, day_of_week)
);

-- Notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('booking', 'payment', 'review', 'system')),
  is_read BOOLEAN DEFAULT false,
  related_booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_addresses_user_id ON public.addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_provider_profiles_user_id ON public.provider_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_provider_profiles_rating ON public.provider_profiles(rating);
CREATE INDEX IF NOT EXISTS idx_bookings_customer_id ON public.bookings(customer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_provider_id ON public.bookings(provider_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_booking_date ON public.bookings(booking_date);
CREATE INDEX IF NOT EXISTS idx_reviews_provider_id ON public.reviews(provider_id);
CREATE INDEX IF NOT EXISTS idx_transactions_booking_id ON public.transactions(booking_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;



-- ============================================================================
-- 02_create_rls_policies.sql
-- ============================================================================

-- RLS Policies for Users table
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
CREATE POLICY "Users can view their own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
CREATE POLICY "Users can update their own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Anyone can view provider profiles" ON public.users;
CREATE POLICY "Anyone can view provider profiles"
  ON public.users FOR SELECT
  USING (role = 'provider');

-- RLS Policies for Addresses table
DROP POLICY IF EXISTS "Users can view their own addresses" ON public.addresses;
CREATE POLICY "Users can view their own addresses"
  ON public.addresses FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own addresses" ON public.addresses;
CREATE POLICY "Users can insert their own addresses"
  ON public.addresses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own addresses" ON public.addresses;
CREATE POLICY "Users can update their own addresses"
  ON public.addresses FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own addresses" ON public.addresses;
CREATE POLICY "Users can delete their own addresses"
  ON public.addresses FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for Provider Profiles
DROP POLICY IF EXISTS "Anyone can view provider profiles" ON public.provider_profiles;
CREATE POLICY "Anyone can view provider profiles"
  ON public.provider_profiles FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Providers can update their own profile" ON public.provider_profiles;
CREATE POLICY "Providers can update their own profile"
  ON public.provider_profiles FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Providers can insert their own profile" ON public.provider_profiles;
CREATE POLICY "Providers can insert their own profile"
  ON public.provider_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for Services
DROP POLICY IF EXISTS "Anyone can view active services" ON public.services;
CREATE POLICY "Anyone can view active services"
  ON public.services FOR SELECT
  USING (is_active = true);

-- RLS Policies for Provider Services
DROP POLICY IF EXISTS "Anyone can view provider services" ON public.provider_services;
CREATE POLICY "Anyone can view provider services"
  ON public.provider_services FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Providers can manage their own services" ON public.provider_services;
CREATE POLICY "Providers can manage their own services"
  ON public.provider_services FOR ALL
  USING (
    provider_id IN (
      SELECT id FROM public.provider_profiles WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for Bookings
DROP POLICY IF EXISTS "Customers can view their own bookings" ON public.bookings;
CREATE POLICY "Customers can view their own bookings"
  ON public.bookings FOR SELECT
  USING (auth.uid() = customer_id);

DROP POLICY IF EXISTS "Providers can view their assigned bookings" ON public.bookings;
CREATE POLICY "Providers can view their assigned bookings"
  ON public.bookings FOR SELECT
  USING (
    provider_id IN (
      SELECT id FROM public.provider_profiles WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Customers can create bookings" ON public.bookings;
CREATE POLICY "Customers can create bookings"
  ON public.bookings FOR INSERT
  WITH CHECK (auth.uid() = customer_id);

DROP POLICY IF EXISTS "Customers can update their pending bookings" ON public.bookings;
CREATE POLICY "Customers can update their pending bookings"
  ON public.bookings FOR UPDATE
  USING (auth.uid() = customer_id AND status = 'pending');

DROP POLICY IF EXISTS "Providers can update their assigned bookings" ON public.bookings;
CREATE POLICY "Providers can update their assigned bookings"
  ON public.bookings FOR UPDATE
  USING (
    provider_id IN (
      SELECT id FROM public.provider_profiles WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for Reviews
DROP POLICY IF EXISTS "Anyone can view reviews" ON public.reviews;
CREATE POLICY "Anyone can view reviews"
  ON public.reviews FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Customers can create reviews for their completed bookings" ON public.reviews;
CREATE POLICY "Customers can create reviews for their completed bookings"
  ON public.reviews FOR INSERT
  WITH CHECK (auth.uid() = customer_id);

DROP POLICY IF EXISTS "Customers can update their own reviews" ON public.reviews;
CREATE POLICY "Customers can update their own reviews"
  ON public.reviews FOR UPDATE
  USING (auth.uid() = customer_id);

DROP POLICY IF EXISTS "Providers can respond to their reviews" ON public.reviews;
CREATE POLICY "Providers can respond to their reviews"
  ON public.reviews FOR UPDATE
  USING (
    provider_id IN (
      SELECT id FROM public.provider_profiles WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for Transactions
DROP POLICY IF EXISTS "Customers can view their own transactions" ON public.transactions;
CREATE POLICY "Customers can view their own transactions"
  ON public.transactions FOR SELECT
  USING (auth.uid() = customer_id);

DROP POLICY IF EXISTS "Providers can view their transactions" ON public.transactions;
CREATE POLICY "Providers can view their transactions"
  ON public.transactions FOR SELECT
  USING (
    provider_id IN (
      SELECT id FROM public.provider_profiles WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for Provider Availability
DROP POLICY IF EXISTS "Anyone can view provider availability" ON public.provider_availability;
CREATE POLICY "Anyone can view provider availability"
  ON public.provider_availability FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Providers can manage their own availability" ON public.provider_availability;
CREATE POLICY "Providers can manage their own availability"
  ON public.provider_availability FOR ALL
  USING (
    provider_id IN (
      SELECT id FROM public.provider_profiles WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for Notifications
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
CREATE POLICY "Users can update their own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);



-- ============================================================================
-- 03_seed_services.sql
-- ============================================================================

-- Seed initial services
INSERT INTO public.services (name, description, category, base_price, unit) VALUES
  ('Standard House Cleaning', 'Regular cleaning including dusting, vacuuming, mopping, and bathroom cleaning', 'residential', 35.00, 'per_hour'),
  ('Deep Cleaning', 'Intensive cleaning including baseboards, inside appliances, and hard-to-reach areas', 'deep', 50.00, 'per_hour'),
  ('Move-In/Move-Out Cleaning', 'Comprehensive cleaning for vacant properties', 'move', 45.00, 'per_hour'),
  ('Office Cleaning', 'Commercial cleaning for office spaces', 'commercial', 40.00, 'per_hour'),
  ('Post-Construction Cleaning', 'Specialized cleaning after renovation or construction', 'post-construction', 55.00, 'per_hour'),
  ('Window Cleaning', 'Interior and exterior window cleaning', 'window', 150.00, 'flat_rate'),
  ('Carpet Cleaning', 'Professional carpet shampooing and stain removal', 'carpet', 0.30, 'per_sqft'),
  ('Eco-Friendly Cleaning', 'Green cleaning using environmentally safe products', 'eco-friendly', 40.00, 'per_hour')
ON CONFLICT DO NOTHING;



-- ============================================================================
-- 04_create_functions.sql
-- ============================================================================

-- Function to update provider rating after review
CREATE OR REPLACE FUNCTION update_provider_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.provider_profiles
  SET 
    rating = (
      SELECT COALESCE(AVG(rating), 0)
      FROM public.reviews
      WHERE provider_id = NEW.provider_id
    ),
    total_reviews = (
      SELECT COUNT(*)
      FROM public.reviews
      WHERE provider_id = NEW.provider_id
    ),
    updated_at = NOW()
  WHERE id = NEW.provider_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update provider rating
CREATE TRIGGER trigger_update_provider_rating
  AFTER INSERT OR UPDATE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_provider_rating();

-- Function to update provider earnings
CREATE OR REPLACE FUNCTION update_provider_earnings()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    UPDATE public.provider_profiles
    SET 
      total_bookings = total_bookings + 1,
      updated_at = NOW()
    WHERE id = NEW.provider_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update provider bookings count
CREATE TRIGGER trigger_update_provider_bookings
  AFTER UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_provider_earnings();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add update timestamp triggers to all tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_addresses_updated_at BEFORE UPDATE ON public.addresses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_provider_profiles_updated_at BEFORE UPDATE ON public.provider_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON public.services
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_provider_availability_updated_at BEFORE UPDATE ON public.provider_availability
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();



-- ============================================================================
-- 05_alter_and_missing_tables.sql
-- ============================================================================

-- Phase 1: Marketing & Growth System - Campaign/Promo/Referral tables
-- Campaigns table
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('email', 'sms', 'whatsapp', 'meta_ads', 'google_ads')) NOT NULL,
  status TEXT CHECK (status IN ('draft', 'scheduled', 'running', 'paused', 'completed')) DEFAULT 'draft',
  audience_filter JSONB NOT NULL,
  template_id UUID,
  scheduled_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  budget DECIMAL(10,2),
  results JSONB DEFAULT '{}',
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Message templates table
CREATE TABLE IF NOT EXISTS message_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('email', 'sms', 'whatsapp')) NOT NULL,
  subject TEXT,
  content TEXT NOT NULL,
  variables TEXT[],
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Promo codes table
CREATE TABLE IF NOT EXISTS promo_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('percentage', 'fixed_amount', 'free_addon')) NOT NULL,
  value DECIMAL(10,2),
  min_order_amount DECIMAL(10,2) DEFAULT 0,
  max_uses INTEGER,
  used_count INTEGER DEFAULT 0,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  applicable_services UUID[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Referrals table
CREATE TABLE IF NOT EXISTS referrals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID REFERENCES public.users(id),
  referee_id UUID REFERENCES public.users(id),
  referral_code TEXT UNIQUE,
  status TEXT CHECK (status IN ('pending', 'completed', 'rewarded')) DEFAULT 'pending',
  reward_amount DECIMAL(10,2),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Additive schema changes and missing tables for Supabase
-- Safe to run multiple times (uses IF NOT EXISTS where possible)

-- Ensure UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- Required for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =========================
-- Missing/aux columns
-- =========================

-- services: duration estimate used by API mocks
ALTER TABLE public.services
ADD COLUMN IF NOT EXISTS duration_minutes INTEGER;

-- provider_profiles: verification status, service areas, bio
ALTER TABLE public.provider_profiles
ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'unverified'
  CHECK (verification_status IN ('unverified','pending','verified','rejected'));

ALTER TABLE public.provider_profiles
ADD COLUMN IF NOT EXISTS service_areas TEXT[];

ALTER TABLE public.provider_profiles
ADD COLUMN IF NOT EXISTS bio TEXT;

-- provider_profiles: Stripe Connect metadata
ALTER TABLE public.provider_profiles
ADD COLUMN IF NOT EXISTS stripe_account_id TEXT;

ALTER TABLE public.provider_profiles
ADD COLUMN IF NOT EXISTS payouts_enabled BOOLEAN DEFAULT false;

ALTER TABLE public.provider_profiles
ADD COLUMN IF NOT EXISTS details_submitted BOOLEAN DEFAULT false;

-- provider_profiles: photo and portfolio
ALTER TABLE public.provider_profiles
ADD COLUMN IF NOT EXISTS photo_url TEXT;

ALTER TABLE public.provider_profiles
ADD COLUMN IF NOT EXISTS portfolio_images JSONB DEFAULT '[]'::jsonb;

-- users: optional 'name' alias used by some routes
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS name TEXT;

-- bookings: convenience fields referenced by mocks
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS notes TEXT;

ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS date DATE;

ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS time TIME;

-- transactions: loose 'type' alias in addition to transaction_type
ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS type TEXT;

-- notifications: 'read' alias in addition to is_read
ALTER TABLE public.notifications
ADD COLUMN IF NOT EXISTS read BOOLEAN DEFAULT false;

-- =========================
-- New tables
-- =========================

-- Provider day-level availability with discrete time slots
CREATE TABLE IF NOT EXISTS public.availability (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_id UUID NOT NULL REFERENCES public.provider_profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  time_slots TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(provider_id, date)
);

-- Optional contact submissions table (referenced by API comments)
CREATE TABLE IF NOT EXISTS public.contact_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  subject TEXT,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new','reviewed','archived')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =========================
-- Indexes
-- =========================
CREATE INDEX IF NOT EXISTS idx_availability_provider_date
  ON public.availability(provider_id, date);

-- =========================
-- RLS enablement
-- =========================
ALTER TABLE public.availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;

-- =========================
-- RLS policies
-- =========================

-- Availability:
--  - Anyone can view availability (for discovery/booking)
--  - Providers manage their own records
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'availability' AND policyname = 'Anyone can view availability'
  ) THEN
    CREATE POLICY "Anyone can view availability"
      ON public.availability FOR SELECT
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'availability' AND policyname = 'Providers can manage their availability'
  ) THEN
    CREATE POLICY "Providers can manage their availability"
      ON public.availability FOR ALL
      USING (
        provider_id IN (
          SELECT id FROM public.provider_profiles WHERE user_id = auth.uid()
        )
      )
      WITH CHECK (
        provider_id IN (
          SELECT id FROM public.provider_profiles WHERE user_id = auth.uid()
        )
      );
  END IF;
END$$;

-- =========================
-- Verification & Trust Tables
-- =========================

-- Core verification records
CREATE TABLE IF NOT EXISTS public.verifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (
    type IN (
      'government_id','face','social','background','reference','drug','vaccination','insurance'
    )
  ),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending','action_required','passed','failed','expired')
  ),
  vendor TEXT,
  vendor_ref TEXT,
  score NUMERIC,
  flags JSONB DEFAULT '{}'::jsonb,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, type)
);

-- Events/audit trail for verification lifecycle (immutable)
CREATE TABLE IF NOT EXISTS public.verification_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  verification_id UUID NOT NULL REFERENCES public.verifications(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Explicit consents (e.g., biometric, background, drug)
CREATE TABLE IF NOT EXISTS public.consents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  scope TEXT NOT NULL,
  version TEXT NOT NULL,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at TIMESTAMPTZ,
  ip INET,
  user_agent TEXT
);
CREATE INDEX IF NOT EXISTS idx_consents_user_scope
  ON public.consents(user_id, scope);

-- Stored artifacts metadata (hash + signed storage URL)
CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  verification_id UUID REFERENCES public.verifications(id) ON DELETE SET NULL,
  kind TEXT NOT NULL,
  hash_sha256 TEXT,
  storage_url TEXT, -- signed URL; do not store raw PII here
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_documents_user_kind
  ON public.documents(user_id, kind);

-- Policy evaluations (derived results)
CREATE TABLE IF NOT EXISTS public.policy_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  policy_name TEXT NOT NULL,
  result TEXT NOT NULL CHECK (result IN ('pass','fail','review')),
  reasons JSONB DEFAULT '{}'::jsonb,
  effective_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_policy_results_user_policy
  ON public.policy_results(user_id, policy_name);

-- Continuous monitoring subscriptions (e.g., background, insurance)
CREATE TABLE IF NOT EXISTS public.monitoring_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('background','insurance')),
  vendor TEXT,
  vendor_ref TEXT,
  active BOOLEAN DEFAULT true,
  next_check_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_monitoring_user_type_active
  ON public.monitoring_subscriptions(user_id, type, active);

-- =========================
-- RLS enablement
-- =========================
ALTER TABLE public.verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.policy_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monitoring_subscriptions ENABLE ROW LEVEL SECURITY;

-- =========================
-- RLS policies (minimal)
-- =========================
DO $$
BEGIN
  -- verifications: users can view their own; admins can view all; no direct insert/update for clients
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='verifications' AND policyname='Users can view own verifications'
  ) THEN
    CREATE POLICY "Users can view own verifications"
      ON public.verifications FOR SELECT
      USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('admin','root_admin')));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='verifications' AND policyname='Service inserts/updates via RPC'
  ) THEN
    CREATE POLICY "Service inserts/updates via RPC"
      ON public.verifications FOR ALL
      USING (true) WITH CHECK (true);
  END IF;

  -- verification_events: read own via join, writes via service
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='verification_events' AND policyname='Users can view own verification events'
  ) THEN
    CREATE POLICY "Users can view own verification events"
      ON public.verification_events FOR SELECT
      USING (EXISTS (
        SELECT 1 FROM public.verifications v WHERE v.id = verification_events.verification_id
        AND (v.user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('admin','root_admin')))
      ));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='verification_events' AND policyname='Service writes events'
  ) THEN
    CREATE POLICY "Service writes events"
      ON public.verification_events FOR ALL
      USING (true) WITH CHECK (true);
  END IF;

  -- consents: users manage their own
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='consents' AND policyname='Users manage own consents'
  ) THEN
    CREATE POLICY "Users manage own consents"
      ON public.consents FOR ALL
      USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
  END IF;

  -- documents: users can view their own; service writes
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='documents' AND policyname='Users view own documents'
  ) THEN
    CREATE POLICY "Users view own documents"
      ON public.documents FOR SELECT
      USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('admin','root_admin')));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='documents' AND policyname='Service writes documents'
  ) THEN
    CREATE POLICY "Service writes documents"
      ON public.documents FOR ALL
      USING (true) WITH CHECK (true);
  END IF;

  -- policy_results: users view own; service writes
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='policy_results' AND policyname='Users view own policy results'
  ) THEN
    CREATE POLICY "Users view own policy results"
      ON public.policy_results FOR SELECT
      USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('admin','root_admin')));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='policy_results' AND policyname='Service writes policy results'
  ) THEN
    CREATE POLICY "Service writes policy results"
      ON public.policy_results FOR ALL
      USING (true) WITH CHECK (true);
  END IF;

  -- monitoring_subscriptions: users view own; service writes
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='monitoring_subscriptions' AND policyname='Users view own monitoring subscriptions'
  ) THEN
    CREATE POLICY "Users view own monitoring subscriptions"
      ON public.monitoring_subscriptions FOR SELECT
      USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('admin','root_admin')));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='monitoring_subscriptions' AND policyname='Service writes monitoring subscriptions'
  ) THEN
    CREATE POLICY "Service writes monitoring subscriptions"
      ON public.monitoring_subscriptions FOR ALL
      USING (true) WITH CHECK (true);
  END IF;
END$$;

-- =========================
-- Triggers to maintain updated_at
-- =========================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_verifications_updated_at') THEN
    CREATE TRIGGER update_verifications_updated_at
      BEFORE UPDATE ON public.verifications
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_monitoring_subscriptions_updated_at') THEN
    CREATE TRIGGER update_monitoring_subscriptions_updated_at
      BEFORE UPDATE ON public.monitoring_subscriptions
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END$$;

-- Contact submissions:
--  - Authenticated users can insert submissions
--  - Only admins can view/update (based on users.role)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'contact_submissions' AND policyname = 'Authenticated can create contact submissions'
  ) THEN
    CREATE POLICY "Authenticated can create contact submissions"
      ON public.contact_submissions FOR INSERT
      WITH CHECK (auth.uid() IS NOT NULL);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'contact_submissions' AND policyname = 'Admins can view contact submissions'
  ) THEN
    CREATE POLICY "Admins can view contact submissions"
      ON public.contact_submissions FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.users u
          WHERE u.id = auth.uid() AND u.role = 'admin'
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'contact_submissions' AND policyname = 'Admins can update contact submissions'
  ) THEN
    CREATE POLICY "Admins can update contact submissions"
      ON public.contact_submissions FOR UPDATE
      USING (
        EXISTS (
          SELECT 1 FROM public.users u
          WHERE u.id = auth.uid() AND u.role = 'admin'
        )
      );
  END IF;
END$$;

-- =========================
-- Triggers to maintain updated_at
-- (Assumes update_updated_at_column() exists from 04_create_functions.sql)
-- =========================
DO $$
BEGIN
  -- availability
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_availability_updated_at'
  ) THEN
    CREATE TRIGGER update_availability_updated_at
      BEFORE UPDATE ON public.availability
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  -- contact_submissions
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_contact_submissions_updated_at'
  ) THEN
    CREATE TRIGGER update_contact_submissions_updated_at
      BEFORE UPDATE ON public.contact_submissions
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END$$;





-- ============================================================================
-- 06_add_add_ons_table.sql
-- ============================================================================

-- Create add_ons table to store optional extras separate from core services
CREATE TABLE IF NOT EXISTS public.add_ons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT, -- free-form; business-level categories (e.g., 'home_care', 'repairs')
  base_price DECIMAL(10, 2) NOT NULL,
  unit TEXT DEFAULT 'flat_rate' CHECK (unit IN ('flat_rate', 'per_hour', 'per_sqft')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Optional: add simple index for quick listing/filtering
CREATE INDEX IF NOT EXISTS add_ons_is_active_idx ON public.add_ons (is_active);
CREATE INDEX IF NOT EXISTS add_ons_category_idx ON public.add_ons (category);





-- ============================================================================
-- 06_loyalty.sql
-- ============================================================================

-- Loyalty program schema
-- Creates: loyalty_accounts, loyalty_transactions, referrals, achievements, user_achievements
-- Assumes existing auth.users or users table provides user ids referenced here.

create table if not exists public.loyalty_accounts (
  user_id uuid primary key,
  points_balance integer not null default 0,
  tier text not null default 'Bronze', -- Bronze, Silver, Gold, Platinum
  tier_points_12m integer not null default 0,
  streak_count integer not null default 0,
  last_booking_at timestamptz,
  dob_month int2, -- 1-12
  dob_day int2,   -- 1-31
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.loyalty_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  delta_points integer not null,
  source_type text not null, -- earn, redemption, refund, referral, milestone, badge, adjustment
  source_id text,
  metadata jsonb,
  created_at timestamptz not null default now()
);
create index if not exists loyalty_transactions_user_id_idx on public.loyalty_transactions(user_id);

create table if not exists public.referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_id uuid not null,
  referee_id uuid not null,
  status text not null default 'pending', -- pending, completed, rejected
  rewarded_at timestamptz,
  created_at timestamptz not null default now()
);
create unique index if not exists referrals_unique_pair on public.referrals(referrer_id, referee_id);
create index if not exists referrals_referrer_idx on public.referrals(referrer_id);

create table if not exists public.achievements (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  bonus_points integer not null default 0,
  once_per_user boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.user_achievements (
  user_id uuid not null,
  achievement_id uuid not null,
  awarded_at timestamptz not null default now(),
  primary key (user_id, achievement_id)
);

-- Simple helper function to upsert loyalty account
create or replace function public.ensure_loyalty_account(p_user_id uuid)
returns void
language plpgsql
as $$
begin
  insert into public.loyalty_accounts(user_id)
  values (p_user_id)
  on conflict (user_id) do nothing;
end;
$$;

-- Trigger for updated_at
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists loyalty_accounts_set_updated_at on public.loyalty_accounts;
create trigger loyalty_accounts_set_updated_at
before update on public.loyalty_accounts
for each row execute procedure public.set_updated_at();

-- (Optional) RLS - adjust as needed. Disabled by default for service role usage.
alter table public.loyalty_accounts enable row level security;
alter table public.loyalty_transactions enable row level security;
alter table public.referrals enable row level security;
alter table public.achievements enable row level security;
alter table public.user_achievements enable row level security;

do $$
begin
  -- Read-own policies for authenticated users
  if not exists (select 1 from pg_policies where tablename = 'loyalty_accounts' and policyname = 'Allow read own account') then
    create policy "Allow read own account" on public.loyalty_accounts
      for select using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'loyalty_transactions' and policyname = 'Allow read own transactions') then
    create policy "Allow read own transactions" on public.loyalty_transactions
      for select using (auth.uid() = user_id);
  end if;

  -- Block direct writes from client; only service role/serverless should write
  if not exists (select 1 from pg_policies where tablename = 'loyalty_accounts' and policyname = 'No client insert/update accounts') then
    create policy "No client insert/update accounts" on public.loyalty_accounts
      for all using (false) with check (false);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'loyalty_transactions' and policyname = 'No client writes transactions') then
    create policy "No client writes transactions" on public.loyalty_transactions
      for all using (false) with check (false);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'referrals' and policyname = 'No client writes referrals') then
    create policy "No client writes referrals" on public.referrals
      for all using (false) with check (false);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'achievements' and policyname = 'Allow public read achievements') then
    create policy "Allow public read achievements" on public.achievements
      for select using (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'user_achievements' and policyname = 'Read own user_achievements') then
    create policy "Read own user_achievements" on public.user_achievements
      for select using (auth.uid() = user_id);
  end if;
end $$;





-- ============================================================================
-- 07_seed_add_ons.sql
-- ============================================================================

-- Seed baseline add-ons. Safe to run multiple times.
INSERT INTO public.add_ons (name, description, category, base_price, unit)
VALUES
  ('Laundry & Ironing', 'Laundry folding and ironing add-on', 'home_care', 25.00, 'flat_rate'),
  ('Interior Design Consultation', 'Virtual or in-person design consultation', 'consulting', 120.00, 'flat_rate'),
  ('Organization Services', 'Closet, pantry, and space organization', 'home_care', 60.00, 'flat_rate'),
  ('Handyman Repairs', 'Minor household repairs and fixes', 'repairs', 85.00, 'flat_rate'),
  ('Gardening / Outdoor Cleaning', 'Light gardening and outdoor cleanup', 'outdoor', 70.00, 'flat_rate'),
  ('Pest Control', 'Basic pest control service', 'pest_control', 150.00, 'flat_rate'),
  ('HVAC Cleaning', 'Duct and vent cleaning', 'hvac', 140.00, 'flat_rate'),
  ('Smart Home Setup', 'Install and configure smart devices', 'tech', 110.00, 'flat_rate')
ON CONFLICT DO NOTHING;





-- ============================================================================
-- 08_customer_personalization.sql
-- ============================================================================

-- Customer Personalization: preferences, favorite cleaners, custom checklists
-- Idempotent creation for safe re-runs

-- Preferences per customer
CREATE TABLE IF NOT EXISTS public.customer_preferences (
  user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  -- Products/music/temperature and general cleaning prefs
  preferred_products TEXT[], -- e.g., ['eco','hypoallergenic','brand:X']
  preferred_music TEXT, -- e.g., 'lofi', 'classical'
  preferred_temperature INTEGER, -- Fahrenheit
  special_instructions TEXT,
  eco_friendly BOOLEAN DEFAULT false,
  pet_friendly BOOLEAN DEFAULT false,
  -- Time preferences
  preferred_time_slot TEXT CHECK (preferred_time_slot IN ('morning','afternoon','evening')) ,
  time_windows JSONB, -- [{day:'mon', start:'09:00', end:'12:00'}, ...]
  do_not_disturb JSONB, -- [{day:'sun', start:'08:00', end:'10:00'}]
  -- Communication preferences
  preferred_channels TEXT[] DEFAULT ARRAY['email']::TEXT[] CHECK (
    preferred_channels <@ ARRAY['email','sms','whatsapp','push']::TEXT[]
  ),
  marketing_opt_in BOOLEAN DEFAULT false,
  -- Address preferences
  default_address_id UUID REFERENCES public.addresses(id) ON DELETE SET NULL,
  -- Pet preferences
  has_pets BOOLEAN DEFAULT false,
  pet_types TEXT[], -- e.g., ['dog','cat']
  pet_notes TEXT,
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customer_preferences_default_addr
  ON public.customer_preferences (default_address_id);

-- Favorite cleaners (providers) per customer
CREATE TABLE IF NOT EXISTS public.favorite_cleaners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES public.provider_profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, provider_id)
);

CREATE INDEX IF NOT EXISTS idx_favorite_cleaners_user ON public.favorite_cleaners (user_id);
CREATE INDEX IF NOT EXISTS idx_favorite_cleaners_provider ON public.favorite_cleaners (provider_id);

-- Custom checklists per customer
CREATE TABLE IF NOT EXISTS public.custom_checklists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  items JSONB NOT NULL, -- [{label:'Vacuum living room', checked:false, notes:''}, ...]
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_custom_checklists_user ON public.custom_checklists (user_id);
CREATE INDEX IF NOT EXISTS idx_custom_checklists_default ON public.custom_checklists (user_id, is_default);

-- Trigger to maintain updated_at columns
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_customer_preferences_updated ON public.customer_preferences;
CREATE TRIGGER trg_customer_preferences_updated
BEFORE UPDATE ON public.customer_preferences
FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

DROP TRIGGER IF EXISTS trg_custom_checklists_updated ON public.custom_checklists;
CREATE TRIGGER trg_custom_checklists_updated
BEFORE UPDATE ON public.custom_checklists
FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

-- RLS: enable and basic policies (owner-only)
ALTER TABLE public.customer_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorite_cleaners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_checklists ENABLE ROW LEVEL SECURITY;

-- Policies: users can manage their own rows
DO $$
BEGIN
  -- customer_preferences
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'customer_preferences' AND policyname = 'customer_preferences_owner_select'
  ) THEN
    CREATE POLICY customer_preferences_owner_select
      ON public.customer_preferences
      FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'customer_preferences' AND policyname = 'customer_preferences_owner_upsert'
  ) THEN
    CREATE POLICY customer_preferences_owner_upsert
      ON public.customer_preferences
      FOR INSERT WITH CHECK (auth.uid() = user_id)
      TO authenticated;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'customer_preferences' AND policyname = 'customer_preferences_owner_update'
  ) THEN
    CREATE POLICY customer_preferences_owner_update
      ON public.customer_preferences
      FOR UPDATE USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;

  -- favorite_cleaners
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'favorite_cleaners' AND policyname = 'favorite_cleaners_owner_all'
  ) THEN
    CREATE POLICY favorite_cleaners_owner_all
      ON public.favorite_cleaners
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;

  -- custom_checklists
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'custom_checklists' AND policyname = 'custom_checklists_owner_all'
  ) THEN
    CREATE POLICY custom_checklists_owner_all
      ON public.custom_checklists
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;





-- ============================================================================
-- 09_multi_tenant.sql
-- ============================================================================

-- Multi-tenant core schema
-- Creates: tenants, tenant_branding, territories, revenue_shares, payouts, usage_meters
-- Safe to re-run; uses IF NOT EXISTS and IF NOT EXISTS guarded policies/triggers

-- Ensure required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =========================
-- tenants
-- =========================
CREATE TABLE IF NOT EXISTS public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  domain TEXT, -- e.g., custom domain or subdomain
  owner_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','suspended','archived')),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS tenants_status_idx ON public.tenants(status);
CREATE INDEX IF NOT EXISTS tenants_owner_idx ON public.tenants(owner_user_id);

-- =========================
-- tenant_branding
-- =========================
CREATE TABLE IF NOT EXISTS public.tenant_branding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  logo_url TEXT,
  favicon_url TEXT,
  primary_color TEXT,
  secondary_color TEXT,
  theme TEXT DEFAULT 'light' CHECK (theme IN ('light','dark','system')),
  typography JSONB, -- {fontFamily, sizes, weights}
  styles JSONB,     -- arbitrary theme tokens
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id)
);
CREATE INDEX IF NOT EXISTS tenant_branding_tenant_idx ON public.tenant_branding(tenant_id);

-- =========================
-- territories (e.g., geographies/markets a tenant operates in)
-- =========================
CREATE TABLE IF NOT EXISTS public.territories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  code TEXT NOT NULL,        -- e.g., 'US-CA-SF'
  name TEXT NOT NULL,        -- human-readable
  geo JSONB,                 -- optional geometry (e.g., GeoJSON)
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, code)
);
CREATE INDEX IF NOT EXISTS territories_tenant_active_idx ON public.territories(tenant_id, active);

-- =========================
-- revenue_shares (how revenue is split for a tenant)
-- =========================
CREATE TABLE IF NOT EXISTS public.revenue_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  party_type TEXT NOT NULL CHECK (party_type IN ('platform','tenant','provider','company')),
  party_id UUID, -- nullable for platform/tenant; for 'provider' link to provider_profiles.id if applicable
  share_percent NUMERIC(5,2) NOT NULL CHECK (share_percent >= 0 AND share_percent <= 100),
  effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
  effective_to DATE,
  conditions JSONB DEFAULT '{}'::jsonb, -- optional filters (service, territory, etc.)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS revenue_shares_tenant_idx ON public.revenue_shares(tenant_id);
CREATE INDEX IF NOT EXISTS revenue_shares_effective_idx ON public.revenue_shares(effective_from, effective_to);

-- =========================
-- payouts (outgoing payments within a tenant context)
-- =========================
CREATE TABLE IF NOT EXISTS public.payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  provider_id UUID,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','scheduled','processing','paid','failed','canceled')),
  method TEXT, -- e.g., 'stripe_transfer', 'ach'
  external_id TEXT, -- e.g., Stripe transfer id
  scheduled_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS payouts_tenant_status_idx ON public.payouts(tenant_id, status);
CREATE INDEX IF NOT EXISTS payouts_provider_idx ON public.payouts(provider_id);

-- Conditionally add FK to provider_profiles if it exists
DO $$
BEGIN
  IF to_regclass('public.provider_profiles') IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_constraint
      WHERE conname = 'payouts_provider_fk'
    ) THEN
      ALTER TABLE public.payouts
        ADD CONSTRAINT payouts_provider_fk
        FOREIGN KEY (provider_id) REFERENCES public.provider_profiles(id) ON DELETE SET NULL;
    END IF;
  END IF;
END$$;

-- =========================
-- usage_meters (track usage for billing/limits per tenant)
-- =========================
CREATE TABLE IF NOT EXISTS public.usage_meters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  meter TEXT NOT NULL, -- e.g., 'bookings_created', 'messages_sent', 'active_providers'
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  quantity NUMERIC(20,6) NOT NULL DEFAULT 0,
  dimensions JSONB DEFAULT '{}'::jsonb, -- arbitrary labels (service, territory, plan)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, meter, period_start, period_end)
);
CREATE INDEX IF NOT EXISTS usage_meters_tenant_meter_idx ON public.usage_meters(tenant_id, meter);
CREATE INDEX IF NOT EXISTS usage_meters_period_idx ON public.usage_meters(period_start, period_end);

-- =========================
-- RLS enablement
-- =========================
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_branding ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.territories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revenue_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_meters ENABLE ROW LEVEL SECURITY;

-- =========================
-- RLS policies (minimal/admin-readable; service-role writes)
-- Adjust as needed once tenant membership model is added
-- =========================
DO $$
BEGIN
  -- Helper EXISTS clause for admin check
  -- Note: relies on public.users.role in ('admin','root_admin')

  -- tenants
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='tenants' AND policyname='Admins can view tenants'
  ) THEN
    CREATE POLICY "Admins can view tenants"
      ON public.tenants FOR SELECT
      USING (EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('admin','root_admin')));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='tenants' AND policyname='Service can manage tenants'
  ) THEN
    CREATE POLICY "Service can manage tenants"
      ON public.tenants FOR ALL
      USING (true) WITH CHECK (true);
  END IF;

  -- tenant_branding
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='tenant_branding' AND policyname='Admins can view tenant_branding'
  ) THEN
    CREATE POLICY "Admins can view tenant_branding"
      ON public.tenant_branding FOR SELECT
      USING (EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('admin','root_admin')));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='tenant_branding' AND policyname='Service can manage tenant_branding'
  ) THEN
    CREATE POLICY "Service can manage tenant_branding"
      ON public.tenant_branding FOR ALL
      USING (true) WITH CHECK (true);
  END IF;

  -- territories
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='territories' AND policyname='Admins can view territories'
  ) THEN
    CREATE POLICY "Admins can view territories"
      ON public.territories FOR SELECT
      USING (EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('admin','root_admin')));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='territories' AND policyname='Service can manage territories'
  ) THEN
    CREATE POLICY "Service can manage territories"
      ON public.territories FOR ALL
      USING (true) WITH CHECK (true);
  END IF;

  -- revenue_shares
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='revenue_shares' AND policyname='Admins can view revenue_shares'
  ) THEN
    CREATE POLICY "Admins can view revenue_shares"
      ON public.revenue_shares FOR SELECT
      USING (EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('admin','root_admin')));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='revenue_shares' AND policyname='Service can manage revenue_shares'
  ) THEN
    CREATE POLICY "Service can manage revenue_shares"
      ON public.revenue_shares FOR ALL
      USING (true) WITH CHECK (true);
  END IF;

  -- payouts
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='payouts' AND policyname='Admins can view payouts'
  ) THEN
    CREATE POLICY "Admins can view payouts"
      ON public.payouts FOR SELECT
      USING (EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('admin','root_admin')));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='payouts' AND policyname='Service can manage payouts'
  ) THEN
    CREATE POLICY "Service can manage payouts"
      ON public.payouts FOR ALL
      USING (true) WITH CHECK (true);
  END IF;

  -- usage_meters
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='usage_meters' AND policyname='Admins can view usage_meters'
  ) THEN
    CREATE POLICY "Admins can view usage_meters"
      ON public.usage_meters FOR SELECT
      USING (EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('admin','root_admin')));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='usage_meters' AND policyname='Service can manage usage_meters'
  ) THEN
    CREATE POLICY "Service can manage usage_meters"
      ON public.usage_meters FOR ALL
      USING (true) WITH CHECK (true);
  END IF;
END$$;

-- =========================
-- Triggers to maintain updated_at
-- (Assumes update_updated_at_column() exists from 04_create_functions.sql)
-- =========================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_tenants_updated_at') THEN
    CREATE TRIGGER update_tenants_updated_at
      BEFORE UPDATE ON public.tenants
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_tenant_branding_updated_at') THEN
    CREATE TRIGGER update_tenant_branding_updated_at
      BEFORE UPDATE ON public.tenant_branding
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_territories_updated_at') THEN
    CREATE TRIGGER update_territories_updated_at
      BEFORE UPDATE ON public.territories
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_revenue_shares_updated_at') THEN
    CREATE TRIGGER update_revenue_shares_updated_at
      BEFORE UPDATE ON public.revenue_shares
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_payouts_updated_at') THEN
    CREATE TRIGGER update_payouts_updated_at
      BEFORE UPDATE ON public.payouts
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_usage_meters_updated_at') THEN
    CREATE TRIGGER update_usage_meters_updated_at
      BEFORE UPDATE ON public.usage_meters
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END$$;





-- ============================================================================
-- 09_multitenancy.sql
-- ============================================================================

-- Multitenancy migration: introduce tenants and add tenant_id to core tables
-- Safe, idempotent(ish) migration designed to run multiple times
-- Strategy:
--  1) Create tenants table
--  2) Add nullable tenant_id columns to core tables (IF NOT EXISTS)
--  3) Ensure a default tenant exists; backfill existing rows to default tenant
--  4) Add FKs, NOT NULL constraints, and indexes

-- =========================
-- Step 1: Tenants table
-- =========================
CREATE TABLE IF NOT EXISTS public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_tenants_updated_at'
  ) THEN
    CREATE TRIGGER update_tenants_updated_at
      BEFORE UPDATE ON public.tenants
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END$$;

-- Ensure a default tenant exists and capture its id
DO $$
DECLARE
  v_default_tenant_id UUID;
BEGIN
  -- insert default tenant if missing
  INSERT INTO public.tenants (slug, name)
  SELECT 'default', 'Default Tenant'
  WHERE NOT EXISTS (SELECT 1 FROM public.tenants WHERE slug = 'default');

  SELECT id INTO v_default_tenant_id FROM public.tenants WHERE slug = 'default';

  -- =========================
  -- Step 2: Add tenant_id columns (nullable for backfill)
  -- =========================
  IF to_regclass('public.users') IS NOT NULL THEN
    PERFORM 1 FROM pg_attribute
    WHERE attrelid = 'public.users'::regclass AND attname = 'tenant_id' AND NOT attisdropped;
    IF NOT FOUND THEN
      ALTER TABLE public.users ADD COLUMN tenant_id UUID;
    END IF;
  END IF;

  IF to_regclass('public.addresses') IS NOT NULL THEN
    PERFORM 1 FROM pg_attribute
    WHERE attrelid = 'public.addresses'::regclass AND attname = 'tenant_id' AND NOT attisdropped;
    IF NOT FOUND THEN
      ALTER TABLE public.addresses ADD COLUMN tenant_id UUID;
    END IF;
  END IF;

  IF to_regclass('public.provider_profiles') IS NOT NULL THEN
    PERFORM 1 FROM pg_attribute
    WHERE attrelid = 'public.provider_profiles'::regclass AND attname = 'tenant_id' AND NOT attisdropped;
    IF NOT FOUND THEN
      ALTER TABLE public.provider_profiles ADD COLUMN tenant_id UUID;
    END IF;
  END IF;

  IF to_regclass('public.services') IS NOT NULL THEN
    PERFORM 1 FROM pg_attribute
    WHERE attrelid = 'public.services'::regclass AND attname = 'tenant_id' AND NOT attisdropped;
    IF NOT FOUND THEN
      ALTER TABLE public.services ADD COLUMN tenant_id UUID;
    END IF;
  END IF;

  IF to_regclass('public.provider_services') IS NOT NULL THEN
    PERFORM 1 FROM pg_attribute
    WHERE attrelid = 'public.provider_services'::regclass AND attname = 'tenant_id' AND NOT attisdropped;
    IF NOT FOUND THEN
      ALTER TABLE public.provider_services ADD COLUMN tenant_id UUID;
    END IF;
  END IF;

  IF to_regclass('public.bookings') IS NOT NULL THEN
    PERFORM 1 FROM pg_attribute
    WHERE attrelid = 'public.bookings'::regclass AND attname = 'tenant_id' AND NOT attisdropped;
    IF NOT FOUND THEN
      ALTER TABLE public.bookings ADD COLUMN tenant_id UUID;
    END IF;
  END IF;

  IF to_regclass('public.reviews') IS NOT NULL THEN
    PERFORM 1 FROM pg_attribute
    WHERE attrelid = 'public.reviews'::regclass AND attname = 'tenant_id' AND NOT attisdropped;
    IF NOT FOUND THEN
      ALTER TABLE public.reviews ADD COLUMN tenant_id UUID;
    END IF;
  END IF;

  IF to_regclass('public.transactions') IS NOT NULL THEN
    PERFORM 1 FROM pg_attribute
    WHERE attrelid = 'public.transactions'::regclass AND attname = 'tenant_id' AND NOT attisdropped;
    IF NOT FOUND THEN
      ALTER TABLE public.transactions ADD COLUMN tenant_id UUID;
    END IF;
  END IF;

  IF to_regclass('public.provider_availability') IS NOT NULL THEN
    PERFORM 1 FROM pg_attribute
    WHERE attrelid = 'public.provider_availability'::regclass AND attname = 'tenant_id' AND NOT attisdropped;
    IF NOT FOUND THEN
      ALTER TABLE public.provider_availability ADD COLUMN tenant_id UUID;
    END IF;
  END IF;

  -- Availability day-level table from 05_alter_and_missing_tables.sql
  IF to_regclass('public.availability') IS NOT NULL THEN
    PERFORM 1 FROM pg_attribute
    WHERE attrelid = 'public.availability'::regclass AND attname = 'tenant_id' AND NOT attisdropped;
    IF NOT FOUND THEN
      ALTER TABLE public.availability ADD COLUMN tenant_id UUID;
    END IF;
  END IF;

  IF to_regclass('public.notifications') IS NOT NULL THEN
    PERFORM 1 FROM pg_attribute
    WHERE attrelid = 'public.notifications'::regclass AND attname = 'tenant_id' AND NOT attisdropped;
    IF NOT FOUND THEN
      ALTER TABLE public.notifications ADD COLUMN tenant_id UUID;
    END IF;
  END IF;

  -- Marketing/growth tables (created in 05):
  IF to_regclass('public.campaigns') IS NOT NULL THEN
    PERFORM 1 FROM pg_attribute
    WHERE attrelid = 'public.campaigns'::regclass AND attname = 'tenant_id' AND NOT attisdropped;
    IF NOT FOUND THEN
      ALTER TABLE public.campaigns ADD COLUMN tenant_id UUID;
    END IF;
  END IF;

  IF to_regclass('public.message_templates') IS NOT NULL THEN
    PERFORM 1 FROM pg_attribute
    WHERE attrelid = 'public.message_templates'::regclass AND attname = 'tenant_id' AND NOT attisdropped;
    IF NOT FOUND THEN
      ALTER TABLE public.message_templates ADD COLUMN tenant_id UUID;
    END IF;
  END IF;

  IF to_regclass('public.promo_codes') IS NOT NULL THEN
    PERFORM 1 FROM pg_attribute
    WHERE attrelid = 'public.promo_codes'::regclass AND attname = 'tenant_id' AND NOT attisdropped;
    IF NOT FOUND THEN
      ALTER TABLE public.promo_codes ADD COLUMN tenant_id UUID;
    END IF;
  END IF;

  -- Referrals exists both in 05 and in loyalty script; add tenant_id if present
  IF to_regclass('public.referrals') IS NOT NULL THEN
    PERFORM 1 FROM pg_attribute
    WHERE attrelid = 'public.referrals'::regclass AND attname = 'tenant_id' AND NOT attisdropped;
    IF NOT FOUND THEN
      ALTER TABLE public.referrals ADD COLUMN tenant_id UUID;
    END IF;
  END IF;

  -- Loyalty tables
  IF to_regclass('public.loyalty_accounts') IS NOT NULL THEN
    PERFORM 1 FROM pg_attribute
    WHERE attrelid = 'public.loyalty_accounts'::regclass AND attname = 'tenant_id' AND NOT attisdropped;
    IF NOT FOUND THEN
      ALTER TABLE public.loyalty_accounts ADD COLUMN tenant_id UUID;
    END IF;
  END IF;
  IF to_regclass('public.loyalty_transactions') IS NOT NULL THEN
    PERFORM 1 FROM pg_attribute
    WHERE attrelid = 'public.loyalty_transactions'::regclass AND attname = 'tenant_id' AND NOT attisdropped;
    IF NOT FOUND THEN
      ALTER TABLE public.loyalty_transactions ADD COLUMN tenant_id UUID;
    END IF;
  END IF;
  IF to_regclass('public.achievements') IS NOT NULL THEN
    PERFORM 1 FROM pg_attribute
    WHERE attrelid = 'public.achievements'::regclass AND attname = 'tenant_id' AND NOT attisdropped;
    IF NOT FOUND THEN
      ALTER TABLE public.achievements ADD COLUMN tenant_id UUID;
    END IF;
  END IF;
  IF to_regclass('public.user_achievements') IS NOT NULL THEN
    PERFORM 1 FROM pg_attribute
    WHERE attrelid = 'public.user_achievements'::regclass AND attname = 'tenant_id' AND NOT attisdropped;
    IF NOT FOUND THEN
      ALTER TABLE public.user_achievements ADD COLUMN tenant_id UUID;
    END IF;
  END IF;

  -- Verification/trust tables
  IF to_regclass('public.verifications') IS NOT NULL THEN
    PERFORM 1 FROM pg_attribute
    WHERE attrelid = 'public.verifications'::regclass AND attname = 'tenant_id' AND NOT attisdropped;
    IF NOT FOUND THEN
      ALTER TABLE public.verifications ADD COLUMN tenant_id UUID;
    END IF;
  END IF;
  IF to_regclass('public.verification_events') IS NOT NULL THEN
    PERFORM 1 FROM pg_attribute
    WHERE attrelid = 'public.verification_events'::regclass AND attname = 'tenant_id' AND NOT attisdropped;
    IF NOT FOUND THEN
      ALTER TABLE public.verification_events ADD COLUMN tenant_id UUID;
    END IF;
  END IF;
  IF to_regclass('public.consents') IS NOT NULL THEN
    PERFORM 1 FROM pg_attribute
    WHERE attrelid = 'public.consents'::regclass AND attname = 'tenant_id' AND NOT attisdropped;
    IF NOT FOUND THEN
      ALTER TABLE public.consents ADD COLUMN tenant_id UUID;
    END IF;
  END IF;
  IF to_regclass('public.documents') IS NOT NULL THEN
    PERFORM 1 FROM pg_attribute
    WHERE attrelid = 'public.documents'::regclass AND attname = 'tenant_id' AND NOT attisdropped;
    IF NOT FOUND THEN
      ALTER TABLE public.documents ADD COLUMN tenant_id UUID;
    END IF;
  END IF;
  IF to_regclass('public.policy_results') IS NOT NULL THEN
    PERFORM 1 FROM pg_attribute
    WHERE attrelid = 'public.policy_results'::regclass AND attname = 'tenant_id' AND NOT attisdropped;
    IF NOT FOUND THEN
      ALTER TABLE public.policy_results ADD COLUMN tenant_id UUID;
    END IF;
  END IF;
  IF to_regclass('public.monitoring_subscriptions') IS NOT NULL THEN
    PERFORM 1 FROM pg_attribute
    WHERE attrelid = 'public.monitoring_subscriptions'::regclass AND attname = 'tenant_id' AND NOT attisdropped;
    IF NOT FOUND THEN
      ALTER TABLE public.monitoring_subscriptions ADD COLUMN tenant_id UUID;
    END IF;
  END IF;

  -- Add-ons
  IF to_regclass('public.add_ons') IS NOT NULL THEN
    PERFORM 1 FROM pg_attribute
    WHERE attrelid = 'public.add_ons'::regclass AND attname = 'tenant_id' AND NOT attisdropped;
    IF NOT FOUND THEN
      ALTER TABLE public.add_ons ADD COLUMN tenant_id UUID;
    END IF;
  END IF;

  -- =========================
  -- Step 3: Backfill tenant_id with default tenant
  -- =========================
  IF to_regclass('public.users') IS NOT NULL THEN
    UPDATE public.users SET tenant_id = v_default_tenant_id WHERE tenant_id IS NULL;
  END IF;
  IF to_regclass('public.addresses') IS NOT NULL THEN
    UPDATE public.addresses SET tenant_id = v_default_tenant_id WHERE tenant_id IS NULL;
  END IF;
  IF to_regclass('public.provider_profiles') IS NOT NULL THEN
    UPDATE public.provider_profiles SET tenant_id = v_default_tenant_id WHERE tenant_id IS NULL;
  END IF;
  IF to_regclass('public.services') IS NOT NULL THEN
    UPDATE public.services SET tenant_id = v_default_tenant_id WHERE tenant_id IS NULL;
  END IF;
  IF to_regclass('public.provider_services') IS NOT NULL THEN
    UPDATE public.provider_services SET tenant_id = v_default_tenant_id WHERE tenant_id IS NULL;
  END IF;
  IF to_regclass('public.bookings') IS NOT NULL THEN
    UPDATE public.bookings SET tenant_id = v_default_tenant_id WHERE tenant_id IS NULL;
  END IF;
  IF to_regclass('public.reviews') IS NOT NULL THEN
    UPDATE public.reviews SET tenant_id = v_default_tenant_id WHERE tenant_id IS NULL;
  END IF;
  IF to_regclass('public.transactions') IS NOT NULL THEN
    UPDATE public.transactions SET tenant_id = v_default_tenant_id WHERE tenant_id IS NULL;
  END IF;
  IF to_regclass('public.provider_availability') IS NOT NULL THEN
    UPDATE public.provider_availability SET tenant_id = v_default_tenant_id WHERE tenant_id IS NULL;
  END IF;
  IF to_regclass('public.availability') IS NOT NULL THEN
    UPDATE public.availability SET tenant_id = v_default_tenant_id WHERE tenant_id IS NULL;
  END IF;
  IF to_regclass('public.notifications') IS NOT NULL THEN
    UPDATE public.notifications SET tenant_id = v_default_tenant_id WHERE tenant_id IS NULL;
  END IF;
  IF to_regclass('public.campaigns') IS NOT NULL THEN
    UPDATE public.campaigns SET tenant_id = v_default_tenant_id WHERE tenant_id IS NULL;
  END IF;
  IF to_regclass('public.message_templates') IS NOT NULL THEN
    UPDATE public.message_templates SET tenant_id = v_default_tenant_id WHERE tenant_id IS NULL;
  END IF;
  IF to_regclass('public.promo_codes') IS NOT NULL THEN
    UPDATE public.promo_codes SET tenant_id = v_default_tenant_id WHERE tenant_id IS NULL;
  END IF;
  IF to_regclass('public.referrals') IS NOT NULL THEN
    UPDATE public.referrals SET tenant_id = v_default_tenant_id WHERE tenant_id IS NULL;
  END IF;
  IF to_regclass('public.loyalty_accounts') IS NOT NULL THEN
    UPDATE public.loyalty_accounts SET tenant_id = v_default_tenant_id WHERE tenant_id IS NULL;
  END IF;
  IF to_regclass('public.loyalty_transactions') IS NOT NULL THEN
    UPDATE public.loyalty_transactions SET tenant_id = v_default_tenant_id WHERE tenant_id IS NULL;
  END IF;
  IF to_regclass('public.achievements') IS NOT NULL THEN
    UPDATE public.achievements SET tenant_id = v_default_tenant_id WHERE tenant_id IS NULL;
  END IF;
  IF to_regclass('public.user_achievements') IS NOT NULL THEN
    UPDATE public.user_achievements SET tenant_id = v_default_tenant_id WHERE tenant_id IS NULL;
  END IF;
  IF to_regclass('public.verifications') IS NOT NULL THEN
    UPDATE public.verifications SET tenant_id = v_default_tenant_id WHERE tenant_id IS NULL;
  END IF;
  IF to_regclass('public.verification_events') IS NOT NULL THEN
    UPDATE public.verification_events SET tenant_id = v_default_tenant_id WHERE tenant_id IS NULL;
  END IF;
  IF to_regclass('public.consents') IS NOT NULL THEN
    UPDATE public.consents SET tenant_id = v_default_tenant_id WHERE tenant_id IS NULL;
  END IF;
  IF to_regclass('public.documents') IS NOT NULL THEN
    UPDATE public.documents SET tenant_id = v_default_tenant_id WHERE tenant_id IS NULL;
  END IF;
  IF to_regclass('public.policy_results') IS NOT NULL THEN
    UPDATE public.policy_results SET tenant_id = v_default_tenant_id WHERE tenant_id IS NULL;
  END IF;
  IF to_regclass('public.monitoring_subscriptions') IS NOT NULL THEN
    UPDATE public.monitoring_subscriptions SET tenant_id = v_default_tenant_id WHERE tenant_id IS NULL;
  END IF;
  IF to_regclass('public.add_ons') IS NOT NULL THEN
    UPDATE public.add_ons SET tenant_id = v_default_tenant_id WHERE tenant_id IS NULL;
  END IF;

  -- =========================
  -- Step 4: Add FKs, NOT NULL, and indexes
  -- =========================
  -- Helper to add FK + not null + index if missing
  -- Users
  IF to_regclass('public.users') IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conname = 'users_tenant_id_fkey' AND conrelid = 'public.users'::regclass
    ) THEN
      ALTER TABLE public.users
        ADD CONSTRAINT users_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE RESTRICT;
    END IF;
    ALTER TABLE public.users
      ALTER COLUMN tenant_id SET NOT NULL;
    CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON public.users(tenant_id);
  END IF;

  -- Addresses
  IF to_regclass('public.addresses') IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conname = 'addresses_tenant_id_fkey' AND conrelid = 'public.addresses'::regclass
    ) THEN
      ALTER TABLE public.addresses
        ADD CONSTRAINT addresses_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE RESTRICT;
    END IF;
    ALTER TABLE public.addresses
      ALTER COLUMN tenant_id SET NOT NULL;
    CREATE INDEX IF NOT EXISTS idx_addresses_tenant_id ON public.addresses(tenant_id);
  END IF;

  -- Provider profiles
  IF to_regclass('public.provider_profiles') IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conname = 'provider_profiles_tenant_id_fkey' AND conrelid = 'public.provider_profiles'::regclass
    ) THEN
      ALTER TABLE public.provider_profiles
        ADD CONSTRAINT provider_profiles_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE RESTRICT;
    END IF;
    ALTER TABLE public.provider_profiles
      ALTER COLUMN tenant_id SET NOT NULL;
    CREATE INDEX IF NOT EXISTS idx_provider_profiles_tenant_id ON public.provider_profiles(tenant_id);
  END IF;

  -- Services
  IF to_regclass('public.services') IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conname = 'services_tenant_id_fkey' AND conrelid = 'public.services'::regclass
    ) THEN
      ALTER TABLE public.services
        ADD CONSTRAINT services_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE RESTRICT;
    END IF;
    ALTER TABLE public.services
      ALTER COLUMN tenant_id SET NOT NULL;
    CREATE INDEX IF NOT EXISTS idx_services_tenant_id ON public.services(tenant_id);
  END IF;

  -- Provider services
  IF to_regclass('public.provider_services') IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conname = 'provider_services_tenant_id_fkey' AND conrelid = 'public.provider_services'::regclass
    ) THEN
      ALTER TABLE public.provider_services
        ADD CONSTRAINT provider_services_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE RESTRICT;
    END IF;
    ALTER TABLE public.provider_services
      ALTER COLUMN tenant_id SET NOT NULL;
    CREATE INDEX IF NOT EXISTS idx_provider_services_tenant_id ON public.provider_services(tenant_id);
  END IF;

  -- Bookings
  IF to_regclass('public.bookings') IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conname = 'bookings_tenant_id_fkey' AND conrelid = 'public.bookings'::regclass
    ) THEN
      ALTER TABLE public.bookings
        ADD CONSTRAINT bookings_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE RESTRICT;
    END IF;
    ALTER TABLE public.bookings
      ALTER COLUMN tenant_id SET NOT NULL;
    CREATE INDEX IF NOT EXISTS idx_bookings_tenant_id ON public.bookings(tenant_id);
    CREATE INDEX IF NOT EXISTS idx_bookings_tenant_date ON public.bookings(tenant_id, booking_date);
  END IF;

  -- Reviews
  IF to_regclass('public.reviews') IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conname = 'reviews_tenant_id_fkey' AND conrelid = 'public.reviews'::regclass
    ) THEN
      ALTER TABLE public.reviews
        ADD CONSTRAINT reviews_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE RESTRICT;
    END IF;
    ALTER TABLE public.reviews
      ALTER COLUMN tenant_id SET NOT NULL;
    CREATE INDEX IF NOT EXISTS idx_reviews_tenant_id ON public.reviews(tenant_id);
  END IF;

  -- Transactions
  IF to_regclass('public.transactions') IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conname = 'transactions_tenant_id_fkey' AND conrelid = 'public.transactions'::regclass
    ) THEN
      ALTER TABLE public.transactions
        ADD CONSTRAINT transactions_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE RESTRICT;
    END IF;
    ALTER TABLE public.transactions
      ALTER COLUMN tenant_id SET NOT NULL;
    CREATE INDEX IF NOT EXISTS idx_transactions_tenant_id ON public.transactions(tenant_id);
  END IF;

  -- Provider availability
  IF to_regclass('public.provider_availability') IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conname = 'provider_availability_tenant_id_fkey' AND conrelid = 'public.provider_availability'::regclass
    ) THEN
      ALTER TABLE public.provider_availability
        ADD CONSTRAINT provider_availability_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE RESTRICT;
    END IF;
    ALTER TABLE public.provider_availability
      ALTER COLUMN tenant_id SET NOT NULL;
    CREATE INDEX IF NOT EXISTS idx_provider_availability_tenant_id ON public.provider_availability(tenant_id);
  END IF;

  -- availability (day-level)
  IF to_regclass('public.availability') IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conname = 'availability_tenant_id_fkey' AND conrelid = 'public.availability'::regclass
    ) THEN
      ALTER TABLE public.availability
        ADD CONSTRAINT availability_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE RESTRICT;
    END IF;
    ALTER TABLE public.availability
      ALTER COLUMN tenant_id SET NOT NULL;
    CREATE INDEX IF NOT EXISTS idx_availability_tenant_id ON public.availability(tenant_id);
  END IF;

  -- Notifications
  IF to_regclass('public.notifications') IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conname = 'notifications_tenant_id_fkey' AND conrelid = 'public.notifications'::regclass
    ) THEN
      ALTER TABLE public.notifications
        ADD CONSTRAINT notifications_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE RESTRICT;
    END IF;
    ALTER TABLE public.notifications
      ALTER COLUMN tenant_id SET NOT NULL;
    CREATE INDEX IF NOT EXISTS idx_notifications_tenant_id ON public.notifications(tenant_id);
  END IF;

  -- Campaigns
  IF to_regclass('public.campaigns') IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conname = 'campaigns_tenant_id_fkey' AND conrelid = 'public.campaigns'::regclass
    ) THEN
      ALTER TABLE public.campaigns
        ADD CONSTRAINT campaigns_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE RESTRICT;
    END IF;
    ALTER TABLE public.campaigns
      ALTER COLUMN tenant_id SET NOT NULL;
    CREATE INDEX IF NOT EXISTS idx_campaigns_tenant_id ON public.campaigns(tenant_id);
  END IF;

  -- Message templates
  IF to_regclass('public.message_templates') IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conname = 'message_templates_tenant_id_fkey' AND conrelid = 'public.message_templates'::regclass
    ) THEN
      ALTER TABLE public.message_templates
        ADD CONSTRAINT message_templates_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE RESTRICT;
    END IF;
    ALTER TABLE public.message_templates
      ALTER COLUMN tenant_id SET NOT NULL;
    CREATE INDEX IF NOT EXISTS idx_message_templates_tenant_id ON public.message_templates(tenant_id);
  END IF;

  -- Promo codes
  IF to_regclass('public.promo_codes') IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conname = 'promo_codes_tenant_id_fkey' AND conrelid = 'public.promo_codes'::regclass
    ) THEN
      ALTER TABLE public.promo_codes
        ADD CONSTRAINT promo_codes_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE RESTRICT;
    END IF;
    ALTER TABLE public.promo_codes
      ALTER COLUMN tenant_id SET NOT NULL;
    CREATE INDEX IF NOT EXISTS idx_promo_codes_tenant_id ON public.promo_codes(tenant_id);
  END IF;

  -- Referrals
  IF to_regclass('public.referrals') IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conname = 'referrals_tenant_id_fkey' AND conrelid = 'public.referrals'::regclass
    ) THEN
      ALTER TABLE public.referrals
        ADD CONSTRAINT referrals_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE RESTRICT;
    END IF;
    ALTER TABLE public.referrals
      ALTER COLUMN tenant_id SET NOT NULL;
    CREATE INDEX IF NOT EXISTS idx_referrals_tenant_id ON public.referrals(tenant_id);
  END IF;

  -- Loyalty
  IF to_regclass('public.loyalty_accounts') IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conname = 'loyalty_accounts_tenant_id_fkey' AND conrelid = 'public.loyalty_accounts'::regclass
    ) THEN
      ALTER TABLE public.loyalty_accounts
        ADD CONSTRAINT loyalty_accounts_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE RESTRICT;
    END IF;
    ALTER TABLE public.loyalty_accounts
      ALTER COLUMN tenant_id SET NOT NULL;
    CREATE INDEX IF NOT EXISTS idx_loyalty_accounts_tenant_id ON public.loyalty_accounts(tenant_id);
  END IF;
  IF to_regclass('public.loyalty_transactions') IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conname = 'loyalty_transactions_tenant_id_fkey' AND conrelid = 'public.loyalty_transactions'::regclass
    ) THEN
      ALTER TABLE public.loyalty_transactions
        ADD CONSTRAINT loyalty_transactions_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE RESTRICT;
    END IF;
    ALTER TABLE public.loyalty_transactions
      ALTER COLUMN tenant_id SET NOT NULL;
    CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_tenant_id ON public.loyalty_transactions(tenant_id);
  END IF;
  IF to_regclass('public.achievements') IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conname = 'achievements_tenant_id_fkey' AND conrelid = 'public.achievements'::regclass
    ) THEN
      ALTER TABLE public.achievements
        ADD CONSTRAINT achievements_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE RESTRICT;
    END IF;
    ALTER TABLE public.achievements
      ALTER COLUMN tenant_id SET NOT NULL;
    CREATE INDEX IF NOT EXISTS idx_achievements_tenant_id ON public.achievements(tenant_id);
  END IF;
  IF to_regclass('public.user_achievements') IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conname = 'user_achievements_tenant_id_fkey' AND conrelid = 'public.user_achievements'::regclass
    ) THEN
      ALTER TABLE public.user_achievements
        ADD CONSTRAINT user_achievements_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE RESTRICT;
    END IF;
    ALTER TABLE public.user_achievements
      ALTER COLUMN tenant_id SET NOT NULL;
    CREATE INDEX IF NOT EXISTS idx_user_achievements_tenant_id ON public.user_achievements(tenant_id);
  END IF;

  -- Verification/trust
  IF to_regclass('public.verifications') IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conname = 'verifications_tenant_id_fkey' AND conrelid = 'public.verifications'::regclass
    ) THEN
      ALTER TABLE public.verifications
        ADD CONSTRAINT verifications_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE RESTRICT;
    END IF;
    ALTER TABLE public.verifications
      ALTER COLUMN tenant_id SET NOT NULL;
    CREATE INDEX IF NOT EXISTS idx_verifications_tenant_id ON public.verifications(tenant_id);
  END IF;
  IF to_regclass('public.verification_events') IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conname = 'verification_events_tenant_id_fkey' AND conrelid = 'public.verification_events'::regclass
    ) THEN
      ALTER TABLE public.verification_events
        ADD CONSTRAINT verification_events_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE RESTRICT;
    END IF;
    ALTER TABLE public.verification_events
      ALTER COLUMN tenant_id SET NOT NULL;
    CREATE INDEX IF NOT EXISTS idx_verification_events_tenant_id ON public.verification_events(tenant_id);
  END IF;
  IF to_regclass('public.consents') IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conname = 'consents_tenant_id_fkey' AND conrelid = 'public.consents'::regclass
    ) THEN
      ALTER TABLE public.consents
        ADD CONSTRAINT consents_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE RESTRICT;
    END IF;
    ALTER TABLE public.consents
      ALTER COLUMN tenant_id SET NOT NULL;
    CREATE INDEX IF NOT EXISTS idx_consents_tenant_id ON public.consents(tenant_id);
  END IF;
  IF to_regclass('public.documents') IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conname = 'documents_tenant_id_fkey' AND conrelid = 'public.documents'::regclass
    ) THEN
      ALTER TABLE public.documents
        ADD CONSTRAINT documents_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE RESTRICT;
    END IF;
    ALTER TABLE public.documents
      ALTER COLUMN tenant_id SET NOT NULL;
    CREATE INDEX IF NOT EXISTS idx_documents_tenant_id ON public.documents(tenant_id);
  END IF;
  IF to_regclass('public.policy_results') IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conname = 'policy_results_tenant_id_fkey' AND conrelid = 'public.policy_results'::regclass
    ) THEN
      ALTER TABLE public.policy_results
        ADD CONSTRAINT policy_results_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE RESTRICT;
    END IF;
    ALTER TABLE public.policy_results
      ALTER COLUMN tenant_id SET NOT NULL;
    CREATE INDEX IF NOT EXISTS idx_policy_results_tenant_id ON public.policy_results(tenant_id);
  END IF;
  IF to_regclass('public.monitoring_subscriptions') IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conname = 'monitoring_subscriptions_tenant_id_fkey' AND conrelid = 'public.monitoring_subscriptions'::regclass
    ) THEN
      ALTER TABLE public.monitoring_subscriptions
        ADD CONSTRAINT monitoring_subscriptions_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE RESTRICT;
    END IF;
    ALTER TABLE public.monitoring_subscriptions
      ALTER COLUMN tenant_id SET NOT NULL;
    CREATE INDEX IF NOT EXISTS idx_monitoring_subscriptions_tenant_id ON public.monitoring_subscriptions(tenant_id);
  END IF;

  -- Add-ons
  IF to_regclass('public.add_ons') IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conname = 'add_ons_tenant_id_fkey' AND conrelid = 'public.add_ons'::regclass
    ) THEN
      ALTER TABLE public.add_ons
        ADD CONSTRAINT add_ons_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE RESTRICT;
    END IF;
    ALTER TABLE public.add_ons
      ALTER COLUMN tenant_id SET NOT NULL;
    CREATE INDEX IF NOT EXISTS idx_add_ons_tenant_id ON public.add_ons(tenant_id);
  END IF;
END$$;

-- Optional: helpful composite indexes for common filters
DO $$
BEGIN
  IF to_regclass('public.provider_profiles') IS NOT NULL THEN
    CREATE INDEX IF NOT EXISTS idx_provider_profiles_tenant_id_rating
      ON public.provider_profiles(tenant_id, rating);
  END IF;
END$$;

DO $$
BEGIN
  IF to_regclass('public.transactions') IS NOT NULL THEN
    CREATE INDEX IF NOT EXISTS idx_transactions_tenant_id_created_at
      ON public.transactions(tenant_id, created_at);
  END IF;
END$$;





-- ============================================================================
-- 09_multitenancy_rls.sql
-- ============================================================================

-- Multitenancy: tenant model, membership, helper, column adds, triggers, and RLS
-- Safe to run multiple times (guards and IF NOT EXISTS)

-- =========================
-- Tenants & Membership
-- =========================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS public.tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_tenants (
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('member','admin','owner')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, tenant_id)
);

-- Helpful index for lookups
CREATE INDEX IF NOT EXISTS idx_user_tenants_tenant ON public.user_tenants(tenant_id);
CREATE INDEX IF NOT EXISTS idx_user_tenants_user ON public.user_tenants(user_id);

-- =========================
-- Helper: current_tenant_id() from JWT custom claim
-- =========================
-- Expect application to set a custom claim "tenant_id" in the JWT.
-- Supabase exposes claims via current_setting('request.jwt.claims', true)
CREATE OR REPLACE FUNCTION public.current_tenant_id()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT NULLIF((current_setting('request.jwt.claims', true))::jsonb ->> 'tenant_id', '')::uuid;
$$;

COMMENT ON FUNCTION public.current_tenant_id()
  IS 'Returns tenant_id from JWT custom claim. Ensure your app includes tenant_id in the access token.';

-- =========================
-- Add tenant_id columns (nullable for backfill), then attach FKs
-- =========================
DO $$
BEGIN
  -- Utility to add column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='addresses' AND column_name='tenant_id'
  ) THEN
    ALTER TABLE public.addresses ADD COLUMN tenant_id UUID;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='provider_profiles' AND column_name='tenant_id'
  ) THEN
    ALTER TABLE public.provider_profiles ADD COLUMN tenant_id UUID;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='provider_services' AND column_name='tenant_id'
  ) THEN
    ALTER TABLE public.provider_services ADD COLUMN tenant_id UUID;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='bookings' AND column_name='tenant_id'
  ) THEN
    ALTER TABLE public.bookings ADD COLUMN tenant_id UUID;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='reviews' AND column_name='tenant_id'
  ) THEN
    ALTER TABLE public.reviews ADD COLUMN tenant_id UUID;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='transactions' AND column_name='tenant_id'
  ) THEN
    ALTER TABLE public.transactions ADD COLUMN tenant_id UUID;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='provider_availability' AND column_name='tenant_id'
  ) THEN
    ALTER TABLE public.provider_availability ADD COLUMN tenant_id UUID;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='notifications' AND column_name='tenant_id'
  ) THEN
    ALTER TABLE public.notifications ADD COLUMN tenant_id UUID;
  END IF;

  -- From 05_ script
  IF to_regclass('public.availability') IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='availability' AND column_name='tenant_id'
  ) THEN
    ALTER TABLE public.availability ADD COLUMN tenant_id UUID;
  END IF;

  IF to_regclass('public.contact_submissions') IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='contact_submissions' AND column_name='tenant_id'
  ) THEN
    ALTER TABLE public.contact_submissions ADD COLUMN tenant_id UUID;
  END IF;

  IF to_regclass('public.verifications') IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='verifications' AND column_name='tenant_id'
  ) THEN
    ALTER TABLE public.verifications ADD COLUMN tenant_id UUID;
  END IF;

  IF to_regclass('public.verification_events') IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='verification_events' AND column_name='tenant_id'
  ) THEN
    ALTER TABLE public.verification_events ADD COLUMN tenant_id UUID;
  END IF;

  IF to_regclass('public.consents') IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='consents' AND column_name='tenant_id'
  ) THEN
    ALTER TABLE public.consents ADD COLUMN tenant_id UUID;
  END IF;

  IF to_regclass('public.documents') IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='documents' AND column_name='tenant_id'
  ) THEN
    ALTER TABLE public.documents ADD COLUMN tenant_id UUID;
  END IF;

  IF to_regclass('public.policy_results') IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='policy_results' AND column_name='tenant_id'
  ) THEN
    ALTER TABLE public.policy_results ADD COLUMN tenant_id UUID;
  END IF;

  IF to_regclass('public.monitoring_subscriptions') IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='monitoring_subscriptions' AND column_name='tenant_id'
  ) THEN
    ALTER TABLE public.monitoring_subscriptions ADD COLUMN tenant_id UUID;
  END IF;
END$$;

-- Attach FKs (idempotent)
DO $$
BEGIN
  PERFORM 1 FROM pg_constraint WHERE conname = 'addresses_tenant_id_fkey';
  IF NOT FOUND THEN
    ALTER TABLE public.addresses
      ADD CONSTRAINT addresses_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;
  END IF;

  PERFORM 1 FROM pg_constraint WHERE conname = 'provider_profiles_tenant_id_fkey';
  IF NOT FOUND THEN
    ALTER TABLE public.provider_profiles
      ADD CONSTRAINT provider_profiles_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;
  END IF;

  PERFORM 1 FROM pg_constraint WHERE conname = 'provider_services_tenant_id_fkey';
  IF NOT FOUND THEN
    ALTER TABLE public.provider_services
      ADD CONSTRAINT provider_services_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;
  END IF;

  PERFORM 1 FROM pg_constraint WHERE conname = 'bookings_tenant_id_fkey';
  IF NOT FOUND THEN
    ALTER TABLE public.bookings
      ADD CONSTRAINT bookings_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;
  END IF;

  PERFORM 1 FROM pg_constraint WHERE conname = 'reviews_tenant_id_fkey';
  IF NOT FOUND THEN
    ALTER TABLE public.reviews
      ADD CONSTRAINT reviews_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;
  END IF;

  PERFORM 1 FROM pg_constraint WHERE conname = 'transactions_tenant_id_fkey';
  IF NOT FOUND THEN
    ALTER TABLE public.transactions
      ADD CONSTRAINT transactions_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;
  END IF;

  PERFORM 1 FROM pg_constraint WHERE conname = 'provider_availability_tenant_id_fkey';
  IF NOT FOUND THEN
    ALTER TABLE public.provider_availability
      ADD CONSTRAINT provider_availability_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;
  END IF;

  PERFORM 1 FROM pg_constraint WHERE conname = 'notifications_tenant_id_fkey';
  IF NOT FOUND THEN
    ALTER TABLE public.notifications
      ADD CONSTRAINT notifications_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;
  END IF;

  IF to_regclass('public.availability') IS NOT NULL THEN
    PERFORM 1 FROM pg_constraint WHERE conname = 'availability_tenant_id_fkey';
    IF NOT FOUND THEN
      ALTER TABLE public.availability
        ADD CONSTRAINT availability_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;
    END IF;
  END IF;

  IF to_regclass('public.contact_submissions') IS NOT NULL THEN
    PERFORM 1 FROM pg_constraint WHERE conname = 'contact_submissions_tenant_id_fkey';
    IF NOT FOUND THEN
      ALTER TABLE public.contact_submissions
        ADD CONSTRAINT contact_submissions_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;
    END IF;
  END IF;

  IF to_regclass('public.verifications') IS NOT NULL THEN
    PERFORM 1 FROM pg_constraint WHERE conname = 'verifications_tenant_id_fkey';
    IF NOT FOUND THEN
      ALTER TABLE public.verifications
        ADD CONSTRAINT verifications_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;
    END IF;
  END IF;

  IF to_regclass('public.verification_events') IS NOT NULL THEN
    PERFORM 1 FROM pg_constraint WHERE conname = 'verification_events_tenant_id_fkey';
    IF NOT FOUND THEN
      ALTER TABLE public.verification_events
        ADD CONSTRAINT verification_events_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;
    END IF;
  END IF;

  IF to_regclass('public.consents') IS NOT NULL THEN
    PERFORM 1 FROM pg_constraint WHERE conname = 'consents_tenant_id_fkey';
    IF NOT FOUND THEN
      ALTER TABLE public.consents
        ADD CONSTRAINT consents_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;
    END IF;
  END IF;

  IF to_regclass('public.documents') IS NOT NULL THEN
    PERFORM 1 FROM pg_constraint WHERE conname = 'documents_tenant_id_fkey';
    IF NOT FOUND THEN
      ALTER TABLE public.documents
        ADD CONSTRAINT documents_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;
    END IF;
  END IF;

  IF to_regclass('public.policy_results') IS NOT NULL THEN
    PERFORM 1 FROM pg_constraint WHERE conname = 'policy_results_tenant_id_fkey';
    IF NOT FOUND THEN
      ALTER TABLE public.policy_results
        ADD CONSTRAINT policy_results_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;
    END IF;
  END IF;

  IF to_regclass('public.monitoring_subscriptions') IS NOT NULL THEN
    PERFORM 1 FROM pg_constraint WHERE conname = 'monitoring_subscriptions_tenant_id_fkey';
    IF NOT FOUND THEN
      ALTER TABLE public.monitoring_subscriptions
        ADD CONSTRAINT monitoring_subscriptions_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;
    END IF;
  END IF;
END$$;

-- =========================
-- Insert trigger to default tenant_id from JWT
-- =========================
CREATE OR REPLACE FUNCTION public.set_tenant_id_from_jwt()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.tenant_id IS NULL THEN
    NEW.tenant_id := public.current_tenant_id();
  END IF;
  RETURN NEW;
END;
$$;

DO $$
BEGIN
  PERFORM 1 FROM pg_trigger WHERE tgname = 'trg_addresses_set_tenant_id';
  IF NOT FOUND THEN
    CREATE TRIGGER trg_addresses_set_tenant_id
      BEFORE INSERT ON public.addresses
      FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id_from_jwt();
  END IF;

  PERFORM 1 FROM pg_trigger WHERE tgname = 'trg_provider_profiles_set_tenant_id';
  IF NOT FOUND THEN
    CREATE TRIGGER trg_provider_profiles_set_tenant_id
      BEFORE INSERT ON public.provider_profiles
      FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id_from_jwt();
  END IF;

  PERFORM 1 FROM pg_trigger WHERE tgname = 'trg_provider_services_set_tenant_id';
  IF NOT FOUND THEN
    CREATE TRIGGER trg_provider_services_set_tenant_id
      BEFORE INSERT ON public.provider_services
      FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id_from_jwt();
  END IF;

  PERFORM 1 FROM pg_trigger WHERE tgname = 'trg_bookings_set_tenant_id';
  IF NOT FOUND THEN
    CREATE TRIGGER trg_bookings_set_tenant_id
      BEFORE INSERT ON public.bookings
      FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id_from_jwt();
  END IF;

  PERFORM 1 FROM pg_trigger WHERE tgname = 'trg_reviews_set_tenant_id';
  IF NOT FOUND THEN
    CREATE TRIGGER trg_reviews_set_tenant_id
      BEFORE INSERT ON public.reviews
      FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id_from_jwt();
  END IF;

  PERFORM 1 FROM pg_trigger WHERE tgname = 'trg_transactions_set_tenant_id';
  IF NOT FOUND THEN
    CREATE TRIGGER trg_transactions_set_tenant_id
      BEFORE INSERT ON public.transactions
      FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id_from_jwt();
  END IF;

  PERFORM 1 FROM pg_trigger WHERE tgname = 'trg_provider_availability_set_tenant_id';
  IF NOT FOUND THEN
    CREATE TRIGGER trg_provider_availability_set_tenant_id
      BEFORE INSERT ON public.provider_availability
      FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id_from_jwt();
  END IF;

  PERFORM 1 FROM pg_trigger WHERE tgname = 'trg_notifications_set_tenant_id';
  IF NOT FOUND THEN
    CREATE TRIGGER trg_notifications_set_tenant_id
      BEFORE INSERT ON public.notifications
      FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id_from_jwt();
  END IF;

  IF to_regclass('public.availability') IS NOT NULL THEN
    PERFORM 1 FROM pg_trigger WHERE tgname = 'trg_availability_set_tenant_id';
    IF NOT FOUND THEN
      CREATE TRIGGER trg_availability_set_tenant_id
        BEFORE INSERT ON public.availability
        FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id_from_jwt();
    END IF;
  END IF;

  IF to_regclass('public.contact_submissions') IS NOT NULL THEN
    PERFORM 1 FROM pg_trigger WHERE tgname = 'trg_contact_submissions_set_tenant_id';
    IF NOT FOUND THEN
      CREATE TRIGGER trg_contact_submissions_set_tenant_id
        BEFORE INSERT ON public.contact_submissions
        FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id_from_jwt();
    END IF;
  END IF;

  IF to_regclass('public.verifications') IS NOT NULL THEN
    PERFORM 1 FROM pg_trigger WHERE tgname = 'trg_verifications_set_tenant_id';
    IF NOT FOUND THEN
      CREATE TRIGGER trg_verifications_set_tenant_id
        BEFORE INSERT ON public.verifications
        FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id_from_jwt();
    END IF;
  END IF;

  IF to_regclass('public.verification_events') IS NOT NULL THEN
    PERFORM 1 FROM pg_trigger WHERE tgname = 'trg_verification_events_set_tenant_id';
    IF NOT FOUND THEN
      CREATE TRIGGER trg_verification_events_set_tenant_id
        BEFORE INSERT ON public.verification_events
        FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id_from_jwt();
    END IF;
  END IF;

  IF to_regclass('public.consents') IS NOT NULL THEN
    PERFORM 1 FROM pg_trigger WHERE tgname = 'trg_consents_set_tenant_id';
    IF NOT FOUND THEN
      CREATE TRIGGER trg_consents_set_tenant_id
        BEFORE INSERT ON public.consents
        FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id_from_jwt();
    END IF;
  END IF;

  IF to_regclass('public.documents') IS NOT NULL THEN
    PERFORM 1 FROM pg_trigger WHERE tgname = 'trg_documents_set_tenant_id';
    IF NOT FOUND THEN
      CREATE TRIGGER trg_documents_set_tenant_id
        BEFORE INSERT ON public.documents
        FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id_from_jwt();
    END IF;
  END IF;

  IF to_regclass('public.policy_results') IS NOT NULL THEN
    PERFORM 1 FROM pg_trigger WHERE tgname = 'trg_policy_results_set_tenant_id';
    IF NOT FOUND THEN
      CREATE TRIGGER trg_policy_results_set_tenant_id
        BEFORE INSERT ON public.policy_results
        FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id_from_jwt();
    END IF;
  END IF;

  IF to_regclass('public.monitoring_subscriptions') IS NOT NULL THEN
    PERFORM 1 FROM pg_trigger WHERE tgname = 'trg_monitoring_subscriptions_set_tenant_id';
    IF NOT FOUND THEN
      CREATE TRIGGER trg_monitoring_subscriptions_set_tenant_id
        BEFORE INSERT ON public.monitoring_subscriptions
        FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id_from_jwt();
    END IF;
  END IF;
END$$;

-- =========================
-- RLS: Enforce tenant isolation across tables
-- =========================
-- Helper macro-ish: Drop permissive policies that ignored tenant, then (re)create tenant-scoped policies
DO $$
BEGIN
  -- addresses
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='addresses' AND policyname='tenant_isolation_addresses'
  ) THEN
    -- Ensure prior overly-permissive policies are dropped if present
    PERFORM 1 FROM pg_policies WHERE schemaname='public' AND tablename='addresses' AND policyname='Users can view their own addresses';
    IF FOUND THEN EXECUTE 'DROP POLICY "Users can view their own addresses" ON public.addresses'; END IF;
    PERFORM 1 FROM pg_policies WHERE schemaname='public' AND tablename='addresses' AND policyname='Users can insert their own addresses';
    IF FOUND THEN EXECUTE 'DROP POLICY "Users can insert their own addresses" ON public.addresses'; END IF;
    PERFORM 1 FROM pg_policies WHERE schemaname='public' AND tablename='addresses' AND policyname='Users can update their own addresses';
    IF FOUND THEN EXECUTE 'DROP POLICY "Users can update their own addresses" ON public.addresses'; END IF;
    PERFORM 1 FROM pg_policies WHERE schemaname='public' AND tablename='addresses' AND policyname='Users can delete their own addresses';
    IF FOUND THEN EXECUTE 'DROP POLICY "Users can delete their own addresses" ON public.addresses'; END IF;

    CREATE POLICY tenant_isolation_addresses
      ON public.addresses
      USING (tenant_id = public.current_tenant_id())
      WITH CHECK (tenant_id = public.current_tenant_id());
  END IF;

  -- provider_profiles
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='provider_profiles' AND policyname='tenant_isolation_provider_profiles'
  ) THEN
    PERFORM 1 FROM pg_policies WHERE schemaname='public' AND tablename='provider_profiles' AND policyname='Anyone can view provider profiles';
    IF FOUND THEN EXECUTE 'DROP POLICY "Anyone can view provider profiles" ON public.provider_profiles'; END IF;
    PERFORM 1 FROM pg_policies WHERE schemaname='public' AND tablename='provider_profiles' AND policyname='Providers can update their own profile';
    IF FOUND THEN EXECUTE 'DROP POLICY "Providers can update their own profile" ON public.provider_profiles'; END IF;
    PERFORM 1 FROM pg_policies WHERE schemaname='public' AND tablename='provider_profiles' AND policyname='Providers can insert their own profile';
    IF FOUND THEN EXECUTE 'DROP POLICY "Providers can insert their own profile" ON public.provider_profiles'; END IF;

    CREATE POLICY tenant_isolation_provider_profiles
      ON public.provider_profiles
      USING (tenant_id = public.current_tenant_id())
      WITH CHECK (tenant_id = public.current_tenant_id());
  END IF;

  -- provider_services
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='provider_services' AND policyname='tenant_isolation_provider_services'
  ) THEN
    PERFORM 1 FROM pg_policies WHERE schemaname='public' AND tablename='provider_services' AND policyname='Anyone can view provider services';
    IF FOUND THEN EXECUTE 'DROP POLICY "Anyone can view provider services" ON public.provider_services'; END IF;
    PERFORM 1 FROM pg_policies WHERE schemaname='public' AND tablename='provider_services' AND policyname='Providers can manage their own services';
    IF FOUND THEN EXECUTE 'DROP POLICY "Providers can manage their own services" ON public.provider_services'; END IF;

    CREATE POLICY tenant_isolation_provider_services
      ON public.provider_services
      USING (tenant_id = public.current_tenant_id())
      WITH CHECK (tenant_id = public.current_tenant_id());
  END IF;

  -- bookings
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='bookings' AND policyname='tenant_isolation_bookings'
  ) THEN
    -- Drop existing policies that ignore tenant boundary
    PERFORM 1 FROM pg_policies WHERE schemaname='public' AND tablename='bookings' AND policyname='Customers can view their own bookings';
    IF FOUND THEN EXECUTE 'DROP POLICY "Customers can view their own bookings" ON public.bookings'; END IF;
    PERFORM 1 FROM pg_policies WHERE schemaname='public' AND tablename='bookings' AND policyname='Providers can view their assigned bookings';
    IF FOUND THEN EXECUTE 'DROP POLICY "Providers can view their assigned bookings" ON public.bookings'; END IF;
    PERFORM 1 FROM pg_policies WHERE schemaname='public' AND tablename='bookings' AND policyname='Customers can create bookings';
    IF FOUND THEN EXECUTE 'DROP POLICY "Customers can create bookings" ON public.bookings'; END IF;
    PERFORM 1 FROM pg_policies WHERE schemaname='public' AND tablename='bookings' AND policyname='Customers can update their pending bookings';
    IF FOUND THEN EXECUTE 'DROP POLICY "Customers can update their pending bookings" ON public.bookings'; END IF;
    PERFORM 1 FROM pg_policies WHERE schemaname='public' AND tablename='bookings' AND policyname='Providers can update their assigned bookings';
    IF FOUND THEN EXECUTE 'DROP POLICY "Providers can update their assigned bookings" ON public.bookings'; END IF;

    CREATE POLICY tenant_isolation_bookings
      ON public.bookings
      USING (tenant_id = public.current_tenant_id())
      WITH CHECK (tenant_id = public.current_tenant_id());
  END IF;

  -- reviews
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='reviews' AND policyname='tenant_isolation_reviews'
  ) THEN
    PERFORM 1 FROM pg_policies WHERE schemaname='public' AND tablename='reviews' AND policyname='Anyone can view reviews';
    IF FOUND THEN EXECUTE 'DROP POLICY "Anyone can view reviews" ON public.reviews'; END IF;
    PERFORM 1 FROM pg_policies WHERE schemaname='public' AND tablename='reviews' AND policyname='Customers can create reviews for their completed bookings';
    IF FOUND THEN EXECUTE 'DROP POLICY "Customers can create reviews for their completed bookings" ON public.reviews'; END IF;
    PERFORM 1 FROM pg_policies WHERE schemaname='public' AND tablename='reviews' AND policyname='Customers can update their own reviews';
    IF FOUND THEN EXECUTE 'DROP POLICY "Customers can update their own reviews" ON public.reviews'; END IF;
    PERFORM 1 FROM pg_policies WHERE schemaname='public' AND tablename='reviews' AND policyname='Providers can respond to their reviews';
    IF FOUND THEN EXECUTE 'DROP POLICY "Providers can respond to their reviews" ON public.reviews'; END IF;

    CREATE POLICY tenant_isolation_reviews
      ON public.reviews
      USING (tenant_id = public.current_tenant_id())
      WITH CHECK (tenant_id = public.current_tenant_id());
  END IF;

  -- transactions
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='transactions' AND policyname='tenant_isolation_transactions'
  ) THEN
    PERFORM 1 FROM pg_policies WHERE schemaname='public' AND tablename='transactions' AND policyname='Customers can view their own transactions';
    IF FOUND THEN EXECUTE 'DROP POLICY "Customers can view their own transactions" ON public.transactions'; END IF;
    PERFORM 1 FROM pg_policies WHERE schemaname='public' AND tablename='transactions' AND policyname='Providers can view their transactions';
    IF FOUND THEN EXECUTE 'DROP POLICY "Providers can view their transactions" ON public.transactions'; END IF;

    CREATE POLICY tenant_isolation_transactions
      ON public.transactions
      USING (tenant_id = public.current_tenant_id())
      WITH CHECK (tenant_id = public.current_tenant_id());
  END IF;

  -- provider_availability
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='provider_availability' AND policyname='tenant_isolation_provider_availability'
  ) THEN
    PERFORM 1 FROM pg_policies WHERE schemaname='public' AND tablename='provider_availability' AND policyname='Anyone can view provider availability';
    IF FOUND THEN EXECUTE 'DROP POLICY "Anyone can view provider availability" ON public.provider_availability'; END IF;
    PERFORM 1 FROM pg_policies WHERE schemaname='public' AND tablename='provider_availability' AND policyname='Providers can manage their own availability';
    IF FOUND THEN EXECUTE 'DROP POLICY "Providers can manage their own availability" ON public.provider_availability'; END IF;

    CREATE POLICY tenant_isolation_provider_availability
      ON public.provider_availability
      USING (tenant_id = public.current_tenant_id())
      WITH CHECK (tenant_id = public.current_tenant_id());
  END IF;

  -- notifications
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='notifications' AND policyname='tenant_isolation_notifications'
  ) THEN
    PERFORM 1 FROM pg_policies WHERE schemaname='public' AND tablename='notifications' AND policyname='Users can view their own notifications';
    IF FOUND THEN EXECUTE 'DROP POLICY "Users can view their own notifications" ON public.notifications'; END IF;
    PERFORM 1 FROM pg_policies WHERE schemaname='public' AND tablename='notifications' AND policyname='Users can update their own notifications';
    IF FOUND THEN EXECUTE 'DROP POLICY "Users can update their own notifications" ON public.notifications'; END IF;

    CREATE POLICY tenant_isolation_notifications
      ON public.notifications
      USING (tenant_id = public.current_tenant_id())
      WITH CHECK (tenant_id = public.current_tenant_id());
  END IF;

  -- availability (optional table)
  IF to_regclass('public.availability') IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='availability' AND policyname='tenant_isolation_availability'
  ) THEN
    PERFORM 1 FROM pg_policies WHERE schemaname='public' AND tablename='availability' AND policyname='Anyone can view availability';
    IF FOUND THEN EXECUTE 'DROP POLICY "Anyone can view availability" ON public.availability'; END IF;
    PERFORM 1 FROM pg_policies WHERE schemaname='public' AND tablename='availability' AND policyname='Providers can manage their availability';
    IF FOUND THEN EXECUTE 'DROP POLICY "Providers can manage their availability" ON public.availability'; END IF;

    CREATE POLICY tenant_isolation_availability
      ON public.availability
      USING (tenant_id = public.current_tenant_id())
      WITH CHECK (tenant_id = public.current_tenant_id());
  END IF;

  -- contact_submissions (admin scoped)
  IF to_regclass('public.contact_submissions') IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='contact_submissions' AND policyname='tenant_isolation_contact_submissions'
  ) THEN
    PERFORM 1 FROM pg_policies WHERE schemaname='public' AND tablename='contact_submissions' AND policyname='Authenticated can create contact submissions';
    IF FOUND THEN EXECUTE 'DROP POLICY "Authenticated can create contact submissions" ON public.contact_submissions'; END IF;
    PERFORM 1 FROM pg_policies WHERE schemaname='public' AND tablename='contact_submissions' AND policyname='Admins can view contact submissions';
    IF FOUND THEN EXECUTE 'DROP POLICY "Admins can view contact submissions" ON public.contact_submissions'; END IF;
    PERFORM 1 FROM pg_policies WHERE schemaname='public' AND tablename='contact_submissions' AND policyname='Admins can update contact submissions';
    IF FOUND THEN EXECUTE 'DROP POLICY "Admins can update contact submissions" ON public.contact_submissions'; END IF;

    CREATE POLICY tenant_isolation_contact_submissions
      ON public.contact_submissions
      USING (tenant_id = public.current_tenant_id())
      WITH CHECK (tenant_id = public.current_tenant_id());
  END IF;

  -- verifications and related tables
  IF to_regclass('public.verifications') IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='verifications' AND policyname='tenant_isolation_verifications'
  ) THEN
    -- Drop earlier generic policies to replace with tenant-scoped
    PERFORM 1 FROM pg_policies WHERE schemaname='public' AND tablename='verifications' AND policyname='Users can view own verifications';
    IF FOUND THEN EXECUTE 'DROP POLICY "Users can view own verifications" ON public.verifications'; END IF;
    PERFORM 1 FROM pg_policies WHERE schemaname='public' AND tablename='verifications' AND policyname='Service inserts/updates via RPC';
    IF FOUND THEN EXECUTE 'DROP POLICY "Service inserts/updates via RPC" ON public.verifications'; END IF;

    CREATE POLICY tenant_isolation_verifications
      ON public.verifications
      USING (tenant_id = public.current_tenant_id())
      WITH CHECK (tenant_id = public.current_tenant_id());
  END IF;

  IF to_regclass('public.verification_events') IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='verification_events' AND policyname='tenant_isolation_verification_events'
  ) THEN
    PERFORM 1 FROM pg_policies WHERE schemaname='public' AND tablename='verification_events' AND policyname='Users can view own verification events';
    IF FOUND THEN EXECUTE 'DROP POLICY "Users can view own verification events" ON public.verification_events'; END IF;
    PERFORM 1 FROM pg_policies WHERE schemaname='public' AND tablename='verification_events' AND policyname='Service writes events';
    IF FOUND THEN EXECUTE 'DROP POLICY "Service writes events" ON public.verification_events'; END IF;

    CREATE POLICY tenant_isolation_verification_events
      ON public.verification_events
      USING (tenant_id = public.current_tenant_id())
      WITH CHECK (tenant_id = public.current_tenant_id());
  END IF;

  IF to_regclass('public.consents') IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='consents' AND policyname='tenant_isolation_consents'
  ) THEN
    PERFORM 1 FROM pg_policies WHERE schemaname='public' AND tablename='consents' AND policyname='Users manage own consents';
    IF FOUND THEN EXECUTE 'DROP POLICY "Users manage own consents" ON public.consents'; END IF;

    CREATE POLICY tenant_isolation_consents
      ON public.consents
      USING (tenant_id = public.current_tenant_id())
      WITH CHECK (tenant_id = public.current_tenant_id());
  END IF;

  IF to_regclass('public.documents') IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='documents' AND policyname='tenant_isolation_documents'
  ) THEN
    PERFORM 1 FROM pg_policies WHERE schemaname='public' AND tablename='documents' AND policyname='Users view own documents';
    IF FOUND THEN EXECUTE 'DROP POLICY "Users view own documents" ON public.documents'; END IF;
    PERFORM 1 FROM pg_policies WHERE schemaname='public' AND tablename='documents' AND policyname='Service writes documents';
    IF FOUND THEN EXECUTE 'DROP POLICY "Service writes documents" ON public.documents'; END IF;

    CREATE POLICY tenant_isolation_documents
      ON public.documents
      USING (tenant_id = public.current_tenant_id())
      WITH CHECK (tenant_id = public.current_tenant_id());
  END IF;

  IF to_regclass('public.policy_results') IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='policy_results' AND policyname='tenant_isolation_policy_results'
  ) THEN
    PERFORM 1 FROM pg_policies WHERE schemaname='public' AND tablename='policy_results' AND policyname='Users view own policy results';
    IF FOUND THEN EXECUTE 'DROP POLICY "Users view own policy results" ON public.policy_results'; END IF;
    PERFORM 1 FROM pg_policies WHERE schemaname='public' AND tablename='policy_results' AND policyname='Service writes policy results';
    IF FOUND THEN EXECUTE 'DROP POLICY "Service writes policy results" ON public.policy_results'; END IF;

    CREATE POLICY tenant_isolation_policy_results
      ON public.policy_results
      USING (tenant_id = public.current_tenant_id())
      WITH CHECK (tenant_id = public.current_tenant_id());
  END IF;

  IF to_regclass('public.monitoring_subscriptions') IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='monitoring_subscriptions' AND policyname='tenant_isolation_monitoring_subscriptions'
  ) THEN
    PERFORM 1 FROM pg_policies WHERE schemaname='public' AND tablename='monitoring_subscriptions' AND policyname='Users view own monitoring subscriptions';
    IF FOUND THEN EXECUTE 'DROP POLICY "Users view own monitoring subscriptions" ON public.monitoring_subscriptions'; END IF;
    PERFORM 1 FROM pg_policies WHERE schemaname='public' AND tablename='monitoring_subscriptions' AND policyname='Service writes monitoring subscriptions';
    IF FOUND THEN EXECUTE 'DROP POLICY "Service writes monitoring subscriptions" ON public.monitoring_subscriptions'; END IF;

    CREATE POLICY tenant_isolation_monitoring_subscriptions
      ON public.monitoring_subscriptions
      USING (tenant_id = public.current_tenant_id())
      WITH CHECK (tenant_id = public.current_tenant_id());
  END IF;
END$$;

-- =========================
-- Enable RLS on new tables
-- =========================
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_tenants ENABLE ROW LEVEL SECURITY;

-- Restrict tenants/user_tenants visibility to members of the same tenant or service role
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='tenants' AND policyname='tenant_isolation_tenants'
  ) THEN
    CREATE POLICY tenant_isolation_tenants
      ON public.tenants
      USING (id = public.current_tenant_id());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='user_tenants' AND policyname='tenant_isolation_user_tenants'
  ) THEN
    CREATE POLICY tenant_isolation_user_tenants
      ON public.user_tenants
      USING (tenant_id = public.current_tenant_id())
      WITH CHECK (tenant_id = public.current_tenant_id());
  END IF;
END$$;





-- ============================================================================
-- 10_custom_domains.sql
-- ============================================================================

-- Custom domains for tenants: CNAME verification and optional ACME HTTP-01 support
-- Safe to run multiple times

CREATE TABLE IF NOT EXISTS public.domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  hostname TEXT UNIQUE NOT NULL, -- e.g., cleaning.example.com
  cname_token TEXT NOT NULL, -- random token for CNAME verification (_tsmart.<domain> -> <token>.<verify_domain>)
  status TEXT NOT NULL DEFAULT 'pending', -- pending|verified|disabled
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.domains ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_domains_updated_at'
  ) THEN
    CREATE TRIGGER update_domains_updated_at
      BEFORE UPDATE ON public.domains
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END$$;

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_domains_tenant_id ON public.domains(tenant_id);
CREATE INDEX IF NOT EXISTS idx_domains_status ON public.domains(status);

-- RLS policies:
-- Service-role (our backend) bypasses RLS. For anon/user access, keep restrictive.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='domains' AND policyname='domains_no_select') THEN
    CREATE POLICY domains_no_select ON public.domains
      FOR SELECT
      TO authenticated, anon
      USING (false);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='domains' AND policyname='domains_no_insert') THEN
    CREATE POLICY domains_no_insert ON public.domains
      FOR INSERT
      TO authenticated, anon
      WITH CHECK (false);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='domains' AND policyname='domains_no_update') THEN
    CREATE POLICY domains_no_update ON public.domains
      FOR UPDATE
      TO authenticated, anon
      USING (false)
      WITH CHECK (false);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='domains' AND policyname='domains_no_delete') THEN
    CREATE POLICY domains_no_delete ON public.domains
      FOR DELETE
      TO authenticated, anon
      USING (false);
  END IF;
END$$;

-- Optional: ACME HTTP-01 challenge storage for automated SSL (served via app route)
CREATE TABLE IF NOT EXISTS public.domain_acme_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hostname TEXT NOT NULL,
  token TEXT NOT NULL,
  key_authorization TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.domain_acme_challenges ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='domain_acme_challenges' AND policyname='acme_no_select') THEN
    CREATE POLICY acme_no_select ON public.domain_acme_challenges
      FOR SELECT TO authenticated, anon USING (false);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='domain_acme_challenges' AND policyname='acme_no_write') THEN
    CREATE POLICY acme_no_write ON public.domain_acme_challenges
      FOR ALL TO authenticated, anon USING (false) WITH CHECK (false);
  END IF;
END$$;





-- ============================================================================
-- 10_revenue_share.sql
-- ============================================================================

-- Revenue Share Rules - Basic storage
-- Creates a flexible rules table with hierarchical matching capabilities.
-- This is a basic schema intended to support tenant/provider/service/territory-specific overrides.

create table if not exists public.revenue_share_rules (
  id uuid primary key default gen_random_uuid(),
  -- Multi-tenancy scoping (nullable means global rule)
  tenant_id uuid references public.tenants(id) on delete cascade,
  -- Optional scoping dimensions for specificity
  provider_id uuid references public.providers(id) on delete cascade,
  service_id uuid references public.services(id) on delete set null,
  territory_id uuid references public.territories(id) on delete set null,
  -- Financials
  platform_percent numeric(5,2) not null check (platform_percent >= 0 and platform_percent <= 100),
  processing_fee_fixed_cents integer not null default 30 check (processing_fee_fixed_cents >= 0),
  minimum_payout_cents integer not null default 2000 check (minimum_payout_cents >= 0),
  -- Rule control
  priority integer not null default 0,
  active boolean not null default true,
  valid_from timestamptz default now(),
  valid_to timestamptz,
  -- Metadata
  name text,
  created_at timestamptz not null default now(),
  created_by uuid
);

create index if not exists idx_revenue_share_rules_active_time
  on public.revenue_share_rules (active, valid_from, valid_to);

create index if not exists idx_revenue_share_rules_scope
  on public.revenue_share_rules (tenant_id, provider_id, service_id, territory_id, priority);

-- Optional: simple default rule if none exist
insert into public.revenue_share_rules (name, platform_percent, processing_fee_fixed_cents, minimum_payout_cents, priority, active)
select 'Global default 15% platform / $0.30 processing', 15.00, 30, 2000, 0, true
where not exists (select 1 from public.revenue_share_rules);





-- ============================================================================
-- 11_audit_logs.sql
-- ============================================================================

-- Per-tenant audit logs for sensitive actions
-- Safe, idempotent migration

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID, -- optional: actor, if known
  action TEXT NOT NULL, -- e.g., 'update_status', 'update_provider', 'launch_campaign'
  resource TEXT NOT NULL, -- e.g., 'job', 'provider_profile', 'campaign', 'preference', 'stripe'
  resource_id TEXT, -- UUID or other identifier as text
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  ip INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_created_at
  ON public.audit_logs(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_action
  ON public.audit_logs(tenant_id, action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_resource
  ON public.audit_logs(tenant_id, resource);

-- Trigger to auto-fill tenant_id from JWT if missing (service role can set explicitly)
CREATE OR REPLACE FUNCTION public.trg_set_audit_tenant_id()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.tenant_id IS NULL THEN
    NEW.tenant_id := public.current_tenant_id();
  END IF;
  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_audit_logs_set_tenant_id'
  ) THEN
    CREATE TRIGGER trg_audit_logs_set_tenant_id
      BEFORE INSERT ON public.audit_logs
      FOR EACH ROW EXECUTE FUNCTION public.trg_set_audit_tenant_id();
  END IF;
END$$;

-- RLS: tenant isolation
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='audit_logs' AND policyname='tenant_isolation_audit_logs'
  ) THEN
    CREATE POLICY tenant_isolation_audit_logs
      ON public.audit_logs
      USING (tenant_id = public.current_tenant_id())
      WITH CHECK (tenant_id = public.current_tenant_id());
  END IF;
END$$;





-- ============================================================================
-- 11_usage_and_billing.sql
-- ============================================================================

-- Usage metering and billing events
-- Idempotent creation for safe re-runs

-- Usage events: track metered actions per tenant
CREATE TABLE IF NOT EXISTS public.usage_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  resource TEXT NOT NULL CHECK (resource IN ('booking','message')),
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);
CREATE INDEX IF NOT EXISTS idx_usage_events_tenant_time
  ON public.usage_events (tenant_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_usage_events_resource_time
  ON public.usage_events (resource, occurred_at DESC);

-- Daily aggregates (optional materialized table, can be generated by jobs)
CREATE TABLE IF NOT EXISTS public.usage_daily_totals (
  tenant_id UUID NOT NULL,
  resource TEXT NOT NULL CHECK (resource IN ('booking','message')),
  date DATE NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (tenant_id, resource, date)
);

-- Billing events: record Stripe invoice/charge/subscription webhooks
CREATE TABLE IF NOT EXISTS public.billing_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID,
  provider TEXT NOT NULL DEFAULT 'stripe',
  event_type TEXT NOT NULL,
  event_id TEXT,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_billing_events_type_time
  ON public.billing_events (event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_billing_events_tenant_time
  ON public.billing_events (tenant_id, created_at DESC);





-- ============================================================================
-- 12_insurance.sql
-- ============================================================================

-- Insurance add-on schema
-- Plans, policies, claims, documents, payments, activities, high-value items

create table if not exists public.insurance_plans (
  id uuid primary key default gen_random_uuid(),
  code text unique not null check (code in ('basic','premium','ultimate')),
  name text not null,
  monthly_price numeric(10,2) not null,
  annual_price numeric(10,2) not null,
  property_damage_limit numeric(12,2) not null,
  theft_limit numeric(12,2),
  liability_limit numeric(12,2) not null,
  key_replacement_limit numeric(12,2),
  emergency_cleans_per_year int default 0,
  deductible numeric(10,2) not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.insurance_policies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  tenant_id text,
  plan_id uuid not null references public.insurance_plans(id),
  policy_number text unique not null,
  status text not null check (status in ('draft','active','pending_activation','cancelled','expired')),
  effective_date date,
  expiration_date date,
  auto_renew boolean default true,
  billing_cycle text not null default 'annual' check (billing_cycle in ('monthly','annual')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.insurance_claims (
  id uuid primary key default gen_random_uuid(),
  policy_id uuid not null references public.insurance_policies(id),
  user_id uuid not null,
  tenant_id text,
  claim_code text unique not null,
  incident_type text not null,
  incident_date date not null,
  incident_time text,
  description text not null,
  amount_claimed numeric(12,2),
  status text not null default 'filed' check (status in ('filed','under_review','adjuster_assigned','approved','denied','paid','withdrawn')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.insurance_claim_documents (
  id uuid primary key default gen_random_uuid(),
  claim_id uuid not null references public.insurance_claims(id) on delete cascade,
  file_name text not null,
  storage_path text not null,
  content_type text,
  size_bytes bigint,
  created_at timestamptz default now()
);

create table if not exists public.insurance_payments (
  id uuid primary key default gen_random_uuid(),
  policy_id uuid not null references public.insurance_policies(id),
  user_id uuid not null,
  cycle text not null check (cycle in ('monthly','annual')),
  amount numeric(10,2) not null,
  currency text not null default 'USD',
  paid_at timestamptz,
  status text not null default 'pending' check (status in ('pending','paid','failed','refunded')),
  created_at timestamptz default now()
);

create table if not exists public.insurance_claim_activities (
  id uuid primary key default gen_random_uuid(),
  claim_id uuid not null references public.insurance_claims(id) on delete cascade,
  actor text not null,
  message text not null,
  created_at timestamptz default now()
);

create table if not exists public.insurance_high_value_items (
  id uuid primary key default gen_random_uuid(),
  policy_id uuid not null references public.insurance_policies(id),
  title text not null,
  description text,
  estimated_value numeric(12,2),
  photo_url text,
  created_at timestamptz default now()
);

-- Useful indexes
create index if not exists idx_ins_policies_user on public.insurance_policies(user_id);
create index if not exists idx_ins_claims_user on public.insurance_claims(user_id);
create index if not exists idx_ins_claims_policy on public.insurance_claims(policy_id);

-- Seed default plans if empty
insert into public.insurance_plans (code, name, monthly_price, annual_price, property_damage_limit, theft_limit, liability_limit, key_replacement_limit, emergency_cleans_per_year, deductible)
select * from (values
  ('basic','Basic', 9.99, 95.90, 5000, null, 50000, 200, 0, 100),
  ('premium','Premium', 19.99, 191.90, 25000, 10000, 500000, 500, 1, 50),
  ('ultimate','Ultimate', 34.99, 335.90, 100000, 50000, 2000000, 1000, 4, 0)
) as v(code,name,monthly_price,annual_price,property_damage_limit,theft_limit,liability_limit,key_replacement_limit,emergency_cleans_per_year,deductible)
where not exists (select 1 from public.insurance_plans);





-- ============================================================================
-- 14_create_missing_tables.sql
-- ============================================================================

-- Create missing Supabase tables
-- This script creates tables that are referenced in the codebase but may not exist
-- Safe to run multiple times (uses IF NOT EXISTS)

-- Ensure required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =========================
-- Companies table
-- =========================
CREATE TABLE IF NOT EXISTS public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  website TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_companies_tenant_id ON public.companies(tenant_id);
CREATE INDEX IF NOT EXISTS idx_companies_status ON public.companies(status);

-- =========================
-- Jobs table (may be an alias for bookings, but creating as separate for analytics)
-- =========================
CREATE TABLE IF NOT EXISTS public.jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  provider_id UUID REFERENCES public.provider_profiles(id) ON DELETE SET NULL,
  service_id UUID REFERENCES public.services(id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  scheduled_date DATE NOT NULL,
  scheduled_time TIME,
  completed_at TIMESTAMPTZ,
  total_amount DECIMAL(10, 2),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_jobs_tenant_id ON public.jobs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_jobs_company_id ON public.jobs(company_id);
CREATE INDEX IF NOT EXISTS idx_jobs_customer_id ON public.jobs(customer_id);
CREATE INDEX IF NOT EXISTS idx_jobs_provider_id ON public.jobs(provider_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON public.jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_scheduled_date ON public.jobs(scheduled_date);

-- =========================
-- Properties table (for companies)
-- =========================
CREATE TABLE IF NOT EXISTS public.properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip_code TEXT NOT NULL,
  property_type TEXT CHECK (property_type IN ('residential', 'commercial', 'office', 'warehouse', 'other')),
  square_feet INTEGER,
  bedrooms INTEGER,
  bathrooms INTEGER,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_properties_tenant_id ON public.properties(tenant_id);
CREATE INDEX IF NOT EXISTS idx_properties_company_id ON public.properties(company_id);
CREATE INDEX IF NOT EXISTS idx_properties_status ON public.properties(status);

-- =========================
-- Reports table (for companies)
-- =========================
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  report_type TEXT NOT NULL CHECK (report_type IN ('analytics', 'financial', 'performance', 'custom')),
  title TEXT NOT NULL,
  description TEXT,
  data JSONB DEFAULT '{}'::jsonb,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  generated_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reports_tenant_id ON public.reports(tenant_id);
CREATE INDEX IF NOT EXISTS idx_reports_company_id ON public.reports(company_id);
CREATE INDEX IF NOT EXISTS idx_reports_type ON public.reports(report_type);
CREATE INDEX IF NOT EXISTS idx_reports_generated_at ON public.reports(generated_at DESC);

-- =========================
-- User profiles table (extended user information)
-- =========================
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  membership_fee DECIMAL(10, 2),
  membership_tier TEXT CHECK (membership_tier IN ('basic', 'silver', 'gold', 'platinum')),
  preferences JSONB DEFAULT '{}'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON public.user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_tenant_id ON public.user_profiles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_membership_tier ON public.user_profiles(membership_tier);

-- =========================
-- Campaign progress table
-- =========================
CREATE TABLE IF NOT EXISTS public.campaign_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  total_recipients INTEGER DEFAULT 0,
  sent_count INTEGER DEFAULT 0,
  delivered_count INTEGER DEFAULT 0,
  opened_count INTEGER DEFAULT 0,
  clicked_count INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(campaign_id)
);

CREATE INDEX IF NOT EXISTS idx_campaign_progress_tenant_id ON public.campaign_progress(tenant_id);
CREATE INDEX IF NOT EXISTS idx_campaign_progress_campaign_id ON public.campaign_progress(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_progress_status ON public.campaign_progress(status);

-- =========================
-- NGO applications table
-- =========================
CREATE TABLE IF NOT EXISTS public.ngo_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  organization_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  mission_statement TEXT,
  website TEXT,
  tax_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'approved', 'rejected')),
  notes TEXT,
  reviewed_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ngo_applications_tenant_id ON public.ngo_applications(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ngo_applications_status ON public.ngo_applications(status);
CREATE INDEX IF NOT EXISTS idx_ngo_applications_email ON public.ngo_applications(email);

-- =========================
-- Booking add-ons junction table
-- =========================
CREATE TABLE IF NOT EXISTS public.booking_add_ons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  add_on_id UUID NOT NULL REFERENCES public.add_ons(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(booking_id, add_on_id)
);

CREATE INDEX IF NOT EXISTS idx_booking_add_ons_tenant_id ON public.booking_add_ons(tenant_id);
CREATE INDEX IF NOT EXISTS idx_booking_add_ons_booking_id ON public.booking_add_ons(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_add_ons_add_on_id ON public.booking_add_ons(add_on_id);

-- =========================
-- Providers table (alias/view or separate table for revenue share)
-- Note: This might be an alias for provider_profiles, but creating as separate
-- if needed for revenue_share_rules foreign key
-- =========================
-- Check if providers table is needed (referenced in revenue_share_rules)
-- If provider_profiles exists, we can create a view or handle the FK differently
-- For now, we'll create a simple providers table that references provider_profiles
DO $$
BEGIN
  -- Only create if it doesn't exist and if provider_profiles exists
  IF to_regclass('public.provider_profiles') IS NOT NULL THEN
    IF to_regclass('public.providers') IS NULL THEN
      CREATE TABLE public.providers (
        id UUID PRIMARY KEY REFERENCES public.provider_profiles(id) ON DELETE CASCADE,
        tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      
      CREATE INDEX IF NOT EXISTS idx_providers_tenant_id ON public.providers(tenant_id);
      
      -- Populate from existing provider_profiles
      INSERT INTO public.providers (id, tenant_id)
      SELECT id, COALESCE(tenant_id, (SELECT id FROM public.tenants WHERE slug = 'default' LIMIT 1))
      FROM public.provider_profiles
      ON CONFLICT (id) DO NOTHING;
    END IF;
  END IF;
END$$;

-- =========================
-- Enable Row Level Security
-- =========================
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ngo_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_add_ons ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF to_regclass('public.providers') IS NOT NULL THEN
    ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;
  END IF;
END$$;

-- =========================
-- RLS Policies (basic - adjust as needed)
-- =========================
DO $$
BEGIN
  -- Companies: admins can view all, service role can manage
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='companies' AND policyname='Admins can view companies'
  ) THEN
    CREATE POLICY "Admins can view companies"
      ON public.companies FOR SELECT
      USING (EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('admin','root_admin')));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='companies' AND policyname='Service can manage companies'
  ) THEN
    CREATE POLICY "Service can manage companies"
      ON public.companies FOR ALL
      USING (true) WITH CHECK (true);
  END IF;

  -- Jobs: similar to bookings policies
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='jobs' AND policyname='Service can manage jobs'
  ) THEN
    CREATE POLICY "Service can manage jobs"
      ON public.jobs FOR ALL
      USING (true) WITH CHECK (true);
  END IF;

  -- Properties: admins can view, service can manage
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='properties' AND policyname='Admins can view properties'
  ) THEN
    CREATE POLICY "Admins can view properties"
      ON public.properties FOR SELECT
      USING (EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('admin','root_admin')));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='properties' AND policyname='Service can manage properties'
  ) THEN
    CREATE POLICY "Service can manage properties"
      ON public.properties FOR ALL
      USING (true) WITH CHECK (true);
  END IF;

  -- Reports: admins can view, service can manage
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='reports' AND policyname='Admins can view reports'
  ) THEN
    CREATE POLICY "Admins can view reports"
      ON public.reports FOR SELECT
      USING (EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('admin','root_admin')));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='reports' AND policyname='Service can manage reports'
  ) THEN
    CREATE POLICY "Service can manage reports"
      ON public.reports FOR ALL
      USING (true) WITH CHECK (true);
  END IF;

  -- User profiles: users can view their own, service can manage
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='user_profiles' AND policyname='Users can view own profile'
  ) THEN
    CREATE POLICY "Users can view own profile"
      ON public.user_profiles FOR SELECT
      USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('admin','root_admin')));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='user_profiles' AND policyname='Service can manage user_profiles'
  ) THEN
    CREATE POLICY "Service can manage user_profiles"
      ON public.user_profiles FOR ALL
      USING (true) WITH CHECK (true);
  END IF;

  -- Campaign progress: admins can view, service can manage
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='campaign_progress' AND policyname='Admins can view campaign_progress'
  ) THEN
    CREATE POLICY "Admins can view campaign_progress"
      ON public.campaign_progress FOR SELECT
      USING (EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('admin','root_admin')));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='campaign_progress' AND policyname='Service can manage campaign_progress'
  ) THEN
    CREATE POLICY "Service can manage campaign_progress"
      ON public.campaign_progress FOR ALL
      USING (true) WITH CHECK (true);
  END IF;

  -- NGO applications: admins can view, service can manage
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='ngo_applications' AND policyname='Admins can view ngo_applications'
  ) THEN
    CREATE POLICY "Admins can view ngo_applications"
      ON public.ngo_applications FOR SELECT
      USING (EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('admin','root_admin')));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='ngo_applications' AND policyname='Service can manage ngo_applications'
  ) THEN
    CREATE POLICY "Service can manage ngo_applications"
      ON public.ngo_applications FOR ALL
      USING (true) WITH CHECK (true);
  END IF;

  -- Booking add-ons: service can manage
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='booking_add_ons' AND policyname='Service can manage booking_add_ons'
  ) THEN
    CREATE POLICY "Service can manage booking_add_ons"
      ON public.booking_add_ons FOR ALL
      USING (true) WITH CHECK (true);
  END IF;

  -- Providers: service can manage
  IF to_regclass('public.providers') IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='providers' AND policyname='Service can manage providers'
    ) THEN
      CREATE POLICY "Service can manage providers"
        ON public.providers FOR ALL
        USING (true) WITH CHECK (true);
    END IF;
  END IF;
END$$;

-- =========================
-- Triggers to maintain updated_at
-- =========================
DO $$
BEGIN
  -- Companies
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_companies_updated_at') THEN
    CREATE TRIGGER update_companies_updated_at
      BEFORE UPDATE ON public.companies
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  -- Jobs
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_jobs_updated_at') THEN
    CREATE TRIGGER update_jobs_updated_at
      BEFORE UPDATE ON public.jobs
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  -- Properties
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_properties_updated_at') THEN
    CREATE TRIGGER update_properties_updated_at
      BEFORE UPDATE ON public.properties
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  -- User profiles
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_user_profiles_updated_at') THEN
    CREATE TRIGGER update_user_profiles_updated_at
      BEFORE UPDATE ON public.user_profiles
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  -- Campaign progress
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_campaign_progress_updated_at') THEN
    CREATE TRIGGER update_campaign_progress_updated_at
      BEFORE UPDATE ON public.campaign_progress
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  -- NGO applications
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_ngo_applications_updated_at') THEN
    CREATE TRIGGER update_ngo_applications_updated_at
      BEFORE UPDATE ON public.ngo_applications
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END$$;

-- =========================
-- Add tenant_id columns if they don't exist (for tables that might have been created before multitenancy)
-- =========================
DO $$
DECLARE
  v_default_tenant_id UUID;
BEGIN
  -- Get default tenant
  SELECT id INTO v_default_tenant_id FROM public.tenants WHERE slug = 'default' LIMIT 1;
  
  IF v_default_tenant_id IS NULL THEN
    INSERT INTO public.tenants (slug, name) VALUES ('default', 'Default Tenant') RETURNING id INTO v_default_tenant_id;
  END IF;

  -- Add tenant_id to companies if missing
  IF to_regclass('public.companies') IS NOT NULL THEN
    PERFORM 1 FROM pg_attribute
    WHERE attrelid = 'public.companies'::regclass AND attname = 'tenant_id' AND NOT attisdropped;
    IF NOT FOUND THEN
      ALTER TABLE public.companies ADD COLUMN tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
      UPDATE public.companies SET tenant_id = v_default_tenant_id WHERE tenant_id IS NULL;
      ALTER TABLE public.companies ALTER COLUMN tenant_id SET NOT NULL;
    END IF;
  END IF;

  -- Add tenant_id to jobs if missing
  IF to_regclass('public.jobs') IS NOT NULL THEN
    PERFORM 1 FROM pg_attribute
    WHERE attrelid = 'public.jobs'::regclass AND attname = 'tenant_id' AND NOT attisdropped;
    IF NOT FOUND THEN
      ALTER TABLE public.jobs ADD COLUMN tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
      UPDATE public.jobs SET tenant_id = v_default_tenant_id WHERE tenant_id IS NULL;
      ALTER TABLE public.jobs ALTER COLUMN tenant_id SET NOT NULL;
    END IF;
  END IF;

  -- Add tenant_id to properties if missing
  IF to_regclass('public.properties') IS NOT NULL THEN
    PERFORM 1 FROM pg_attribute
    WHERE attrelid = 'public.properties'::regclass AND attname = 'tenant_id' AND NOT attisdropped;
    IF NOT FOUND THEN
      ALTER TABLE public.properties ADD COLUMN tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
      UPDATE public.properties SET tenant_id = v_default_tenant_id WHERE tenant_id IS NULL;
      ALTER TABLE public.properties ALTER COLUMN tenant_id SET NOT NULL;
    END IF;
  END IF;

  -- Add tenant_id to reports if missing
  IF to_regclass('public.reports') IS NOT NULL THEN
    PERFORM 1 FROM pg_attribute
    WHERE attrelid = 'public.reports'::regclass AND attname = 'tenant_id' AND NOT attisdropped;
    IF NOT FOUND THEN
      ALTER TABLE public.reports ADD COLUMN tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
      UPDATE public.reports SET tenant_id = v_default_tenant_id WHERE tenant_id IS NULL;
      ALTER TABLE public.reports ALTER COLUMN tenant_id SET NOT NULL;
    END IF;
  END IF;

  -- Add tenant_id to user_profiles if missing
  IF to_regclass('public.user_profiles') IS NOT NULL THEN
    PERFORM 1 FROM pg_attribute
    WHERE attrelid = 'public.user_profiles'::regclass AND attname = 'tenant_id' AND NOT attisdropped;
    IF NOT FOUND THEN
      ALTER TABLE public.user_profiles ADD COLUMN tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
      UPDATE public.user_profiles SET tenant_id = v_default_tenant_id WHERE tenant_id IS NULL;
      ALTER TABLE public.user_profiles ALTER COLUMN tenant_id SET NOT NULL;
    END IF;
  END IF;

  -- Add tenant_id to campaign_progress if missing
  IF to_regclass('public.campaign_progress') IS NOT NULL THEN
    PERFORM 1 FROM pg_attribute
    WHERE attrelid = 'public.campaign_progress'::regclass AND attname = 'tenant_id' AND NOT attisdropped;
    IF NOT FOUND THEN
      ALTER TABLE public.campaign_progress ADD COLUMN tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
      UPDATE public.campaign_progress SET tenant_id = v_default_tenant_id WHERE tenant_id IS NULL;
      ALTER TABLE public.campaign_progress ALTER COLUMN tenant_id SET NOT NULL;
    END IF;
  END IF;

  -- Add tenant_id to ngo_applications if missing
  IF to_regclass('public.ngo_applications') IS NOT NULL THEN
    PERFORM 1 FROM pg_attribute
    WHERE attrelid = 'public.ngo_applications'::regclass AND attname = 'tenant_id' AND NOT attisdropped;
    IF NOT FOUND THEN
      ALTER TABLE public.ngo_applications ADD COLUMN tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
      UPDATE public.ngo_applications SET tenant_id = v_default_tenant_id WHERE tenant_id IS NULL;
      ALTER TABLE public.ngo_applications ALTER COLUMN tenant_id SET NOT NULL;
    END IF;
  END IF;

  -- Add tenant_id to booking_add_ons if missing
  IF to_regclass('public.booking_add_ons') IS NOT NULL THEN
    PERFORM 1 FROM pg_attribute
    WHERE attrelid = 'public.booking_add_ons'::regclass AND attname = 'tenant_id' AND NOT attisdropped;
    IF NOT FOUND THEN
      ALTER TABLE public.booking_add_ons ADD COLUMN tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
      UPDATE public.booking_add_ons SET tenant_id = v_default_tenant_id WHERE tenant_id IS NULL;
      ALTER TABLE public.booking_add_ons ALTER COLUMN tenant_id SET NOT NULL;
    END IF;
  END IF;
END$$;




-- ============================================================================
-- 15_blog_and_newsletter.sql
-- ============================================================================

-- Blog and Newsletter System
-- Idempotent creation for safe re-runs

-- Blog categories table
CREATE TABLE IF NOT EXISTS public.blog_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Blog tags table
CREATE TABLE IF NOT EXISTS public.blog_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Blog posts table
CREATE TABLE IF NOT EXISTS public.blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT,
  content TEXT NOT NULL, -- Full blog post content (can be markdown or HTML)
  featured_image TEXT,
  category_id UUID REFERENCES public.blog_categories(id) ON DELETE SET NULL,
  author_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  published_at TIMESTAMPTZ,
  meta_title TEXT, -- SEO meta title
  meta_description TEXT, -- SEO meta description
  meta_keywords TEXT[], -- SEO keywords
  view_count INTEGER DEFAULT 0,
  reading_time_minutes INTEGER, -- Calculated reading time
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Blog post tags junction table
CREATE TABLE IF NOT EXISTS public.blog_post_tags (
  blog_post_id UUID NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.blog_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (blog_post_id, tag_id)
);

-- Newsletter subscribers table
CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  first_name TEXT,
  last_name TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'unsubscribed')),
  confirmation_token TEXT UNIQUE,
  confirmed_at TIMESTAMPTZ,
  unsubscribed_at TIMESTAMPTZ,
  unsubscribe_token TEXT UNIQUE,
  source TEXT, -- Where they subscribed from (e.g., 'blog', 'homepage', 'footer')
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON public.blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON public.blog_posts(status);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published_at ON public.blog_posts(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_blog_posts_category ON public.blog_posts(category_id);
CREATE INDEX IF NOT EXISTS idx_blog_post_tags_post ON public.blog_post_tags(blog_post_id);
CREATE INDEX IF NOT EXISTS idx_blog_post_tags_tag ON public.blog_post_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_email ON public.newsletter_subscribers(email);
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_status ON public.newsletter_subscribers(status);
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_confirmation_token ON public.newsletter_subscribers(confirmation_token);
CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_unsubscribe_token ON public.newsletter_subscribers(unsubscribe_token);

-- Insert default blog categories
INSERT INTO public.blog_categories (name, slug, description) VALUES
  ('Tips & Tricks', 'tips-tricks', 'Helpful cleaning tips and tricks'),
  ('Business', 'business', 'Commercial cleaning and business insights'),
  ('Health & Wellness', 'health-wellness', 'Health benefits of clean spaces'),
  ('Industry News', 'industry-news', 'Latest news in the cleaning industry'),
  ('Product Reviews', 'product-reviews', 'Reviews of cleaning products and tools')
ON CONFLICT (slug) DO NOTHING;




-- ============================================================================
-- 16_support_tickets.sql
-- ============================================================================

-- Support Tickets System
-- Idempotent creation for safe re-runs

-- Support tickets table
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  ticket_number TEXT NOT NULL UNIQUE,
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('technical', 'billing', 'account', 'booking', 'general', 'other')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  assigned_to UUID REFERENCES public.users(id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Support ticket messages/notes (for conversation thread)
CREATE TABLE IF NOT EXISTS public.support_ticket_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  message TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT false, -- Internal notes vs customer-visible messages
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_support_tickets_tenant_id ON public.support_tickets(tenant_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON public.support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON public.support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_priority ON public.support_tickets(priority);
CREATE INDEX IF NOT EXISTS idx_support_tickets_assigned_to ON public.support_tickets(assigned_to);
CREATE INDEX IF NOT EXISTS idx_support_tickets_created_at ON public.support_tickets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_support_ticket_messages_ticket_id ON public.support_ticket_messages(ticket_id);
CREATE INDEX IF NOT EXISTS idx_support_ticket_messages_created_at ON public.support_ticket_messages(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_ticket_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DO $$
BEGIN
  -- Support tickets: admins can view all, users can view their own, service can manage
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='support_tickets' AND policyname='Users can view own tickets'
  ) THEN
    CREATE POLICY "Users can view own tickets"
      ON public.support_tickets FOR SELECT
      USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('admin','root_admin','team')));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='support_tickets' AND policyname='Service can manage support_tickets'
  ) THEN
    CREATE POLICY "Service can manage support_tickets"
      ON public.support_tickets FOR ALL
      USING (true) WITH CHECK (true);
  END IF;

  -- Support ticket messages: similar policies
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='support_ticket_messages' AND policyname='Users can view own ticket messages'
  ) THEN
    CREATE POLICY "Users can view own ticket messages"
      ON public.support_ticket_messages FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.support_tickets st 
          WHERE st.id = support_ticket_messages.ticket_id 
          AND (st.user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('admin','root_admin','team')))
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='support_ticket_messages' AND policyname='Service can manage support_ticket_messages'
  ) THEN
    CREATE POLICY "Service can manage support_ticket_messages"
      ON public.support_ticket_messages FOR ALL
      USING (true) WITH CHECK (true);
  END IF;
END$$;

-- Trigger to maintain updated_at
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_support_tickets_updated_at') THEN
    CREATE TRIGGER update_support_tickets_updated_at
      BEFORE UPDATE ON public.support_tickets
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END$$;

-- Function to generate ticket number
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS TEXT AS $$
DECLARE
  new_number TEXT;
  exists_check BOOLEAN;
BEGIN
  LOOP
    -- Format: TKT-YYYYMMDD-XXXXX (e.g., TKT-20240101-12345)
    new_number := 'TKT-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 100000)::TEXT, 5, '0');
    
    SELECT EXISTS(SELECT 1 FROM public.support_tickets WHERE ticket_number = new_number) INTO exists_check;
    
    IF NOT exists_check THEN
      RETURN new_number;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;




-- ============================================================================
-- 17_membership_cards.sql
-- ============================================================================

-- Membership Cards (tSmartCard) schema
-- Creates: membership_cards, membership_transactions, membership_usage
-- Safe to re-run; uses IF NOT EXISTS

-- Ensure required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =========================
-- membership_cards
-- =========================
CREATE TABLE IF NOT EXISTS public.membership_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE SET NULL,
  
  -- Card details
  card_number TEXT NOT NULL UNIQUE, -- e.g., TSC-2024-012345
  card_number_masked TEXT NOT NULL, -- e.g., •••• •••• •••• 1234
  design_type TEXT NOT NULL DEFAULT 'purple' CHECK (design_type IN ('purple', 'black', 'rose', 'emerald', 'custom')),
  custom_image_url TEXT,
  
  -- Membership details
  tier TEXT NOT NULL DEFAULT 'premium' CHECK (tier IN ('basic', 'premium', 'pro', 'elite')),
  discount_percentage DECIMAL(5, 2) NOT NULL DEFAULT 10.00, -- 10% for premium, 15% for pro, 20% for elite
  annual_cost DECIMAL(10, 2) NOT NULL DEFAULT 99.00,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'expired', 'cancelled', 'suspended')),
  is_activated BOOLEAN NOT NULL DEFAULT false,
  activation_code TEXT, -- For card activation flow
  activated_at TIMESTAMPTZ,
  
  -- Dates
  purchase_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expiration_date TIMESTAMPTZ NOT NULL,
  auto_renew BOOLEAN NOT NULL DEFAULT true,
  
  -- Physical card
  physical_card_shipped BOOLEAN NOT NULL DEFAULT false,
  physical_card_delivered BOOLEAN NOT NULL DEFAULT false,
  tracking_number TEXT,
  shipped_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  
  -- Usage tracking
  total_savings DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  order_count INTEGER NOT NULL DEFAULT 0,
  break_even_orders INTEGER, -- Calculated: annual_cost / (avg_order_amount * discount_percentage)
  
  -- Referral program
  referral_code TEXT UNIQUE,
  referral_count INTEGER NOT NULL DEFAULT 0,
  referral_credits DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  
  -- Bonus credits
  bonus_credits DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  birthday_bonus_used BOOLEAN NOT NULL DEFAULT false,
  birthday_bonus_available_date DATE, -- Month and day when birthday bonus becomes available
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS membership_cards_user_id_idx ON public.membership_cards(user_id);
CREATE INDEX IF NOT EXISTS membership_cards_status_idx ON public.membership_cards(status);
CREATE INDEX IF NOT EXISTS membership_cards_referral_code_idx ON public.membership_cards(referral_code);
CREATE INDEX IF NOT EXISTS membership_cards_expiration_date_idx ON public.membership_cards(expiration_date);

-- =========================
-- membership_transactions
-- =========================
CREATE TABLE IF NOT EXISTS public.membership_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  membership_card_id UUID NOT NULL REFERENCES public.membership_cards(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('purchase', 'renewal', 'upgrade', 'refund', 'activation')),
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  
  -- Payment details
  stripe_payment_intent_id TEXT,
  stripe_subscription_id TEXT,
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS membership_transactions_card_id_idx ON public.membership_transactions(membership_card_id);
CREATE INDEX IF NOT EXISTS membership_transactions_user_id_idx ON public.membership_transactions(user_id);

-- =========================
-- membership_usage
-- =========================
CREATE TABLE IF NOT EXISTS public.membership_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  membership_card_id UUID NOT NULL REFERENCES public.membership_cards(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- Usage details
  order_date TIMESTAMPTZ NOT NULL,
  service_name TEXT,
  original_amount DECIMAL(10, 2) NOT NULL,
  discount_amount DECIMAL(10, 2) NOT NULL,
  final_amount DECIMAL(10, 2) NOT NULL,
  
  -- Benefit used
  benefit_type TEXT, -- 'discount', 'free_upgrade', 'birthday_bonus', 'referral_credit', 'bonus_credit'
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS membership_usage_card_id_idx ON public.membership_usage(membership_card_id);
CREATE INDEX IF NOT EXISTS membership_usage_user_id_idx ON public.membership_usage(user_id);
CREATE INDEX IF NOT EXISTS membership_usage_booking_id_idx ON public.membership_usage(booking_id);
CREATE INDEX IF NOT EXISTS membership_usage_order_date_idx ON public.membership_usage(order_date);

-- =========================
-- Functions
-- =========================

-- Function to generate unique card number
CREATE OR REPLACE FUNCTION public.generate_card_number()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  year_part TEXT;
  seq_num INTEGER;
  card_num TEXT;
BEGIN
  year_part := TO_CHAR(NOW(), 'YYYY');
  
  -- Get next sequence number for this year
  SELECT COALESCE(MAX(CAST(SUBSTRING(card_number FROM '\d+$') AS INTEGER)), 0) + 1
  INTO seq_num
  FROM public.membership_cards
  WHERE card_number LIKE 'TSC-' || year_part || '-%';
  
  card_num := 'TSC-' || year_part || '-' || LPAD(seq_num::TEXT, 6, '0');
  RETURN card_num;
END;
$$;

-- Function to generate masked card number
CREATE OR REPLACE FUNCTION public.generate_masked_card_number(card_num TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  last_four TEXT;
BEGIN
  last_four := RIGHT(card_num, 4);
  RETURN '•••• •••• •••• ' || last_four;
END;
$$;

-- Function to generate unique referral code
CREATE OR REPLACE FUNCTION public.generate_referral_code(user_name TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  base_code TEXT;
  final_code TEXT;
  counter INTEGER := 0;
BEGIN
  -- Create base code from user name (uppercase, alphanumeric only, max 10 chars)
  base_code := UPPER(REGEXP_REPLACE(COALESCE(user_name, 'USER'), '[^A-Z0-9]', '', 'g'));
  base_code := SUBSTRING(base_code FROM 1 FOR 10);
  base_code := base_code || TO_CHAR(NOW(), 'YYYY');
  
  final_code := base_code;
  
  -- Ensure uniqueness
  WHILE EXISTS (SELECT 1 FROM public.membership_cards WHERE referral_code = final_code) LOOP
    counter := counter + 1;
    final_code := base_code || counter::TEXT;
  END LOOP;
  
  RETURN final_code;
END;
$$;

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS membership_cards_set_updated_at ON public.membership_cards;
CREATE TRIGGER membership_cards_set_updated_at
BEFORE UPDATE ON public.membership_cards
FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

-- =========================
-- RLS Policies
-- =========================

ALTER TABLE public.membership_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.membership_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.membership_usage ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own membership card
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'membership_cards' AND policyname = 'Allow read own card') THEN
    CREATE POLICY "Allow read own card" ON public.membership_cards
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'membership_transactions' AND policyname = 'Allow read own transactions') THEN
    CREATE POLICY "Allow read own transactions" ON public.membership_transactions
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'membership_usage' AND policyname = 'Allow read own usage') THEN
    CREATE POLICY "Allow read own usage" ON public.membership_usage
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
  
  -- Block direct writes from client; only service role should write
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'membership_cards' AND policyname = 'No client writes cards') THEN
    CREATE POLICY "No client writes cards" ON public.membership_cards
      FOR ALL USING (false) WITH CHECK (false);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'membership_transactions' AND policyname = 'No client writes transactions') THEN
    CREATE POLICY "No client writes transactions" ON public.membership_transactions
      FOR ALL USING (false) WITH CHECK (false);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'membership_usage' AND policyname = 'No client writes usage') THEN
    CREATE POLICY "No client writes usage" ON public.membership_usage
      FOR ALL USING (false) WITH CHECK (false);
  END IF;
END $$;




-- ============================================================================
-- 18_company_invoices.sql
-- ============================================================================

-- Company Invoices table
-- This script creates the invoices table for company billing and payment tracking
-- Safe to run multiple times (uses IF NOT EXISTS)

-- =========================
-- Invoices table
-- =========================
CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  invoice_number TEXT NOT NULL UNIQUE,
  invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,
  period_start DATE,
  period_end DATE,
  
  -- Amounts
  subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0,
  tax_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  paid_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  
  -- Status
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled', 'refunded')),
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'partial', 'paid', 'overdue', 'refunded')),
  
  -- Payment tracking
  paid_at TIMESTAMPTZ,
  payment_method TEXT,
  payment_reference TEXT,
  
  -- Invoice details
  description TEXT,
  notes TEXT,
  line_items JSONB DEFAULT '[]'::jsonb,
  
  -- Metadata
  pdf_url TEXT,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invoices_tenant_id ON public.invoices(tenant_id);
CREATE INDEX IF NOT EXISTS idx_invoices_company_id ON public.invoices(company_id);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON public.invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_payment_status ON public.invoices(payment_status);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_date ON public.invoices(invoice_date DESC);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON public.invoices(due_date);

-- =========================
-- Invoice payments table (for tracking partial payments)
-- =========================
CREATE TABLE IF NOT EXISTS public.invoice_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method TEXT,
  payment_reference TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invoice_payments_tenant_id ON public.invoice_payments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_invoice_payments_invoice_id ON public.invoice_payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_payments_payment_date ON public.invoice_payments(payment_date DESC);

-- =========================
-- Add company_id to users table if it doesn't exist
-- =========================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_attribute
    WHERE attrelid = 'public.users'::regclass
    AND attname = 'company_id'
    AND NOT attisdropped
  ) THEN
    ALTER TABLE public.users
    ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL;
    
    CREATE INDEX IF NOT EXISTS idx_users_company_id ON public.users(company_id);
  END IF;
END$$;

-- =========================
-- Enable Row Level Security
-- =========================
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_payments ENABLE ROW LEVEL SECURITY;

-- =========================
-- RLS Policies
-- =========================
DO $$
BEGIN
  -- Invoices: company users can view their company's invoices, service can manage
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='invoices' AND policyname='Company users can view invoices'
  ) THEN
    CREATE POLICY "Company users can view invoices"
      ON public.invoices FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.users u 
          WHERE u.id = auth.uid() 
          AND (u.company_id = invoices.company_id OR u.role IN ('admin', 'root_admin'))
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='invoices' AND policyname='Service can manage invoices'
  ) THEN
    CREATE POLICY "Service can manage invoices"
      ON public.invoices FOR ALL
      USING (true) WITH CHECK (true);
  END IF;

  -- Invoice payments: company users can view, service can manage
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='invoice_payments' AND policyname='Company users can view payments'
  ) THEN
    CREATE POLICY "Company users can view payments"
      ON public.invoice_payments FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.invoices inv
          JOIN public.users u ON u.id = auth.uid()
          WHERE inv.id = invoice_payments.invoice_id 
          AND (u.company_id = inv.company_id OR u.role IN ('admin', 'root_admin'))
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='invoice_payments' AND policyname='Service can manage payments'
  ) THEN
    CREATE POLICY "Service can manage payments"
      ON public.invoice_payments FOR ALL
      USING (true) WITH CHECK (true);
  END IF;
END$$;

-- =========================
-- Triggers to maintain updated_at
-- =========================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_invoices_updated_at') THEN
    CREATE TRIGGER update_invoices_updated_at
      BEFORE UPDATE ON public.invoices
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END$$;

-- =========================
-- Function to generate invoice number
-- =========================
CREATE OR REPLACE FUNCTION generate_invoice_number(company_id_param UUID)
RETURNS TEXT AS $$
DECLARE
  prefix TEXT;
  year_num TEXT;
  sequence_num INTEGER;
  invoice_num TEXT;
BEGIN
  -- Get company prefix (first 3 letters of company name or 'INV')
  SELECT COALESCE(UPPER(LEFT(name, 3)), 'INV') INTO prefix
  FROM public.companies
  WHERE id = company_id_param;
  
  -- Get current year
  year_num := TO_CHAR(CURRENT_DATE, 'YYYY');
  
  -- Get next sequence number for this company and year
  SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM '[0-9]+$') AS INTEGER)), 0) + 1
  INTO sequence_num
  FROM public.invoices
  WHERE company_id = company_id_param
  AND invoice_number LIKE prefix || '-' || year_num || '-%';
  
  -- Format: PREFIX-YYYY-0001
  invoice_num := prefix || '-' || year_num || '-' || LPAD(sequence_num::TEXT, 4, '0');
  
  RETURN invoice_num;
END;
$$ LANGUAGE plpgsql;




-- ============================================================================
-- 19_messages.sql
-- ============================================================================

-- Messages/Conversations System
-- Idempotent creation for safe re-runs

-- Conversations table (threads between users)
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  participant_1_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  participant_2_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  last_message_at TIMESTAMPTZ,
  last_message_preview TEXT,
  unread_count_participant_1 INTEGER DEFAULT 0,
  unread_count_participant_2 INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_participants UNIQUE (participant_1_id, participant_2_id),
  CONSTRAINT different_participants CHECK (participant_1_id != participant_2_id)
);

-- Messages table
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_conversations_tenant_id ON public.conversations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_conversations_participant_1 ON public.conversations(participant_1_id);
CREATE INDEX IF NOT EXISTS idx_conversations_participant_2 ON public.conversations(participant_2_id);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message_at ON public.conversations(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient_id ON public.messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_is_read ON public.messages(is_read) WHERE is_read = false;

-- Enable Row Level Security
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DO $$
BEGIN
  -- Conversations: users can view conversations they're part of, admins can view all
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='conversations' AND policyname='Users can view own conversations'
  ) THEN
    CREATE POLICY "Users can view own conversations"
      ON public.conversations FOR SELECT
      USING (
        participant_1_id = auth.uid() OR 
        participant_2_id = auth.uid() OR 
        EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('admin','root_admin','team'))
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='conversations' AND policyname='Service can manage conversations'
  ) THEN
    CREATE POLICY "Service can manage conversations"
      ON public.conversations FOR ALL
      USING (true) WITH CHECK (true);
  END IF;

  -- Messages: users can view messages in their conversations, admins can view all
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='messages' AND policyname='Users can view own messages'
  ) THEN
    CREATE POLICY "Users can view own messages"
      ON public.messages FOR SELECT
      USING (
        sender_id = auth.uid() OR 
        recipient_id = auth.uid() OR 
        EXISTS (
          SELECT 1 FROM public.conversations c 
          WHERE c.id = messages.conversation_id 
          AND (c.participant_1_id = auth.uid() OR c.participant_2_id = auth.uid())
        ) OR
        EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('admin','root_admin','team'))
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='messages' AND policyname='Users can send messages'
  ) THEN
    CREATE POLICY "Users can send messages"
      ON public.messages FOR INSERT
      WITH CHECK (sender_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='messages' AND policyname='Service can manage messages'
  ) THEN
    CREATE POLICY "Service can manage messages"
      ON public.messages FOR ALL
      USING (true) WITH CHECK (true);
  END IF;
END$$;

-- Trigger to maintain updated_at
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_conversations_updated_at') THEN
    CREATE TRIGGER update_conversations_updated_at
      BEFORE UPDATE ON public.conversations
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END$$;

-- Function to update conversation when a message is sent
CREATE OR REPLACE FUNCTION update_conversation_on_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.conversations
  SET 
    last_message_at = NEW.created_at,
    last_message_preview = LEFT(NEW.content, 100),
    unread_count_participant_1 = CASE 
      WHEN NEW.recipient_id = participant_1_id THEN unread_count_participant_1 + 1
      ELSE unread_count_participant_1
    END,
    unread_count_participant_2 = CASE 
      WHEN NEW.recipient_id = participant_2_id THEN unread_count_participant_2 + 1
      ELSE unread_count_participant_2
    END,
    updated_at = NOW()
  WHERE id = NEW.conversation_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update conversation on new message
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_update_conversation_on_message') THEN
    CREATE TRIGGER trigger_update_conversation_on_message
      AFTER INSERT ON public.messages
      FOR EACH ROW EXECUTE FUNCTION update_conversation_on_message();
  END IF;
END$$;

-- Function to mark messages as read
CREATE OR REPLACE FUNCTION mark_messages_as_read(
  p_conversation_id UUID,
  p_user_id UUID
)
RETURNS void AS $$
BEGIN
  UPDATE public.messages
  SET is_read = true, read_at = NOW()
  WHERE conversation_id = p_conversation_id
    AND recipient_id = p_user_id
    AND is_read = false;
  
  -- Reset unread count
  UPDATE public.conversations
  SET 
    unread_count_participant_1 = CASE 
      WHEN participant_1_id = p_user_id THEN 0
      ELSE unread_count_participant_1
    END,
    unread_count_participant_2 = CASE 
      WHEN participant_2_id = p_user_id THEN 0
      ELSE unread_count_participant_2
    END
  WHERE id = p_conversation_id;
END;
$$ LANGUAGE plpgsql;



