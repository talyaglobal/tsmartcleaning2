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


