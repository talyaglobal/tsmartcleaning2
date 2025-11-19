-- Add review_status field to insurance_claim_documents table
-- This enables document review workflow for claim documents

alter table if exists public.insurance_claim_documents
  add column if not exists review_status text default 'pending'
    check (review_status in ('pending', 'approved', 'rejected', 'needs_revision'));

-- Add index for faster queries on review status
create index if not exists idx_claim_documents_review_status
  on public.insurance_claim_documents(review_status);

-- Add reviewed_at timestamp for tracking when documents were reviewed
alter table if exists public.insurance_claim_documents
  add column if not exists reviewed_at timestamptz;

-- Add reviewed_by field to track who reviewed the document
alter table if exists public.insurance_claim_documents
  add column if not exists reviewed_by uuid references public.users(id);

-- Add review_notes field for reviewer comments
alter table if exists public.insurance_claim_documents
  add column if not exists review_notes text;

-- Update existing documents to have 'pending' status if null
update public.insurance_claim_documents
  set review_status = 'pending'
  where review_status is null;

