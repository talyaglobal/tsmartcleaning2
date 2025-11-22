-- Fix Loyalty Accounts Table Tenant Isolation
-- This script ensures loyalty_accounts table exists and has proper tenant isolation

-- =========================
-- 1. Ensure loyalty_accounts table exists (re-run creation if needed)
-- =========================

-- Create loyalty_accounts table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.loyalty_accounts (
  user_id UUID PRIMARY KEY,
  points_balance INTEGER NOT NULL DEFAULT 0,
  tier TEXT NOT NULL DEFAULT 'Bronze', -- Bronze, Silver, Gold, Platinum
  tier_points_12m INTEGER NOT NULL DEFAULT 0,
  streak_count INTEGER NOT NULL DEFAULT 0,
  last_booking_at TIMESTAMPTZ,
  dob_month INT2, -- 1-12
  dob_day INT2,   -- 1-31
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================
-- 2. Add tenant_id column if missing
-- =========================

DO $$
BEGIN
  -- Add tenant_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='loyalty_accounts' AND column_name='tenant_id'
  ) THEN
    ALTER TABLE public.loyalty_accounts ADD COLUMN tenant_id UUID;
    
    -- Add foreign key constraint
    ALTER TABLE public.loyalty_accounts
      ADD CONSTRAINT loyalty_accounts_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;
    
    -- Add index for performance
    CREATE INDEX IF NOT EXISTS idx_loyalty_accounts_tenant_id ON public.loyalty_accounts(tenant_id);
    
    RAISE NOTICE 'Added tenant_id column to loyalty_accounts table';
  ELSE
    RAISE NOTICE 'tenant_id column already exists in loyalty_accounts table';
  END IF;
END$$;

-- =========================
-- 3. Enable RLS and create tenant-aware policies
-- =========================

-- Enable RLS
ALTER TABLE public.loyalty_accounts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to replace with tenant-aware ones
DROP POLICY IF EXISTS "Allow read own account" ON public.loyalty_accounts;
DROP POLICY IF EXISTS "No client insert/update accounts" ON public.loyalty_accounts;

-- Create tenant-aware policies
CREATE POLICY loyalty_accounts_tenant_isolation ON public.loyalty_accounts FOR ALL USING (
  -- Users can access their own loyalty account within their tenant
  (auth.uid() = user_id AND tenant_id = public.current_tenant_id()) OR
  -- Admins can access all loyalty accounts within their tenant
  (tenant_id = public.current_tenant_id() AND auth.uid() IN (
    SELECT id FROM public.users WHERE role = 'admin'
  ))
) WITH CHECK (
  -- Only allow creation/updates within the current tenant
  tenant_id = public.current_tenant_id() AND (
    -- Users can only modify their own account
    auth.uid() = user_id OR
    -- Admins can modify any account
    auth.uid() IN (
      SELECT id FROM public.users WHERE role = 'admin'
    )
  )
);

-- =========================
-- 4. Add trigger to auto-set tenant_id
-- =========================

-- Create function to set tenant_id
CREATE OR REPLACE FUNCTION public.set_loyalty_accounts_tenant_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.tenant_id IS NULL THEN
    NEW.tenant_id := public.current_tenant_id();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trg_loyalty_accounts_set_tenant_id ON public.loyalty_accounts;
CREATE TRIGGER trg_loyalty_accounts_set_tenant_id
  BEFORE INSERT ON public.loyalty_accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.set_loyalty_accounts_tenant_id();

-- =========================
-- 5. Add updated_at trigger
-- =========================

-- Ensure updated_at trigger exists
DROP TRIGGER IF EXISTS loyalty_accounts_set_updated_at ON public.loyalty_accounts;
CREATE TRIGGER loyalty_accounts_set_updated_at
  BEFORE UPDATE ON public.loyalty_accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =========================
-- 6. Comment for documentation
-- =========================

COMMENT ON TABLE public.loyalty_accounts IS 'RLS enabled - loyalty accounts are tenant-scoped, users can access their own account, admins can access all within tenant';
COMMENT ON COLUMN public.loyalty_accounts.tenant_id IS 'Tenant isolation - loyalty accounts are scoped to specific tenants';

-- Verify table exists and has proper structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'loyalty_accounts'
ORDER BY ordinal_position;