import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'
import { resolveTenantFromRequest } from '@/lib/supabase'

/**
 * Analytics dashboard API endpoint
 * Returns aggregated analytics data for dashboard visualization
 */
export async function GET(request: NextRequest) {
  try {
    const tenantId = resolveTenantFromRequest(request)
    const supabase = createServerSupabase(tenantId || undefined)
    
    const searchParams = request.nextUrl.searchParams
    const startDate = searchParams.get('startDate') || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const endDate = searchParams.get('endDate') || new Date().toISOString()

    // Build query with tenant filter
    let baseQuery = supabase
      .from('analytics_events')
      .select('*')

    if (tenantId) {
      baseQuery = baseQuery.eq('tenant_id', tenantId)
    }

    baseQuery = baseQuery
      .gte('occurred_at', startDate)
      .lte('occurred_at', endDate)

    const { data: events, error } = await baseQuery

    if (error) {
      throw error
    }

    // Aggregate metrics
    const totalEvents = events?.length || 0
    const uniqueUsers = new Set(events?.map(e => e.user_id).filter(Boolean)).size
    const uniqueSessions = new Set(events?.map(e => e.session_id).filter(Boolean)).size

    // Event counts by category
    const eventCountsByCategory: Record<string, number> = {}
    events?.forEach((event: any) => {
      const category = event.event_category || 'uncategorized'
      eventCountsByCategory[category] = (eventCountsByCategory[category] || 0) + 1
    })

    // Event counts by name (top 10)
    const eventCountsByName: Record<string, number> = {}
    events?.forEach((event: any) => {
      const name = event.event_name
      eventCountsByName[name] = (eventCountsByName[name] || 0) + 1
    })
    const topEvents = Object.entries(eventCountsByName)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }))

    // Conversion events
    const conversions = events?.filter((e: any) => 
      e.event_category === 'conversion' || 
      e.event_name?.includes('conversion') ||
      e.event_name?.includes('purchase')
    ) || []

    const totalConversionValue = conversions.reduce((sum: number, e: any) => 
      sum + (Number(e.value) || 0), 0
    )

    // Time series data (events per day)
    const eventsByDay: Record<string, number> = {}
    events?.forEach((event: any) => {
      const day = new Date(event.occurred_at).toISOString().split('T')[0]
      eventsByDay[day] = (eventsByDay[day] || 0) + 1
    })
    const timeSeries = Object.entries(eventsByDay)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({ date, count }))

    return NextResponse.json({
      summary: {
        totalEvents,
        uniqueUsers,
        uniqueSessions,
        totalConversions: conversions.length,
        totalConversionValue,
      },
      eventCountsByCategory,
      topEvents,
      timeSeries,
      period: {
        startDate,
        endDate,
      },
    })
  } catch (error: any) {
    console.error('[analytics] Dashboard error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics data', message: error.message },
      { status: 500 }
    )
  }
}

