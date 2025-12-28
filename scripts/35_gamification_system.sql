-- Gamification System Migration
-- Creates comprehensive gamification tables, indexes, RLS policies, and functions
-- Safe to re-run; uses IF NOT EXISTS and guards

-- Ensure required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =========================
-- gamification_points
-- =========================
CREATE TABLE IF NOT EXISTS public.gamification_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  user_type TEXT NOT NULL CHECK (user_type IN ('company', 'cleaner')),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  points INTEGER NOT NULL DEFAULT 0 CHECK (points >= 0),
  level INTEGER NOT NULL DEFAULT 1 CHECK (level >= 1),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, user_type, tenant_id)
);

-- Indexes for gamification_points
CREATE INDEX IF NOT EXISTS idx_gamification_points_user_id ON public.gamification_points(user_id);
CREATE INDEX IF NOT EXISTS idx_gamification_points_user_type ON public.gamification_points(user_type);
CREATE INDEX IF NOT EXISTS idx_gamification_points_level ON public.gamification_points(level);
CREATE INDEX IF NOT EXISTS idx_gamification_points_tenant_id ON public.gamification_points(tenant_id);
CREATE INDEX IF NOT EXISTS idx_gamification_points_user_type_tenant ON public.gamification_points(user_type, tenant_id);
CREATE INDEX IF NOT EXISTS idx_gamification_points_points_desc ON public.gamification_points(points DESC);

-- =========================
-- gamification_points_transactions
-- =========================
CREATE TABLE IF NOT EXISTS public.gamification_points_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  user_type TEXT NOT NULL CHECK (user_type IN ('company', 'cleaner')),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL, -- e.g., 'booking_completed', 'review_received', 'badge_earned', 'challenge_completed'
  points_delta INTEGER NOT NULL, -- positive for earned, negative for spent
  metadata JSONB DEFAULT '{}'::jsonb, -- additional context about the transaction
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for gamification_points_transactions
CREATE INDEX IF NOT EXISTS idx_points_transactions_user_id ON public.gamification_points_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_points_transactions_user_type ON public.gamification_points_transactions(user_type);
CREATE INDEX IF NOT EXISTS idx_points_transactions_tenant_id ON public.gamification_points_transactions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_points_transactions_action_type ON public.gamification_points_transactions(action_type);
CREATE INDEX IF NOT EXISTS idx_points_transactions_created_at ON public.gamification_points_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_points_transactions_user_created ON public.gamification_points_transactions(user_id, user_type, created_at DESC);

-- =========================
-- gamification_badges
-- =========================
CREATE TABLE IF NOT EXISTS public.gamification_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE, -- unique identifier for the badge (e.g., 'first_booking', 'perfect_week')
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT, -- URL or icon identifier
  badge_type TEXT NOT NULL CHECK (badge_type IN ('company', 'cleaner', 'both')),
  criteria JSONB DEFAULT '{}'::jsonb, -- criteria for earning the badge
  bonus_points INTEGER DEFAULT 0 CHECK (bonus_points >= 0),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE, -- NULL for global badges
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for gamification_badges
CREATE INDEX IF NOT EXISTS idx_gamification_badges_code ON public.gamification_badges(code);
CREATE INDEX IF NOT EXISTS idx_gamification_badges_badge_type ON public.gamification_badges(badge_type);
CREATE INDEX IF NOT EXISTS idx_gamification_badges_tenant_id ON public.gamification_badges(tenant_id);

-- =========================
-- user_badges
-- =========================
CREATE TABLE IF NOT EXISTS public.user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  user_type TEXT NOT NULL CHECK (user_type IN ('company', 'cleaner')),
  badge_id UUID NOT NULL REFERENCES public.gamification_badges(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb, -- context about how/when badge was earned
  UNIQUE(user_id, user_type, badge_id, tenant_id)
);

