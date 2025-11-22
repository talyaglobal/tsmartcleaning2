import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'
import { resolveTenantFromRequest } from '@/lib/supabase'
import { withRateLimit, RateLimitPresets } from '@/lib/rate-limit'
import { withAuth } from '@/lib/auth/rbac'
import { isAdminRole } from '@/lib/auth/roles'

/**
 * API endpoint for tracking analytics events
 * Stores custom analytics events in the database for analysis
 */
export const POST = withAuth(async (request: NextRequest, auth) => {
  try {
    const tenantId = auth.tenantId || resolveTenantFromRequest(request)
    const supabase = auth.supabase
    
    const {
      eventName,
      eventCategory,
      eventLabel,
      value,
      metadata,
      sessionId,
    } = await request.json()

    // Use authenticated user ID instead of accepting userId parameter
    const userId = auth.user.id

    if (!eventName) {
      return NextResponse.json(
        { error: 'eventName is required' },
        { status: 400 }
      )
    }

    // Store analytics event
    const { error } = await supabase.from('analytics_events').insert({
      tenant_id: tenantId,
      user_id: userId || null,
      session_id: sessionId || null,
      event_name: eventName,
      event_category: eventCategory || null,
      event_label: eventLabel || null,
      value: value || null,
      metadata: metadata || {},
      occurred_at: new Date().toISOString(),
      ip_address: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.ip || null,
      user_agent: request.headers.get('user-agent') || null,
    } as any)

    if (error) {
      console.error('[analytics] Failed to store event:', error)
      // Don't fail the request if analytics storage fails
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[analytics] Track error:', error)
    return NextResponse.json(
      { error: 'Failed to track event', message: error.message },
      { status: 500 }
    )
  }
})

/**
 * GET endpoint to retrieve analytics events
 * Supports filtering by date range, event type, tenant, etc.
 * Requires authentication - analytics data is sensitive
 */
export const GET = withAuth(async (request: NextRequest, auth) => {
  try {
    const tenantId = auth.tenantId || resolveTenantFromRequest(request)
    const supabase = auth.supabase
    
    const searchParams = request.nextUrl.searchParams
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const eventName = searchParams.get('eventName')
    const eventCategory = searchParams.get('eventCategory')
    const limit = parseInt(searchParams.get('limit') || '100')

    let query = supabase
      .from('analytics_events')
      .select('*')
      .order('occurred_at', { ascending: false })
      .limit(limit)

    // Non-admins can only see their own events
    const isAdmin = isAdminRole(auth.user.role)
    
    if (tenantId) {
      query = query.eq('tenant_id', tenantId)
    }

    // Non-admins can only view their own analytics
    if (!isAdmin) {
      query = query.eq('user_id', auth.user.id)
    }

    if (startDate) {
      query = query.gte('occurred_at', startDate)
    }

    if (endDate) {
      query = query.lte('occurred_at', endDate)
    }

    if (eventName) {
      query = query.eq('event_name', eventName)
    }

    if (eventCategory) {
      query = query.eq('event_category', eventCategory)
    }

    const { data, error } = await query

    if (error) {
      throw error
    }

    return NextResponse.json({ events: data || [] })
  } catch (error: any) {
    console.error('[analytics] Get events error:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve events', message: error.message },
      { status: 500 }
    )
  }
})

