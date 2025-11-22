-- Gamification System Rollback Script
-- WARNING: This will drop all gamification tables and data
-- Only use this if you need to completely remove the gamification system
-- Make sure you have a backup before running this!

-- Drop functions first (they may have dependencies)
DROP FUNCTION IF EXISTS public.award_points(UUID, TEXT, TEXT, INTEGER, JSONB, UUID);
DROP FUNCTION IF EXISTS public.check_badge_eligibility(UUID, TEXT, TEXT, UUID);
DROP FUNCTION IF EXISTS public.calculate_user_level(UUID, TEXT, UUID);
DROP FUNCTION IF EXISTS public.update_leaderboard(TEXT, TEXT, TEXT, INTEGER, UUID);

-- Drop triggers
DROP TRIGGER IF EXISTS update_gamification_points_updated_at ON public.gamification_points;
DROP TRIGGER IF EXISTS update_leaderboards_updated_at ON public.gamification_leaderboards;
DROP TRIGGER IF EXISTS update_gtm_strategy_updated_at ON public.gtm_strategy_progress;
DROP TRIGGER IF EXISTS update_team_todo_updated_at ON public.team_todo_progress;
DROP TRIGGER IF EXISTS update_kpi_tracking_updated_at ON public.kpi_tracking;

-- Drop tables (in reverse order of dependencies)
DROP TABLE IF EXISTS public.challenge_participants CASCADE;
DROP TABLE IF EXISTS public.gamification_challenges CASCADE;
DROP TABLE IF EXISTS public.user_badges CASCADE;
DROP TABLE IF EXISTS public.gamification_badges CASCADE;
DROP TABLE IF EXISTS public.gamification_points_transactions CASCADE;
DROP TABLE IF EXISTS public.gamification_points CASCADE;
DROP TABLE IF EXISTS public.gamification_levels CASCADE;
DROP TABLE IF EXISTS public.gamification_leaderboards CASCADE;
DROP TABLE IF EXISTS public.gtm_strategy_progress CASCADE;
DROP TABLE IF EXISTS public.team_todo_progress CASCADE;
DROP TABLE IF EXISTS public.kpi_tracking CASCADE;

-- Drop indexes (if they weren't dropped with tables)
-- Note: Indexes are automatically dropped when tables are dropped,
-- but we include this for completeness
DROP INDEX IF EXISTS idx_gamification_points_user_id;
DROP INDEX IF EXISTS idx_gamification_points_user_type;
DROP INDEX IF EXISTS idx_gamification_points_level;
DROP INDEX IF EXISTS idx_gamification_points_tenant_id;
DROP INDEX IF EXISTS idx_gamification_points_user_type_tenant;
DROP INDEX IF EXISTS idx_gamification_points_points_desc;
DROP INDEX IF EXISTS idx_points_transactions_user_id;
DROP INDEX IF EXISTS idx_points_transactions_user_type;
DROP INDEX IF EXISTS idx_points_transactions_tenant_id;
DROP INDEX IF EXISTS idx_points_transactions_action_type;
DROP INDEX IF EXISTS idx_points_transactions_created_at;
DROP INDEX IF EXISTS idx_points_transactions_user_created;
DROP INDEX IF EXISTS idx_gamification_badges_code;
DROP INDEX IF EXISTS idx_gamification_badges_badge_type;
DROP INDEX IF EXISTS idx_gamification_badges_tenant_id;
DROP INDEX IF EXISTS idx_user_badges_user_id;
DROP INDEX IF EXISTS idx_user_badges_user_type;
DROP INDEX IF EXISTS idx_user_badges_badge_id;
DROP INDEX IF EXISTS idx_user_badges_tenant_id;
DROP INDEX IF EXISTS idx_user_badges_earned_at;
DROP INDEX IF EXISTS idx_user_badges_user_tenant;
DROP INDEX IF EXISTS idx_gamification_levels_level_number;
DROP INDEX IF EXISTS idx_gamification_levels_user_type;
DROP INDEX IF EXISTS idx_gamification_levels_points_threshold;
DROP INDEX IF EXISTS idx_gamification_levels_tenant_id;
DROP INDEX IF EXISTS idx_leaderboards_type;
DROP INDEX IF EXISTS idx_leaderboards_user_type;
DROP INDEX IF EXISTS idx_leaderboards_timeframe;
DROP INDEX IF EXISTS idx_leaderboards_tenant_id;
DROP INDEX IF EXISTS idx_leaderboards_updated_at;
DROP INDEX IF EXISTS idx_challenges_status;
DROP INDEX IF EXISTS idx_challenges_dates;
DROP INDEX IF EXISTS idx_challenges_tenant_id;
DROP INDEX IF EXISTS idx_challenges_type;
DROP INDEX IF EXISTS idx_challenge_participants_challenge_id;
DROP INDEX IF EXISTS idx_challenge_participants_user_id;
DROP INDEX IF EXISTS idx_challenge_participants_user_type;
DROP INDEX IF EXISTS idx_challenge_participants_tenant_id;
DROP INDEX IF EXISTS idx_challenge_participants_completed;
DROP INDEX IF EXISTS idx_gtm_strategy_phase;
DROP INDEX IF EXISTS idx_gtm_strategy_status;
DROP INDEX IF EXISTS idx_gtm_strategy_tenant_id;
DROP INDEX IF EXISTS idx_gtm_strategy_updated_at;
DROP INDEX IF EXISTS idx_team_todo_assignee;
DROP INDEX IF EXISTS idx_team_todo_status;
DROP INDEX IF EXISTS idx_team_todo_priority;
DROP INDEX IF EXISTS idx_team_todo_due_date;
DROP INDEX IF EXISTS idx_team_todo_tenant_id;
DROP INDEX IF EXISTS idx_team_todo_assignee_status;
DROP INDEX IF EXISTS idx_kpi_metric_name;
DROP INDEX IF EXISTS idx_kpi_period;
DROP INDEX IF EXISTS idx_kpi_tenant_id;
DROP INDEX IF EXISTS idx_kpi_period_dates;
DROP INDEX IF EXISTS idx_kpi_updated_at;

-- Note: RLS policies are automatically dropped when tables are dropped
-- No need to explicitly drop them

COMMENT ON SCHEMA public IS 'Gamification system has been rolled back. All tables, functions, and policies have been removed.';

