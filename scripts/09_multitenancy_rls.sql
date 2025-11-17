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


