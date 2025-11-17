-- Phase 1: Marketing & Growth System - Campaign/Promo/Referral tables
-- Campaigns table
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('email', 'sms', 'whatsapp', 'meta_ads', 'google_ads')) NOT NULL,
  status TEXT CHECK (status IN ('draft', 'scheduled', 'running', 'paused', 'completed')) DEFAULT 'draft',
  audience_filter JSONB NOT NULL,
  template_id UUID,
  scheduled_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  budget DECIMAL(10,2),
  results JSONB DEFAULT '{}',
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Message templates table
CREATE TABLE IF NOT EXISTS message_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('email', 'sms', 'whatsapp')) NOT NULL,
  subject TEXT,
  content TEXT NOT NULL,
  variables TEXT[],
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Promo codes table
CREATE TABLE IF NOT EXISTS promo_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('percentage', 'fixed_amount', 'free_addon')) NOT NULL,
  value DECIMAL(10,2),
  min_order_amount DECIMAL(10,2) DEFAULT 0,
  max_uses INTEGER,
  used_count INTEGER DEFAULT 0,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  applicable_services UUID[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Referrals table
CREATE TABLE IF NOT EXISTS referrals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID REFERENCES public.users(id),
  referee_id UUID REFERENCES public.users(id),
  referral_code TEXT UNIQUE,
  status TEXT CHECK (status IN ('pending', 'completed', 'rewarded')) DEFAULT 'pending',
  reward_amount DECIMAL(10,2),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Additive schema changes and missing tables for Supabase
-- Safe to run multiple times (uses IF NOT EXISTS where possible)

-- Ensure UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- Required for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =========================
-- Missing/aux columns
-- =========================

-- services: duration estimate used by API mocks
ALTER TABLE public.services
ADD COLUMN IF NOT EXISTS duration_minutes INTEGER;

-- provider_profiles: verification status, service areas, bio
ALTER TABLE public.provider_profiles
ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'unverified'
  CHECK (verification_status IN ('unverified','pending','verified','rejected'));

ALTER TABLE public.provider_profiles
ADD COLUMN IF NOT EXISTS service_areas TEXT[];

ALTER TABLE public.provider_profiles
ADD COLUMN IF NOT EXISTS bio TEXT;

-- provider_profiles: Stripe Connect metadata
ALTER TABLE public.provider_profiles
ADD COLUMN IF NOT EXISTS stripe_account_id TEXT;

ALTER TABLE public.provider_profiles
ADD COLUMN IF NOT EXISTS payouts_enabled BOOLEAN DEFAULT false;

ALTER TABLE public.provider_profiles
ADD COLUMN IF NOT EXISTS details_submitted BOOLEAN DEFAULT false;

-- users: optional 'name' alias used by some routes
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS name TEXT;

-- bookings: convenience fields referenced by mocks
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS notes TEXT;

ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS date DATE;

ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS time TIME;

-- transactions: loose 'type' alias in addition to transaction_type
ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS type TEXT;

-- notifications: 'read' alias in addition to is_read
ALTER TABLE public.notifications
ADD COLUMN IF NOT EXISTS read BOOLEAN DEFAULT false;

-- =========================
-- New tables
-- =========================

-- Provider day-level availability with discrete time slots
CREATE TABLE IF NOT EXISTS public.availability (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_id UUID NOT NULL REFERENCES public.provider_profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  time_slots TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(provider_id, date)
);

-- Optional contact submissions table (referenced by API comments)
CREATE TABLE IF NOT EXISTS public.contact_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  subject TEXT,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new','reviewed','archived')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =========================
-- Indexes
-- =========================
CREATE INDEX IF NOT EXISTS idx_availability_provider_date
  ON public.availability(provider_id, date);

-- =========================
-- RLS enablement
-- =========================
ALTER TABLE public.availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;

-- =========================
-- RLS policies
-- =========================

-- Availability:
--  - Anyone can view availability (for discovery/booking)
--  - Providers manage their own records
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'availability' AND policyname = 'Anyone can view availability'
  ) THEN
    CREATE POLICY "Anyone can view availability"
      ON public.availability FOR SELECT
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'availability' AND policyname = 'Providers can manage their availability'
  ) THEN
    CREATE POLICY "Providers can manage their availability"
      ON public.availability FOR ALL
      USING (
        provider_id IN (
          SELECT id FROM public.provider_profiles WHERE user_id = auth.uid()
        )
      )
      WITH CHECK (
        provider_id IN (
          SELECT id FROM public.provider_profiles WHERE user_id = auth.uid()
        )
      );
  END IF;
