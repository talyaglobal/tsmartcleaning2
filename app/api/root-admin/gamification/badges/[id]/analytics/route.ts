import { NextRequest, NextResponse } from 'next/server'
import { withRootAdmin } from '@/lib/auth/rbac'
import { handleApiError, ApiErrors } from '@/lib/api/errors'
import { validateRouteParams, ValidationSchemas } from '@/lib/api/validation'
import { createServerSupabase } from '@/lib/supabase'
import { z } from 'zod'

// Get badge analytics
export const GET = withRootAdmin(
  async (request: NextRequest, context?: { params: { id: string } }) => {
    try {
      if (!context?.params?.id) {
        return ApiErrors.badRequest('Badge ID is required')
      }

      const paramsSchema = z.object({
        id: ValidationSchemas.uuid,
      })

      const paramsValidation = validateRouteParams(context.params, paramsSchema)
      if (!paramsValidation.success) {
        return paramsValidation.response
      }

      const supabase = createServerSupabase()

      // Get badge
      const { data: badge, error: badgeError } = await supabase
        .from('gamification_badges')
        .select('*')
        .eq('id', paramsValidation.data.id)
        .single()

      if (badgeError || !badge) {
        return ApiErrors.notFound('Badge not found')
      }

      // Get total earned count
      const { count: totalEarned } = await supabase
        .from('gamification_user_badges')
        .select('*', { count: 'exact', head: true })
        .eq('badge_id', paramsValidation.data.id)

      // Get total users of this type
      const { count: totalUsers } = await supabase
        .from('gamification_accounts')
        .select('*', { count: 'exact', head: true })
        .eq('user_type', badge.user_type)

      // Calculate earn rate
      const earnRate = totalUsers && totalUsers > 0 ? ((totalEarned || 0) / totalUsers) * 100 : 0

      // Get earning trends (last 30 days)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const { data: recentEarnings } = await supabase
        .from('gamification_user_badges')
        .select('earned_at')
        .eq('badge_id', paramsValidation.data.id)
        .gte('earned_at', thirtyDaysAgo.toISOString())
        .order('earned_at', { ascending: true })

      // Group by date
      const dailyEarnings: Record<string, number> = {}
      recentEarnings?.forEach((earning) => {
        const date = new Date(earning.earned_at).toISOString().split('T')[0]
        dailyEarnings[date] = (dailyEarnings[date] || 0) + 1
      })

      // Get top earners (users who earned this badge)
      const { data: topEarners } = await supabase
        .from('gamification_user_badges')
        .select('user_id, earned_at')
        .eq('badge_id', paramsValidation.data.id)
        .order('earned_at', { ascending: true })
        .limit(10)

      // Get user names for top earners
      const topEarnersWithNames = await Promise.all(
        (topEarners || []).map(async (earner) => {
          const { data: user } = await supabase
            .from('users')
            .select('full_name, email')
            .eq('id', earner.user_id)
            .single()

          return {
            userId: earner.user_id,
            userName: user?.full_name || user?.email || 'Unknown',
            earnedAt: earner.earned_at,
          }
        })
      )

      return NextResponse.json({
        badgeId: paramsValidation.data.id,
        totalEarned: totalEarned || 0,
        totalUsers: totalUsers || 0,
        earnRate: Math.round(earnRate * 100) / 100,
        dailyEarnings,
        topEarners: topEarnersWithNames,
      })
    } catch (error) {
      return handleApiError('root-admin/gamification/badges/[id]/analytics', error)
    }
  }
)

