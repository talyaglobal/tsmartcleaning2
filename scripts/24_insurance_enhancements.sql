-- Insurance system enhancements
-- Adds fields needed for claims review workflow

-- Add adjuster_name and internal_notes to insurance_claims
ALTER TABLE public.insurance_claims
ADD COLUMN IF NOT EXISTS adjuster_name TEXT,
ADD COLUMN IF NOT EXISTS internal_notes TEXT,
ADD COLUMN IF NOT EXISTS amount_paid NUMERIC(12,2),
ADD COLUMN IF NOT EXISTS denial_reason TEXT;

-- Add index for adjuster queries
CREATE INDEX IF NOT EXISTS idx_ins_claims_adjuster ON public.insurance_claims(adjuster_name) WHERE adjuster_name IS NOT NULL;

-- Add index for activity log queries
CREATE INDEX IF NOT EXISTS idx_ins_claim_activities_claim ON public.insurance_claim_activities(claim_id, created_at DESC);

