import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, resolveTenantFromRequest } from '@/lib/supabase'
import { withAuth } from '@/lib/auth/rbac'
import { isAdminRole } from '@/lib/auth/roles'

/**
 * POST /api/performance/metrics
 * Report a performance metric (e.g., from frontend Core Web Vitals)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { metric_name, metric_type, value_ms, endpoint_path, metadata } = body

    if (!metric_name || !metric_type || value_ms === undefined) {
      return NextResponse.json(
        { error: 'metric_name, metric_type, and value_ms are required' },
        { status: 400 }
      )
    }

    const tenantId = resolveTenantFromRequest(request)
    const supabase = createServerSupabase(tenantId ?? undefined)

    // Determine status based on thresholds
    let status: 'ok' | 'warning' | 'critical' = 'ok'
    
    // Core Web Vitals thresholds
    if (metric_name === 'LCP' && value_ms > 2500) status = 'critical'
    else if (metric_name === 'LCP' && value_ms > 2000) status = 'warning'
    else if (metric_name === 'FID' && value_ms > 100) status = 'critical'
    else if (metric_name === 'FID' && value_ms > 50) status = 'warning'
    else if (metric_name === 'INP' && value_ms > 200) status = 'critical'
    else if (metric_name === 'INP' && value_ms > 150) status = 'warning'
    else if (metric_name === 'CLS' && value_ms > 0.1) status = 'critical'
    else if (metric_name === 'CLS' && value_ms > 0.05) status = 'warning'
    else if (metric_name === 'FCP' && value_ms > 1800) status = 'critical'
    else if (metric_name === 'FCP' && value_ms > 1500) status = 'warning'
    else if (metric_name === 'TTFB' && value_ms > 800) status = 'critical'
    else if (metric_name === 'TTFB' && value_ms > 600) status = 'warning'
    else if (metric_name === 'page_load_time' && value_ms > 3000) status = 'critical'
    else if (metric_name === 'page_load_time' && value_ms > 2000) status = 'warning'

    const { error } = await supabase.from('performance_metrics').insert({
      tenant_id: tenantId,
      metric_name,
      metric_type: metric_type || 'frontend',
      value_ms,
      endpoint_path: endpoint_path || null,
      status,
      metadata: metadata || {},
    })

    if (error) {
      console.error('[performance] Failed to record metric:', error)
      return NextResponse.json(
        { error: 'Failed to record metric' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[performance] Error recording metric:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/performance/metrics
 * Query performance metrics (admin only)
 */
export const GET = withAuth(
  async (request: NextRequest, { user, supabase, tenantId }) => {
    try {
      // Only admins can query performance metrics
      if (!isAdminRole(user.role)) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 403 }
        )
      }

      const { searchParams } = request.nextUrl
      const metricName = searchParams.get('metric_name')
      const metricType = searchParams.get('metric_type')
      const endpointPath = searchParams.get('endpoint_path')
      const status = searchParams.get('status')
      const startDate = searchParams.get('start_date')
      const endDate = searchParams.get('end_date')
      const limit = parseInt(searchParams.get('limit') || '100', 10)

      let query = supabase
        .from('performance_metrics')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit)

      if (tenantId) {
        query = query.eq('tenant_id', tenantId)
      }

      if (metricName) {
        query = query.eq('metric_name', metricName)
      }

      if (metricType) {
        query = query.eq('metric_type', metricType)
      }

      if (endpointPath) {
        query = query.eq('endpoint_path', endpointPath)
      }

      if (status) {
        query = query.eq('status', status)
      }

      if (startDate) {
        query = query.gte('created_at', startDate)
      }

      if (endDate) {
        query = query.lte('created_at', endDate)
      }

      const { data, error } = await query

      if (error) {
        console.error('[performance] Failed to query metrics:', error)
        return NextResponse.json(
          { error: 'Failed to query metrics' },
          { status: 500 }
        )
      }

      // Calculate summary statistics
      const summary = {
        total: data?.length || 0,
        by_status: {
          ok: data?.filter((m: any) => m.status === 'ok').length || 0,
          warning: data?.filter((m: any) => m.status === 'warning').length || 0,
          critical: data?.filter((m: any) => m.status === 'critical').length || 0,
        },
        avg_value_ms: data?.length
          ? data.reduce((sum: number, m: any) => sum + parseFloat(m.value_ms || 0), 0) / data.length
          : 0,
        min_value_ms: data?.length
          ? Math.min(...data.map((m: any) => parseFloat(m.value_ms || 0)))
          : 0,
        max_value_ms: data?.length
          ? Math.max(...data.map((m: any) => parseFloat(m.value_ms || 0)))
          : 0,
      }

      return NextResponse.json({
        metrics: data,
        summary,
      })
    } catch (error: any) {
      console.error('[performance] Error querying metrics:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  }
)

