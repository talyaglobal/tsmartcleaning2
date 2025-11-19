-- About Page Data Tables
-- Idempotent creation for safe re-runs

-- Team members table
CREATE TABLE IF NOT EXISTS public.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  bio TEXT,
  photo_url TEXT,
  email TEXT,
  linkedin_url TEXT,
  twitter_url TEXT,
  display_order INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Company timeline table
CREATE TABLE IF NOT EXISTS public.company_timeline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year INTEGER NOT NULL,
  month INTEGER, -- Optional, for more precise dates
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Office locations table
CREATE TABLE IF NOT EXISTS public.office_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address_line_1 TEXT NOT NULL,
  address_line_2 TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip_code TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'USA',
  phone TEXT,
  email TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  is_headquarters BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Press/media mentions table
CREATE TABLE IF NOT EXISTS public.press_mentions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  publication TEXT NOT NULL,
  url TEXT,
  published_date DATE,
  excerpt TEXT,
  image_url TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_team_members_display_order ON public.team_members(display_order);
CREATE INDEX IF NOT EXISTS idx_team_members_featured ON public.team_members(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_company_timeline_year ON public.company_timeline(year DESC);
CREATE INDEX IF NOT EXISTS idx_company_timeline_display_order ON public.company_timeline(display_order);
CREATE INDEX IF NOT EXISTS idx_office_locations_display_order ON public.office_locations(display_order);
CREATE INDEX IF NOT EXISTS idx_press_mentions_published_date ON public.press_mentions(published_date DESC);
CREATE INDEX IF NOT EXISTS idx_press_mentions_display_order ON public.press_mentions(display_order);

-- Enable Row Level Security
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.office_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.press_mentions ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Public read access, admin write access
DO $$
BEGIN
  -- Team members: public read, admin write
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'team_members' AND policyname = 'team_members_select_public'
  ) THEN
    CREATE POLICY team_members_select_public ON public.team_members
      FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'team_members' AND policyname = 'team_members_modify_admin'
  ) THEN
    CREATE POLICY team_members_modify_admin ON public.team_members
      FOR ALL USING (
        EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('admin', 'root_admin'))
      );
  END IF;

  -- Company timeline: public read, admin write
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'company_timeline' AND policyname = 'company_timeline_select_public'
  ) THEN
    CREATE POLICY company_timeline_select_public ON public.company_timeline
      FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'company_timeline' AND policyname = 'company_timeline_modify_admin'
  ) THEN
    CREATE POLICY company_timeline_modify_admin ON public.company_timeline
      FOR ALL USING (
        EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('admin', 'root_admin'))
      );
  END IF;

  -- Office locations: public read, admin write
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'office_locations' AND policyname = 'office_locations_select_public'
  ) THEN
    CREATE POLICY office_locations_select_public ON public.office_locations
      FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'office_locations' AND policyname = 'office_locations_modify_admin'
  ) THEN
    CREATE POLICY office_locations_modify_admin ON public.office_locations
      FOR ALL USING (
        EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('admin', 'root_admin'))
      );
  END IF;

  -- Press mentions: public read, admin write
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'press_mentions' AND policyname = 'press_mentions_select_public'
  ) THEN
    CREATE POLICY press_mentions_select_public ON public.press_mentions
      FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'press_mentions' AND policyname = 'press_mentions_modify_admin'
  ) THEN
    CREATE POLICY press_mentions_modify_admin ON public.press_mentions
      FOR ALL USING (
        EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role IN ('admin', 'root_admin'))
      );
  END IF;
END $$;

