# Gamification Database Schema Documentation

## Overview

This document describes the database schema for the TSmartCleaning gamification system. All tables use PostgreSQL with Row Level Security (RLS) enabled for tenant isolation.

---

## Tables

### `gamification_points`

Stores current points and level for each user.

**Columns:**
- `id` (UUID, Primary Key): Unique identifier
- `user_id` (UUID, NOT NULL): Reference to users table
- `user_type` (TEXT, NOT NULL): `'company'` or `'cleaner'`
- `tenant_id` (UUID, Nullable): Reference to tenants table (NULL for global)
- `points` (INTEGER, NOT NULL, DEFAULT 0): Current total points
- `level` (INTEGER, NOT NULL, DEFAULT 1): Current level
- `created_at` (TIMESTAMPTZ, NOT NULL): Creation timestamp
- `updated_at` (TIMESTAMPTZ, NOT NULL): Last update timestamp

**Indexes:**
- `idx_gamification_points_user_id`: On `user_id`
- `idx_gamification_points_user_type`: On `user_type`
- `idx_gamification_points_level`: On `level`
- `idx_gamification_points_tenant_id`: On `tenant_id`
- `idx_gamification_points_user_type_tenant`: On `(user_type, tenant_id)`
- `idx_gamification_points_points_desc`: On `points DESC`

**Constraints:**
- `UNIQUE(user_id, user_type, tenant_id)`: One record per user per type per tenant
- `CHECK (points >= 0)`: Points cannot be negative
- `CHECK (level >= 1)`: Level must be at least 1

**RLS Policies:**
- Users can view their own points
- Service role has full access

---

### `gamification_points_transactions`

Historical record of all points transactions.

**Columns:**
- `id` (UUID, Primary Key): Unique identifier
- `user_id` (UUID, NOT NULL): Reference to users table
- `user_type` (TEXT, NOT NULL): `'company'` or `'cleaner'`
- `tenant_id` (UUID, Nullable): Reference to tenants table
- `action_type` (TEXT, NOT NULL): Type of action (e.g., `'booking_completed'`, `'review_received'`)
- `points_delta` (INTEGER, NOT NULL): Points change (positive for earned, negative for spent)
- `metadata` (JSONB, DEFAULT '{}'): Additional context about the transaction
- `created_at` (TIMESTAMPTZ, NOT NULL): Transaction timestamp

**Indexes:**
- `idx_points_transactions_user_id`: On `user_id`
- `idx_points_transactions_user_type`: On `user_type`
- `idx_points_transactions_tenant_id`: On `tenant_id`
- `idx_points_transactions_action_type`: On `action_type`
- `idx_points_transactions_created_at`: On `created_at DESC`
- `idx_points_transactions_user_created`: On `(user_id, user_type, created_at DESC)`

**Constraints:**
- `CHECK (user_type IN ('company', 'cleaner'))`: Valid user types only

**RLS Policies:**
- Users can view their own transactions
- Service role has full access

---

### `gamification_badges`

Available badges that users can earn.

**Columns:**
- `id` (UUID, Primary Key): Unique identifier
- `code` (TEXT, NOT NULL, UNIQUE): Unique badge code (e.g., `'first_booking'`)
- `name` (TEXT, NOT NULL): Display name
- `description` (TEXT): Badge description
- `icon` (TEXT): URL or icon identifier
- `badge_type` (TEXT, NOT NULL): `'company'`, `'cleaner'`, or `'both'`
- `criteria` (JSONB, DEFAULT '{}'): Criteria for earning the badge
- `bonus_points` (INTEGER, DEFAULT 0): Points awarded when badge is earned
- `tenant_id` (UUID, Nullable): Reference to tenants table (NULL for global badges)
- `created_at` (TIMESTAMPTZ, NOT NULL): Creation timestamp

**Indexes:**
- `idx_gamification_badges_code`: On `code`
- `idx_gamification_badges_badge_type`: On `badge_type`
- `idx_gamification_badges_tenant_id`: On `tenant_id`

**Constraints:**
- `CHECK (badge_type IN ('company', 'cleaner', 'both'))`: Valid badge types only
- `CHECK (bonus_points >= 0)`: Bonus points cannot be negative

