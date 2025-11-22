-- Fix Services Table Tenant Isolation
-- This script adds missing tenant_id column and RLS policy to services table

-- =========================
-- 1. Add tenant_id column to services table if missing
-- =========================

DO $$
BEGIN
  -- Add tenant_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='services' AND column_name='tenant_id'
  ) THEN
    ALTER TABLE public.services ADD COLUMN tenant_id UUID;
    
    -- Add foreign key constraint
    ALTER TABLE public.services
      ADD CONSTRAINT services_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;
    
    -- Add index for performance
    CREATE INDEX IF NOT EXISTS idx_services_tenant_id ON public.services(tenant_id);
    
    RAISE NOTICE 'Added tenant_id column to services table';
  ELSE
    RAISE NOTICE 'tenant_id column already exists in services table';
  END IF;
END$$;

-- =========================
-- 2. Update RLS policy for services table
-- =========================

-- Drop the current non-tenant-aware policy
DROP POLICY IF EXISTS "services_public_read_admin_write" ON public.services;

-- Create new tenant-aware policy for services
CREATE POLICY services_tenant_isolation ON public.services FOR ALL USING (
  -- Services can be viewed by users in the same tenant
  tenant_id = public.current_tenant_id() OR 
  -- Or by admins (who can see all)
  auth.uid() IN (
    SELECT id FROM public.users WHERE role = 'admin'
  )
) WITH CHECK (
  -- Only admin can modify services, and they must be in a tenant context
  auth.uid() IN (
    SELECT id FROM public.users WHERE role = 'admin'
  ) AND 
  tenant_id = public.current_tenant_id()
);

-- =========================
-- 3. Verify RLS is enabled
-- =========================

-- Ensure RLS is enabled on services table
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- =========================
-- 4. Comment for documentation
-- =========================

COMMENT ON TABLE public.services IS 'RLS enabled - services are tenant-scoped, viewable by tenant members, modifiable by admins only';
COMMENT ON COLUMN public.services.tenant_id IS 'Tenant isolation - services are scoped to specific tenants';

-- Show verification query
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'services'
ORDER BY policyname;