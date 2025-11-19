-- ============================================================================
-- NGO/Agency System Schema
-- ============================================================================
-- Creates tables for NGO/Agency partnerships, worker management, and placements
-- Safe to re-run; uses IF NOT EXISTS clauses
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =========================
-- placements table
-- =========================
CREATE TABLE IF NOT EXISTS public.placements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  agency_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  job_title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'interview_scheduled', 'offer_extended', 'accepted', 'active', 'completed', 'terminated', 'withdrawn')),
  start_date DATE,
  end_date DATE,
  placement_fee DECIMAL(10, 2) DEFAULT 0,
  hourly_rate DECIMAL(10, 2),
  hours_per_week INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes will be created after ensuring tenant_id exists
CREATE INDEX IF NOT EXISTS idx_placements_agency_id ON public.placements(agency_id);
CREATE INDEX IF NOT EXISTS idx_placements_candidate_id ON public.placements(candidate_id);
CREATE INDEX IF NOT EXISTS idx_placements_company_id ON public.placements(company_id);
CREATE INDEX IF NOT EXISTS idx_placements_status ON public.placements(status);
CREATE INDEX IF NOT EXISTS idx_placements_start_date ON public.placements(start_date);

-- =========================
-- agency_workers table (candidates/workers managed by agencies)
-- =========================
CREATE TABLE IF NOT EXISTS public.agency_workers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  agency_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'placed', 'training', 'inactive', 'on_hold')),
  skills TEXT[],
  languages TEXT[],
  work_authorization_status TEXT,
  availability_status TEXT DEFAULT 'available' CHECK (availability_status IN ('available', 'busy', 'unavailable')),
  notes TEXT,
  last_contact_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(agency_id, user_id)
);

-- Indexes will be created after ensuring tenant_id exists
CREATE INDEX IF NOT EXISTS idx_agency_workers_agency_id ON public.agency_workers(agency_id);
CREATE INDEX IF NOT EXISTS idx_agency_workers_user_id ON public.agency_workers(user_id);
CREATE INDEX IF NOT EXISTS idx_agency_workers_status ON public.agency_workers(status);

-- =========================
-- placement_timeline table (track placement status changes)
-- =========================
CREATE TABLE IF NOT EXISTS public.placement_timeline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  placement_id UUID NOT NULL REFERENCES public.placements(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  notes TEXT,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes will be created after ensuring tenant_id exists
CREATE INDEX IF NOT EXISTS idx_placement_timeline_placement_id ON public.placement_timeline(placement_id);
CREATE INDEX IF NOT EXISTS idx_placement_timeline_created_at ON public.placement_timeline(created_at);

-- =========================
-- messages table (for agency communication)
-- =========================
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  agency_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  from_email TEXT,
  to_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'draft', 'failed', 'delivered')),
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes will be created after ensuring tenant_id exists
CREATE INDEX IF NOT EXISTS idx_messages_agency_id ON public.messages(agency_id);
CREATE INDEX IF NOT EXISTS idx_messages_to_email ON public.messages(to_email);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at);

-- =========================
-- Enable Row Level Security
-- =========================
ALTER TABLE public.placements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agency_workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.placement_timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- =========================
-- RLS Policies for placements
-- =========================
DO $$
BEGIN
  -- Only create policies if table exists and has required columns
  IF to_regclass('public.placements') IS NOT NULL AND EXISTS (
    SELECT 1 FROM pg_attribute 
    WHERE attrelid = 'public.placements'::regclass AND attname = 'agency_id' AND NOT attisdropped
  ) THEN
    -- Agency can view their own placements
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE schemaname='public' AND tablename='placements' 
      AND policyname='Agencies can view their placements'
    ) THEN
      CREATE POLICY "Agencies can view their placements"
        ON public.placements FOR SELECT
        USING (
          EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.role = 'ngo_agency'
            AND placements.agency_id = users.id
          )
        );
    END IF;

    -- Agency can insert their own placements
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE schemaname='public' AND tablename='placements' 
      AND policyname='Agencies can insert their placements'
    ) THEN
      CREATE POLICY "Agencies can insert their placements"
        ON public.placements FOR INSERT
        WITH CHECK (
          EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.role = 'ngo_agency'
            AND placements.agency_id = users.id
          )
        );
    END IF;

    -- Agency can update their own placements
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE schemaname='public' AND tablename='placements' 
      AND policyname='Agencies can update their placements'
    ) THEN
      CREATE POLICY "Agencies can update their placements"
        ON public.placements FOR UPDATE
        USING (
          EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.role = 'ngo_agency'
            AND placements.agency_id = users.id
          )
        );
    END IF;

    -- Admins can view all placements
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE schemaname='public' AND tablename='placements' 
      AND policyname='Admins can view all placements'
    ) THEN
      CREATE POLICY "Admins can view all placements"
        ON public.placements FOR SELECT
        USING (
          EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.role IN ('admin', 'root_admin')
          )
        );
    END IF;

    -- Service role can manage all placements
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE schemaname='public' AND tablename='placements' 
      AND policyname='Service can manage placements'
    ) THEN
      CREATE POLICY "Service can manage placements"
        ON public.placements FOR ALL
        USING (auth.role() = 'service_role');
    END IF;
  END IF;