**RLS Policies:**
- Public read access (anyone can view badges)
- Service role has full access

**Example Criteria JSONB:**
```json
{
  "type": "jobs",
  "threshold": 10,
  "metadata": {}
}
```

---

### `user_badges`

Badges earned by users.

**Columns:**
- `id` (UUID, Primary Key): Unique identifier
- `user_id` (UUID, NOT NULL): Reference to users table
- `user_type` (TEXT, NOT NULL): `'company'` or `'cleaner'`
- `badge_id` (UUID, NOT NULL): Reference to gamification_badges table
- `tenant_id` (UUID, Nullable): Reference to tenants table
- `earned_at` (TIMESTAMPTZ, NOT NULL): When badge was earned
- `metadata` (JSONB, DEFAULT '{}'): Context about how/when badge was earned

**Indexes:**
- `idx_user_badges_user_id`: On `user_id`
- `idx_user_badges_user_type`: On `user_type`
- `idx_user_badges_badge_id`: On `badge_id`
- `idx_user_badges_tenant_id`: On `tenant_id`
- `idx_user_badges_earned_at`: On `earned_at DESC`
- `idx_user_badges_user_tenant`: On `(user_id, user_type, tenant_id)`

**Constraints:**
- `UNIQUE(user_id, user_type, badge_id, tenant_id)`: Users cannot earn the same badge twice
- `CHECK (user_type IN ('company', 'cleaner'))`: Valid user types only

**RLS Policies:**
- Users can view their own badges
- Service role has full access

---

### `gamification_levels`

Level definitions with point thresholds.

**Columns:**
- `id` (UUID, Primary Key): Unique identifier
- `level_name` (TEXT, NOT NULL): Display name (e.g., `'Bronze Partner'`)
- `level_number` (INTEGER, NOT NULL): Sequential level number (1, 2, 3, etc.)
- `user_type` (TEXT, NOT NULL): `'company'`, `'cleaner'`, or `'both'`
- `points_threshold` (INTEGER, NOT NULL): Minimum points required for this level
- `rewards` (JSONB, DEFAULT '{}'): Rewards for reaching this level
- `tenant_id` (UUID, Nullable): Reference to tenants table (NULL for global levels)
- `created_at` (TIMESTAMPTZ, NOT NULL): Creation timestamp

**Indexes:**
- `idx_gamification_levels_level_number`: On `level_number`
- `idx_gamification_levels_user_type`: On `user_type`
- `idx_gamification_levels_points_threshold`: On `points_threshold`
- `idx_gamification_levels_tenant_id`: On `tenant_id`

**Constraints:**
- `UNIQUE(level_number, user_type, tenant_id)`: One level per number per type per tenant
- `CHECK (level_number >= 1)`: Level number must be at least 1
- `CHECK (points_threshold >= 0)`: Threshold cannot be negative
- `CHECK (user_type IN ('company', 'cleaner', 'both'))`: Valid user types only

**RLS Policies:**
- Public read access (anyone can view levels)
- Service role has full access

---

### `gamification_leaderboards`

Cached leaderboard rankings.

**Columns:**
- `id` (UUID, Primary Key): Unique identifier
- `leaderboard_type` (TEXT, NOT NULL): Type (e.g., `'weekly'`, `'monthly'`, `'all_time'`)
- `user_type` (TEXT, NOT NULL): `'company'` or `'cleaner'`
- `timeframe` (TEXT): Timeframe identifier (e.g., `'2024-01'`, `'2024-W01'`, `'all_time'`)
- `tenant_id` (UUID, Nullable): Reference to tenants table
- `rankings` (JSONB, NOT NULL, DEFAULT '[]'): Array of ranking entries
- `updated_at` (TIMESTAMPTZ, NOT NULL): Last update timestamp

**Indexes:**
- `idx_leaderboards_type`: On `leaderboard_type`
- `idx_leaderboards_user_type`: On `user_type`
- `idx_leaderboards_timeframe`: On `timeframe`
- `idx_leaderboards_tenant_id`: On `tenant_id`
- `idx_leaderboards_updated_at`: On `updated_at DESC`

