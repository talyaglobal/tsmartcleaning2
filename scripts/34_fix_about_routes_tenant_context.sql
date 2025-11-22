-- Fix About Page Routes - Add tenant context awareness
-- This script addresses the tenant isolation issues in /about/ API routes

-- =========================
-- Issue Analysis:
-- =========================
-- The about page routes query tenant-specific data without tenant filtering:
-- 1. /about/locations, /about/press, /about/team, /about/timeline - these are OK (public tables)
-- 2. /about/stats - queries users, provider_profiles, bookings, addresses, reviews without tenant context
--
-- The /about/stats route needs to be updated to either:
-- A) Show tenant-specific stats (recommended for tenant isolation)
-- B) Show global stats (only if this is meant to be a public marketing page)

-- =========================
-- Recommendation: Make About Tables Tenant-Aware
-- =========================
-- Since this is a multi-tenant application, the about page data should likely be tenant-specific
-- This allows each tenant to have their own custom about page content

-- Add tenant_id to about page tables
DO $$
BEGIN
  -- team_members
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='team_members' AND column_name='tenant_id'
  ) THEN
    ALTER TABLE public.team_members ADD COLUMN tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_team_members_tenant_id ON public.team_members(tenant_id);
    RAISE NOTICE 'Added tenant_id to team_members table';
  END IF;

  -- company_timeline  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='company_timeline' AND column_name='tenant_id'
  ) THEN
    ALTER TABLE public.company_timeline ADD COLUMN tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_company_timeline_tenant_id ON public.company_timeline(tenant_id);
    RAISE NOTICE 'Added tenant_id to company_timeline table';
  END IF;

  -- office_locations
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='office_locations' AND column_name='tenant_id'
  ) THEN
    ALTER TABLE public.office_locations ADD COLUMN tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_office_locations_tenant_id ON public.office_locations(tenant_id);
    RAISE NOTICE 'Added tenant_id to office_locations table';
  END IF;

  -- press_mentions
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='press_mentions' AND column_name='tenant_id'
  ) THEN
    ALTER TABLE public.press_mentions ADD COLUMN tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_press_mentions_tenant_id ON public.press_mentions(tenant_id);
    RAISE NOTICE 'Added tenant_id to press_mentions table';
  END IF;
END$$;

-- =========================
-- Update RLS Policies to be Tenant-Aware
-- =========================

-- team_members: tenant-scoped
DROP POLICY IF EXISTS "team_members_select_public" ON public.team_members;
DROP POLICY IF EXISTS "team_members_modify_admin" ON public.team_members;

CREATE POLICY team_members_tenant_read ON public.team_members 
  FOR SELECT USING (
    tenant_id = public.current_tenant_id() OR tenant_id IS NULL
  );

CREATE POLICY team_members_tenant_write ON public.team_members 
  FOR ALL USING (
    tenant_id = public.current_tenant_id() AND 
    auth.uid() IN (SELECT id FROM public.users WHERE role = 'admin')
  ) WITH CHECK (
    tenant_id = public.current_tenant_id() AND 
    auth.uid() IN (SELECT id FROM public.users WHERE role = 'admin')
  );

-- company_timeline: tenant-scoped
DROP POLICY IF EXISTS "company_timeline_select_public" ON public.company_timeline;
DROP POLICY IF EXISTS "company_timeline_modify_admin" ON public.company_timeline;

CREATE POLICY company_timeline_tenant_read ON public.company_timeline 
  FOR SELECT USING (
    tenant_id = public.current_tenant_id() OR tenant_id IS NULL
  );

CREATE POLICY company_timeline_tenant_write ON public.company_timeline 
  FOR ALL USING (
    tenant_id = public.current_tenant_id() AND 
    auth.uid() IN (SELECT id FROM public.users WHERE role = 'admin')
  ) WITH CHECK (
    tenant_id = public.current_tenant_id() AND 
    auth.uid() IN (SELECT id FROM public.users WHERE role = 'admin')
  );