END$$;

-- =========================
-- RLS Policies for agency_workers
-- =========================
DO $$
BEGIN
  -- Only create policies if table exists and has required columns
  IF to_regclass('public.agency_workers') IS NOT NULL AND EXISTS (
    SELECT 1 FROM pg_attribute 
    WHERE attrelid = 'public.agency_workers'::regclass AND attname = 'agency_id' AND NOT attisdropped
  ) THEN
    -- Agency can view their own workers
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE schemaname='public' AND tablename='agency_workers' 
      AND policyname='Agencies can view their workers'
    ) THEN
      CREATE POLICY "Agencies can view their workers"
        ON public.agency_workers FOR SELECT
        USING (
          EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.role = 'ngo_agency'
            AND agency_workers.agency_id = users.id
          )
        );
    END IF;

    -- Agency can manage their own workers
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE schemaname='public' AND tablename='agency_workers' 
      AND policyname='Agencies can manage their workers'
    ) THEN
      CREATE POLICY "Agencies can manage their workers"
        ON public.agency_workers FOR ALL
        USING (
          EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.role = 'ngo_agency'
            AND agency_workers.agency_id = users.id
          )
        );
    END IF;

    -- Admins can view all workers
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE schemaname='public' AND tablename='agency_workers' 
      AND policyname='Admins can view all workers'
    ) THEN
      CREATE POLICY "Admins can view all workers"
        ON public.agency_workers FOR SELECT
        USING (
          EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.role IN ('admin', 'root_admin')
          )
        );
    END IF;

    -- Service role can manage all workers
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE schemaname='public' AND tablename='agency_workers' 
      AND policyname='Service can manage workers'
    ) THEN
      CREATE POLICY "Service can manage workers"
        ON public.agency_workers FOR ALL
        USING (auth.role() = 'service_role');
    END IF;
  END IF;
END$$;

-- =========================
-- RLS Policies for placement_timeline
-- =========================
DO $$
BEGIN
  -- Only create policies if tables exist and have required columns
  IF to_regclass('public.placement_timeline') IS NOT NULL 
     AND to_regclass('public.placements') IS NOT NULL
     AND EXISTS (
       SELECT 1 FROM pg_attribute 
       WHERE attrelid = 'public.placements'::regclass AND attname = 'agency_id' AND NOT attisdropped
     ) THEN
    -- Agency can view timeline for their placements
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE schemaname='public' AND tablename='placement_timeline' 
      AND policyname='Agencies can view their placement timeline'
    ) THEN
      CREATE POLICY "Agencies can view their placement timeline"
        ON public.placement_timeline FOR SELECT
        USING (
          EXISTS (
            SELECT 1 FROM public.placements
            JOIN public.users ON users.id = placements.agency_id
            WHERE placements.id = placement_timeline.placement_id
            AND users.id = auth.uid()
            AND users.role = 'ngo_agency'
          )
        );
    END IF;

    -- Agency can insert timeline entries for their placements
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE schemaname='public' AND tablename='placement_timeline' 
      AND policyname='Agencies can insert timeline entries'
    ) THEN
      CREATE POLICY "Agencies can insert timeline entries"
        ON public.placement_timeline FOR INSERT
        WITH CHECK (
          EXISTS (
            SELECT 1 FROM public.placements
            JOIN public.users ON users.id = placements.agency_id
            WHERE placements.id = placement_timeline.placement_id
            AND users.id = auth.uid()
            AND users.role = 'ngo_agency'
          )
        );
    END IF;

    -- Service role can manage all timeline entries
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE schemaname='public' AND tablename='placement_timeline' 
      AND policyname='Service can manage timeline'
    ) THEN
      CREATE POLICY "Service can manage timeline"
        ON public.placement_timeline FOR ALL
        USING (auth.role() = 'service_role');
    END IF;
  END IF;