-- Indexes for user_badges
CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON public.user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_user_type ON public.user_badges(user_type);
CREATE INDEX IF NOT EXISTS idx_user_badges_badge_id ON public.user_badges(badge_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_tenant_id ON public.user_badges(tenant_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_earned_at ON public.user_badges(earned_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_badges_user_tenant ON public.user_badges(user_id, user_type, tenant_id);

-- =========================
-- gamification_levels
-- =========================
CREATE TABLE IF NOT EXISTS public.gamification_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level_name TEXT NOT NULL, -- e.g., 'Bronze', 'Silver', 'Gold', 'Platinum'
  level_number INTEGER NOT NULL CHECK (level_number >= 1),
  user_type TEXT NOT NULL CHECK (user_type IN ('company', 'cleaner', 'both')),
  points_threshold INTEGER NOT NULL CHECK (points_threshold >= 0),
  rewards JSONB DEFAULT '{}'::jsonb, -- rewards for reaching this level
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE, -- NULL for global levels
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(level_number, user_type, tenant_id)
);

-- Indexes for gamification_levels
CREATE INDEX IF NOT EXISTS idx_gamification_levels_level_number ON public.gamification_levels(level_number);
CREATE INDEX IF NOT EXISTS idx_gamification_levels_user_type ON public.gamification_levels(user_type);
CREATE INDEX IF NOT EXISTS idx_gamification_levels_points_threshold ON public.gamification_levels(points_threshold);
CREATE INDEX IF NOT EXISTS idx_gamification_levels_tenant_id ON public.gamification_levels(tenant_id);

-- =========================
-- gamification_leaderboards
-- =========================
CREATE TABLE IF NOT EXISTS public.gamification_leaderboards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  leaderboard_type TEXT NOT NULL, -- e.g., 'weekly', 'monthly', 'all_time', 'challenge'
  user_type TEXT NOT NULL CHECK (user_type IN ('company', 'cleaner')),
  timeframe TEXT, -- e.g., '2024-01', '2024-W01', 'all_time'
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  rankings JSONB NOT NULL DEFAULT '[]'::jsonb, -- array of {user_id, points, rank, level}
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(leaderboard_type, user_type, timeframe, tenant_id)
);

-- Indexes for gamification_leaderboards
CREATE INDEX IF NOT EXISTS idx_leaderboards_type ON public.gamification_leaderboards(leaderboard_type);
CREATE INDEX IF NOT EXISTS idx_leaderboards_user_type ON public.gamification_leaderboards(user_type);
CREATE INDEX IF NOT EXISTS idx_leaderboards_timeframe ON public.gamification_leaderboards(timeframe);
CREATE INDEX IF NOT EXISTS idx_leaderboards_tenant_id ON public.gamification_leaderboards(tenant_id);
CREATE INDEX IF NOT EXISTS idx_leaderboards_updated_at ON public.gamification_leaderboards(updated_at DESC);

-- =========================
-- gamification_challenges
-- =========================
CREATE TABLE IF NOT EXISTS public.gamification_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  challenge_type TEXT NOT NULL, -- e.g., 'booking_count', 'rating_target', 'streak', 'custom'
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  criteria JSONB NOT NULL DEFAULT '{}'::jsonb, -- criteria for completing the challenge
  rewards JSONB DEFAULT '{}'::jsonb, -- rewards for completing the challenge
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed', 'cancelled')),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (end_date > start_date)
);

