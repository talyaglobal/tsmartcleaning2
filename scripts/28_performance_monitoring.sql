-- Performance monitoring and APM tables
-- Safe, idempotent migration for performance tracking

-- Performance baselines: store expected performance metrics
CREATE TABLE IF NOT EXISTS public.performance_baselines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_name TEXT NOT NULL, -- e.g., 'api_response_time', 'db_query_time', 'page_load_time'
  metric_type TEXT NOT NULL CHECK (metric_type IN ('api', 'database', 'frontend', 'system')),
  endpoint_path TEXT, -- For API metrics: e.g., '/api/bookings'
  table_name TEXT, -- For database metrics: e.g., 'bookings'
  baseline_value_ms DECIMAL(10,2) NOT NULL, -- Baseline in milliseconds
  threshold_warning_ms DECIMAL(10,2), -- Warning threshold
  threshold_critical_ms DECIMAL(10,2), -- Critical threshold
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(metric_name, endpoint_path, table_name, tenant_id)
);

CREATE INDEX IF NOT EXISTS idx_performance_baselines_metric ON public.performance_baselines(metric_name, metric_type);
CREATE INDEX IF NOT EXISTS idx_performance_baselines_tenant ON public.performance_baselines(tenant_id);
CREATE INDEX IF NOT EXISTS idx_performance_baselines_updated ON public.performance_baselines(updated_at DESC);

-- Slow queries: track database queries that exceed thresholds
CREATE TABLE IF NOT EXISTS public.slow_queries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  query_type TEXT NOT NULL, -- 'select', 'insert', 'update', 'delete'
  table_name TEXT,
  query_text TEXT, -- Sanitized query (no sensitive data)
  execution_time_ms DECIMAL(10,2) NOT NULL,
  threshold_ms DECIMAL(10,2) NOT NULL, -- Threshold that was exceeded
  row_count INTEGER,
  error_message TEXT,
  stack_trace TEXT, -- Optional: where the query was called from
  metadata JSONB DEFAULT '{}'::jsonb, -- Additional context
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_slow_queries_tenant_time ON public.slow_queries(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_slow_queries_table ON public.slow_queries(table_name, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_slow_queries_execution_time ON public.slow_queries(execution_time_ms DESC);

-- Performance metrics: store actual performance measurements
CREATE TABLE IF NOT EXISTS public.performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  metric_name TEXT NOT NULL,
  metric_type TEXT NOT NULL CHECK (metric_type IN ('api', 'database', 'frontend', 'system')),
  value_ms DECIMAL(10,2) NOT NULL,
  endpoint_path TEXT, -- For API metrics
  table_name TEXT, -- For database metrics
  status TEXT CHECK (status IN ('ok', 'warning', 'critical')) DEFAULT 'ok',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_performance_metrics_tenant_time ON public.performance_metrics(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_name_time ON public.performance_metrics(metric_name, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_status ON public.performance_metrics(status, created_at DESC);

-- Enable RLS on all tables
ALTER TABLE public.performance_baselines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.slow_queries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_metrics ENABLE ROW LEVEL SECURITY;

-- RLS Policies: tenant isolation
DO $$
BEGIN
  -- Performance baselines policies
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='performance_baselines' AND policyname='tenant_isolation_baselines'
  ) THEN
    CREATE POLICY tenant_isolation_baselines ON public.performance_baselines
      FOR ALL
      USING (tenant_id = public.current_tenant_id() OR tenant_id IS NULL)
      WITH CHECK (tenant_id = public.current_tenant_id() OR tenant_id IS NULL);
  END IF;

  -- Slow queries policies
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='slow_queries' AND policyname='tenant_isolation_slow_queries'
  ) THEN
    CREATE POLICY tenant_isolation_slow_queries ON public.slow_queries
      FOR ALL
      USING (tenant_id = public.current_tenant_id() OR tenant_id IS NULL)
      WITH CHECK (tenant_id = public.current_tenant_id() OR tenant_id IS NULL);
  END IF;

  -- Performance metrics policies
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='performance_metrics' AND policyname='tenant_isolation_metrics'
  ) THEN
    CREATE POLICY tenant_isolation_metrics ON public.performance_metrics
      FOR ALL
      USING (tenant_id = public.current_tenant_id() OR tenant_id IS NULL)
      WITH CHECK (tenant_id = public.current_tenant_id() OR tenant_id IS NULL);
  END IF;
END$$;

-- Trigger to update updated_at on performance_baselines
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_performance_baselines_updated_at'
  ) THEN
    CREATE TRIGGER update_performance_baselines_updated_at
      BEFORE UPDATE ON public.performance_baselines
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END$$;

