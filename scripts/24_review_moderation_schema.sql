-- Add review moderation columns to reviews table
-- This script adds columns needed for review moderation workflow

-- Add status column for review moderation
ALTER TABLE public.reviews
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending' 
  CHECK (status IN ('pending', 'approved', 'flagged', 'rejected'));

-- Add flagged_reason column
ALTER TABLE public.reviews
ADD COLUMN IF NOT EXISTS flagged_reason TEXT;

-- Add moderated_at timestamp
ALTER TABLE public.reviews
ADD COLUMN IF NOT EXISTS moderated_at TIMESTAMPTZ;

-- Add moderated_by user reference
ALTER TABLE public.reviews
ADD COLUMN IF NOT EXISTS moderated_by UUID REFERENCES public.users(id) ON DELETE SET NULL;

-- Create index on status for faster filtering
CREATE INDEX IF NOT EXISTS idx_reviews_status ON public.reviews(status);

-- Create index on moderated_at for sorting
CREATE INDEX IF NOT EXISTS idx_reviews_moderated_at ON public.reviews(moderated_at DESC);

-- Update existing reviews to 'approved' status (assuming they were already published)
UPDATE public.reviews
SET status = 'approved'
WHERE status IS NULL OR status = 'pending';

