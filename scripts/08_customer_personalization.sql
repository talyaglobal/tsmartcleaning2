-- Customer Personalization: preferences, favorite cleaners, custom checklists
-- Idempotent creation for safe re-runs

-- Preferences per customer
CREATE TABLE IF NOT EXISTS public.customer_preferences (
  user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  -- Products/music/temperature and general cleaning prefs
  preferred_products TEXT[], -- e.g., ['eco','hypoallergenic','brand:X']
  preferred_music TEXT, -- e.g., 'lofi', 'classical'
  preferred_temperature INTEGER, -- Fahrenheit
  special_instructions TEXT,
  eco_friendly BOOLEAN DEFAULT false,
  pet_friendly BOOLEAN DEFAULT false,
  -- Time preferences
  preferred_time_slot TEXT CHECK (preferred_time_slot IN ('morning','afternoon','evening')) ,
  time_windows JSONB, -- [{day:'mon', start:'09:00', end:'12:00'}, ...]
  do_not_disturb JSONB, -- [{day:'sun', start:'08:00', end:'10:00'}]
  -- Communication preferences
  preferred_channels TEXT[] DEFAULT ARRAY['email']::TEXT[] CHECK (
    preferred_channels <@ ARRAY['email','sms','whatsapp','push']::TEXT[]
  ),
  marketing_opt_in BOOLEAN DEFAULT false,
  -- Address preferences
  default_address_id UUID REFERENCES public.addresses(id) ON DELETE SET NULL,
  -- Pet preferences
  has_pets BOOLEAN DEFAULT false,
  pet_types TEXT[], -- e.g., ['dog','cat']
  pet_notes TEXT,
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customer_preferences_default_addr
  ON public.customer_preferences (default_address_id);

-- Favorite cleaners (providers) per customer
CREATE TABLE IF NOT EXISTS public.favorite_cleaners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES public.provider_profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, provider_id)
);

CREATE INDEX IF NOT EXISTS idx_favorite_cleaners_user ON public.favorite_cleaners (user_id);
CREATE INDEX IF NOT EXISTS idx_favorite_cleaners_provider ON public.favorite_cleaners (provider_id);

-- Custom checklists per customer
CREATE TABLE IF NOT EXISTS public.custom_checklists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  items JSONB NOT NULL, -- [{label:'Vacuum living room', checked:false, notes:''}, ...]
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_custom_checklists_user ON public.custom_checklists (user_id);
CREATE INDEX IF NOT EXISTS idx_custom_checklists_default ON public.custom_checklists (user_id, is_default);

-- Trigger to maintain updated_at columns
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_customer_preferences_updated ON public.customer_preferences;
CREATE TRIGGER trg_customer_preferences_updated
BEFORE UPDATE ON public.customer_preferences
FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

DROP TRIGGER IF EXISTS trg_custom_checklists_updated ON public.custom_checklists;
CREATE TRIGGER trg_custom_checklists_updated
BEFORE UPDATE ON public.custom_checklists
FOR EACH ROW EXECUTE PROCEDURE public.set_updated_at();

-- RLS: enable and basic policies (owner-only)
ALTER TABLE public.customer_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorite_cleaners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_checklists ENABLE ROW LEVEL SECURITY;

-- Policies: users can manage their own rows
DO $$
BEGIN
  -- customer_preferences
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'customer_preferences' AND policyname = 'customer_preferences_owner_select'
  ) THEN
    CREATE POLICY customer_preferences_owner_select
      ON public.customer_preferences
      FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'customer_preferences' AND policyname = 'customer_preferences_owner_upsert'
  ) THEN
    CREATE POLICY customer_preferences_owner_upsert
      ON public.customer_preferences
      FOR INSERT WITH CHECK (auth.uid() = user_id)
      TO authenticated;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'customer_preferences' AND policyname = 'customer_preferences_owner_update'
  ) THEN
    CREATE POLICY customer_preferences_owner_update
      ON public.customer_preferences
      FOR UPDATE USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;

  -- favorite_cleaners
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'favorite_cleaners' AND policyname = 'favorite_cleaners_owner_all'
  ) THEN
    CREATE POLICY favorite_cleaners_owner_all
      ON public.favorite_cleaners
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;

  -- custom_checklists
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'custom_checklists' AND policyname = 'custom_checklists_owner_all'
  ) THEN
    CREATE POLICY custom_checklists_owner_all
      ON public.custom_checklists
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;


