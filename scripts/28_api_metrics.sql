-- API Performance Metrics Tracking
-- Tracks response time, error rate, and throughput for API endpoints
-- Safe, idempotent migration

CREATE TABLE IF NOT EXISTS public.api_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL, -- e.g., '/api/bookings', '/api/admin/stats'
  method TEXT NOT NULL DEFAULT 'GET', -- GET, POST, PUT, DELETE, etc.
  status_code INTEGER NOT NULL, -- HTTP status code
  response_time_ms INTEGER NOT NULL, -- Response time in milliseconds
  request_size_bytes INTEGER, -- Request body size in bytes
  response_size_bytes INTEGER, -- Response body size in bytes
  user_id UUID, -- Optional: user making the request
  ip INET, -- Client IP address
  user_agent TEXT, -- User agent string
  error_message TEXT, -- Error message if status >= 400
  metadata JSONB DEFAULT '{}'::jsonb, -- Additional context
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_api_metrics_endpoint_time
  ON public.api_metrics(endpoint, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_metrics_tenant_time
  ON public.api_metrics(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_metrics_status_code
  ON public.api_metrics(status_code, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_metrics_created_at
  ON public.api_metrics(created_at DESC);

-- Aggregated metrics table for faster dashboard queries
CREATE TABLE IF NOT EXISTS public.api_metrics_hourly (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  hour TIMESTAMPTZ NOT NULL, -- Hour bucket (rounded to hour)
  request_count INTEGER NOT NULL DEFAULT 0,
  error_count INTEGER NOT NULL DEFAULT 0,
  total_response_time_ms BIGINT NOT NULL DEFAULT 0,
  min_response_time_ms INTEGER,
  max_response_time_ms INTEGER,
  avg_response_time_ms NUMERIC(10, 2),
  p50_response_time_ms INTEGER, -- 50th percentile
  p95_response_time_ms INTEGER, -- 95th percentile
  p99_response_time_ms INTEGER, -- 99th percentile
  total_request_size_bytes BIGINT DEFAULT 0,
  total_response_size_bytes BIGINT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, endpoint, method, hour)
);

CREATE INDEX IF NOT EXISTS idx_api_metrics_hourly_endpoint_hour
  ON public.api_metrics_hourly(endpoint, hour DESC);
CREATE INDEX IF NOT EXISTS idx_api_metrics_hourly_tenant_hour
  ON public.api_metrics_hourly(tenant_id, hour DESC);

-- Function to calculate percentiles
CREATE OR REPLACE FUNCTION public.calculate_percentile(
  values_array INTEGER[],
  percentile NUMERIC
)
RETURNS INTEGER
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  sorted_values INTEGER[];
  index NUMERIC;
BEGIN
  IF array_length(values_array, 1) IS NULL THEN
    RETURN NULL;
  END IF;
  
  sorted_values := ARRAY(SELECT unnest(values_array) ORDER BY unnest);
  index := CEIL(array_length(sorted_values, 1) * percentile / 100.0);
  
  IF index < 1 THEN
    index := 1;
  END IF;
  
  RETURN sorted_values[CAST(index AS INTEGER)];
END;
$$;

-- Function to aggregate metrics hourly (can be called by a cron job)
CREATE OR REPLACE FUNCTION public.aggregate_api_metrics_hourly()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  hour_start TIMESTAMPTZ;
  hour_end TIMESTAMPTZ;
BEGIN
  -- Process the previous hour
  hour_start := date_trunc('hour', NOW() - INTERVAL '1 hour');
  hour_end := hour_start + INTERVAL '1 hour';
  
  -- Aggregate metrics for each endpoint/method/tenant combination
  INSERT INTO public.api_metrics_hourly (
    tenant_id,
    endpoint,
    method,
    hour,
    request_count,
    error_count,
    total_response_time_ms,
    min_response_time_ms,
    max_response_time_ms,
    avg_response_time_ms,
    p50_response_time_ms,
    p95_response_time_ms,
    p99_response_time_ms,
    total_request_size_bytes,
    total_response_size_bytes,
    updated_at
  )
  SELECT
    tenant_id,
    endpoint,
    method,
    hour_start,
    COUNT(*) as request_count,
    COUNT(*) FILTER (WHERE status_code >= 400) as error_count,
    SUM(response_time_ms)::BIGINT as total_response_time_ms,
    MIN(response_time_ms) as min_response_time_ms,
    MAX(response_time_ms) as max_response_time_ms,
    AVG(response_time_ms)::NUMERIC(10, 2) as avg_response_time_ms,
    calculate_percentile(ARRAY_AGG(response_time_ms ORDER BY response_time_ms), 50) as p50_response_time_ms,
    calculate_percentile(ARRAY_AGG(response_time_ms ORDER BY response_time_ms), 95) as p95_response_time_ms,
    calculate_percentile(ARRAY_AGG(response_time_ms ORDER BY response_time_ms), 99) as p99_response_time_ms,
    COALESCE(SUM(request_size_bytes), 0)::BIGINT as total_request_size_bytes,
    COALESCE(SUM(response_size_bytes), 0)::BIGINT as total_response_size_bytes,
    NOW() as updated_at
  FROM public.api_metrics
  WHERE created_at >= hour_start AND created_at < hour_end
  GROUP BY tenant_id, endpoint, method
  ON CONFLICT (tenant_id, endpoint, method, hour)
  DO UPDATE SET
    request_count = EXCLUDED.request_count,
    error_count = EXCLUDED.error_count,
    total_response_time_ms = EXCLUDED.total_response_time_ms,
    min_response_time_ms = EXCLUDED.min_response_time_ms,
    max_response_time_ms = EXCLUDED.max_response_time_ms,
    avg_response_time_ms = EXCLUDED.avg_response_time_ms,
    p50_response_time_ms = EXCLUDED.p50_response_time_ms,
    p95_response_time_ms = EXCLUDED.p95_response_time_ms,
    p99_response_time_ms = EXCLUDED.p99_response_time_ms,
    total_request_size_bytes = EXCLUDED.total_request_size_bytes,
    total_response_size_bytes = EXCLUDED.total_response_size_bytes,
    updated_at = EXCLUDED.updated_at;
END;
$$;

-- Alert thresholds configuration table
CREATE TABLE IF NOT EXISTS public.api_alert_thresholds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  endpoint TEXT, -- NULL means applies to all endpoints
  method TEXT, -- NULL means applies to all methods
  max_response_time_ms INTEGER, -- Alert if response time exceeds this (ms)
  max_error_rate_percent NUMERIC(5, 2), -- Alert if error rate exceeds this (%)
  min_throughput_per_minute INTEGER, -- Alert if throughput drops below this
  enabled BOOLEAN NOT NULL DEFAULT true,
  notification_channels JSONB DEFAULT '[]'::jsonb, -- e.g., ['email', 'slack', 'webhook']
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, endpoint, method)
);