-- Indexes for gamification_challenges
CREATE INDEX IF NOT EXISTS idx_challenges_status ON public.gamification_challenges(status);
CREATE INDEX IF NOT EXISTS idx_challenges_dates ON public.gamification_challenges(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_challenges_tenant_id ON public.gamification_challenges(tenant_id);
CREATE INDEX IF NOT EXISTS idx_challenges_type ON public.gamification_challenges(challenge_type);

-- =========================
-- challenge_participants
-- =========================
CREATE TABLE IF NOT EXISTS public.challenge_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID NOT NULL REFERENCES public.gamification_challenges(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  user_type TEXT NOT NULL CHECK (user_type IN ('company', 'cleaner')),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  progress JSONB DEFAULT '{}'::jsonb, -- current progress towards challenge completion
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(challenge_id, user_id, user_type, tenant_id)
);

-- Indexes for challenge_participants
CREATE INDEX IF NOT EXISTS idx_challenge_participants_challenge_id ON public.challenge_participants(challenge_id);
CREATE INDEX IF NOT EXISTS idx_challenge_participants_user_id ON public.challenge_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_challenge_participants_user_type ON public.challenge_participants(user_type);
CREATE INDEX IF NOT EXISTS idx_challenge_participants_tenant_id ON public.challenge_participants(tenant_id);
CREATE INDEX IF NOT EXISTS idx_challenge_participants_completed ON public.challenge_participants(completed_at) WHERE completed_at IS NOT NULL;

-- =========================
-- gtm_strategy_progress
-- =========================
CREATE TABLE IF NOT EXISTS public.gtm_strategy_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phase TEXT NOT NULL, -- e.g., 'phase_1', 'phase_2', 'phase_3'
  milestone TEXT NOT NULL, -- specific milestone within the phase
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'blocked')),
  completion_percentage INTEGER DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
  notes TEXT,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for gtm_strategy_progress
CREATE INDEX IF NOT EXISTS idx_gtm_strategy_phase ON public.gtm_strategy_progress(phase);
CREATE INDEX IF NOT EXISTS idx_gtm_strategy_status ON public.gtm_strategy_progress(status);
CREATE INDEX IF NOT EXISTS idx_gtm_strategy_tenant_id ON public.gtm_strategy_progress(tenant_id);
CREATE INDEX IF NOT EXISTS idx_gtm_strategy_updated_at ON public.gtm_strategy_progress(updated_at DESC);

-- =========================
-- team_todo_progress
-- =========================
CREATE TABLE IF NOT EXISTS public.team_todo_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignee TEXT NOT NULL CHECK (assignee IN ('volkan', 'ozgun')),
  task_id TEXT, -- optional external task identifier
  task_description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'blocked', 'cancelled')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  due_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for team_todo_progress
CREATE INDEX IF NOT EXISTS idx_team_todo_assignee ON public.team_todo_progress(assignee);
CREATE INDEX IF NOT EXISTS idx_team_todo_status ON public.team_todo_progress(status);
CREATE INDEX IF NOT EXISTS idx_team_todo_priority ON public.team_todo_progress(priority);
CREATE INDEX IF NOT EXISTS idx_team_todo_due_date ON public.team_todo_progress(due_date);
CREATE INDEX IF NOT EXISTS idx_team_todo_tenant_id ON public.team_todo_progress(tenant_id);
CREATE INDEX IF NOT EXISTS idx_team_todo_assignee_status ON public.team_todo_progress(assignee, status);

-- =========================
-- kpi_tracking
-- =========================
CREATE TABLE IF NOT EXISTS public.kpi_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_name TEXT NOT NULL, -- e.g., 'user_retention', 'booking_conversion', 'revenue_growth'
  target_value NUMERIC,
  current_value NUMERIC,
  period TEXT NOT NULL, -- e.g., 'daily', 'weekly', 'monthly', 'quarterly', 'yearly'
  period_start TIMESTAMPTZ,
  period_end TIMESTAMPTZ,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for kpi_tracking