**Constraints:**
- `UNIQUE(leaderboard_type, user_type, timeframe, tenant_id)`: One leaderboard per type/timeframe/tenant
- `CHECK (user_type IN ('company', 'cleaner'))`: Valid user types only

**RLS Policies:**
- Public read access (anyone can view leaderboards)
- Service role has full access

**Example Rankings JSONB:**
```json
[
  {
    "rank": 1,
    "user_id": "uuid",
    "points": 5000,
    "level": 5,
    "full_name": "Company Name",
    "email": "company@example.com"
  }
]
```

---

### `gamification_challenges`

Time-limited challenges for users.

**Columns:**
- `id` (UUID, Primary Key): Unique identifier
- `name` (TEXT, NOT NULL): Challenge name
- `description` (TEXT): Challenge description
- `challenge_type` (TEXT, NOT NULL): Type (e.g., `'booking_count'`, `'rating_target'`, `'streak'`, `'custom'`)
- `start_date` (TIMESTAMPTZ, NOT NULL): Challenge start date
- `end_date` (TIMESTAMPTZ, NOT NULL): Challenge end date
- `criteria` (JSONB, NOT NULL, DEFAULT '{}'): Criteria for completing the challenge
- `rewards` (JSONB, DEFAULT '{}'): Rewards for completing the challenge
- `status` (TEXT, NOT NULL, DEFAULT 'draft'): `'draft'`, `'active'`, `'completed'`, or `'cancelled'`
- `tenant_id` (UUID, Nullable): Reference to tenants table
- `created_at` (TIMESTAMPTZ, NOT NULL): Creation timestamp

**Indexes:**
- `idx_challenges_status`: On `status`
- `idx_challenges_dates`: On `(start_date, end_date)`
- `idx_challenges_tenant_id`: On `tenant_id`
- `idx_challenges_type`: On `challenge_type`

**Constraints:**
- `CHECK (end_date > start_date)`: End date must be after start date
- `CHECK (status IN ('draft', 'active', 'completed', 'cancelled'))`: Valid statuses only

**RLS Policies:**
- Public read access for active challenges only
- Service role has full access

**Example Criteria JSONB:**
```json
{
  "type": "jobs",
  "target": 10,
  "metadata": {}
}
```

**Example Rewards JSONB:**
```json
[
  {
    "type": "points",
    "value": 500
  },
  {
    "type": "badge",
    "value": "challenge_winner"
  }
]
```

---

### `challenge_participants`

User participation in challenges.

**Columns:**
- `id` (UUID, Primary Key): Unique identifier
- `challenge_id` (UUID, NOT NULL): Reference to gamification_challenges table
- `user_id` (UUID, NOT NULL): Reference to users table
- `user_type` (TEXT, NOT NULL): `'company'` or `'cleaner'`
- `tenant_id` (UUID, Nullable): Reference to tenants table
- `progress` (JSONB, DEFAULT '{}'): Current progress towards challenge completion
- `completed_at` (TIMESTAMPTZ, Nullable): When challenge was completed
- `created_at` (TIMESTAMPTZ, NOT NULL): When user joined the challenge

**Indexes:**
- `idx_challenge_participants_challenge_id`: On `challenge_id`
- `idx_challenge_participants_user_id`: On `user_id`
- `idx_challenge_participants_user_type`: On `user_type`
- `idx_challenge_participants_tenant_id`: On `tenant_id`
- `idx_challenge_participants_completed`: On `completed_at` (partial index, WHERE completed_at IS NOT NULL)

**Constraints:**
- `UNIQUE(challenge_id, user_id, user_type, tenant_id)`: Users can only join a challenge once
- `CHECK (user_type IN ('company', 'cleaner'))`: Valid user types only

**RLS Policies:**
- Users can view and insert their own participation
- Service role has full access

---

### `gtm_strategy_progress`

Go-to-market strategy tracking.

