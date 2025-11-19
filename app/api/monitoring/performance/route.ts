import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'
import { resolveTenantFromRequest } from '@/lib/supabase'
import { withAuth } from '@/lib/auth/rbac'

/**
 * GET /api/monitoring/performance
 * 
 * Returns performance metrics and slow queries
 * Requires admin authentication
 */
export const GET = withAuth(
  async (request: NextRequest, { supabase, tenantId }) => {
    try {
      const url = new URL(request.url)
      const timeRange = url.searchParams.get('timeRange') || '24h' // 1h, 24h, 7d, 30d
      const metricType = url.searchParams.get('type') // api, database, frontend, system
      const limit = parseInt(url.searchParams.get('limit') || '100')

      // Calculate time range
      const now = new Date()
      let startTime: Date
      switch (timeRange) {
        case '1h':
          startTime = new Date(now.getTime() - 60 * 60 * 1000)
          break
        case '24h':
          startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000)
          break
        case '7d':
          startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          break
        case '30d':
          startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          break
        default:
          startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000)
      }

      // Build query for performance metrics
      let metricsQuery = supabase
        .from('performance_metrics')
        .select('*')
        .gte('created_at', startTime.toISOString())
        .order('created_at', { ascending: false })
        .limit(limit)

      if (tenantId) {
        metricsQuery = metricsQuery.eq('tenant_id', tenantId)
      }

      if (metricType) {
        metricsQuery = metricsQuery.eq('metric_type', metricType)
      }

      const { data: metrics, error: metricsError } = await metricsQuery

      if (metricsError) {
        console.error('[monitoring] Error fetching metrics:', metricsError)
      }

      // Get slow queries
      let slowQueriesQuery = supabase
        .from('slow_queries')
        .select('*')
        .gte('created_at', startTime.toISOString())
        .order('created_at', { ascending: false })
        .limit(limit)

      if (tenantId) {
        slowQueriesQuery = slowQueriesQuery.eq('tenant_id', tenantId)
      }

      const { data: slowQueries, error: slowQueriesError } = await slowQueriesQuery

      if (slowQueriesError) {
        console.error('[monitoring] Error fetching slow queries:', slowQueriesError)
      }

      // Get performance baselines
      let baselinesQuery = supabase
        .from('performance_baselines')
        .select('*')
        .order('metric_name', { ascending: true })

      if (tenantId) {
        baselinesQuery = baselinesQuery.eq('tenant_id', tenantId)
      }

      const { data: baselines, error: baselinesError } = await baselinesQuery

      if (baselinesError) {
        console.error('[monitoring] Error fetching baselines:', baselinesError)
      }

      // Calculate summary statistics
      const summary = {
        total_metrics: metrics?.length || 0,
        total_slow_queries: slowQueries?.length || 0,
        total_baselines: baselines?.length || 0,
        metrics_by_type: {} as Record<string, number>,
        metrics_by_status: {
          ok: 0,
          warning: 0,
          critical: 0,
        },
        avg_response_time_ms: 0,
        max_response_time_ms: 0,
        slow_queries_by_table: {} as Record<string, number>,
      }

      if (metrics && metrics.length > 0) {
        // Group by type
        metrics.forEach((m: any) => {
          summary.metrics_by_type[m.metric_type] =
            (summary.metrics_by_type[m.metric_type] || 0) + 1
          if (m.status) {
            summary.metrics_by_status[m.status] =
              (summary.metrics_by_status[m.status] || 0) + 1
          }
        })

        // Calculate averages
        const responseTimes = metrics
          .filter((m: any) => m.metric_type === 'api' || m.metric_type === 'database')
          .map((m: any) => parseFloat(m.value_ms) || 0)

        if (responseTimes.length > 0) {
          summary.avg_response_time_ms =
            responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
          summary.max_response_time_ms = Math.max(...responseTimes)
        }
      }

      if (slowQueries && slowQueries.length > 0) {
        slowQueries.forEach((sq: any) => {
          const table = sq.table_name || 'unknown'
          summary.slow_queries_by_table[table] =
            (summary.slow_queries_by_table[table] || 0) + 1
        })
      }

      return NextResponse.json({
        summary,
        metrics: metrics || [],
        slow_queries: slowQueries || [],
        baselines: baselines || [],
        time_range: timeRange,
        start_time: startTime.toISOString(),
        end_time: now.toISOString(),
      })
    } catch (error: any) {
      console.error('[monitoring] Error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch performance metrics', details: error.message },
        { status: 500 }
      )
    }
  },
  {
    requiredRole: 'admin',
  }
)

