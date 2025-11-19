-- Company Invoices table
-- This script creates the invoices table for company billing and payment tracking
-- Safe to run multiple times (uses IF NOT EXISTS)

-- =========================
-- Invoices table
-- =========================
CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  invoice_number TEXT NOT NULL UNIQUE,
  invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,
  period_start DATE,
  period_end DATE,
  
  -- Amounts
  subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0,
  tax_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  paid_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  
  -- Status
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled', 'refunded')),
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'partial', 'paid', 'overdue', 'refunded')),
  
  -- Payment tracking
  paid_at TIMESTAMPTZ,
  payment_method TEXT,
  payment_reference TEXT,
  
  -- Invoice details
  description TEXT,
  notes TEXT,
  line_items JSONB DEFAULT '[]'::jsonb,
  
  -- Metadata
  pdf_url TEXT,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invoices_tenant_id ON public.invoices(tenant_id);
CREATE INDEX IF NOT EXISTS idx_invoices_company_id ON public.invoices(company_id);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON public.invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_payment_status ON public.invoices(payment_status);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_date ON public.invoices(invoice_date DESC);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON public.invoices(due_date);

-- =========================
-- Invoice payments table (for tracking partial payments)
-- =========================
CREATE TABLE IF NOT EXISTS public.invoice_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method TEXT,
  payment_reference TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invoice_payments_tenant_id ON public.invoice_payments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_invoice_payments_invoice_id ON public.invoice_payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_payments_payment_date ON public.invoice_payments(payment_date DESC);

-- =========================
-- Add company_id to users table if it doesn't exist
-- =========================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_attribute
    WHERE attrelid = 'public.users'::regclass
    AND attname = 'company_id'
    AND NOT attisdropped
  ) THEN
    ALTER TABLE public.users
    ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL;
    
    CREATE INDEX IF NOT EXISTS idx_users_company_id ON public.users(company_id);
  END IF;
END$$;

-- =========================
-- Enable Row Level Security
-- =========================
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_payments ENABLE ROW LEVEL SECURITY;

-- =========================
-- RLS Policies
-- =========================
DO $$
BEGIN
  -- Invoices: company users can view their company's invoices, service can manage
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='invoices' AND policyname='Company users can view invoices'
  ) THEN
    CREATE POLICY "Company users can view invoices"
      ON public.invoices FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.users u 
          WHERE u.id = auth.uid() 
          AND (u.company_id = invoices.company_id OR u.role IN ('admin', 'root_admin'))
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='invoices' AND policyname='Service can manage invoices'
  ) THEN
    CREATE POLICY "Service can manage invoices"
      ON public.invoices FOR ALL
      USING (true) WITH CHECK (true);
  END IF;

  -- Invoice payments: company users can view, service can manage
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='invoice_payments' AND policyname='Company users can view payments'
  ) THEN
    CREATE POLICY "Company users can view payments"
      ON public.invoice_payments FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.invoices inv
          JOIN public.users u ON u.id = auth.uid()
          WHERE inv.id = invoice_payments.invoice_id 
          AND (u.company_id = inv.company_id OR u.role IN ('admin', 'root_admin'))
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='invoice_payments' AND policyname='Service can manage payments'
  ) THEN
    CREATE POLICY "Service can manage payments"
      ON public.invoice_payments FOR ALL
      USING (true) WITH CHECK (true);
  END IF;
END$$;

-- =========================
-- Triggers to maintain updated_at
-- =========================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_invoices_updated_at') THEN
    CREATE TRIGGER update_invoices_updated_at
      BEFORE UPDATE ON public.invoices
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END$$;

-- =========================
-- Function to generate invoice number
-- =========================
CREATE OR REPLACE FUNCTION generate_invoice_number(company_id_param UUID)
RETURNS TEXT AS $$
DECLARE
  prefix TEXT;
  year_num TEXT;
  sequence_num INTEGER;
  invoice_num TEXT;
BEGIN
  -- Get company prefix (first 3 letters of company name or 'INV')
  SELECT COALESCE(UPPER(LEFT(name, 3)), 'INV') INTO prefix
  FROM public.companies
  WHERE id = company_id_param;
  
  -- Get current year
  year_num := TO_CHAR(CURRENT_DATE, 'YYYY');
  
  -- Get next sequence number for this company and year
  SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM '[0-9]+$') AS INTEGER)), 0) + 1
  INTO sequence_num
  FROM public.invoices
  WHERE company_id = company_id_param
  AND invoice_number LIKE prefix || '-' || year_num || '-%';
  
  -- Format: PREFIX-YYYY-0001
  invoice_num := prefix || '-' || year_num || '-' || LPAD(sequence_num::TEXT, 4, '0');
  
  RETURN invoice_num;
END;
$$ LANGUAGE plpgsql;