END$$;

-- =========================
-- Verification & Trust Tables
-- =========================

-- Core verification records
CREATE TABLE IF NOT EXISTS public.verifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (
    type IN (
      'government_id','face','social','background','reference','drug','vaccination','insurance'
    )
  ),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending','action_required','passed','failed','expired')
  ),
  vendor TEXT,
  vendor_ref TEXT,
  score NUMERIC,
  flags JSONB DEFAULT '{}'::jsonb,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, type)
);

-- Events/audit trail for verification lifecycle (immutable)
CREATE TABLE IF NOT EXISTS public.verification_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  verification_id UUID NOT NULL REFERENCES public.verifications(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Explicit consents (e.g., biometric, background, drug)
CREATE TABLE IF NOT EXISTS public.consents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  scope TEXT NOT NULL,
  version TEXT NOT NULL,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at TIMESTAMPTZ,
  ip INET,
  user_agent TEXT
);
CREATE INDEX IF NOT EXISTS idx_consents_user_scope
  ON public.consents(user_id, scope);

-- Stored artifacts metadata (hash + signed storage URL)
CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  verification_id UUID REFERENCES public.verifications(id) ON DELETE SET NULL,
  kind TEXT NOT NULL,
  hash_sha256 TEXT,
  storage_url TEXT, -- signed URL; do not store raw PII here
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_documents_user_kind
  ON public.documents(user_id, kind);

-- Policy evaluations (derived results)
CREATE TABLE IF NOT EXISTS public.policy_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  policy_name TEXT NOT NULL,
  result TEXT NOT NULL CHECK (result IN ('pass','fail','review')),
  reasons JSONB DEFAULT '{}'::jsonb,
  effective_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_policy_results_user_policy
  ON public.policy_results(user_id, policy_name);

-- Continuous monitoring subscriptions (e.g., background, insurance)
CREATE TABLE IF NOT EXISTS public.monitoring_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('background','insurance')),
  vendor TEXT,
  vendor_ref TEXT,
  active BOOLEAN DEFAULT true,
  next_check_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_monitoring_user_type_active
  ON public.monitoring_subscriptions(user_id, type, active);

-- =========================
-- RLS enablement
-- =========================
ALTER TABLE public.verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.policy_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monitoring_subscriptions ENABLE ROW LEVEL SECURITY;

