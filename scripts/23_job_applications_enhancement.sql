-- Enhance job_applications table to store all application step data
-- Add application_data JSONB column to store all step-by-step form data
DO $$
BEGIN
  -- Add application_data column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'job_applications' 
    AND column_name = 'application_data'
  ) THEN
    ALTER TABLE public.job_applications
    ADD COLUMN application_data JSONB DEFAULT '{}'::jsonb;
    
    COMMENT ON COLUMN public.job_applications.application_data IS 'Stores all step-by-step application form data';
  END IF;

  -- Add file URL columns for all uploaded documents
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'job_applications' 
    AND column_name = 'address_proof_urls'
  ) THEN
    ALTER TABLE public.job_applications
    ADD COLUMN address_proof_urls JSONB DEFAULT '[]'::jsonb;
    
    COMMENT ON COLUMN public.job_applications.address_proof_urls IS 'Array of URLs to uploaded address proof documents';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'job_applications' 
    AND column_name = 'work_permit_document_url'
  ) THEN
    ALTER TABLE public.job_applications
    ADD COLUMN work_permit_document_url TEXT;
    
    COMMENT ON COLUMN public.job_applications.work_permit_document_url IS 'URL to uploaded work permit document';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'job_applications' 
    AND column_name = 'photo_url'
  ) THEN
    ALTER TABLE public.job_applications
    ADD COLUMN photo_url TEXT;
    
    COMMENT ON COLUMN public.job_applications.photo_url IS 'URL to uploaded profile photo';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'job_applications' 
    AND column_name = 'id_document_url'
  ) THEN
    ALTER TABLE public.job_applications
    ADD COLUMN id_document_url TEXT;
    
    COMMENT ON COLUMN public.job_applications.id_document_url IS 'URL to uploaded ID document';
  END IF;
END$$;

-- Create index on application_data for better query performance
CREATE INDEX IF NOT EXISTS idx_job_applications_application_data 
ON public.job_applications USING GIN (application_data);

