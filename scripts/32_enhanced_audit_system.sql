-- Enhanced Audit Logging System
-- This script extends the existing audit logs with comprehensive monitoring
-- and adds advanced audit features for compliance and security

-- =========================
-- 1. ENHANCED AUDIT LOGS TABLE STRUCTURE
-- =========================

-- Add additional columns to existing audit_logs table if they don't exist
DO $$
BEGIN
  -- Add session_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'audit_logs' AND column_name = 'session_id'
  ) THEN
    ALTER TABLE public.audit_logs ADD COLUMN session_id UUID;
  END IF;
  
  -- Add request_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'audit_logs' AND column_name = 'request_id'
  ) THEN
    ALTER TABLE public.audit_logs ADD COLUMN request_id UUID;
  END IF;
  
  -- Add severity column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'audit_logs' AND column_name = 'severity'
  ) THEN
    ALTER TABLE public.audit_logs ADD COLUMN severity TEXT DEFAULT 'info' 
      CHECK (severity IN ('debug', 'info', 'warning', 'error', 'critical'));
  END IF;
  
  -- Add tags column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'audit_logs' AND column_name = 'tags'
  ) THEN
    ALTER TABLE public.audit_logs ADD COLUMN tags TEXT[];
  END IF;
  
  -- Add correlation_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'audit_logs' AND column_name = 'correlation_id'
  ) THEN
    ALTER TABLE public.audit_logs ADD COLUMN correlation_id UUID;
  END IF;
END$$;

-- Add indexes for enhanced audit logs
CREATE INDEX IF NOT EXISTS audit_logs_session_id_idx ON public.audit_logs(session_id);
CREATE INDEX IF NOT EXISTS audit_logs_request_id_idx ON public.audit_logs(request_id);
CREATE INDEX IF NOT EXISTS audit_logs_severity_idx ON public.audit_logs(severity);
CREATE INDEX IF NOT EXISTS audit_logs_tags_idx ON public.audit_logs USING GIN(tags);
CREATE INDEX IF NOT EXISTS audit_logs_correlation_id_idx ON public.audit_logs(correlation_id);

-- =========================
-- 2. COMPLIANCE AUDIT TABLE
-- =========================

CREATE TABLE IF NOT EXISTS public.compliance_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  compliance_type TEXT NOT NULL CHECK (compliance_type IN (
    'gdpr_access', 'gdpr_deletion', 'gdpr_rectification', 'gdpr_portability',
    'ccpa_access', 'ccpa_deletion', 'sox_financial', 'hipaa_access',
    'pci_access', 'iso27001_access'
  )),
  regulation TEXT NOT NULL, -- e.g., 'GDPR', 'CCPA', 'SOX', 'HIPAA'
  subject_type TEXT NOT NULL, -- e.g., 'data_subject', 'financial_record', 'health_record'
  subject_id UUID, -- ID of the subject (user, record, etc.)
  action_taken TEXT NOT NULL,
  legal_basis TEXT, -- GDPR legal basis
  retention_period INTERVAL, -- How long this record must be kept
  officer_id UUID REFERENCES public.users(id), -- Data Protection Officer or Compliance Officer
  documentation JSONB DEFAULT '{}'::jsonb,
  external_reference TEXT, -- Reference to external compliance systems
  audit_trail JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ, -- When this compliance record can be deleted
  INDEX (tenant_id, compliance_type),
  INDEX (regulation, created_at),
  INDEX (subject_type, subject_id),
  INDEX (expires_at)
);

ALTER TABLE public.compliance_audit_logs ENABLE ROW LEVEL SECURITY;

-- =========================
-- 3. FINANCIAL AUDIT TABLE (SOX Compliance)
-- =========================

