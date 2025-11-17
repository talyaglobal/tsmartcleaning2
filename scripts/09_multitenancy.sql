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


