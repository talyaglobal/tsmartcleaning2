import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'
import { withAuth } from '@/lib/auth/rbac'

export const GET = withAuth(
  async (request: NextRequest, { supabase }) => {
    try {

    // Get report generation statistics
    const { data: reports, error: reportsError } = await supabase
      .from('reports')
      .select('*')
      .order('generated_at', { ascending: false })
      .limit(1000)

    if (reportsError) {
      console.error('[v0] Reports query error:', reportsError)
      return NextResponse.json({
        analytics: {
          totalReports: 0,
          reportsByType: {},
          reportsByPeriod: {},
          recentReports: [],
          averageGenerationTime: 0,
        },
      })
    }

    const totalReports = reports?.length || 0

    // Group by report type
    const reportsByType: Record<string, number> = {}
    for (const report of reports || []) {
      const type = report.report_type || 'unknown'
      reportsByType[type] = (reportsByType[type] || 0) + 1
    }

    // Group by period (last 7 days, 30 days, etc.)
    const now = new Date()
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const last90Days = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)

    const reportsByPeriod = {
      last7Days: (reports || []).filter((r: any) => new Date(r.generated_at) >= last7Days).length,
      last30Days: (reports || []).filter((r: any) => new Date(r.generated_at) >= last30Days).length,
      last90Days: (reports || []).filter((r: any) => new Date(r.generated_at) >= last90Days).length,
      allTime: totalReports,
    }

    // Recent reports (last 10)
    const recentReports = (reports || [])
      .slice(0, 10)
      .map((r: any) => ({
        id: r.id,
        type: r.report_type,
        title: r.title,
        generatedAt: r.generated_at,
      }))

    // Get scheduled reports count
    let scheduledCount = 0
    try {
      const { count } = await supabase
        .from('report_schedules')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)
      
      scheduledCount = count || 0
    } catch (error) {
      // Table might not exist
    }

    return NextResponse.json({
      analytics: {
        totalReports,
        reportsByType,
        reportsByPeriod,
        recentReports,
        scheduledReports: scheduledCount,
        averageGenerationTime: 0, // Would need to track this separately
      },
    })
    } catch (error) {
      console.error('[v0] Get report analytics error:', error)
      return NextResponse.json(
        { error: 'Failed to load report analytics' },
        { status: 500 }
      )
    }
  },
  {
    requireAdmin: true,
  }
)

