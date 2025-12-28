import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, resolveTenantFromRequest } from '@/lib/supabase'
import { withAuth } from '@/lib/auth/rbac'
import { isAdminRole } from '@/lib/auth/roles'

/**
 * GET /api/performance/summary
 * Get performance metrics summary (admin only)
 */
export const GET = withAuth(
  async (request: NextRequest, { user, supabase, tenantId }) => {
    try {
      // Only admins can view performance summary
      if (!isAdminRole(user.role)) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 403 }
        )
      }

      const { searchParams } = request.nextUrl
      const days = parseInt(searchParams.get('days') || '7', 10)
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)

      // Get metrics for the specified period
      let query = supabase
        .from('performance_metrics')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false })

      if (tenantId) {
        query = query.eq('tenant_id', tenantId)
      }

      const { data: metrics, error } = await query

      if (error) {
        console.error('[performance] Failed to query metrics:', error)
        return NextResponse.json(
          { error: 'Failed to query metrics' },
          { status: 500 }
        )
      }

      // Calculate summary by metric type
      const summary: Record<string, any> = {}

      // Group by metric name
      const byMetricName: Record<string, any[]> = {}
      for (const metric of metrics || []) {
        const name = metric.metric_name
        if (!byMetricName[name]) {
          byMetricName[name] = []
        }
        byMetricName[name].push(metric)
      }

      // Calculate statistics for each metric
      for (const [metricName, metricData] of Object.entries(byMetricName)) {
        const values = metricData.map((m) => parseFloat(m.value_ms || 0))
        const statusCounts = {
          ok: metricData.filter((m) => m.status === 'ok').length,
          warning: metricData.filter((m) => m.status === 'warning').length,
          critical: metricData.filter((m) => m.status === 'critical').length,
        }

        summary[metricName] = {
          count: metricData.length,
          avg: values.reduce((a, b) => a + b, 0) / values.length,
          min: Math.min(...values),
          max: Math.max(...values),
          p50: percentile(values, 50),
          p75: percentile(values, 75),
          p95: percentile(values, 95),
          p99: percentile(values, 99),
          status_counts: statusCounts,
          threshold_met: {
            // Core Web Vitals thresholds
            lcp: metricName === 'LCP' ? statusCounts.critical === 0 && statusCounts.warning < metricData.length * 0.1 : null,
            fid: metricName === 'FID' || metricName === 'INP' ? statusCounts.critical === 0 && statusCounts.warning < metricData.length * 0.1 : null,
            cls: metricName === 'CLS' ? statusCounts.critical === 0 && statusCounts.warning < metricData.length * 0.1 : null,
            page_load: metricName === 'page_load_time' ? statusCounts.critical === 0 && statusCounts.warning < metricData.length * 0.1 : null,
            api_response: metricName === 'api_response_time' ? statusCounts.critical === 0 && statusCounts.warning < metricData.length * 0.1 : null,
          },
        }
      }

      // Overall health score (0-100)
      const totalMetrics = metrics?.length || 0
      const criticalCount = metrics?.filter((m) => m.status === 'critical').length || 0
      const warningCount = metrics?.filter((m) => m.status === 'warning').length || 0
      const healthScore = totalMetrics > 0
        ? Math.max(0, 100 - (criticalCount * 10 + warningCount * 5) / totalMetrics * 100)
        : 100

      return NextResponse.json({
        period_days: days,
        start_date: startDate.toISOString(),
        total_metrics: totalMetrics,
        health_score: Math.round(healthScore),
        summary,
        thresholds: {
          lcp: { target: 2500, warning: 2000, critical: 3000 },
          fid: { target: 100, warning: 50, critical: 150 },
          inp: { target: 200, warning: 150, critical: 300 },
          cls: { target: 0.1, warning: 0.05, critical: 0.15 },
          fcp: { target: 1800, warning: 1500, critical: 2500 },
          ttfb: { target: 800, warning: 600, critical: 1000 },
          page_load_time: { target: 3000, warning: 2000, critical: 5000 },
          api_response_time: { target: 500, warning: 1000, critical: 2000 },
        },
      })
    } catch (error: any) {
      console.error('[performance] Error getting summary:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  }
)

/**
 * Calculate percentile
 */
function percentile(values: number[], p: number): number {
  const sorted = [...values].sort((a, b) => a - b)
  const index = Math.ceil((p / 100) * sorted.length) - 1
  return sorted[Math.max(0, index)] || 0
}



