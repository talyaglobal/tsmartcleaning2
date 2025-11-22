-- Enhanced Row Level Security (RLS) Policies
-- This script builds upon existing RLS setup and adds comprehensive security policies
-- for all tables with proper tenant isolation and access controls

-- =========================
-- 1. UTILITY FUNCTIONS FOR RLS
-- =========================

-- Function to get current user's tenant ID
CREATE OR REPLACE FUNCTION public.current_tenant_id()
RETURNS UUID
LANGUAGE sql SECURITY DEFINER
AS $$
  SELECT COALESCE(
    -- Try to get tenant_id from JWT claims
    (auth.jwt()->>'tenant_id')::uuid,
    -- Fallback: get tenant_id from user's membership
    (
      SELECT t.id 
      FROM public.tenants t
      JOIN public.tenant_members tm ON t.id = tm.tenant_id
      WHERE tm.user_id = auth.uid()
      LIMIT 1
    )
  );
$$;

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role IN ('admin', 'root_admin')
  );
$$;

-- Function to check if user belongs to tenant
CREATE OR REPLACE FUNCTION public.user_belongs_to_tenant(tenant_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.tenant_members
    WHERE user_id = auth.uid() AND tenant_id = tenant_uuid
  ) OR public.is_admin();
$$;

-- =========================
-- 2. TENANT MEMBERS TABLE (if not exists)
-- =========================

CREATE TABLE IF NOT EXISTS public.tenant_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  permissions JSONB DEFAULT '{}'::jsonb,
  invited_by UUID REFERENCES public.users(id),
  invited_at TIMESTAMPTZ,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'pending')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, user_id)
);

CREATE INDEX IF NOT EXISTS tenant_members_tenant_idx ON public.tenant_members(tenant_id);
CREATE INDEX IF NOT EXISTS tenant_members_user_idx ON public.tenant_members(user_id);
CREATE INDEX IF NOT EXISTS tenant_members_role_idx ON public.tenant_members(tenant_id, role);

-- Enable RLS on tenant_members
ALTER TABLE public.tenant_members ENABLE ROW LEVEL SECURITY;

-- =========================
-- 3. ENHANCED TENANT-AWARE POLICIES
-- =========================

-- Drop existing tenant isolation policies to replace with enhanced ones
DO $$
BEGIN
  -- Drop existing policies that might conflict
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename='tenants' AND policyname='tenant_isolation_tenants') THEN
    DROP POLICY tenant_isolation_tenants ON public.tenants;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename='tenant_branding' AND policyname='tenant_isolation_tenant_branding') THEN
    DROP POLICY tenant_isolation_tenant_branding ON public.tenant_branding;
  END IF;
END$$;

-- Enhanced tenant policies with proper access control
CREATE POLICY enhanced_tenant_access ON public.tenants FOR ALL USING (
  -- User is a member of this tenant
  public.user_belongs_to_tenant(id) OR
  -- System admin access
  public.is_admin()
) WITH CHECK (
  -- Only admins or tenant owners can modify
  public.is_admin() OR
  EXISTS (
    SELECT 1 FROM public.tenant_members
    WHERE tenant_id = id AND user_id = auth.uid() 
    AND role IN ('owner', 'admin')
  )
);

-- Tenant members policy
CREATE POLICY tenant_members_policy ON public.tenant_members FOR ALL USING (
  -- Users can see members of their tenants
  public.user_belongs_to_tenant(tenant_id) OR
  -- Users can see their own memberships
  user_id = auth.uid() OR
  -- Admin access
  public.is_admin()
) WITH CHECK (
  -- Only tenant admins/owners or system admins can modify
  public.is_admin() OR
  EXISTS (
    SELECT 1 FROM public.tenant_members tm
    WHERE tm.tenant_id = tenant_id AND tm.user_id = auth.uid()
    AND tm.role IN ('owner', 'admin')
  )
);

