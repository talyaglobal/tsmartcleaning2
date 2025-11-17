-- Per-tenant audit logs for sensitive actions
-- Safe, idempotent migration

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID, -- optional: actor, if known
  action TEXT NOT NULL, -- e.g., 'update_status', 'update_provider', 'launch_campaign'
  resource TEXT NOT NULL, -- e.g., 'job', 'provider_profile', 'campaign', 'preference', 'stripe'
  resource_id TEXT, -- UUID or other identifier as text
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  ip INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_created_at
  ON public.audit_logs(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_action
  ON public.audit_logs(tenant_id, action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_resource
  ON public.audit_logs(tenant_id, resource);

-- Trigger to auto-fill tenant_id from JWT if missing (service role can set explicitly)
CREATE OR REPLACE FUNCTION public.trg_set_audit_tenant_id()
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
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_audit_logs_set_tenant_id'
  ) THEN
    CREATE TRIGGER trg_audit_logs_set_tenant_id
      BEFORE INSERT ON public.audit_logs
      FOR EACH ROW EXECUTE FUNCTION public.trg_set_audit_tenant_id();
  END IF;
END$$;

-- RLS: tenant isolation
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='audit_logs' AND policyname='tenant_isolation_audit_logs'
  ) THEN
    CREATE POLICY tenant_isolation_audit_logs
      ON public.audit_logs
      USING (tenant_id = public.current_tenant_id())
      WITH CHECK (tenant_id = public.current_tenant_id());
  END IF;
END$$;


