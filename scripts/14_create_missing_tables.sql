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