CREATE INDEX IF NOT EXISTS idx_kpi_metric_name ON public.kpi_tracking(metric_name);
CREATE INDEX IF NOT EXISTS idx_kpi_period ON public.kpi_tracking(period);
CREATE INDEX IF NOT EXISTS idx_kpi_tenant_id ON public.kpi_tracking(tenant_id);
CREATE INDEX IF NOT EXISTS idx_kpi_period_dates ON public.kpi_tracking(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_kpi_updated_at ON public.kpi_tracking(updated_at DESC);

-- =========================
-- Enable RLS on all tables
-- =========================
ALTER TABLE public.gamification_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gamification_points_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gamification_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gamification_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gamification_leaderboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gamification_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gtm_strategy_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_todo_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kpi_tracking ENABLE ROW LEVEL SECURITY;

-- =========================
-- RLS Policies
-- =========================

-- Helper function to get current tenant_id (reuse if exists, otherwise create)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'current_tenant_id' AND pronamespace = 'public'::regnamespace
  ) THEN
    CREATE OR REPLACE FUNCTION public.current_tenant_id()
    RETURNS uuid
    LANGUAGE sql
    STABLE
    AS $$
      SELECT NULLIF((current_setting('request.jwt.claims', true))::jsonb ->> 'tenant_id', '')::uuid;
    $$;
  END IF;
END$$;

-- gamification_points: Users can view their own points, admins can view all in their tenant
DO $$
BEGIN
  -- Users can view their own points
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='gamification_points' AND policyname='users_view_own_points'
  ) THEN
    CREATE POLICY "users_view_own_points"
      ON public.gamification_points FOR SELECT
      USING (
        user_id = auth.uid() AND 
        (tenant_id = public.current_tenant_id() OR tenant_id IS NULL)
      );
  END IF;

  -- Service role can view all
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='gamification_points' AND policyname='service_role_all_access'
  ) THEN
    CREATE POLICY "service_role_all_access"
      ON public.gamification_points FOR ALL
      USING (auth.jwt() ->> 'role' = 'service_role');
  END IF;
END$$;

-- gamification_points_transactions: Users can view their own transactions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='gamification_points_transactions' AND policyname='users_view_own_transactions'
  ) THEN
    CREATE POLICY "users_view_own_transactions"
      ON public.gamification_points_transactions FOR SELECT
      USING (
        user_id = auth.uid() AND 
        (tenant_id = public.current_tenant_id() OR tenant_id IS NULL)
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='gamification_points_transactions' AND policyname='service_role_all_access'
  ) THEN
    CREATE POLICY "service_role_all_access"
      ON public.gamification_points_transactions FOR ALL
      USING (auth.jwt() ->> 'role' = 'service_role');
  END IF;
END$$;

-- gamification_badges: Anyone can view badges (public), admins can manage
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='gamification_badges' AND policyname='public_view_badges'
  ) THEN
    CREATE POLICY "public_view_badges"
      ON public.gamification_badges FOR SELECT
      USING (
        tenant_id = public.current_tenant_id() OR tenant_id IS NULL
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='gamification_badges' AND policyname='service_role_all_access'
  ) THEN
    CREATE POLICY "service_role_all_access"
      ON public.gamification_badges FOR ALL
      USING (auth.jwt() ->> 'role' = 'service_role');
  END IF;
END$$;

-- user_badges: Users can view their own badges
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='user_badges' AND policyname='users_view_own_badges'
  ) THEN
    CREATE POLICY "users_view_own_badges"
      ON public.user_badges FOR SELECT
      USING (
        user_id = auth.uid() AND 
        (tenant_id = public.current_tenant_id() OR tenant_id IS NULL)
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='user_badges' AND policyname='service_role_all_access'
  ) THEN
    CREATE POLICY "service_role_all_access"
      ON public.user_badges FOR ALL
      USING (auth.jwt() ->> 'role' = 'service_role');
  END IF;
END$$;

-- gamification_levels: Public read, admin write
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='gamification_levels' AND policyname='public_view_levels'
  ) THEN
    CREATE POLICY "public_view_levels"
      ON public.gamification_levels FOR SELECT
      USING (
        tenant_id = public.current_tenant_id() OR tenant_id IS NULL
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='gamification_levels' AND policyname='service_role_all_access'
  ) THEN
    CREATE POLICY "service_role_all_access"
      ON public.gamification_levels FOR ALL
      USING (auth.jwt() ->> 'role' = 'service_role');
  END IF;