CREATE TABLE IF NOT EXISTS public.financial_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  transaction_id UUID, -- Reference to financial transaction
  financial_period TEXT, -- e.g., '2024-Q1', '2024-03'
  account_code TEXT,
  audit_type TEXT NOT NULL CHECK (audit_type IN (
    'revenue_recognition', 'expense_validation', 'asset_verification',
    'liability_review', 'equity_adjustment', 'control_test'
  )),
  control_id TEXT, -- Internal control reference
  test_result TEXT CHECK (test_result IN ('passed', 'failed', 'not_applicable', 'deficiency')),
  materiality_level TEXT CHECK (materiality_level IN ('immaterial', 'material', 'significant')),
  auditor_id UUID REFERENCES public.users(id),
  finding_description TEXT,
  remediation_required BOOLEAN DEFAULT false,
  remediation_action TEXT,
  remediation_deadline DATE,
  supporting_evidence JSONB DEFAULT '{}'::jsonb,
  management_response TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES public.users(id)
);

CREATE INDEX IF NOT EXISTS financial_audit_tenant_period_idx 
  ON public.financial_audit_logs(tenant_id, financial_period);
CREATE INDEX IF NOT EXISTS financial_audit_control_idx 
  ON public.financial_audit_logs(control_id);
CREATE INDEX IF NOT EXISTS financial_audit_materiality_idx 
  ON public.financial_audit_logs(materiality_level, test_result);

ALTER TABLE public.financial_audit_logs ENABLE ROW LEVEL SECURITY;

-- =========================
-- 4. CHANGE TRACKING TABLE
-- =========================

CREATE TABLE IF NOT EXISTS public.change_tracking_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  operation TEXT NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE', 'TRUNCATE')),
  changed_by UUID REFERENCES public.users(id),
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  old_values JSONB,
  new_values JSONB,
  changed_columns TEXT[], -- Array of changed column names
  change_reason TEXT, -- Why was this change made?
  approval_required BOOLEAN DEFAULT false,
  approved_by UUID REFERENCES public.users(id),
  approved_at TIMESTAMPTZ,
  approval_reason TEXT,
  rollback_data JSONB, -- Data needed to rollback this change
  change_hash TEXT, -- Hash of the change for integrity verification
  business_context JSONB DEFAULT '{}'::jsonb, -- Business context for the change
  
  -- Indexes
  INDEX (tenant_id, table_name, changed_at),
  INDEX (record_id, table_name),
  INDEX (changed_by, changed_at),
  INDEX (approval_required, approved_at)
);

ALTER TABLE public.change_tracking_logs ENABLE ROW LEVEL SECURITY;

-- =========================
-- 5. ENHANCED AUDIT FUNCTIONS
-- =========================