-- =========================
-- 4. ENHANCED BUSINESS TABLE POLICIES
-- =========================

-- Companies with tenant isolation (if companies belong to tenants)
DO $$
BEGIN
  IF to_regclass('public.companies') IS NOT NULL THEN
    -- Check if companies table has tenant_id column
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'companies' AND column_name = 'tenant_id'
    ) THEN
      DROP POLICY IF EXISTS company_access_policy ON public.companies;
      
      CREATE POLICY companies_tenant_isolation ON public.companies FOR ALL USING (
        -- User belongs to the same tenant
        public.user_belongs_to_tenant(tenant_id) OR
        -- Admin access
        public.is_admin()
      ) WITH CHECK (
        -- Only allow modifications within user's tenant
        public.user_belongs_to_tenant(COALESCE(tenant_id, public.current_tenant_id())) OR
        public.is_admin()
      );
    END IF;
  END IF;
END$$;

-- Bookings with enhanced tenant isolation
DO $$
BEGIN
  IF to_regclass('public.bookings') IS NOT NULL THEN
    -- Add tenant_id to bookings if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'bookings' AND column_name = 'tenant_id'
    ) THEN
      ALTER TABLE public.bookings ADD COLUMN tenant_id UUID REFERENCES public.tenants(id);
      CREATE INDEX IF NOT EXISTS bookings_tenant_idx ON public.bookings(tenant_id);
    END IF;

    DROP POLICY IF EXISTS booking_access ON public.bookings;
    
    CREATE POLICY bookings_enhanced_access ON public.bookings FOR ALL USING (
      -- Customer can access their bookings
      auth.uid() = customer_id OR
      -- Provider can access their bookings
      (provider_id IS NOT NULL AND auth.uid() IN (
        SELECT user_id FROM public.provider_profiles WHERE id = provider_id
      )) OR
      -- Tenant members can access bookings in their tenant
      public.user_belongs_to_tenant(tenant_id) OR
      -- Admin access
      public.is_admin()
    ) WITH CHECK (
      -- Ensure bookings are created within proper tenant context
      (tenant_id IS NULL OR public.user_belongs_to_tenant(tenant_id)) OR
      public.is_admin()
    );
  END IF;
END$$;

-- =========================
-- 5. AUDIT AND SECURITY TABLES
-- =========================

-- Security events table for monitoring
CREATE TABLE IF NOT EXISTS public.security_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'auth_failure', 'suspicious_activity', 'rate_limit_exceeded',
    'unauthorized_access', 'data_breach_attempt', 'privilege_escalation'
  )),
  severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  resource_type TEXT,
  resource_id TEXT,
  ip_address INET,
  user_agent TEXT,
  details JSONB DEFAULT '{}'::jsonb,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS security_events_tenant_idx ON public.security_events(tenant_id);
CREATE INDEX IF NOT EXISTS security_events_type_idx ON public.security_events(event_type);
CREATE INDEX IF NOT EXISTS security_events_severity_idx ON public.security_events(severity);
CREATE INDEX IF NOT EXISTS security_events_created_idx ON public.security_events(created_at DESC);

ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY security_events_access ON public.security_events FOR ALL USING (
  -- Tenant members can see events in their tenant
  public.user_belongs_to_tenant(tenant_id) OR
  -- Users can see their own security events
  user_id = auth.uid() OR
  -- Admin access
  public.is_admin()
) WITH CHECK (
  -- Only security admins or system admins can create/modify
  public.is_admin() OR
  EXISTS (
    SELECT 1 FROM public.tenant_members
    WHERE tenant_id = security_events.tenant_id 
    AND user_id = auth.uid() 
    AND (permissions->>'security_admin')::boolean = true
  )
);

