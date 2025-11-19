import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase'
import { requireTenantId } from '@/lib/tenant'

export async function GET(request: NextRequest) {
  try {
    const tenantId = requireTenantId(request)
    const { searchParams } = new URL(request.url)
    const ambassadorId = searchParams.get('ambassadorId')
    const date = searchParams.get('date')
    const status = searchParams.get('status')

    if (!ambassadorId) {
      return NextResponse.json(
        { error: 'ambassadorId is required' },
        { status: 400 }
      )
    }

    const supabase = createServerSupabase()
    
    let query = supabase
      .from('bookings')
      .select(`
        id,
        booking_date,
        booking_time,
        status,
        duration_hours,
        total_amount,
        special_instructions,
        provider_id,
        customer_id,
        service_id,
        address_id,
        services:service_id (
          name
        ),
        addresses:address_id (
          street_address,
          apt_suite,
          city,
          state,
          zip_code
        ),
        users:customer_id (
          full_name,
          email,
          phone
        )
      `)
      .eq('tenant_id', tenantId)
      .order('booking_date', { ascending: true })
      .order('booking_time', { ascending: true })

    if (date) {
      query = query.eq('booking_date', date)
    }

    if (status) {
      query = query.eq('status', status)
    }

    const { data: bookings, error } = await query

    if (error) {
      console.error('[v0] Get ambassador jobs error:', error)
      return NextResponse.json({ error: 'Failed to load jobs' }, { status: 500 })
    }

    const jobs = (bookings || []).map((booking: any) => ({
      id: booking.id,
      customerName: booking.users?.full_name || 'Unknown',
      address: booking.addresses
        ? `${booking.addresses.street_address}${booking.addresses.apt_suite ? ' ' + booking.addresses.apt_suite : ''}, ${booking.addresses.city}, ${booking.addresses.state} ${booking.addresses.zip_code}`
        : 'Address not available',
      service: booking.services?.name || 'Unknown Service',
      date: booking.booking_date,
      time: booking.booking_time,
      status: booking.status,
      assignedTo: booking.provider_id || undefined,
      duration: booking.duration_hours || 1,
      amount: Number(booking.total_amount || 0),
    }))

    return NextResponse.json({ jobs })
  } catch (error) {
    console.error('[v0] Get ambassador jobs error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

