-- Company Enterprise Features
-- Adds company_users table and enhances company features
-- Safe to run multiple times (uses IF NOT EXISTS)

-- Ensure required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =========================
-- Company Users (for managing team members within a company)
-- =========================
CREATE TABLE IF NOT EXISTS public.company_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'manager', 'member', 'viewer')),
  permissions JSONB DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  invited_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  invited_at TIMESTAMPTZ,
  joined_at TIMESTAMPTZ,
  last_active_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(company_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_company_users_tenant_id ON public.company_users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_company_users_company_id ON public.company_users(company_id);
CREATE INDEX IF NOT EXISTS idx_company_users_user_id ON public.company_users(user_id);
CREATE INDEX IF NOT EXISTS idx_company_users_status ON public.company_users(status);
CREATE INDEX IF NOT EXISTS idx_company_users_role ON public.company_users(role);

-- =========================
-- Company Billing Settings
-- =========================
CREATE TABLE IF NOT EXISTS public.company_billing_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  company_id UUID NOT NULL UNIQUE REFERENCES public.companies(id) ON DELETE CASCADE,
  billing_email TEXT,
  billing_address TEXT,
  billing_city TEXT,
  billing_state TEXT,
  billing_zip_code TEXT,
  billing_country TEXT DEFAULT 'US',
  payment_method TEXT CHECK (payment_method IN ('credit_card', 'bank_transfer', 'check', 'other')),
  payment_terms TEXT DEFAULT 'net_30' CHECK (payment_terms IN ('net_15', 'net_30', 'net_60', 'due_on_receipt')),
  auto_pay BOOLEAN DEFAULT false,
  tax_id TEXT,
  currency TEXT DEFAULT 'USD',
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_company_billing_settings_tenant_id ON public.company_billing_settings(tenant_id);
CREATE INDEX IF NOT EXISTS idx_company_billing_settings_company_id ON public.company_billing_settings(company_id);

-- =========================
-- Company Payment Methods
-- =========================
CREATE TABLE IF NOT EXISTS public.company_payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('credit_card', 'bank_account', 'paypal', 'other')),
  provider TEXT, -- e.g., 'stripe', 'paypal'
  provider_account_id TEXT, -- External provider's account ID
  is_default BOOLEAN DEFAULT false,
  last4 TEXT, -- Last 4 digits of card/account
  brand TEXT, -- Card brand (visa, mastercard, etc.)
  expiry_month INTEGER,
  expiry_year INTEGER,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'expired')),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_company_payment_methods_tenant_id ON public.company_payment_methods(tenant_id);
CREATE INDEX IF NOT EXISTS idx_company_payment_methods_company_id ON public.company_payment_methods(company_id);
CREATE INDEX IF NOT EXISTS idx_company_payment_methods_status ON public.company_payment_methods(status);

-- =========================
-- Update triggers for updated_at
-- =========================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_company_users_updated_at ON public.company_users;
CREATE TRIGGER update_company_users_updated_at
  BEFORE UPDATE ON public.company_users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_company_billing_settings_updated_at ON public.company_billing_settings;
CREATE TRIGGER update_company_billing_settings_updated_at
  BEFORE UPDATE ON public.company_billing_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_company_payment_methods_updated_at ON public.company_payment_methods;
CREATE TRIGGER update_company_payment_methods_updated_at
  BEFORE UPDATE ON public.company_payment_methods
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =========================
-- RLS Policies for company_users
-- =========================
ALTER TABLE public.company_users ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view company_users for companies they belong to
DROP POLICY IF EXISTS "Users can view company_users for their companies" ON public.company_users;
CREATE POLICY "Users can view company_users for their companies"
  ON public.company_users
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.company_users cu
      WHERE cu.user_id = auth.uid()
      AND cu.company_id = company_users.company_id
      AND cu.status = 'active'
    )
  );

-- Policy: Company admins can manage company_users
DROP POLICY IF EXISTS "Company admins can manage company_users" ON public.company_users;
CREATE POLICY "Company admins can manage company_users"
  ON public.company_users
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.company_users cu
      WHERE cu.user_id = auth.uid()
      AND cu.company_id = company_users.company_id
      AND cu.role IN ('admin', 'manager')
      AND cu.status = 'active'
    )
  );

-- =========================
-- RLS Policies for company_billing_settings
-- =========================
ALTER TABLE public.company_billing_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Company admins can view and manage billing settings
DROP POLICY IF EXISTS "Company admins can manage billing settings" ON public.company_billing_settings;
CREATE POLICY "Company admins can manage billing settings"
  ON public.company_billing_settings
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.company_users cu
      WHERE cu.user_id = auth.uid()
      AND cu.company_id = company_billing_settings.company_id
      AND cu.role IN ('admin', 'manager')
      AND cu.status = 'active'
    )
  );

-- =========================
-- RLS Policies for company_payment_methods
-- =========================
ALTER TABLE public.company_payment_methods ENABLE ROW LEVEL SECURITY;

-- Policy: Company admins can manage payment methods
DROP POLICY IF EXISTS "Company admins can manage payment methods" ON public.company_payment_methods;
CREATE POLICY "Company admins can manage payment methods"
  ON public.company_payment_methods
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.company_users cu
      WHERE cu.user_id = auth.uid()
      AND cu.company_id = company_payment_methods.company_id
      AND cu.role IN ('admin', 'manager')
      AND cu.status = 'active'
    )
  );