END$$;

-- gamification_leaderboards: Public read, admin write
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='gamification_leaderboards' AND policyname='public_view_leaderboards'
  ) THEN
    CREATE POLICY "public_view_leaderboards"
      ON public.gamification_leaderboards FOR SELECT
      USING (
        tenant_id = public.current_tenant_id() OR tenant_id IS NULL
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='gamification_leaderboards' AND policyname='service_role_all_access'
  ) THEN
    CREATE POLICY "service_role_all_access"
      ON public.gamification_leaderboards FOR ALL
      USING (auth.jwt() ->> 'role' = 'service_role');
  END IF;
END$$;

-- gamification_challenges: Public read active challenges, admin write
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='gamification_challenges' AND policyname='public_view_active_challenges'
  ) THEN
    CREATE POLICY "public_view_active_challenges"
      ON public.gamification_challenges FOR SELECT
      USING (
        status = 'active' AND 
        (tenant_id = public.current_tenant_id() OR tenant_id IS NULL)
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='gamification_challenges' AND policyname='service_role_all_access'
  ) THEN
    CREATE POLICY "service_role_all_access"
      ON public.gamification_challenges FOR ALL
      USING (auth.jwt() ->> 'role' = 'service_role');
  END IF;
END$$;

-- challenge_participants: Users can view their own participation
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='challenge_participants' AND policyname='users_view_own_participation'
  ) THEN
    CREATE POLICY "users_view_own_participation"
      ON public.challenge_participants FOR SELECT
      USING (
        user_id = auth.uid() AND 
        (tenant_id = public.current_tenant_id() OR tenant_id IS NULL)
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='challenge_participants' AND policyname='users_insert_own_participation'
  ) THEN
    CREATE POLICY "users_insert_own_participation"
      ON public.challenge_participants FOR INSERT
      WITH CHECK (
        user_id = auth.uid() AND 
        (tenant_id = public.current_tenant_id() OR tenant_id IS NULL)
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='challenge_participants' AND policyname='service_role_all_access'
  ) THEN
    CREATE POLICY "service_role_all_access"
      ON public.challenge_participants FOR ALL
      USING (auth.jwt() ->> 'role' = 'service_role');
  END IF;
END$$;

-- gtm_strategy_progress: Admin only
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='gtm_strategy_progress' AND policyname='admin_access_gtm'
  ) THEN
    CREATE POLICY "admin_access_gtm"
      ON public.gtm_strategy_progress FOR ALL
      USING (
        auth.jwt() ->> 'role' = 'service_role' OR
        (auth.uid() IN (SELECT id FROM public.users WHERE role = 'admin'))
      );
  END IF;
END$$;

-- team_todo_progress: Team members can view their own tasks, admins can view all
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='team_todo_progress' AND policyname='team_view_own_tasks'
  ) THEN
    CREATE POLICY "team_view_own_tasks"
      ON public.team_todo_progress FOR SELECT
      USING (
        (assignee = 'volkan' AND auth.uid() IN (SELECT id FROM public.users WHERE email LIKE '%volkan%')) OR
        (assignee = 'ozgun' AND auth.uid() IN (SELECT id FROM public.users WHERE email LIKE '%ozgun%')) OR
        auth.jwt() ->> 'role' = 'service_role' OR
        (auth.uid() IN (SELECT id FROM public.users WHERE role = 'admin'))
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='team_todo_progress' AND policyname='admin_manage_tasks'
  ) THEN
    CREATE POLICY "admin_manage_tasks"
      ON public.team_todo_progress FOR ALL
      USING (
        auth.jwt() ->> 'role' = 'service_role' OR
        (auth.uid() IN (SELECT id FROM public.users WHERE role = 'admin'))
      );
  END IF;
