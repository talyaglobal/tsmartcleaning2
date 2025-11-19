-- Webhook events logging table
-- Idempotent creation for safe re-runs
-- This table logs all webhook events from various providers for monitoring and debugging

CREATE TABLE IF NOT EXISTS public.webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL, -- 'stripe', 'email', 'whatsapp', 'persona', etc.
  event_type TEXT NOT NULL, -- e.g., 'payment_intent.succeeded', 'delivered', 'bounced'
  event_id TEXT, -- External event ID (e.g., Stripe event ID)
  tenant_id UUID, -- Optional: tenant context if available
  status TEXT NOT NULL DEFAULT 'received' CHECK (status IN ('received', 'processing', 'processed', 'failed', 'ignored')),
  http_status INTEGER, -- HTTP status code returned to webhook sender
  error_message TEXT, -- Error message if processing failed
  payload JSONB NOT NULL DEFAULT '{}'::jsonb, -- Full webhook payload
  processed_at TIMESTAMPTZ, -- When processing completed
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_webhook_events_provider_time
  ON public.webhook_events (provider, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_webhook_events_type_time
  ON public.webhook_events (event_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_webhook_events_tenant_time
  ON public.webhook_events (tenant_id, created_at DESC) WHERE tenant_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_webhook_events_status_time
  ON public.webhook_events (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_webhook_events_event_id
  ON public.webhook_events (event_id) WHERE event_id IS NOT NULL;

-- RLS: Allow service role to insert/read all, but restrict tenant access
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

-- Policy: Service role can do everything
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'webhook_events' 
    AND policyname = 'service_role_all_webhook_events'
  ) THEN
    CREATE POLICY service_role_all_webhook_events
      ON public.webhook_events
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;
END$$;

-- Policy: Tenants can only see their own webhook events
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'webhook_events' 
    AND policyname = 'tenant_isolation_webhook_events'
  ) THEN
    CREATE POLICY tenant_isolation_webhook_events
      ON public.webhook_events
      FOR SELECT
      TO authenticated
      USING (tenant_id = public.current_tenant_id());
  END IF;
END$$;

-- Comments for documentation
COMMENT ON TABLE public.webhook_events IS 'Logs all webhook events from external providers for monitoring, debugging, and audit purposes';
COMMENT ON COLUMN public.webhook_events.provider IS 'Webhook provider name (stripe, email, whatsapp, etc.)';
COMMENT ON COLUMN public.webhook_events.event_type IS 'Type of webhook event (e.g., payment_intent.succeeded, delivered, bounced)';
COMMENT ON COLUMN public.webhook_events.event_id IS 'External event ID from provider (e.g., Stripe evt_xxx)';
COMMENT ON COLUMN public.webhook_events.status IS 'Processing status: received, processing, processed, failed, ignored';
COMMENT ON COLUMN public.webhook_events.http_status IS 'HTTP status code returned to webhook sender (200 = success, 4xx/5xx = retry)';