-- Function to create detailed audit log entries
CREATE OR REPLACE FUNCTION public.create_audit_log(
  p_tenant_id UUID,
  p_action TEXT,
  p_resource TEXT,
  p_resource_id TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb,
  p_severity TEXT DEFAULT 'info',
  p_tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  p_session_id UUID DEFAULT NULL,
  p_request_id UUID DEFAULT NULL,
  p_correlation_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  audit_id UUID;
  current_user_id UUID;
  current_ip INET;
  current_user_agent TEXT;
BEGIN
  -- Get current user context
  current_user_id := auth.uid();
  
  -- Try to get IP and user agent from request context
  BEGIN
    current_ip := (current_setting('request.headers', true)::jsonb->>'x-forwarded-for')::inet;
  EXCEPTION WHEN OTHERS THEN
    current_ip := NULL;
  END;
  
  BEGIN
    current_user_agent := current_setting('request.headers', true)::jsonb->>'user-agent';
  EXCEPTION WHEN OTHERS THEN
    current_user_agent := NULL;
  END;
  
  INSERT INTO public.audit_logs (
    tenant_id, user_id, action, resource, resource_id, metadata,
    severity, tags, session_id, request_id, correlation_id,
    ip, user_agent, created_at
  ) VALUES (
    p_tenant_id, current_user_id, p_action, p_resource, p_resource_id, p_metadata,
    p_severity, p_tags, p_session_id, p_request_id, p_correlation_id,
    current_ip, current_user_agent, NOW()
  ) RETURNING id INTO audit_id;
  
  RETURN audit_id;
END;
$$;

-- Function to log compliance events
CREATE OR REPLACE FUNCTION public.log_compliance_event(
  p_tenant_id UUID,
  p_compliance_type TEXT,
  p_regulation TEXT,
  p_subject_type TEXT,
  p_subject_id UUID,
  p_action_taken TEXT,
  p_legal_basis TEXT DEFAULT NULL,
  p_retention_period INTERVAL DEFAULT NULL,
  p_documentation JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  compliance_id UUID;
  expires_at TIMESTAMPTZ;
BEGIN
  -- Calculate expiration date if retention period is provided
  IF p_retention_period IS NOT NULL THEN
    expires_at := NOW() + p_retention_period;
  END IF;
  
  INSERT INTO public.compliance_audit_logs (
    tenant_id, compliance_type, regulation, subject_type, subject_id,
    action_taken, legal_basis, retention_period, documentation,
    officer_id, created_at, expires_at
  ) VALUES (
    p_tenant_id, p_compliance_type, p_regulation, p_subject_type, p_subject_id,
    p_action_taken, p_legal_basis, p_retention_period, p_documentation,
    auth.uid(), NOW(), expires_at
  ) RETURNING id INTO compliance_id;
  
  -- Also create a regular audit log entry
  PERFORM public.create_audit_log(
    p_tenant_id,
    'compliance_event',
    'compliance_audit',
    compliance_id::text,
    jsonb_build_object(
      'compliance_type', p_compliance_type,
      'regulation', p_regulation,
      'subject_type', p_subject_type
    ),
    'info',
    ARRAY['compliance', p_regulation::text, p_compliance_type::text]
  );
  
  RETURN compliance_id;
END;
$$;

-- Function to track data changes with approval workflow
CREATE OR REPLACE FUNCTION public.track_data_change(
  p_tenant_id UUID,
  p_table_name TEXT,
  p_record_id UUID,
  p_operation TEXT,
  p_old_values JSONB DEFAULT NULL,
  p_new_values JSONB DEFAULT NULL,
  p_changed_columns TEXT[] DEFAULT ARRAY[]::TEXT[],
  p_change_reason TEXT DEFAULT NULL,
  p_requires_approval BOOLEAN DEFAULT false,
  p_business_context JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  change_id UUID;
  change_data TEXT;
  change_hash_value TEXT;
BEGIN
  -- Create hash of the change for integrity
  change_data := p_table_name || p_record_id::text || p_operation || 
                COALESCE(p_old_values::text, '') || COALESCE(p_new_values::text, '');
  change_hash_value := encode(sha256(change_data::bytea), 'hex');
  
  INSERT INTO public.change_tracking_logs (
    tenant_id, table_name, record_id, operation, changed_by,
    old_values, new_values, changed_columns, change_reason,
    approval_required, business_context, change_hash, changed_at
  ) VALUES (
    p_tenant_id, p_table_name, p_record_id, p_operation, auth.uid(),
    p_old_values, p_new_values, p_changed_columns, p_change_reason,
    p_requires_approval, p_business_context, change_hash_value, NOW()
  ) RETURNING id INTO change_id;
  
  -- Create audit log entry
  PERFORM public.create_audit_log(
    p_tenant_id,
    'data_change',
    p_table_name,
    p_record_id::text,
    jsonb_build_object(
      'operation', p_operation,
      'changed_columns', p_changed_columns,
      'requires_approval', p_requires_approval,
      'change_id', change_id
    ),
    CASE 
      WHEN p_operation = 'DELETE' THEN 'warning'
      WHEN p_requires_approval THEN 'info'
      ELSE 'debug'
    END,
    ARRAY['data_change', p_operation::text, p_table_name]
  );
  
  RETURN change_id;
END;
$$;

-- =========================
-- 6. AUTOMATED AUDIT TRIGGERS
-- =========================

-- Enhanced audit trigger function
CREATE OR REPLACE FUNCTION public.audit_trigger_enhanced()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  tenant_uuid UUID;
  changed_cols TEXT[];
  old_values_json JSONB;
  new_values_json JSONB;
BEGIN
  -- Get tenant context
  tenant_uuid := public.current_tenant_id();
  
  -- Skip if no tenant context (system operations)
  IF tenant_uuid IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;
  
  -- Determine changed columns for UPDATE operations
  IF TG_OP = 'UPDATE' THEN
    SELECT array_agg(key) INTO changed_cols
    FROM jsonb_each(to_jsonb(NEW))
    WHERE to_jsonb(NEW) -> key != to_jsonb(OLD) -> key;
    
    old_values_json := to_jsonb(OLD);
    new_values_json := to_jsonb(NEW);
  ELSIF TG_OP = 'INSERT' THEN
    new_values_json := to_jsonb(NEW);
  ELSIF TG_OP = 'DELETE' THEN
    old_values_json := to_jsonb(OLD);
  END IF;
  
  -- Create enhanced audit log
  PERFORM public.create_audit_log(
    tenant_uuid,
    'data_' || lower(TG_OP),
    TG_TABLE_NAME,
    CASE 
      WHEN TG_OP = 'DELETE' THEN (OLD.id)::text
      ELSE (NEW.id)::text
    END,
    jsonb_build_object(
      'operation', TG_OP,
      'table', TG_TABLE_NAME,
      'changed_columns', changed_cols,
      'trigger_name', TG_NAME
    ),
    CASE 
      WHEN TG_OP = 'DELETE' THEN 'warning'
      WHEN array_length(changed_cols, 1) > 5 THEN 'info' -- Many changes
      ELSE 'debug'
    END,
    ARRAY['database', 'data_change', TG_TABLE_NAME, lower(TG_OP)]
  );
  
  -- Create change tracking entry for critical tables
  IF TG_TABLE_NAME IN ('users', 'transactions', 'financial_records', 'payments') THEN
    PERFORM public.track_data_change(
      tenant_uuid,
      TG_TABLE_NAME,
      CASE 
        WHEN TG_OP = 'DELETE' THEN OLD.id
        ELSE NEW.id
      END,
      TG_OP,
      old_values_json,
      new_values_json,
      changed_cols,
      'Automated tracking via trigger'
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- =========================
-- 7. AUDIT RETENTION AND CLEANUP
-- =========================

-- Function to clean up expired audit logs
CREATE OR REPLACE FUNCTION public.cleanup_expired_audit_logs()
RETURNS INTEGER
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER := 0;
  retention_config JSONB;
BEGIN
  -- Default retention periods (can be overridden per tenant)
  retention_config := jsonb_build_object(
    'debug_logs', '30 days',
    'info_logs', '1 year', 
    'warning_logs', '3 years',
    'error_logs', '7 years',
    'critical_logs', '10 years',
    'compliance_logs', '7 years',
    'financial_logs', '7 years'
  );
  
  -- Clean up audit_logs based on severity
  WITH deleted AS (
    DELETE FROM public.audit_logs
    WHERE 
      (severity = 'debug' AND created_at < NOW() - INTERVAL '30 days') OR
      (severity = 'info' AND created_at < NOW() - INTERVAL '1 year') OR
      (severity = 'warning' AND created_at < NOW() - INTERVAL '3 years') OR
      (severity = 'error' AND created_at < NOW() - INTERVAL '7 years') OR
      (severity = 'critical' AND created_at < NOW() - INTERVAL '10 years')
    RETURNING id
  )
  SELECT count(*) INTO deleted_count FROM deleted;
  
  -- Clean up expired compliance logs
  DELETE FROM public.compliance_audit_logs
  WHERE expires_at IS NOT NULL AND expires_at < NOW();
  
  -- Clean up old change tracking logs (keep 2 years)
  DELETE FROM public.change_tracking_logs
  WHERE changed_at < NOW() - INTERVAL '2 years';
  
  RETURN deleted_count;
END;
$$;

-- =========================
-- 8. AUDIT REPORTING VIEWS
-- =========================

-- View for security audit summary
CREATE OR REPLACE VIEW public.security_audit_summary AS
SELECT 
  tenant_id,
  DATE_TRUNC('day', created_at) as audit_date,
  severity,
  COUNT(*) as event_count,
  COUNT(DISTINCT user_id) as unique_users,
  array_agg(DISTINCT action) as actions_performed,
  array_agg(DISTINCT resource) as resources_accessed
FROM public.audit_logs
WHERE created_at >= NOW() - INTERVAL '30 days'
  AND severity IN ('warning', 'error', 'critical')
GROUP BY tenant_id, DATE_TRUNC('day', created_at), severity
ORDER BY audit_date DESC, severity DESC;

-- View for compliance audit summary
CREATE OR REPLACE VIEW public.compliance_audit_summary AS
SELECT 
  tenant_id,
  regulation,
  compliance_type,
  COUNT(*) as total_events,
  COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') as recent_events,
  MAX(created_at) as last_event,
  COUNT(DISTINCT subject_id) as unique_subjects
FROM public.compliance_audit_logs
GROUP BY tenant_id, regulation, compliance_type
ORDER BY tenant_id, regulation, compliance_type;

-- =========================
-- 9. RLS POLICIES FOR NEW TABLES
-- =========================

-- Compliance audit logs policies
CREATE POLICY compliance_audit_tenant_isolation 
  ON public.compliance_audit_logs
  FOR ALL USING (
    public.user_belongs_to_tenant(tenant_id) OR public.is_admin()
  ) WITH CHECK (
    public.user_belongs_to_tenant(COALESCE(tenant_id, public.current_tenant_id())) OR public.is_admin()
  );

-- Financial audit logs policies  
CREATE POLICY financial_audit_tenant_isolation
  ON public.financial_audit_logs
  FOR ALL USING (
    public.user_belongs_to_tenant(tenant_id) OR public.is_admin()
  ) WITH CHECK (
    public.user_belongs_to_tenant(COALESCE(tenant_id, public.current_tenant_id())) OR public.is_admin()
  );

-- Change tracking logs policies
CREATE POLICY change_tracking_tenant_isolation
  ON public.change_tracking_logs  
  FOR ALL USING (
    public.user_belongs_to_tenant(tenant_id) OR public.is_admin()
  ) WITH CHECK (
    public.user_belongs_to_tenant(COALESCE(tenant_id, public.current_tenant_id())) OR public.is_admin()
  );

-- =========================
-- 10. GRANTS AND PERMISSIONS
-- =========================

-- Grant necessary permissions for audit functions
GRANT EXECUTE ON FUNCTION public.create_audit_log TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_compliance_event TO authenticated;
GRANT EXECUTE ON FUNCTION public.track_data_change TO authenticated;

-- Grant select on audit views to authenticated users
GRANT SELECT ON public.security_audit_summary TO authenticated;
GRANT SELECT ON public.compliance_audit_summary TO authenticated;

-- Create scheduled job for audit cleanup (if pg_cron is available)
DO $$
BEGIN
  -- Only create if pg_cron extension is available
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    -- Schedule daily cleanup at 2 AM
    PERFORM cron.schedule('audit-cleanup', '0 2 * * *', 'SELECT public.cleanup_expired_audit_logs();');
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- Ignore if pg_cron is not available
  NULL;
END$$;

-- =========================
-- FINAL VERIFICATION
-- =========================

SELECT 
  'Enhanced audit system successfully implemented!' as status,
  COUNT(*) FILTER (WHERE table_name = 'audit_logs') as audit_logs_tables,
  COUNT(*) FILTER (WHERE table_name = 'compliance_audit_logs') as compliance_tables,
  COUNT(*) FILTER (WHERE table_name = 'financial_audit_logs') as financial_tables,
  COUNT(*) FILTER (WHERE table_name = 'change_tracking_logs') as change_tracking_tables
FROM information_schema.tables
WHERE table_schema = 'public' 
  AND table_name IN ('audit_logs', 'compliance_audit_logs', 'financial_audit_logs', 'change_tracking_logs');