-- =========================
-- RLS policies (minimal)
-- =========================
DO $$
BEGIN
  -- verifications: users can view their own; admins can view all; no direct insert/update for clients
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='verifications' AND policyname='Users can view own verifications'
  ) THEN
    CREATE POLICY "Users can view own verifications"
      ON public.verifications FOR SELECT
      USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('admin','root_admin')));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='verifications' AND policyname='Service inserts/updates via RPC'
  ) THEN
    CREATE POLICY "Service inserts/updates via RPC"
      ON public.verifications FOR ALL
      USING (true) WITH CHECK (true);
  END IF;

  -- verification_events: read own via join, writes via service
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='verification_events' AND policyname='Users can view own verification events'
  ) THEN
    CREATE POLICY "Users can view own verification events"
      ON public.verification_events FOR SELECT
      USING (EXISTS (
        SELECT 1 FROM public.verifications v WHERE v.id = verification_events.verification_id
        AND (v.user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('admin','root_admin')))
      ));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='verification_events' AND policyname='Service writes events'
  ) THEN
    CREATE POLICY "Service writes events"
      ON public.verification_events FOR ALL
      USING (true) WITH CHECK (true);
  END IF;

  -- consents: users manage their own
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='consents' AND policyname='Users manage own consents'
  ) THEN
    CREATE POLICY "Users manage own consents"
      ON public.consents FOR ALL
      USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
  END IF;

  -- documents: users can view their own; service writes
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='documents' AND policyname='Users view own documents'
  ) THEN
    CREATE POLICY "Users view own documents"
      ON public.documents FOR SELECT
      USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('admin','root_admin')));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='documents' AND policyname='Service writes documents'
  ) THEN
    CREATE POLICY "Service writes documents"
      ON public.documents FOR ALL
      USING (true) WITH CHECK (true);
  END IF;

  -- policy_results: users view own; service writes
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='policy_results' AND policyname='Users view own policy results'
  ) THEN
    CREATE POLICY "Users view own policy results"
      ON public.policy_results FOR SELECT
      USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('admin','root_admin')));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='policy_results' AND policyname='Service writes policy results'
  ) THEN
    CREATE POLICY "Service writes policy results"
      ON public.policy_results FOR ALL
      USING (true) WITH CHECK (true);
  END IF;

  -- monitoring_subscriptions: users view own; service writes
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='monitoring_subscriptions' AND policyname='Users view own monitoring subscriptions'
  ) THEN
    CREATE POLICY "Users view own monitoring subscriptions"
      ON public.monitoring_subscriptions FOR SELECT
      USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('admin','root_admin')));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='monitoring_subscriptions' AND policyname='Service writes monitoring subscriptions'
  ) THEN
    CREATE POLICY "Service writes monitoring subscriptions"
      ON public.monitoring_subscriptions FOR ALL
      USING (true) WITH CHECK (true);
  END IF;
END$$;

-- =========================
-- Triggers to maintain updated_at
-- =========================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_verifications_updated_at') THEN
    CREATE TRIGGER update_verifications_updated_at
      BEFORE UPDATE ON public.verifications
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_monitoring_subscriptions_updated_at') THEN
    CREATE TRIGGER update_monitoring_subscriptions_updated_at
      BEFORE UPDATE ON public.monitoring_subscriptions
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END$$;

-- Contact submissions:
--  - Authenticated users can insert submissions
--  - Only admins can view/update (based on users.role)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'contact_submissions' AND policyname = 'Authenticated can create contact submissions'
  ) THEN
    CREATE POLICY "Authenticated can create contact submissions"
      ON public.contact_submissions FOR INSERT
      WITH CHECK (auth.uid() IS NOT NULL);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'contact_submissions' AND policyname = 'Admins can view contact submissions'
  ) THEN
    CREATE POLICY "Admins can view contact submissions"
      ON public.contact_submissions FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.users u
          WHERE u.id = auth.uid() AND u.role = 'admin'
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'contact_submissions' AND policyname = 'Admins can update contact submissions'
  ) THEN
    CREATE POLICY "Admins can update contact submissions"
      ON public.contact_submissions FOR UPDATE
      USING (
        EXISTS (
          SELECT 1 FROM public.users u
          WHERE u.id = auth.uid() AND u.role = 'admin'
        )
      );
  END IF;
END$$;

-- =========================
-- Triggers to maintain updated_at
-- (Assumes update_updated_at_column() exists from 04_create_functions.sql)
-- =========================
DO $$
BEGIN
  -- availability
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_availability_updated_at'
  ) THEN
    CREATE TRIGGER update_availability_updated_at
      BEFORE UPDATE ON public.availability
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  -- contact_submissions
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_contact_submissions_updated_at'
  ) THEN
    CREATE TRIGGER update_contact_submissions_updated_at
      BEFORE UPDATE ON public.contact_submissions
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END$$;


