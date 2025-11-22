/**
 * Script to initialize all gamification badges
 * Run with: npx tsx scripts/initialize-gamification-badges.ts
 */

import { createServerSupabase } from '../lib/supabase'
import { createBadge } from '../lib/gamification/badges'

const COMPANY_BADGES = [
  {
    code: 'first_timer',
    name: 'First Timer',
    description: 'Post your first job',
    icon: '🌟',
    criteria: { type: 'jobs', threshold: 1, metadata: { job_type: 'first_post' } },
    pointsReward: 0,
  },
  {
    code: 'quick_starter',
    name: 'Quick Starter',
    description: 'Complete first job within 24 hours',
    icon: '🚀',
    criteria: { type: 'custom', threshold: 1, metadata: { time_limit_hours: 24 } },
    pointsReward: 0,
  },
  {
    code: 'premium_partner',
    name: 'Premium Partner',
    description: 'Subscribe to Professional tier',
    icon: '💎',
    criteria: { type: 'custom', threshold: 1, metadata: { subscription_tier: 'professional' } },
    pointsReward: 0,
  },
  {
    code: 'top_employer',
    name: 'Top Employer',
    description: 'Maintain 4.8+ rating',
    icon: '🏆',
    criteria: { type: 'ratings', threshold: 4.8, metadata: { min_reviews: 5 } },
    pointsReward: 0,
  },
  {
    code: 'consistent_poster',
    name: 'Consistent Poster',
    description: 'Post jobs for 4 consecutive weeks',
    icon: '🎯',
    criteria: { type: 'streak', threshold: 4, metadata: { streak_type: 'weekly_posts' } },
    pointsReward: 0,
  },
  {
    code: 'elite_partner',
    name: 'Elite Partner',
    description: 'Complete 100+ jobs',
    icon: '👑',
    criteria: { type: 'jobs', threshold: 100 },
    pointsReward: 0,
  },
  {
    code: 'referral_champion',
    name: 'Referral Champion',
    description: 'Refer 3+ companies',
    icon: '🤝',
    criteria: { type: 'referrals', threshold: 3 },
    pointsReward: 0,
  },
  {
    code: 'five_star_partner',
    name: '5-Star Partner',
    description: 'Receive 50+ 5-star ratings',
    icon: '⭐',
    criteria: { type: 'ratings', threshold: 5, metadata: { min_count: 50, exact_rating: 5 } },
    pointsReward: 0,
  },
]

const CLEANER_BADGES = [
  {
    code: 'new_star',
    name: 'New Star',
    description: 'Complete your first job',
    icon: '🌟',
    criteria: { type: 'jobs', threshold: 1, metadata: { job_type: 'first_completed' } },
    pointsReward: 0,
  },
  {
    code: 'fast_responder',
    name: 'Fast Responder',
    description: 'Accept jobs within 1 hour',
    icon: '🚀',
    criteria: { type: 'custom', threshold: 1, metadata: { response_time_hours: 1 } },
    pointsReward: 0,
  },
  {
    code: 'certified_pro',
    name: 'Certified Pro',
    description: 'Complete all certifications',
    icon: '💎',
    criteria: { type: 'custom', threshold: 1, metadata: { all_certifications: true } },
    pointsReward: 0,
  },
  {
    code: 'top_performer',
    name: 'Top Performer',
    description: 'Maintain 4.9+ rating',
    icon: '🏆',
    criteria: { type: 'ratings', threshold: 4.9, metadata: { min_reviews: 10 } },
    pointsReward: 0,
  },
  {
    code: 'reliable_worker',
    name: 'Reliable Worker',
    description: '95%+ job completion rate',
    icon: '🎯',
    criteria: { type: 'custom', threshold: 95, metadata: { completion_rate_percent: 95 } },
    pointsReward: 0,
  },
  {
    code: 'elite_cleaner',
    name: 'Elite Cleaner',
    description: 'Complete 100+ jobs',
    icon: '👑',
    criteria: { type: 'jobs', threshold: 100 },
    pointsReward: 0,
  },
  {
    code: 'community_builder',
    name: 'Community Builder',
    description: 'Refer 5+ cleaners',
    icon: '🤝',
    criteria: { type: 'referrals', threshold: 5 },
    pointsReward: 0,
  },
  {
    code: 'perfect_record',
    name: 'Perfect Record',
    description: '100 consecutive 5-star ratings',
    icon: '⭐',
    criteria: { type: 'ratings', threshold: 5, metadata: { consecutive_count: 100, exact_rating: 5 } },
    pointsReward: 0,
  },
]

async function initializeBadges() {
  console.log('Initializing gamification badges...')
  
  // Note: This would need to be run in a server context
  // For now, this is a reference implementation
  // You would need to call this from an API endpoint or admin script
  
  const supabase = createServerSupabase()
  
  let created = 0
  let skipped = 0
  let errors = 0

  // Create company badges
  console.log('\nCreating company badges...')
  for (const badge of COMPANY_BADGES) {
    try {
      const result = await createBadge(supabase, {
        ...badge,
        userType: 'company',
      })
      
      if (result.success) {
        console.log(`✓ Created: ${badge.name}`)
        created++
      } else {
        if (result.error?.includes('already exists')) {
          console.log(`⊘ Skipped (exists): ${badge.name}`)
          skipped++
        } else {
          console.error(`✗ Failed: ${badge.name} - ${result.error}`)
          errors++
        }
      }
    } catch (error: any) {
      console.error(`✗ Error creating ${badge.name}:`, error.message)
      errors++
    }
  }

  // Create cleaner badges
  console.log('\nCreating cleaner badges...')
  for (const badge of CLEANER_BADGES) {
    try {
      const result = await createBadge(supabase, {
        ...badge,
        userType: 'cleaner',
      })
      
      if (result.success) {
        console.log(`✓ Created: ${badge.name}`)
        created++
      } else {
        if (result.error?.includes('already exists')) {
          console.log(`⊘ Skipped (exists): ${badge.name}`)
          skipped++
        } else {
          console.error(`✗ Failed: ${badge.name} - ${result.error}`)
          errors++
        }
      }
    } catch (error: any) {
      console.error(`✗ Error creating ${badge.name}:`, error.message)
      errors++
    }
  }

  console.log('\n=== Summary ===')
  console.log(`Created: ${created}`)
  console.log(`Skipped: ${skipped}`)
  console.log(`Errors: ${errors}`)
  console.log(`Total: ${COMPANY_BADGES.length + CLEANER_BADGES.length}`)
}

// Export for use in API endpoint
export { COMPANY_BADGES, CLEANER_BADGES, initializeBadges }

// If run directly
if (require.main === module) {
  initializeBadges()
    .then(() => {
      console.log('\nDone!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('Fatal error:', error)
      process.exit(1)
    })
}

