import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'
import { withRootAdmin } from '@/lib/auth/rbac'

export const GET = withRootAdmin(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const slaFilter = searchParams.get('slaFilter')
    const limit = parseInt(searchParams.get('limit') || '100', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)

    const supabase = createServerSupabase(null)

    // Note: Booking requests might be stored in a separate table or in bookings table
    // For now, we'll query bookings that are in 'pending' status as booking requests
    // You may need to create a booking_requests table or use a different approach
    
    let query = supabase
      .from('bookings')
      .select(`
        id,
        booking_date,
        booking_time,
        status,
        created_at,
        customer:users!bookings_customer_id_fkey(id, full_name, email),
        service:services!bookings_service_id_fkey(id, name)
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (status) {
      query = query.eq('status', status)
    } else {
      // Default to pending requests
      query = query.in('status', ['pending'])
    }

    const { data: bookings, error } = await query

    if (error) {
      console.error('[root-admin] Fetch booking requests error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch booking requests' },
        { status: 500 }
      )
    }

    // Calculate SLA metrics
    const now = new Date()
    const SLA_HOURS = 24 // Default SLA: 24 hours to respond

    const transformedRequests = bookings?.map((booking: any) => {
      const createdAt = new Date(booking.created_at)
      const hoursSinceCreation = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60)
      
      // Check if there's a response (status changed from pending)
      const hasResponse = booking.status !== 'pending'
      const responseTimeHours = hasResponse ? hoursSinceCreation : null
      const slaMet = hasResponse ? hoursSinceCreation <= SLA_HOURS : null

      return {
        id: booking.id,
        customer_name: booking.customer?.full_name || 'Unknown',
        customer_email: booking.customer?.email || '',
        service_type: booking.service?.name || 'Unknown Service',
        requested_date: booking.booking_date,
        created_at: booking.created_at,
        response_time_hours: responseTimeHours,
        sla_met: slaMet,
        status: booking.status === 'pending' ? 'pending' : 
                booking.status === 'confirmed' ? 'converted' : 
                booking.status === 'cancelled' ? 'expired' : 'responded',
        converted: booking.status === 'confirmed',
      }
    }) || []

    // Apply SLA filter if provided
    let filteredRequests = transformedRequests
    if (slaFilter === 'met') {
      filteredRequests = filteredRequests.filter((r: any) => r.sla_met === true)
    } else if (slaFilter === 'missed') {
      filteredRequests = filteredRequests.filter((r: any) => r.sla_met === false)
    }

    return NextResponse.json({ requests: filteredRequests })
  } catch (error: any) {
    if (error instanceof NextResponse) {
      return error
    }
    console.error('[root-admin] Fetch booking requests error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
});

