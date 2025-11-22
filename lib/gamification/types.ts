/**
 * Gamification system types and interfaces
 */

export type UserType = 'company' | 'cleaner'

export type PointAction =
  // Company actions
  | 'post_job'
  | 'complete_job'
  | 'rate_cleaner'
  | 'refer_company'
  | 'complete_profile'
  | 'upload_logo'
  | 'first_job_posted'
  | 'ten_jobs_completed'
  // Cleaner actions
  | 'upload_photo'
  | 'complete_certification'
  | 'accept_job'
  | 'receive_five_star_rating'
  | 'refer_cleaner'
  | 'first_job_completed'
  | 'fifty_jobs_completed'

export interface PointTransaction {
  id: string
  user_id: string
  user_type: UserType
  points: number
  action: PointAction
  source_id?: string // e.g., job_id, booking_id
  metadata?: Record<string, unknown>
  created_at: string
}

export interface Badge {
  id: string
  code: string
  name: string
  description: string
  icon?: string
  user_type: UserType
  criteria: BadgeCriteria
  points_reward?: number
  created_at: string
  updated_at: string
}

export interface BadgeCriteria {
  type: 'points' | 'jobs' | 'ratings' | 'streak' | 'referrals' | 'custom'
  threshold: number
  metadata?: Record<string, unknown>
}

export interface UserBadge {
  id: string
  user_id: string
  badge_id: string
  earned_at: string
  metadata?: Record<string, unknown>
}

export interface Level {
  id: string
  name: string
  user_type: UserType
  level_number: number
  points_required: number
  rewards?: LevelReward[]
  created_at: string
  updated_at: string
}

export interface LevelReward {
  type: 'badge' | 'feature' | 'discount' | 'priority'
  value: string | number
  metadata?: Record<string, unknown>
}

export interface UserLevel {
  user_id: string
  user_type: UserType
  current_level: number
  current_points: number
  points_to_next_level: number
  level_name: string
  progress_percentage: number
  updated_at: string
}

export type LeaderboardType = 'points' | 'jobs' | 'ratings' | 'referrals'
export type LeaderboardTimeframe = 'daily' | 'weekly' | 'monthly' | 'all_time'

export interface LeaderboardEntry {
  rank: number
  user_id: string
  user_name: string
  user_type: UserType
  score: number
  metadata?: Record<string, unknown>
}

export interface Leaderboard {
  type: LeaderboardType
  timeframe: LeaderboardTimeframe
  user_type: UserType
  entries: LeaderboardEntry[]
  generated_at: string
  total_participants: number
  cached?: boolean
}

export interface Challenge {
  id: string
  name: string
  description: string
  user_type: UserType
  start_date: string
  end_date: string
  criteria: ChallengeCriteria
  rewards: ChallengeReward[]
  status: 'draft' | 'active' | 'completed' | 'cancelled'
  created_at: string
  updated_at: string
}

export interface ChallengeCriteria {
  type: 'points' | 'jobs' | 'ratings' | 'streak' | 'custom'
  target: number
  metadata?: Record<string, unknown>
}

export interface ChallengeReward {
  type: 'points' | 'badge' | 'discount' | 'feature'
  value: string | number
  metadata?: Record<string, unknown>
}

export interface UserChallenge {
  id: string
  user_id: string
  challenge_id: string
  progress: number
  target: number
  completed: boolean
  completed_at?: string
  started_at: string
  updated_at: string
}

export interface GamificationStats {
  user_id: string
  user_type: UserType
  total_points: number
  current_level: number
  level_name: string
  badges_count: number
  badges: UserBadge[]
  challenges_completed: number
  challenges_active: number
  rank?: number
}

