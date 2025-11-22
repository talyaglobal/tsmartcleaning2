import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/rbac'
import { isAdminRole } from '@/lib/auth/roles'
import { handleApiError, ApiErrors } from '@/lib/api/errors'
import { validateRequestBody, validateQueryParams, ValidationSchemas } from '@/lib/api/validation'
import { getBadges, getUserBadges, createBadge, awardBadge } from '@/lib/gamification/badges'
import { z } from 'zod'

// Get badges or user badges
export const GET = withAuth(async (request: NextRequest, auth) => {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id')
    const userType = searchParams.get('user_type') as 'company' | 'cleaner' | null

    // If user_id is provided, get user's badges
    if (userId) {
      const isAdmin = isAdminRole(auth.user.role)
      const requestedUserId = userId || auth.user.id

      // Verify user can only access their own badges (unless admin)
      if (!isAdmin && requestedUserId !== auth.user.id) {
        return ApiErrors.forbidden('You can only view your own badges')
      }

      const badges = await getUserBadges(auth.supabase, requestedUserId)
      return NextResponse.json({ badges })
    }

    // Otherwise, get all badges for user type
    if (!userType) {
      return ApiErrors.badRequest('user_type is required when user_id is not provided')
    }

    const badges = await getBadges(auth.supabase, userType)
    return NextResponse.json({ badges })
  } catch (error) {
    return handleApiError('gamification/badges', error)
  }
})

// Create a new badge (admin only)
export const POST = withAuth(
  async (request: NextRequest, auth) => {
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

      const result = await createBadge(auth.supabase, {
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
      return handleApiError('gamification/badges', error)
    }
  },
  { requireAdmin: true }
)