END$$;

-- kpi_tracking: Admin only
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='kpi_tracking' AND policyname='admin_access_kpi'
  ) THEN
    CREATE POLICY "admin_access_kpi"
      ON public.kpi_tracking FOR ALL
      USING (
        auth.jwt() ->> 'role' = 'service_role' OR
        (auth.uid() IN (SELECT id FROM public.users WHERE role = 'admin'))
      );
  END IF;
END$$;

-- =========================
-- Update timestamp triggers
-- =========================
DO $$
BEGIN
  -- Ensure update_updated_at_column function exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column' AND pronamespace = 'public'::regnamespace
  ) THEN
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  END IF;

  -- Add triggers for updated_at columns
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_gamification_points_updated_at') THEN
    CREATE TRIGGER update_gamification_points_updated_at
      BEFORE UPDATE ON public.gamification_points
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_leaderboards_updated_at') THEN
    CREATE TRIGGER update_leaderboards_updated_at
      BEFORE UPDATE ON public.gamification_leaderboards
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_gtm_strategy_updated_at') THEN
    CREATE TRIGGER update_gtm_strategy_updated_at
      BEFORE UPDATE ON public.gtm_strategy_progress
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_team_todo_updated_at') THEN
    CREATE TRIGGER update_team_todo_updated_at
      BEFORE UPDATE ON public.team_todo_progress
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_kpi_tracking_updated_at') THEN
    CREATE TRIGGER update_kpi_tracking_updated_at
      BEFORE UPDATE ON public.kpi_tracking
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END$$;

-- =========================
-- Database Functions
-- =========================