-- Data access log for compliance
CREATE TABLE IF NOT EXISTS public.data_access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  table_name TEXT NOT NULL,
  operation TEXT NOT NULL CHECK (operation IN ('SELECT', 'INSERT', 'UPDATE', 'DELETE')),
  record_id TEXT,
  affected_columns TEXT[],
  old_values JSONB,
  new_values JSONB,
  query_hash TEXT,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS data_access_logs_tenant_idx ON public.data_access_logs(tenant_id);
CREATE INDEX IF NOT EXISTS data_access_logs_user_idx ON public.data_access_logs(user_id);
CREATE INDEX IF NOT EXISTS data_access_logs_table_idx ON public.data_access_logs(table_name);
CREATE INDEX IF NOT EXISTS data_access_logs_created_idx ON public.data_access_logs(created_at DESC);

ALTER TABLE public.data_access_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY data_access_logs_policy ON public.data_access_logs FOR ALL USING (
  -- Users can see their own access logs
  user_id = auth.uid() OR
  -- Tenant admins can see all logs in their tenant
  (public.user_belongs_to_tenant(tenant_id) AND EXISTS (
    SELECT 1 FROM public.tenant_members
    WHERE tenant_id = data_access_logs.tenant_id 
    AND user_id = auth.uid() 
    AND role IN ('owner', 'admin')
  )) OR
  -- System admin access
  public.is_admin()
);

-- =========================
-- 6. TRIGGERS FOR AUDIT LOGGING
-- =========================

-- Function to log data access
CREATE OR REPLACE FUNCTION public.log_data_access()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  -- Only log if user is authenticated and not service role
  IF auth.uid() IS NOT NULL AND current_setting('role', true) != 'service_role' THEN
    INSERT INTO public.data_access_logs (
      tenant_id,
      user_id,
      table_name,
      operation,
      record_id,
      old_values,
      new_values,
      created_at
    ) VALUES (
      public.current_tenant_id(),
      auth.uid(),
      TG_TABLE_NAME,
      TG_OP,
      CASE 
        WHEN TG_OP = 'DELETE' THEN (OLD.id)::text
        ELSE (NEW.id)::text
      END,
      CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN row_to_json(OLD) END,
      CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN row_to_json(NEW) END,
      NOW()
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- =========================
-- 7. APPLY AUDIT TRIGGERS TO SENSITIVE TABLES
-- =========================

-- Add audit triggers to critical tables
DO $$
DECLARE
  table_record RECORD;
BEGIN
  FOR table_record IN 
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name IN (
      'users', 'bookings', 'transactions', 'payments', 
      'provider_profiles', 'companies', 'tenant_members'
    )
  LOOP
    -- Drop existing trigger if it exists
    EXECUTE format('DROP TRIGGER IF EXISTS %I_audit_trigger ON public.%I', 
                   table_record.table_name, table_record.table_name);
    
    -- Create audit trigger
    EXECUTE format('CREATE TRIGGER %I_audit_trigger 
                    AFTER INSERT OR UPDATE OR DELETE ON public.%I
                    FOR EACH ROW EXECUTE FUNCTION public.log_data_access()',
                   table_record.table_name, table_record.table_name);
  END LOOP;
END$$;

-- =========================
-- 8. SECURITY VALIDATION VIEWS
-- =========================

-- View to check RLS status
CREATE OR REPLACE VIEW public.rls_status AS
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled,
  (
    SELECT count(*) 
    FROM pg_policies p 
    WHERE p.schemaname = t.schemaname 
    AND p.tablename = t.tablename
  ) as policy_count
FROM pg_tables t
WHERE schemaname = 'public'
  AND tablename NOT LIKE '%_backup'
  AND tablename NOT LIKE 'pg_%'
ORDER BY tablename;

-- View to check tenant isolation
CREATE OR REPLACE VIEW public.tenant_isolation_status AS
SELECT 
  t.tablename,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns c
      WHERE c.table_name = t.tablename 
      AND c.column_name = 'tenant_id'
    ) THEN 'Has tenant_id column'
    ELSE 'Missing tenant_id column'
  END as tenant_column_status,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_policies p
      WHERE p.tablename = t.tablename
      AND (p.qual LIKE '%tenant_id%' OR p.with_check LIKE '%tenant_id%')
    ) THEN 'Has tenant isolation policy'
    ELSE 'Missing tenant isolation policy'
  END as policy_status
