import { NextRequest, NextResponse } from 'next/server'
import { withAuth } from '@/lib/auth/rbac'
import { isAdminRole } from '@/lib/auth/roles'
import {
  getEmailUsageStats,
  getEmailDeliveryStats,
  checkEmailQuota,
  checkBounceRate,
} from '@/lib/emails/monitoring'
import { resolveTenantFromRequest } from '@/lib/supabase'

/**
 * GET /api/emails/stats
 * 
 * Get email usage and delivery statistics
 * 
 * Query params:
 * - period: 'today' | 'week' | 'month' | 'all' (default: 'month')
 * - type: 'usage' | 'delivery' | 'all' (default: 'all')
 * 
 * Requires: Admin role
 */
export const GET = withAuth(
  async (request: NextRequest, { user }) => {
    try {
      // Only admins can view email stats
      if (!isAdminRole(user.role)) {
        return NextResponse.json(
          { error: 'Unauthorized - Admin access required' },
          { status: 403 }
        )
      }

      const { searchParams } = new URL(request.url)
      const period = (searchParams.get('period') || 'month') as 'today' | 'week' | 'month' | 'all'
      const type = (searchParams.get('type') || 'all') as 'usage' | 'delivery' | 'all'

      const tenantId = resolveTenantFromRequest(request)

      const result: any = {}

      if (type === 'usage' || type === 'all') {
        result.usage = await getEmailUsageStats(tenantId, period)
        result.quota = await checkEmailQuota(tenantId)
      }

      if (type === 'delivery' || type === 'all') {
        result.delivery = await getEmailDeliveryStats(tenantId, period === 'all' ? 'month' : period)
        result.bounceRate = await checkBounceRate(tenantId)
      }

      return NextResponse.json({
        success: true,
        period,
        ...result,
      })
    } catch (error: any) {
      console.error('[emails/stats] Error:', error)
      return NextResponse.json(
        { error: 'Failed to get email statistics', message: error.message },
        { status: 500 }
      )
    }
  }
)