-- Function: award_points
-- Awards points to a user and creates a transaction record
CREATE OR REPLACE FUNCTION public.award_points(
  p_user_id UUID,
  p_user_type TEXT,
  p_action_type TEXT,
  p_points_delta INTEGER,
  p_metadata JSONB DEFAULT '{}'::jsonb,
  p_tenant_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_transaction_id UUID;
  v_tenant_id UUID;
  v_current_points INTEGER;
  v_new_points INTEGER;
  v_current_level INTEGER;
  v_new_level INTEGER;
BEGIN
  -- Get tenant_id if not provided
  IF p_tenant_id IS NULL THEN
    v_tenant_id := public.current_tenant_id();
  ELSE
    v_tenant_id := p_tenant_id;
  END IF;

  -- Create transaction record
  INSERT INTO public.gamification_points_transactions (
    user_id, user_type, tenant_id, action_type, points_delta, metadata
  ) VALUES (
    p_user_id, p_user_type, v_tenant_id, p_action_type, p_points_delta, p_metadata
  ) RETURNING id INTO v_transaction_id;

  -- Get or create points record
  INSERT INTO public.gamification_points (user_id, user_type, tenant_id, points, level)
  VALUES (p_user_id, p_user_type, v_tenant_id, GREATEST(0, p_points_delta), 1)
  ON CONFLICT (user_id, user_type, tenant_id)
  DO UPDATE SET
    points = GREATEST(0, gamification_points.points + p_points_delta),
    updated_at = NOW()
  RETURNING points, level INTO v_new_points, v_current_level;

  -- Calculate new level
  SELECT COALESCE(MAX(level_number), 1) INTO v_new_level
  FROM public.gamification_levels
  WHERE user_type IN (p_user_type, 'both')
    AND points_threshold <= v_new_points
    AND (tenant_id = v_tenant_id OR tenant_id IS NULL)
  ORDER BY level_number DESC
  LIMIT 1;

  -- Update level if changed
  IF v_new_level > v_current_level THEN
    UPDATE public.gamification_points
    SET level = v_new_level, updated_at = NOW()
    WHERE user_id = p_user_id AND user_type = p_user_type AND tenant_id = v_tenant_id;
  END IF;

  RETURN v_transaction_id;
END;
$$;

-- Function: check_badge_eligibility
-- Checks if a user is eligible for a badge and awards it if eligible
CREATE OR REPLACE FUNCTION public.check_badge_eligibility(
  p_user_id UUID,
  p_user_type TEXT,
  p_badge_code TEXT,
  p_tenant_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_badge RECORD;
  v_tenant_id UUID;
  v_already_earned BOOLEAN;
  v_eligible BOOLEAN := false;
BEGIN
  -- Get tenant_id if not provided
  IF p_tenant_id IS NULL THEN
    v_tenant_id := public.current_tenant_id();
  ELSE
    v_tenant_id := p_tenant_id;
  END IF;

  -- Get badge information
  SELECT * INTO v_badge
  FROM public.gamification_badges
  WHERE code = p_badge_code
    AND (badge_type = p_user_type OR badge_type = 'both')
    AND (tenant_id = v_tenant_id OR tenant_id IS NULL)
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  -- Check if already earned
  SELECT EXISTS(
    SELECT 1 FROM public.user_badges
    WHERE user_id = p_user_id
      AND user_type = p_user_type
      AND badge_id = v_badge.id
      AND (tenant_id = v_tenant_id OR tenant_id IS NULL)
  ) INTO v_already_earned;

  IF v_already_earned THEN
    RETURN false;
  END IF;

  -- TODO: Implement criteria checking logic based on v_badge.criteria JSONB
  -- For now, this is a placeholder that would need to be implemented based on specific criteria
  -- Example criteria might be: {"booking_count": 10, "rating_threshold": 4.5, etc.}
  
  -- Placeholder: assume eligible if badge exists and not already earned
  -- In production, this should evaluate the criteria JSONB against user's actual data
  v_eligible := true;

  -- If eligible, award the badge
  IF v_eligible THEN
    INSERT INTO public.user_badges (user_id, user_type, badge_id, tenant_id, metadata)
    VALUES (p_user_id, p_user_type, v_badge.id, v_tenant_id, '{}'::jsonb)
    ON CONFLICT DO NOTHING;

    -- Award bonus points if any
    IF v_badge.bonus_points > 0 THEN
      PERFORM public.award_points(
        p_user_id,
        p_user_type,
        'badge_earned',
        v_badge.bonus_points,
        jsonb_build_object('badge_code', p_badge_code, 'badge_id', v_badge.id),
        v_tenant_id
      );
    END IF;

    RETURN true;
  END IF;

  RETURN false;
END;
$$;

-- Function: calculate_user_level
-- Calculates and updates a user's level based on their current points
CREATE OR REPLACE FUNCTION public.calculate_user_level(
  p_user_id UUID,
  p_user_type TEXT,
  p_tenant_id UUID DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tenant_id UUID;
  v_current_points INTEGER;
  v_new_level INTEGER;
BEGIN
  -- Get tenant_id if not provided
  IF p_tenant_id IS NULL THEN
    v_tenant_id := public.current_tenant_id();
  ELSE
    v_tenant_id := p_tenant_id;
  END IF;

  -- Get current points
  SELECT points INTO v_current_points
  FROM public.gamification_points
  WHERE user_id = p_user_id
    AND user_type = p_user_type
    AND (tenant_id = v_tenant_id OR tenant_id IS NULL)
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN 1; -- Default level
  END IF;

  -- Find the highest level the user qualifies for
  SELECT COALESCE(MAX(level_number), 1) INTO v_new_level
  FROM public.gamification_levels
  WHERE user_type IN (p_user_type, 'both')
    AND points_threshold <= v_current_points
    AND (tenant_id = v_tenant_id OR tenant_id IS NULL)
  ORDER BY level_number DESC
  LIMIT 1;

  -- Update the user's level
  UPDATE public.gamification_points
  SET level = v_new_level, updated_at = NOW()
  WHERE user_id = p_user_id
    AND user_type = p_user_type
    AND (tenant_id = v_tenant_id OR tenant_id IS NULL);

  RETURN v_new_level;
END;
$$;

-- Function: update_leaderboard
-- Updates or creates a leaderboard for a specific type and timeframe
CREATE OR REPLACE FUNCTION public.update_leaderboard(
  p_leaderboard_type TEXT,
  p_user_type TEXT,
  p_timeframe TEXT,
  p_limit INTEGER DEFAULT 100,
  p_tenant_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tenant_id UUID;
  v_leaderboard_id UUID;
  v_rankings JSONB;
  v_ranking_record RECORD;
  v_rank INTEGER := 0;
BEGIN
  -- Get tenant_id if not provided
  IF p_tenant_id IS NULL THEN
    v_tenant_id := public.current_tenant_id();
  ELSE
    v_tenant_id := p_tenant_id;
  END IF;

  -- Build rankings array
  v_rankings := '[]'::jsonb;

  -- Query top users based on points
  FOR v_ranking_record IN
    SELECT 
      gp.user_id,
      gp.points,
      gp.level,
      u.full_name,
      u.email
    FROM public.gamification_points gp
    LEFT JOIN public.users u ON u.id = gp.user_id
    WHERE gp.user_type = p_user_type
      AND (gp.tenant_id = v_tenant_id OR gp.tenant_id IS NULL)
    ORDER BY gp.points DESC, gp.updated_at DESC
    LIMIT p_limit
  LOOP
    v_rank := v_rank + 1;
    v_rankings := v_rankings || jsonb_build_object(
      'rank', v_rank,
      'user_id', v_ranking_record.user_id,
      'points', v_ranking_record.points,
      'level', v_ranking_record.level,
      'full_name', v_ranking_record.full_name,
      'email', v_ranking_record.email
    );
  END LOOP;

  -- Insert or update leaderboard
  INSERT INTO public.gamification_leaderboards (
    leaderboard_type, user_type, timeframe, tenant_id, rankings
  ) VALUES (
    p_leaderboard_type, p_user_type, p_timeframe, v_tenant_id, v_rankings
  )
  ON CONFLICT (leaderboard_type, user_type, timeframe, tenant_id)
  DO UPDATE SET
    rankings = EXCLUDED.rankings,
    updated_at = NOW()
  RETURNING id INTO v_leaderboard_id;

  RETURN v_leaderboard_id;
END;
$$;

-- =========================
-- Comments for documentation
-- =========================
COMMENT ON TABLE public.gamification_points IS 'Stores current points and level for each user';
COMMENT ON TABLE public.gamification_points_transactions IS 'Historical record of all points transactions';
COMMENT ON TABLE public.gamification_badges IS 'Available badges that users can earn';
COMMENT ON TABLE public.user_badges IS 'Badges earned by users';
COMMENT ON TABLE public.gamification_levels IS 'Level definitions with point thresholds';
COMMENT ON TABLE public.gamification_leaderboards IS 'Cached leaderboard rankings';
COMMENT ON TABLE public.gamification_challenges IS 'Time-limited challenges for users';
COMMENT ON TABLE public.challenge_participants IS 'User participation in challenges';
COMMENT ON TABLE public.gtm_strategy_progress IS 'Go-to-market strategy tracking';
COMMENT ON TABLE public.team_todo_progress IS 'Team task management';
COMMENT ON TABLE public.kpi_tracking IS 'Key performance indicators tracking';

COMMENT ON FUNCTION public.award_points IS 'Awards points to a user and creates a transaction record';
COMMENT ON FUNCTION public.check_badge_eligibility IS 'Checks if a user is eligible for a badge and awards it';
COMMENT ON FUNCTION public.calculate_user_level IS 'Calculates and updates a user''s level based on points';
COMMENT ON FUNCTION public.update_leaderboard IS 'Updates or creates a leaderboard for a specific type and timeframe';