END$$;

-- =========================
-- RLS Policies for messages
-- =========================
DO $$
BEGIN
  -- Only create policies if table exists and has required columns
  IF to_regclass('public.messages') IS NOT NULL AND EXISTS (
    SELECT 1 FROM pg_attribute 
    WHERE attrelid = 'public.messages'::regclass AND attname = 'agency_id' AND NOT attisdropped
  ) THEN
    -- Agency can view their own messages
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE schemaname='public' AND tablename='messages' 
      AND policyname='Agencies can view their messages'
    ) THEN
      CREATE POLICY "Agencies can view their messages"
        ON public.messages FOR SELECT
        USING (
          EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.role = 'ngo_agency'
            AND messages.agency_id = users.id
          )
        );
    END IF;

    -- Agency can insert their own messages
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE schemaname='public' AND tablename='messages' 
      AND policyname='Agencies can insert their messages'
    ) THEN
      CREATE POLICY "Agencies can insert their messages"
        ON public.messages FOR INSERT
        WITH CHECK (
          EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid()
            AND users.role = 'ngo_agency'
            AND messages.agency_id = users.id
          )
        );
    END IF;

    -- Service role can manage all messages
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE schemaname='public' AND tablename='messages' 
      AND policyname='Service can manage messages'
    ) THEN
      CREATE POLICY "Service can manage messages"
        ON public.messages FOR ALL
        USING (auth.role() = 'service_role');
    END IF;
  END IF;
END$$;

-- =========================
-- Triggers for updated_at
-- =========================
DO $$
BEGIN
  -- placements updated_at trigger
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_placements_updated_at') THEN
    CREATE TRIGGER update_placements_updated_at
      BEFORE UPDATE ON public.placements
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;

  -- agency_workers updated_at trigger
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_agency_workers_updated_at') THEN
    CREATE TRIGGER update_agency_workers_updated_at
      BEFORE UPDATE ON public.agency_workers
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END$$;

-- =========================
-- Add tenant_id to existing tables if missing (do this BEFORE creating triggers)
-- =========================
DO $$
DECLARE
  v_default_tenant_id UUID;