-- office_locations: tenant-scoped  
DROP POLICY IF EXISTS "office_locations_select_public" ON public.office_locations;
DROP POLICY IF EXISTS "office_locations_modify_admin" ON public.office_locations;

CREATE POLICY office_locations_tenant_read ON public.office_locations 
  FOR SELECT USING (
    tenant_id = public.current_tenant_id() OR tenant_id IS NULL
  );

CREATE POLICY office_locations_tenant_write ON public.office_locations 
  FOR ALL USING (
    tenant_id = public.current_tenant_id() AND 
    auth.uid() IN (SELECT id FROM public.users WHERE role = 'admin')
  ) WITH CHECK (
    tenant_id = public.current_tenant_id() AND 
    auth.uid() IN (SELECT id FROM public.users WHERE role = 'admin')
  );

-- press_mentions: tenant-scoped
DROP POLICY IF EXISTS "press_mentions_select_public" ON public.press_mentions;
DROP POLICY IF EXISTS "press_mentions_modify_admin" ON public.press_mentions;

CREATE POLICY press_mentions_tenant_read ON public.press_mentions 
  FOR SELECT USING (
    tenant_id = public.current_tenant_id() OR tenant_id IS NULL
  );

CREATE POLICY press_mentions_tenant_write ON public.press_mentions 
  FOR ALL USING (
    tenant_id = public.current_tenant_id() AND 
    auth.uid() IN (SELECT id FROM public.users WHERE role = 'admin')
  ) WITH CHECK (
    tenant_id = public.current_tenant_id() AND 
    auth.uid() IN (SELECT id FROM public.users WHERE role = 'admin')
  );

-- =========================
-- Add Triggers to Auto-Set tenant_id
-- =========================

-- Function to set tenant_id for about tables
CREATE OR REPLACE FUNCTION public.set_about_table_tenant_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.tenant_id IS NULL THEN
    NEW.tenant_id := public.current_tenant_id();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for each table
DROP TRIGGER IF EXISTS trg_team_members_set_tenant_id ON public.team_members;
CREATE TRIGGER trg_team_members_set_tenant_id
  BEFORE INSERT ON public.team_members
  FOR EACH ROW
  EXECUTE FUNCTION public.set_about_table_tenant_id();

DROP TRIGGER IF EXISTS trg_company_timeline_set_tenant_id ON public.company_timeline;
CREATE TRIGGER trg_company_timeline_set_tenant_id
  BEFORE INSERT ON public.company_timeline
  FOR EACH ROW
  EXECUTE FUNCTION public.set_about_table_tenant_id();

DROP TRIGGER IF EXISTS trg_office_locations_set_tenant_id ON public.office_locations;
CREATE TRIGGER trg_office_locations_set_tenant_id
  BEFORE INSERT ON public.office_locations
  FOR EACH ROW
  EXECUTE FUNCTION public.set_about_table_tenant_id();

DROP TRIGGER IF EXISTS trg_press_mentions_set_tenant_id ON public.press_mentions;
CREATE TRIGGER trg_press_mentions_set_tenant_id
  BEFORE INSERT ON public.press_mentions
  FOR EACH ROW
  EXECUTE FUNCTION public.set_about_table_tenant_id();

-- =========================
-- Comments for Documentation
-- =========================

COMMENT ON TABLE public.team_members IS 'RLS enabled - tenant-scoped about page team members, null tenant_id for global/shared entries';
COMMENT ON TABLE public.company_timeline IS 'RLS enabled - tenant-scoped about page timeline, null tenant_id for global/shared entries';  
COMMENT ON TABLE public.office_locations IS 'RLS enabled - tenant-scoped about page locations, null tenant_id for global/shared entries';
COMMENT ON TABLE public.press_mentions IS 'RLS enabled - tenant-scoped about page press mentions, null tenant_id for global/shared entries';

-- Note: The /about/stats API route will need to be updated in the application code to include
-- tenant context when querying users, provider_profiles, bookings, addresses, reviews tables