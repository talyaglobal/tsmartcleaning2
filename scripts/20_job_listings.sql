-- Job Listings and Applications System
-- Idempotent creation for safe re-runs

-- Job listings table
CREATE TABLE IF NOT EXISTS public.job_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('engineering', 'design', 'marketing', 'sales', 'customer-success', 'operations', 'product', 'other')),
  department TEXT NOT NULL CHECK (department IN ('Engineering', 'Design', 'Marketing', 'Sales', 'Customer Success', 'Operations', 'Product', 'Other')),
  employment_type TEXT NOT NULL CHECK (employment_type IN ('full-time', 'part-time', 'contract', 'internship')),
  location_type TEXT NOT NULL CHECK (location_type IN ('remote', 'on-site', 'hybrid')),
  location TEXT, -- e.g., "San Francisco, CA" or "Remote - USA"
  salary_min DECIMAL(10, 2),
  salary_max DECIMAL(10, 2),
  salary_currency TEXT DEFAULT 'USD',
  salary_display TEXT, -- e.g., "$120k - $150k" or "Competitive"
  requirements JSONB DEFAULT '[]'::jsonb, -- Array of requirement strings
  responsibilities JSONB DEFAULT '[]'::jsonb, -- Array of responsibility strings
  benefits JSONB DEFAULT '[]'::jsonb, -- Array of benefit strings
  is_active BOOLEAN DEFAULT true,
  application_deadline TIMESTAMPTZ,
  posted_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Job applications table
CREATE TABLE IF NOT EXISTS public.job_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_listing_id UUID NOT NULL REFERENCES public.job_listings(id) ON DELETE CASCADE,
  applicant_email TEXT NOT NULL,
  applicant_name TEXT NOT NULL,
  applicant_phone TEXT,
  cover_letter TEXT,
  resume_url TEXT, -- URL to uploaded resume file
  portfolio_url TEXT,
  linkedin_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'interviewing', 'offered', 'rejected', 'withdrawn', 'hired')),
  notes TEXT, -- Internal notes from hiring team
  reviewed_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_job_listings_tenant_id ON public.job_listings(tenant_id);
CREATE INDEX IF NOT EXISTS idx_job_listings_category ON public.job_listings(category);
CREATE INDEX IF NOT EXISTS idx_job_listings_department ON public.job_listings(department);
CREATE INDEX IF NOT EXISTS idx_job_listings_employment_type ON public.job_listings(employment_type);
CREATE INDEX IF NOT EXISTS idx_job_listings_location_type ON public.job_listings(location_type);
CREATE INDEX IF NOT EXISTS idx_job_listings_is_active ON public.job_listings(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_job_listings_posted_at ON public.job_listings(posted_at DESC);
CREATE INDEX IF NOT EXISTS idx_job_applications_job_listing_id ON public.job_applications(job_listing_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_applicant_email ON public.job_applications(applicant_email);
CREATE INDEX IF NOT EXISTS idx_job_applications_status ON public.job_applications(status);
CREATE INDEX IF NOT EXISTS idx_job_applications_created_at ON public.job_applications(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.job_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DO $$
BEGIN
  -- Job listings: public can view active listings, admins can manage all
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='job_listings' AND policyname='Public can view active job listings'
  ) THEN
    CREATE POLICY "Public can view active job listings"
      ON public.job_listings FOR SELECT
      USING (is_active = true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='job_listings' AND policyname='Admins can manage job listings'
  ) THEN
    CREATE POLICY "Admins can manage job listings"
      ON public.job_listings FOR ALL
      USING (
        EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('admin', 'root_admin'))
      )
      WITH CHECK (
        EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('admin', 'root_admin'))
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='job_listings' AND policyname='Service can manage job listings'
  ) THEN
    CREATE POLICY "Service can manage job listings"
      ON public.job_listings FOR ALL
      USING (true) WITH CHECK (true);
  END IF;

  -- Job applications: applicants can view their own applications, admins can view all
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='job_applications' AND policyname='Applicants can view own applications'
  ) THEN
    CREATE POLICY "Applicants can view own applications"
      ON public.job_applications FOR SELECT
      USING (
        -- Allow if email matches (for non-authenticated applicants)
        applicant_email = COALESCE((SELECT email FROM public.users WHERE id = auth.uid()), '')
        OR
        -- Allow if authenticated user exists
        EXISTS (
          SELECT 1 FROM public.users u 
          WHERE u.id = auth.uid() 
          AND (u.email = job_applications.applicant_email OR u.role IN ('admin', 'root_admin'))
        )
        OR
        -- Allow admins
        EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('admin', 'root_admin'))
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='job_applications' AND policyname='Anyone can submit applications'
  ) THEN
    CREATE POLICY "Anyone can submit applications"
      ON public.job_applications FOR INSERT
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='job_applications' AND policyname='Admins can update applications'
  ) THEN
    CREATE POLICY "Admins can update applications"
      ON public.job_applications FOR UPDATE
      USING (
        EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('admin', 'root_admin'))
      )
      WITH CHECK (
        EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('admin', 'root_admin'))
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='job_applications' AND policyname='Service can manage applications'
  ) THEN
    CREATE POLICY "Service can manage applications"
      ON public.job_applications FOR ALL
      USING (true) WITH CHECK (true);
  END IF;
END$$;

-- Trigger to maintain updated_at
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_job_listings_updated_at') THEN
    CREATE TRIGGER update_job_listings_updated_at
      BEFORE UPDATE ON public.job_listings
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_job_applications_updated_at') THEN
    CREATE TRIGGER update_job_applications_updated_at
      BEFORE UPDATE ON public.job_applications
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END$$;