**Columns:**
- `id` (UUID, Primary Key): Unique identifier
- `phase` (TEXT, NOT NULL): Phase identifier (e.g., `'phase_1'`, `'phase_2'`, `'phase_3'`)
- `milestone` (TEXT, NOT NULL): Specific milestone within the phase
- `status` (TEXT, NOT NULL, DEFAULT 'pending'): `'pending'`, `'in_progress'`, `'completed'`, or `'blocked'`
- `completion_percentage` (INTEGER, DEFAULT 0): Completion percentage (0-100)
- `notes` (TEXT): Additional notes
- `tenant_id` (UUID, Nullable): Reference to tenants table
- `updated_at` (TIMESTAMPTZ, NOT NULL): Last update timestamp
- `created_at` (TIMESTAMPTZ, NOT NULL): Creation timestamp

**Indexes:**
- `idx_gtm_strategy_phase`: On `phase`
- `idx_gtm_strategy_status`: On `status`
- `idx_gtm_strategy_tenant_id`: On `tenant_id`
- `idx_gtm_strategy_updated_at`: On `updated_at DESC`

**Constraints:**
- `CHECK (status IN ('pending', 'in_progress', 'completed', 'blocked'))`: Valid statuses only
- `CHECK (completion_percentage >= 0 AND completion_percentage <= 100)`: Valid percentage range

**RLS Policies:**
- Admin access only
- Service role has full access

---

### `team_todo_progress`

Team task management.

**Columns:**
- `id` (UUID, Primary Key): Unique identifier
- `assignee` (TEXT, NOT NULL): `'volkan'` or `'ozgun'`
- `task_id` (TEXT, Nullable): Optional external task identifier
- `task_description` (TEXT, NOT NULL): Task description
- `status` (TEXT, NOT NULL, DEFAULT 'pending'): `'pending'`, `'in_progress'`, `'completed'`, `'blocked'`, or `'cancelled'`
- `priority` (TEXT, NOT NULL, DEFAULT 'medium'): `'low'`, `'medium'`, `'high'`, or `'urgent'`
- `due_date` (TIMESTAMPTZ, Nullable): Task due date
- `completed_at` (TIMESTAMPTZ, Nullable): When task was completed
- `tenant_id` (UUID, Nullable): Reference to tenants table
- `created_at` (TIMESTAMPTZ, NOT NULL): Creation timestamp
- `updated_at` (TIMESTAMPTZ, NOT NULL): Last update timestamp

**Indexes:**
- `idx_team_todo_assignee`: On `assignee`
- `idx_team_todo_status`: On `status`
- `idx_team_todo_priority`: On `priority`
- `idx_team_todo_due_date`: On `due_date`
- `idx_team_todo_tenant_id`: On `tenant_id`
- `idx_team_todo_assignee_status`: On `(assignee, status)`

**Constraints:**
- `CHECK (assignee IN ('volkan', 'ozgun'))`: Valid assignees only
- `CHECK (status IN ('pending', 'in_progress', 'completed', 'blocked', 'cancelled'))`: Valid statuses only
- `CHECK (priority IN ('low', 'medium', 'high', 'urgent'))`: Valid priorities only

**RLS Policies:**
- Team members can view their own tasks
- Admins can view and manage all tasks
- Service role has full access

---

### `kpi_tracking`

Key performance indicators tracking.

**Columns:**
- `id` (UUID, Primary Key): Unique identifier
- `metric_name` (TEXT, NOT NULL): Metric name (e.g., `'user_retention'`, `'booking_conversion'`, `'revenue_growth'`)
- `target_value` (NUMERIC, Nullable): Target value
- `current_value` (NUMERIC, Nullable): Current value
- `period` (TEXT, NOT NULL): `'daily'`, `'weekly'`, `'monthly'`, `'quarterly'`, or `'yearly'`
- `period_start` (TIMESTAMPTZ, Nullable): Period start date
- `period_end` (TIMESTAMPTZ, Nullable): Period end date
- `tenant_id` (UUID, Nullable): Reference to tenants table
- `updated_at` (TIMESTAMPTZ, NOT NULL): Last update timestamp
- `created_at` (TIMESTAMPTZ, NOT NULL): Creation timestamp

**Indexes:**
- `idx_kpi_metric_name`: On `metric_name`
- `idx_kpi_period`: On `period`
- `idx_kpi_tenant_id`: On `tenant_id`
- `idx_kpi_period_dates`: On `(period_start, period_end)`
- `idx_kpi_updated_at`: On `updated_at DESC`

