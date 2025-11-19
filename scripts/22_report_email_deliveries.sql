-- Report Email Deliveries Table
-- Tracks email delivery status for scheduled report emails
-- Idempotent creation for safe re-runs

-- Report schedules table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS public.report_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly')),
  recipients TEXT[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  next_run_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_report_schedules_company_id ON public.report_schedules(company_id);
CREATE INDEX IF NOT EXISTS idx_report_schedules_property_id ON public.report_schedules(property_id);
CREATE INDEX IF NOT EXISTS idx_report_schedules_next_run_at ON public.report_schedules(next_run_at);
CREATE INDEX IF NOT EXISTS idx_report_schedules_is_active ON public.report_schedules(is_active);

-- Report email deliveries table
CREATE TABLE IF NOT EXISTS public.report_email_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schedule_id UUID NOT NULL REFERENCES public.report_schedules(id) ON DELETE CASCADE,
  recipient_email TEXT NOT NULL,
  report_url TEXT NOT NULL,
  message_id TEXT,
  status TEXT NOT NULL CHECK (status IN ('sent', 'failed', 'delivered', 'bounced', 'opened', 'clicked')),
  error_message TEXT,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  delivered_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_report_email_deliveries_schedule_id ON public.report_email_deliveries(schedule_id);
CREATE INDEX IF NOT EXISTS idx_report_email_deliveries_recipient_email ON public.report_email_deliveries(recipient_email);
CREATE INDEX IF NOT EXISTS idx_report_email_deliveries_status ON public.report_email_deliveries(status);
CREATE INDEX IF NOT EXISTS idx_report_email_deliveries_sent_at ON public.report_email_deliveries(sent_at);
CREATE INDEX IF NOT EXISTS idx_report_email_deliveries_message_id ON public.report_email_deliveries(message_id);

-- Add updated_at trigger for report_schedules
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_report_schedules_updated_at ON public.report_schedules;
CREATE TRIGGER update_report_schedules_updated_at
  BEFORE UPDATE ON public.report_schedules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE public.report_schedules IS 'Stores scheduled report configurations for companies and properties';
COMMENT ON TABLE public.report_email_deliveries IS 'Tracks email delivery status and engagement metrics for scheduled report emails';