CREATE INDEX IF NOT EXISTS idx_api_alert_thresholds_tenant
  ON public.api_alert_thresholds(tenant_id);

-- RLS policies
ALTER TABLE public.api_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_metrics_hourly ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_alert_thresholds ENABLE ROW LEVEL SECURITY;

-- RLS: tenant isolation for api_metrics
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='api_metrics' AND policyname='tenant_isolation_api_metrics'
  ) THEN
    CREATE POLICY tenant_isolation_api_metrics
      ON public.api_metrics
      USING (tenant_id = public.current_tenant_id() OR tenant_id IS NULL)
      WITH CHECK (tenant_id = public.current_tenant_id() OR tenant_id IS NULL);
  END IF;
END$$;

-- RLS: tenant isolation for api_metrics_hourly
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='api_metrics_hourly' AND policyname='tenant_isolation_api_metrics_hourly'
  ) THEN
    CREATE POLICY tenant_isolation_api_metrics_hourly
      ON public.api_metrics_hourly
      USING (tenant_id = public.current_tenant_id() OR tenant_id IS NULL)
      WITH CHECK (tenant_id = public.current_tenant_id() OR tenant_id IS NULL);
  END IF;
END$$;

-- RLS: tenant isolation for api_alert_thresholds
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='api_alert_thresholds' AND policyname='tenant_isolation_api_alert_thresholds'
  ) THEN
    CREATE POLICY tenant_isolation_api_alert_thresholds
      ON public.api_alert_thresholds
      USING (tenant_id = public.current_tenant_id() OR tenant_id IS NULL)
      WITH CHECK (tenant_id = public.current_tenant_id() OR tenant_id IS NULL);
  END IF;
END$$;

-- Insert default alert thresholds for root admin (tenant_id = NULL means system-wide)
INSERT INTO public.api_alert_thresholds (
  tenant_id,
  endpoint,
  method,
  max_response_time_ms,
  max_error_rate_percent,
  min_throughput_per_minute,
  enabled,
  notification_channels
) VALUES
  (NULL, NULL, NULL, 5000, 5.0, 10, true, '["email"]'::jsonb),
  (NULL, '/api/bookings', NULL, 3000, 3.0, 5, true, '["email"]'::jsonb),
  (NULL, '/api/admin/stats', NULL, 2000, 2.0, 1, true, '["email"]'::jsonb)
ON CONFLICT (tenant_id, endpoint, method) DO NOTHING;