**Constraints:**
- `CHECK (period IN ('daily', 'weekly', 'monthly', 'quarterly', 'yearly'))`: Valid periods only

**RLS Policies:**
- Admin access only
- Service role has full access

---

## Database Functions

### `award_points(p_user_id, p_user_type, p_action_type, p_points_delta, p_metadata, p_tenant_id)`

Awards points to a user and creates a transaction record.

**Parameters:**
- `p_user_id` (UUID): User ID
- `p_user_type` (TEXT): `'company'` or `'cleaner'`
- `p_action_type` (TEXT): Action type
- `p_points_delta` (INTEGER): Points to award (can be negative)
- `p_metadata` (JSONB): Additional metadata
- `p_tenant_id` (UUID, optional): Tenant ID

**Returns:** UUID (transaction ID)

**Security:** SECURITY DEFINER

---

### `check_badge_eligibility(p_user_id, p_user_type, p_badge_code, p_tenant_id)`

Checks if a user is eligible for a badge and awards it if eligible.

**Parameters:**
- `p_user_id` (UUID): User ID
- `p_user_type` (TEXT): `'company'` or `'cleaner'`
- `p_badge_code` (TEXT): Badge code
- `p_tenant_id` (UUID, optional): Tenant ID

**Returns:** BOOLEAN (true if badge was awarded)

**Security:** SECURITY DEFINER

---

### `calculate_user_level(p_user_id, p_user_type, p_tenant_id)`

Calculates and updates a user's level based on their current points.

**Parameters:**
- `p_user_id` (UUID): User ID
- `p_user_type` (TEXT): `'company'` or `'cleaner'`
- `p_tenant_id` (UUID, optional): Tenant ID

**Returns:** INTEGER (new level number)

**Security:** SECURITY DEFINER

---

### `update_leaderboard(p_leaderboard_type, p_user_type, p_timeframe, p_limit, p_tenant_id)`

Updates or creates a leaderboard for a specific type and timeframe.

**Parameters:**
- `p_leaderboard_type` (TEXT): Leaderboard type
- `p_user_type` (TEXT): `'company'` or `'cleaner'`
- `p_timeframe` (TEXT): Timeframe identifier
- `p_limit` (INTEGER, default 100): Number of entries to include
- `p_tenant_id` (UUID, optional): Tenant ID

**Returns:** UUID (leaderboard ID)

**Security:** SECURITY DEFINER

---

## Triggers

### `update_gamification_points_updated_at`

Automatically updates `updated_at` timestamp when `gamification_points` is updated.

### `update_leaderboards_updated_at`

Automatically updates `updated_at` timestamp when `gamification_leaderboards` is updated.

### `update_gtm_strategy_updated_at`

Automatically updates `updated_at` timestamp when `gtm_strategy_progress` is updated.

### `update_team_todo_updated_at`

Automatically updates `updated_at` timestamp when `team_todo_progress` is updated.

### `update_kpi_tracking_updated_at`

Automatically updates `updated_at` timestamp when `kpi_tracking` is updated.

---

## Relationships

- `gamification_points.user_id` → `users.id`
- `gamification_points.tenant_id` → `tenants.id`
- `gamification_points_transactions.user_id` → `users.id`
- `gamification_points_transactions.tenant_id` → `tenants.id`
- `user_badges.user_id` → `users.id`
- `user_badges.badge_id` → `gamification_badges.id`
- `user_badges.tenant_id` → `tenants.id`
- `gamification_levels.tenant_id` → `tenants.id`
- `gamification_leaderboards.tenant_id` → `tenants.id`
- `gamification_challenges.tenant_id` → `tenants.id`
- `challenge_participants.challenge_id` → `gamification_challenges.id`
- `challenge_participants.user_id` → `users.id`
- `challenge_participants.tenant_id` → `tenants.id`

---

## Notes

- All tables have RLS enabled for tenant isolation
- Timestamps use `TIMESTAMPTZ` for timezone-aware storage
- JSONB columns allow flexible schema for metadata and criteria
- Indexes are optimized for common query patterns
- Foreign keys use `ON DELETE CASCADE` for tenant deletion
- All user-facing data respects tenant boundaries

---

**Last Updated**: January 2025

