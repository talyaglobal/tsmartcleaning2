-- Analytics events table for tracking user behavior, conversions, and custom events
-- Safe, idempotent migration

CREATE TABLE IF NOT EXISTS public.analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID, -- Optional: for multi-tenant analytics
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  session_id TEXT, -- Browser session identifier
  event_name TEXT NOT NULL, -- e.g., 'page_view', 'button_click', 'conversion'
  event_category TEXT, -- e.g., 'engagement', 'conversion', 'error'
  event_label TEXT, -- Additional context/label
  value DECIMAL(10, 2), -- Numeric value (e.g., purchase amount)
  metadata JSONB DEFAULT '{}'::jsonb, -- Additional event data
  ip_address INET,
  user_agent TEXT,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_analytics_events_tenant_time
  ON public.analytics_events(tenant_id, occurred_at DESC)
  WHERE tenant_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_analytics_events_user_time
  ON public.analytics_events(user_id, occurred_at DESC)
  WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_analytics_events_name_time
  ON public.analytics_events(event_name, occurred_at DESC);

CREATE INDEX IF NOT EXISTS idx_analytics_events_category_time
  ON public.analytics_events(event_category, occurred_at DESC)
  WHERE event_category IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_analytics_events_session
  ON public.analytics_events(session_id, occurred_at DESC)
  WHERE session_id IS NOT NULL;

-- Enable RLS for tenant isolation
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see their own analytics events
CREATE POLICY tenant_isolation_analytics_events ON public.analytics_events
  FOR ALL
  USING (
    tenant_id IS NULL OR
    tenant_id = public.current_tenant_id() OR
    user_id = auth.uid()
  );

-- RLS Policy: Service role can access all events
CREATE POLICY service_role_analytics_events ON public.analytics_events
  FOR ALL
  USING (auth.role() = 'service_role');

-- Comment on table
COMMENT ON TABLE public.analytics_events IS 'Tracks analytics events including page views, conversions, user interactions, and custom events';