BEGIN
  -- Get default tenant ID
  SELECT id INTO v_default_tenant_id FROM public.tenants WHERE slug = 'default' LIMIT 1;
  
  IF v_default_tenant_id IS NULL THEN
    INSERT INTO public.tenants (name, slug, status) 
    VALUES ('Default Tenant', 'default', 'active')
    RETURNING id INTO v_default_tenant_id;
  END IF;

  -- Add tenant_id to placements if missing
  IF to_regclass('public.placements') IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_attribute 
      WHERE attrelid = 'public.placements'::regclass AND attname = 'tenant_id' AND NOT attisdropped
    ) THEN
      ALTER TABLE public.placements ADD COLUMN tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
      UPDATE public.placements SET tenant_id = v_default_tenant_id WHERE tenant_id IS NULL;
      ALTER TABLE public.placements ALTER COLUMN tenant_id SET NOT NULL;
    END IF;
  END IF;

  -- Add tenant_id to agency_workers if missing
  IF to_regclass('public.agency_workers') IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_attribute 
      WHERE attrelid = 'public.agency_workers'::regclass AND attname = 'tenant_id' AND NOT attisdropped
    ) THEN
      ALTER TABLE public.agency_workers ADD COLUMN tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
      UPDATE public.agency_workers SET tenant_id = v_default_tenant_id WHERE tenant_id IS NULL;
      ALTER TABLE public.agency_workers ALTER COLUMN tenant_id SET NOT NULL;
    END IF;
  END IF;

  -- Add tenant_id to placement_timeline if missing
  IF to_regclass('public.placement_timeline') IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_attribute 
      WHERE attrelid = 'public.placement_timeline'::regclass AND attname = 'tenant_id' AND NOT attisdropped
    ) THEN
      ALTER TABLE public.placement_timeline ADD COLUMN tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
      UPDATE public.placement_timeline SET tenant_id = v_default_tenant_id WHERE tenant_id IS NULL;
    END IF;
  END IF;

  -- Add tenant_id to messages if missing
  IF to_regclass('public.messages') IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_attribute 
      WHERE attrelid = 'public.messages'::regclass AND attname = 'tenant_id' AND NOT attisdropped
    ) THEN
      ALTER TABLE public.messages ADD COLUMN tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE;
      UPDATE public.messages SET tenant_id = v_default_tenant_id WHERE tenant_id IS NULL;
    END IF;
  END IF;

  -- Now create tenant_id indexes after ensuring columns exist
  IF to_regclass('public.placements') IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM pg_attribute 
      WHERE attrelid = 'public.placements'::regclass AND attname = 'tenant_id' AND NOT attisdropped
    ) THEN
      CREATE INDEX IF NOT EXISTS idx_placements_tenant_id ON public.placements(tenant_id);
    END IF;
  END IF;

  IF to_regclass('public.agency_workers') IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM pg_attribute 
      WHERE attrelid = 'public.agency_workers'::regclass AND attname = 'tenant_id' AND NOT attisdropped
    ) THEN
      CREATE INDEX IF NOT EXISTS idx_agency_workers_tenant_id ON public.agency_workers(tenant_id);
    END IF;
  END IF;

  IF to_regclass('public.placement_timeline') IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM pg_attribute 
      WHERE attrelid = 'public.placement_timeline'::regclass AND attname = 'tenant_id' AND NOT attisdropped
    ) THEN
      CREATE INDEX IF NOT EXISTS idx_placement_timeline_tenant_id ON public.placement_timeline(tenant_id);
    END IF;
  END IF;

  IF to_regclass('public.messages') IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM pg_attribute 
      WHERE attrelid = 'public.messages'::regclass AND attname = 'tenant_id' AND NOT attisdropped
    ) THEN
      CREATE INDEX IF NOT EXISTS idx_messages_tenant_id ON public.messages(tenant_id);
    END IF;
  END IF;
END$$;

-- =========================
-- Trigger to create timeline entry on placement status change
-- (Created AFTER ensuring tenant_id columns exist)
-- =========================
CREATE OR REPLACE FUNCTION create_placement_timeline_entry()
RETURNS TRIGGER AS $$
DECLARE
  v_tenant_id UUID;
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    -- Get tenant_id from NEW record (column should exist at this point)
    v_tenant_id := NEW.tenant_id;
    
    -- Fallback to default tenant if tenant_id is NULL
    IF v_tenant_id IS NULL THEN
      SELECT id INTO v_tenant_id FROM public.tenants WHERE slug = 'default' LIMIT 1;
    END IF;
    
    INSERT INTO public.placement_timeline (
      tenant_id,
      placement_id,
      status,
      notes,
      created_by
    ) VALUES (
      COALESCE(v_tenant_id, (SELECT id FROM public.tenants WHERE slug = 'default' LIMIT 1)),
      NEW.id,
      NEW.status,
      'Status changed from ' || OLD.status || ' to ' || NEW.status,
      auth.uid()
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'placement_status_timeline_trigger') THEN
    CREATE TRIGGER placement_status_timeline_trigger
      AFTER UPDATE ON public.placements
      FOR EACH ROW
      WHEN (OLD.status IS DISTINCT FROM NEW.status)
      EXECUTE FUNCTION create_placement_timeline_entry();
  END IF;
END$$;

-- =========================
-- Update users table to include ngo_agency role if needed
-- =========================
DO $$
BEGIN
  -- Check if the role constraint needs updating
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'users_role_check' 
    AND table_name = 'users'
  ) THEN
    -- Drop the old constraint
    ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;
    
    -- Add new constraint with ngo_agency role
    ALTER TABLE public.users ADD CONSTRAINT users_role_check 
      CHECK (role IN ('customer', 'provider', 'admin', 'root_admin', 'ngo_agency', 'cleaner', 'candidate'));
  END IF;
END$$;

