-- Extended Job Applications Schema
-- Adds fields for comprehensive 8-step application form

-- Add new columns to job_applications table if they don't exist
DO $$
BEGIN
  -- Personal Information (Step 1)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'job_applications' AND column_name = 'first_name') THEN
    ALTER TABLE public.job_applications ADD COLUMN first_name TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'job_applications' AND column_name = 'middle_name') THEN
    ALTER TABLE public.job_applications ADD COLUMN middle_name TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'job_applications' AND column_name = 'last_name') THEN
    ALTER TABLE public.job_applications ADD COLUMN last_name TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'job_applications' AND column_name = 'date_of_birth') THEN
    ALTER TABLE public.job_applications ADD COLUMN date_of_birth DATE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'job_applications' AND column_name = 'gender') THEN
    ALTER TABLE public.job_applications ADD COLUMN gender TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'job_applications' AND column_name = 'preferred_language') THEN
    ALTER TABLE public.job_applications ADD COLUMN preferred_language TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'job_applications' AND column_name = 'ssn_sin') THEN
    ALTER TABLE public.job_applications ADD COLUMN ssn_sin TEXT; -- Encrypted SSN/SIN
  END IF;

  -- Contact Details (Step 2)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'job_applications' AND column_name = 'alternative_phone') THEN
    ALTER TABLE public.job_applications ADD COLUMN alternative_phone TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'job_applications' AND column_name = 'preferred_contact_method') THEN
    ALTER TABLE public.job_applications ADD COLUMN preferred_contact_method TEXT[];
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'job_applications' AND column_name = 'best_time_to_reach') THEN
    ALTER TABLE public.job_applications ADD COLUMN best_time_to_reach TEXT[];
  END IF;

  -- Address Information (Step 3)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'job_applications' AND column_name = 'address_country') THEN
    ALTER TABLE public.job_applications ADD COLUMN address_country TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'job_applications' AND column_name = 'address_line1') THEN
    ALTER TABLE public.job_applications ADD COLUMN address_line1 TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'job_applications' AND column_name = 'address_line2') THEN
    ALTER TABLE public.job_applications ADD COLUMN address_line2 TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'job_applications' AND column_name = 'address_city') THEN
    ALTER TABLE public.job_applications ADD COLUMN address_city TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'job_applications' AND column_name = 'address_state') THEN
    ALTER TABLE public.job_applications ADD COLUMN address_state TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'job_applications' AND column_name = 'address_zip') THEN
    ALTER TABLE public.job_applications ADD COLUMN address_zip TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'job_applications' AND column_name = 'address_years') THEN
    ALTER TABLE public.job_applications ADD COLUMN address_years INTEGER;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'job_applications' AND column_name = 'address_months') THEN
    ALTER TABLE public.job_applications ADD COLUMN address_months INTEGER;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'job_applications' AND column_name = 'previous_address') THEN
    ALTER TABLE public.job_applications ADD COLUMN previous_address JSONB;
  END IF;

  -- Address Proof (Step 4)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'job_applications' AND column_name = 'address_proof_urls') THEN
    ALTER TABLE public.job_applications ADD COLUMN address_proof_urls TEXT[];
  END IF;

  -- Work Eligibility (Step 5)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'job_applications' AND column_name = 'work_eligibility_country') THEN
    ALTER TABLE public.job_applications ADD COLUMN work_eligibility_country TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'job_applications' AND column_name = 'work_authorization_type') THEN
    ALTER TABLE public.job_applications ADD COLUMN work_authorization_type TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'job_applications' AND column_name = 'work_permit_number') THEN
    ALTER TABLE public.job_applications ADD COLUMN work_permit_number TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'job_applications' AND column_name = 'work_permit_expiry') THEN
    ALTER TABLE public.job_applications ADD COLUMN work_permit_expiry DATE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'job_applications' AND column_name = 'work_permit_document_url') THEN
    ALTER TABLE public.job_applications ADD COLUMN work_permit_document_url TEXT;
  END IF;

  -- Photo & ID (Step 6)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'job_applications' AND column_name = 'photo_url') THEN
    ALTER TABLE public.job_applications ADD COLUMN photo_url TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'job_applications' AND column_name = 'id_type') THEN
    ALTER TABLE public.job_applications ADD COLUMN id_type TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'job_applications' AND column_name = 'id_number') THEN
    ALTER TABLE public.job_applications ADD COLUMN id_number TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'job_applications' AND column_name = 'id_expiry') THEN
    ALTER TABLE public.job_applications ADD COLUMN id_expiry DATE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'job_applications' AND column_name = 'id_document_url') THEN
    ALTER TABLE public.job_applications ADD COLUMN id_document_url TEXT;
  END IF;

  -- Availability & Preferences (Step 7)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'job_applications' AND column_name = 'availability_days') THEN
    ALTER TABLE public.job_applications ADD COLUMN availability_days TEXT[];
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'job_applications' AND column_name = 'availability_hours') THEN
    ALTER TABLE public.job_applications ADD COLUMN availability_hours TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'job_applications' AND column_name = 'preferred_locations') THEN
    ALTER TABLE public.job_applications ADD COLUMN preferred_locations TEXT[];
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'job_applications' AND column_name = 'transportation') THEN
    ALTER TABLE public.job_applications ADD COLUMN transportation TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'job_applications' AND column_name = 'has_vehicle') THEN
    ALTER TABLE public.job_applications ADD COLUMN has_vehicle BOOLEAN;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'job_applications' AND column_name = 'vehicle_details') THEN
    ALTER TABLE public.job_applications ADD COLUMN vehicle_details TEXT;
  END IF;

  -- Experience & References (Step 8)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'job_applications' AND column_name = 'years_experience') THEN
    ALTER TABLE public.job_applications ADD COLUMN years_experience INTEGER;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'job_applications' AND column_name = 'previous_employers') THEN
    ALTER TABLE public.job_applications ADD COLUMN previous_employers JSONB;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'job_applications' AND column_name = 'applicant_references') THEN
    ALTER TABLE public.job_applications ADD COLUMN applicant_references JSONB;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'job_applications' AND column_name = 'emergency_contact') THEN
    ALTER TABLE public.job_applications ADD COLUMN emergency_contact JSONB;
  END IF;

  -- Additional metadata
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'job_applications' AND column_name = 'application_data') THEN
    ALTER TABLE public.job_applications ADD COLUMN application_data JSONB; -- Store full form data as backup
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'job_applications' AND column_name = 'current_step') THEN
    ALTER TABLE public.job_applications ADD COLUMN current_step INTEGER DEFAULT 1; -- Track which step user is on
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'job_applications' AND column_name = 'is_draft') THEN
    ALTER TABLE public.job_applications ADD COLUMN is_draft BOOLEAN DEFAULT false;
  END IF;
END$$;

-- Create index for draft applications
CREATE INDEX IF NOT EXISTS idx_job_applications_is_draft ON public.job_applications(is_draft) WHERE is_draft = true;
CREATE INDEX IF NOT EXISTS idx_job_applications_status_created ON public.job_applications(status, created_at DESC);

