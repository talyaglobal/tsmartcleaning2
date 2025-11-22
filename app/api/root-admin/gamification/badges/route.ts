import { NextRequest, NextResponse } from 'next/server'
import { withRootAdmin } from '@/lib/auth/rbac'
import { handleApiError, ApiErrors } from '@/lib/api/errors'
import { validateRequestBody, validateQueryParams } from '@/lib/api/validation'
import { createBadge, getBadges } from '@/lib/gamification/badges'
import { createServerSupabase } from '@/lib/supabase'
import { z } from 'zod'

// Get all badges
export const GET = withRootAdmin(async (request: NextRequest) => {
  try {
    const querySchema = z.object({
      userType: z.enum(['company', 'cleaner']).optional(),
      search: z.string().optional(),
    })

    const validation = validateQueryParams(request, querySchema)
    if (!validation.success) {
      return validation.response
    }

    const supabase = createServerSupabase()
    const { userType, search } = validation.data

    let badges = []

    if (userType) {
      badges = await getBadges(supabase, userType)
    } else {
      // Get all badges
      const companyBadges = await getBadges(supabase, 'company')
      const cleanerBadges = await getBadges(supabase, 'cleaner')
      badges = [...companyBadges, ...cleanerBadges]
    }

    // Apply search filter if provided
    if (search) {
      const searchLower = search.toLowerCase()
      badges = badges.filter(
        (badge) =>
          badge.name.toLowerCase().includes(searchLower) ||
          badge.description.toLowerCase().includes(searchLower) ||
          badge.code.toLowerCase().includes(searchLower)
      )
    }

    // Get statistics for each badge
    const badgesWithStats = await Promise.all(
      badges.map(async (badge) => {
        const { count } = await supabase
          .from('gamification_user_badges')
          .select('*', { count: 'exact', head: true })
          .eq('badge_id', badge.id)

        return {
          ...badge,
          totalEarned: count || 0,
        }
      })
    )

    return NextResponse.json({ badges: badgesWithStats })
  } catch (error) {
    return handleApiError('root-admin/gamification/badges', error)
  }
})

// Create a new badge
export const POST = withRootAdmin(async (request: NextRequest) => {
  try {
    const bodySchema = z.object({
      code: z.string().min(1),
      name: z.string().min(1),
      description: z.string().min(1),
      icon: z.string().optional(),
      userType: z.enum(['company', 'cleaner']),
      criteria: z.object({
        type: z.enum(['points', 'jobs', 'ratings', 'streak', 'referrals', 'custom']),
        threshold: z.number().int().nonnegative(),
        metadata: z.record(z.unknown()).optional(),
      }),
      pointsReward: z.number().int().nonnegative().optional(),
    })

    const validation = await validateRequestBody(request, bodySchema)
    if (!validation.success) {
      return validation.response
    }

    const supabase = createServerSupabase()
    const result = await createBadge(supabase, {
      code: validation.data.code,
      name: validation.data.name,
      description: validation.data.description,
      icon: validation.data.icon,
      userType: validation.data.userType,
      criteria: validation.data.criteria,
      pointsReward: validation.data.pointsReward,
    })

    if (!result.success) {
      return ApiErrors.internalError(result.error || 'Failed to create badge')
    }

    return NextResponse.json({ success: true, badge: result.badge })
  } catch (error) {
    return handleApiError('root-admin/gamification/badges', error)
  }
})