FROM pg_tables t
WHERE t.schemaname = 'public'
  AND t.tablename NOT LIKE '%_backup'
  AND t.tablename NOT LIKE 'pg_%'
  AND t.rowsecurity = true
ORDER BY t.tablename;

-- =========================
-- 9. SECURITY FUNCTIONS
-- =========================

-- Function to validate tenant access
CREATE OR REPLACE FUNCTION public.validate_tenant_access(
  table_name TEXT,
  record_id UUID,
  required_permission TEXT DEFAULT 'read'
)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  tenant_uuid UUID;
  has_access BOOLEAN := false;
BEGIN
  -- Get tenant_id for the record
  EXECUTE format('SELECT tenant_id FROM public.%I WHERE id = $1', table_name)
  INTO tenant_uuid
  USING record_id;
  
  -- Check if user has access to this tenant
  SELECT public.user_belongs_to_tenant(tenant_uuid) INTO has_access;
  
  -- Additional permission check if specified
  IF has_access AND required_permission != 'read' THEN
    SELECT EXISTS (
      SELECT 1 FROM public.tenant_members
      WHERE tenant_id = tenant_uuid 
      AND user_id = auth.uid()
      AND (
        role IN ('owner', 'admin') OR
        (permissions->>required_permission)::boolean = true
      )
    ) INTO has_access;
  END IF;
  
  RETURN has_access OR public.is_admin();
END;
$$;

-- Function to check for suspicious activity
CREATE OR REPLACE FUNCTION public.detect_suspicious_activity()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  recent_count INTEGER;
  tenant_uuid UUID;
BEGIN
  -- Get tenant context
  tenant_uuid := public.current_tenant_id();
  
  -- Check for rapid successive operations
  SELECT COUNT(*)
  FROM public.data_access_logs
  WHERE user_id = auth.uid()
    AND table_name = TG_TABLE_NAME
    AND created_at >= NOW() - INTERVAL '5 minutes'
  INTO recent_count;
  
  -- Log suspicious activity if too many operations
  IF recent_count > 50 THEN
    INSERT INTO public.security_events (
      tenant_id, event_type, severity, user_id,
      resource_type, details
    ) VALUES (
      tenant_uuid, 'suspicious_activity', 'high', auth.uid(),
      TG_TABLE_NAME,
      jsonb_build_object(
        'operation_count', recent_count,
        'time_window', '5 minutes',
        'table', TG_TABLE_NAME
      )
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- =========================
-- 10. FINAL VALIDATIONS
-- =========================

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON public.rls_status TO authenticated;
GRANT SELECT ON public.tenant_isolation_status TO authenticated;

-- Comments for documentation
COMMENT ON TABLE public.tenant_members IS 'Multi-tenant membership table with role-based access control';
COMMENT ON TABLE public.security_events IS 'Security incident logging and monitoring';
COMMENT ON TABLE public.data_access_logs IS 'Audit trail for data access compliance';
COMMENT ON FUNCTION public.current_tenant_id() IS 'Gets current user tenant context';
COMMENT ON FUNCTION public.user_belongs_to_tenant(UUID) IS 'Checks if user belongs to specified tenant';
COMMENT ON VIEW public.rls_status IS 'Shows RLS enablement status for all tables';
COMMENT ON VIEW public.tenant_isolation_status IS 'Shows tenant isolation implementation status';

-- Final verification query
SELECT 
  'Enhanced RLS policies and audit system successfully implemented!' as status,
  COUNT(*) as tables_with_rls
FROM pg_tables t
WHERE t.schemaname = 'public' 
  AND t.rowsecurity = true;